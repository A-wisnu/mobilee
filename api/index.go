package handler

import (
	"encoding/json"
	"net/http"
	"runtime"
	"time"
)

// StatusResponse represents the API response
type StatusResponse struct {
	Status    string `json:"status"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	Platform  string `json:"platform"`
	Version   string `json:"version"`
}

// Handler is the serverless function entry point for Vercel
func Handler(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	// Handle preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Return status info
	response := StatusResponse{
		Status:    "ok",
		Message:   "Android Emulator Web API - Vercel Serverless",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Platform:  runtime.GOOS + "/" + runtime.GOARCH,
		Version:   "1.0.0",
	}

	// Note about limitations
	if r.URL.Path == "/api/info" || r.URL.Path == "/api" || r.URL.Path == "/api/" {
		response.Message = "This is the Vercel frontend. For full emulator control, connect to a backend server running the main.go with ADB access."
	}

	json.NewEncoder(w).Encode(response)
}
