package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"sync"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// EmulatorManager handles emulator operations
type EmulatorManager struct {
	mu          sync.Mutex
	running     bool
	containerID string
	vncPort     string
}

// StatusResponse for API
type StatusResponse struct {
	Status   string `json:"status"`
	Running  bool   `json:"running"`
	Message  string `json:"message,omitempty"`
	VNCUrl   string `json:"vnc_url,omitempty"`
	EmulatorInfo string `json:"emulator_info,omitempty"`
}

var manager = &EmulatorManager{
	vncPort: "6080",
}

func main() {
	// Static files
	fs := http.FileServer(http.Dir("./public"))
	http.Handle("/", fs)

	// API endpoints
	http.HandleFunc("/api/status", handleStatus)
	http.HandleFunc("/api/start", handleStart)
	http.HandleFunc("/api/stop", handleStop)
	http.HandleFunc("/api/check-docker", handleCheckDocker)

	// Proxy VNC
	http.HandleFunc("/vnc/", handleVNCProxy)

	// Get port from environment variable (Railway, Render, etc.)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Server starting on port %s\n", port)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// handleStatus returns emulator status
func handleStatus(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	manager.mu.Lock()
	defer manager.mu.Unlock()

	resp := StatusResponse{
		Status:  "ok",
		Running: manager.running,
	}

	if manager.running {
		resp.VNCUrl = fmt.Sprintf("http://localhost:%s", manager.vncPort)
		resp.EmulatorInfo = "Android 11 (Docker)"
	}

	json.NewEncoder(w).Encode(resp)
}

// handleCheckDocker checks if Docker is available
func handleCheckDocker(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	cmd := exec.Command("docker", "--version")
	output, err := cmd.Output()

	resp := StatusResponse{Status: "ok"}

	if err != nil {
		resp.Status = "error"
		resp.Message = "Docker tidak ditemukan. Install Docker Desktop terlebih dahulu."
	} else {
		resp.Message = string(output)
	}

	json.NewEncoder(w).Encode(resp)
}

// handleStart starts the emulator
func handleStart(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	manager.mu.Lock()
	if manager.running {
		manager.mu.Unlock()
		json.NewEncoder(w).Encode(StatusResponse{
			Status:  "ok",
			Running: true,
			Message: "Emulator sudah berjalan",
			VNCUrl:  fmt.Sprintf("http://localhost:%s", manager.vncPort),
		})
		return
	}
	manager.mu.Unlock()

	// Stop any existing container
	exec.Command("docker", "stop", "android-web").Run()
	exec.Command("docker", "rm", "android-web").Run()

	// Start Android container with noVNC
	log.Println("Starting Android emulator container...")

	cmd := exec.Command("docker", "run", "-d",
		"--name", "android-web",
		"-p", "6080:6080",
		"-e", "EMULATOR_DEVICE=Samsung Galaxy S10",
		"-e", "WEB_VNC=true",
		"--privileged",
		"budtmo/docker-android:emulator_11.0",
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Docker error: %v - %s", err, string(output))
		json.NewEncoder(w).Encode(StatusResponse{
			Status:  "error",
			Message: fmt.Sprintf("Gagal memulai emulator: %v", err),
		})
		return
	}

	manager.mu.Lock()
	manager.running = true
	manager.containerID = string(output)
	manager.mu.Unlock()

	log.Println("Container started:", string(output))

	json.NewEncoder(w).Encode(StatusResponse{
		Status:  "ok",
		Running: true,
		Message: "Emulator dimulai. Tunggu 1-2 menit untuk boot.",
		VNCUrl:  fmt.Sprintf("http://localhost:%s", manager.vncPort),
	})
}

// handleStop stops the emulator
func handleStop(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	exec.Command("docker", "stop", "android-web").Run()
	exec.Command("docker", "rm", "android-web").Run()

	manager.mu.Lock()
	manager.running = false
	manager.containerID = ""
	manager.mu.Unlock()

	json.NewEncoder(w).Encode(StatusResponse{
		Status:  "ok",
		Running: false,
		Message: "Emulator dihentikan",
	})
}

// handleVNCProxy proxies VNC connection
func handleVNCProxy(w http.ResponseWriter, r *http.Request) {
	// Redirect to noVNC
	http.Redirect(w, r, fmt.Sprintf("http://localhost:%s", manager.vncPort), http.StatusTemporaryRedirect)
}

// Proxy helper
func proxyRequest(w http.ResponseWriter, r *http.Request, targetURL string) {
	resp, err := http.Get(targetURL)
	if err != nil {
		http.Error(w, "Proxy error", 502)
		return
	}
	defer resp.Body.Close()

	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// setCORS sets CORS headers
func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")
}
