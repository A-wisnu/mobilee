@echo off
REM Android Emulator Web - Setup Script
REM Automatically downloads and runs Android x86 emulator via Docker

echo ========================================
echo   Android Emulator Web - Setup
echo ========================================
echo.

REM Check Docker
echo [1/4] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not found!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo Docker OK!
echo.

REM Pull Android x86 image (lightweight, no login required)
echo [2/4] Downloading Android emulator image...
echo This may take a few minutes on first run...
docker pull budtmo/docker-android:emulator_11.0
echo.

REM Stop existing container if running
echo [3/4] Preparing container...
docker stop android-emu 2>nul
docker rm android-emu 2>nul
echo.

REM Run container
echo [4/4] Starting Android emulator...
docker run -d ^
    --name android-emu ^
    -p 5554:5554 ^
    -p 5555:5555 ^
    -p 6080:6080 ^
    -e EMULATOR_DEVICE="Samsung Galaxy S10" ^
    -e WEB_VNC=true ^
    --privileged ^
    budtmo/docker-android:emulator_11.0

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Emulator is starting... (may take 1-2 minutes)
echo.
echo Access options:
echo   - Web VNC: http://localhost:6080
echo   - ADB: adb connect localhost:5555
echo.
echo After emulator boots, run: go run main.go
echo Then open: http://localhost:8080
echo.
pause
