# Android Emulator Web 📱

Web-based Android emulator controller built with Golang and WebSocket.

## Features

- 🖥️ Real-time screen viewing via screenshot streaming
- 👆 Touch/tap controls with visual feedback
- ⌨️ Text input and keyboard simulation
- 🎮 Quick action buttons (Home, Back, Recent, Volume, Power)
- 🔄 Auto-refresh screen capture
- 🌐 WebSocket for real-time input events
- 🎨 Modern dark theme with glassmorphism UI

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser       │────▶│  Golang Server   │────▶│ Android Emulator│
│   (Frontend)    │◀────│  (main.go)       │◀────│ (via ADB)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │ WebSocket              │ HTTP/REST
        │ Touch Events           │ Screenshots
        └────────────────────────┘
```

## Requirements

- Go 1.21+
- Android SDK with ADB configured in PATH
- Running Android emulator or connected device

## Quick Start

### 1. Clone & Install Dependencies

```bash
cd roarr
go mod tidy
```

### 2. Start Android Emulator

```bash
# List available AVDs
emulator -list-avds

# Start an emulator
emulator -avd <AVD_NAME>

# Or check connected devices
adb devices
```

### 3. Run the Server

```bash
go run main.go
```

### 4. Open in Browser

Navigate to `http://localhost:8080`

## Deployment

### Frontend Only (Vercel)

The frontend can be deployed to Vercel as static files:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy
```

> **Note**: The Vercel deployment only serves the frontend. For full functionality, you need a backend server with ADB access.

### Full Stack (VPS/Server)

For full emulator control, deploy to a VPS with:
1. Android SDK installed
2. Emulator running (headless mode: `emulator -avd <name> -no-window`)
3. Golang server running

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get connection status |
| `/api/devices` | GET | List connected devices |
| `/api/start?device=<id>` | GET | Connect to device |
| `/api/stop` | GET | Disconnect |
| `/api/screenshot` | GET | Capture screen (PNG) |
| `/ws` | WebSocket | Real-time input events |

## WebSocket Events

```json
// Tap
{"type": "tap", "x": 540, "y": 1200}

// Swipe
{"type": "swipe", "x": 540, "y": 1500, "x2": 540, "y2": 500}

// Key
{"type": "back"} | {"type": "home"} | {"type": "recent"}

// Text
{"type": "text", "text": "Hello World"}
```

## Project Structure

```
roarr/
├── main.go          # Golang backend server
├── go.mod           # Go module
├── vercel.json      # Vercel deployment config
├── api/
│   └── index.go     # Vercel serverless function
└── public/
    ├── index.html   # Web interface
    ├── styles.css   # Dark theme styles
    └── app.js       # Frontend JavaScript
```

## License

MIT
