@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title Android Emulator Web - Setup & Run
color 0A

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         Android Emulator Web - Setup ^& Run                ║
echo ║         Otomatis download semua yang dibutuhkan           ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

set "NEED_INSTALL=0"
set "DOCKER_OK=0"
set "GO_OK=0"
set "IMAGE_OK=0"

REM ============================================
REM CHECK 1: Docker Desktop
REM ============================================
echo [1/4] Memeriksa Docker Desktop...

docker --version >nul 2>&1
if errorlevel 1 (
    echo       ❌ Docker tidak ditemukan!
    set "NEED_INSTALL=1"
    set "DOCKER_INSTALL=1"
) else (
    for /f "tokens=*" %%i in ('docker --version 2^>nul') do echo       ✅ %%i
    set "DOCKER_OK=1"
)
echo.

REM ============================================
REM CHECK 2: Golang
REM ============================================
echo [2/4] Memeriksa Golang...

go version >nul 2>&1
if errorlevel 1 (
    echo       ❌ Golang tidak ditemukan!
    set "NEED_INSTALL=1"
    set "GO_INSTALL=1"
) else (
    for /f "tokens=*" %%i in ('go version 2^>nul') do echo       ✅ %%i
    set "GO_OK=1"
)
echo.

REM ============================================
REM CHECK 3: Docker Image
REM ============================================
if "%DOCKER_OK%"=="1" (
    echo [3/4] Memeriksa Docker Image Android...
    
    docker images budtmo/docker-android:emulator_11.0 --format "{{.Repository}}" 2>nul | findstr /i "budtmo" >nul
    if errorlevel 1 (
        echo       ⚠️ Image Android belum didownload
        set "IMAGE_INSTALL=1"
    ) else (
        echo       ✅ Image Android sudah ada
        set "IMAGE_OK=1"
    )
) else (
    echo [3/4] Memeriksa Docker Image Android...
    echo       ⏭️ Dilewati (Docker belum terinstall)
)
echo.

REM ============================================
REM CHECK 4: Go Modules
REM ============================================
echo [4/4] Memeriksa Go Modules...
if exist "go.sum" (
    echo       ✅ Go modules sudah ada
) else (
    echo       ⚠️ Go modules perlu didownload
    set "GO_MOD_INSTALL=1"
)
echo.

REM ============================================
REM INSTALL MISSING DEPENDENCIES
REM ============================================
if "%DOCKER_INSTALL%"=="1" (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo   DOWNLOAD DOCKER DESKTOP
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo   Docker Desktop diperlukan untuk menjalankan emulator.
    echo   Silakan download dan install dari:
    echo.
    echo   https://desktop.docker.com/win/main/amd64/Docker%%20Desktop%%20Installer.exe
    echo.
    echo   Setelah install, restart komputer dan jalankan script ini lagi.
    echo.
    
    choice /C YN /M "Buka halaman download Docker sekarang"
    if !errorlevel!==1 (
        start "" "https://www.docker.com/products/docker-desktop/"
    )
    
    echo.
    echo Script akan berhenti. Install Docker dan jalankan lagi.
    pause
    exit /b 1
)

if "%GO_INSTALL%"=="1" (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo   DOWNLOAD GOLANG
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo   Golang diperlukan untuk menjalankan server.
    echo   Silakan download dan install dari:
    echo.
    echo   https://go.dev/dl/go1.21.5.windows-amd64.msi
    echo.
    echo   Setelah install, restart terminal dan jalankan script ini lagi.
    echo.
    
    choice /C YN /M "Buka halaman download Golang sekarang"
    if !errorlevel!==1 (
        start "" "https://go.dev/dl/"
    )
    
    echo.
    echo Script akan berhenti. Install Golang dan jalankan lagi.
    pause
    exit /b 1
)

REM ============================================
REM DOWNLOAD DOCKER IMAGE (if needed)
REM ============================================
if "%IMAGE_INSTALL%"=="1" (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo   DOWNLOAD ANDROID EMULATOR IMAGE
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo   Mendownload image Android 11... (sekitar 3-5GB)
    echo   Ini mungkin memakan waktu beberapa menit.
    echo.
    
    docker pull budtmo/docker-android:emulator_11.0
    
    if errorlevel 1 (
        echo.
        echo   ❌ Gagal download image. Pastikan:
        echo      - Docker Desktop sedang berjalan
        echo      - Koneksi internet stabil
        echo.
        pause
        exit /b 1
    ) else (
        echo.
        echo   ✅ Image Android berhasil didownload!
    )
)

REM ============================================
REM DOWNLOAD GO MODULES (if needed)
REM ============================================
if "%GO_MOD_INSTALL%"=="1" (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo   DOWNLOAD GO MODULES
    echo ═══════════════════════════════════════════════════════════
    echo.
    
    go mod tidy
    
    if errorlevel 1 (
        echo   ❌ Gagal download Go modules.
        pause
        exit /b 1
    ) else (
        echo   ✅ Go modules berhasil didownload!
    )
)

REM ============================================
REM START DOCKER IF NOT RUNNING
REM ============================================
echo.
echo ═══════════════════════════════════════════════════════════
echo   MEMERIKSA DOCKER
echo ═══════════════════════════════════════════════════════════
echo.

docker info >nul 2>&1
if errorlevel 1 (
    echo   ⚠️ Docker tidak berjalan. Mencoba memulai Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo   Menunggu Docker siap...
    timeout /t 30 /nobreak >nul
    
    docker info >nul 2>&1
    if errorlevel 1 (
        echo.
        echo   ❌ Docker gagal dijalankan. Silakan buka Docker Desktop manual.
        pause
        exit /b 1
    )
)
echo   ✅ Docker berjalan!

REM ============================================
REM START ANDROID EMULATOR CONTAINER
REM ============================================
echo.
echo ═══════════════════════════════════════════════════════════
echo   MENJALANKAN ANDROID EMULATOR
echo ═══════════════════════════════════════════════════════════
echo.

REM Stop existing container
docker stop android-web >nul 2>&1
docker rm android-web >nul 2>&1

echo   Memulai container Android emulator...
docker run -d --name android-web -p 6080:6080 -e EMULATOR_DEVICE="Samsung Galaxy S10" -e WEB_VNC=true --privileged budtmo/docker-android:emulator_11.0

if errorlevel 1 (
    echo   ❌ Gagal memulai emulator container.
    pause
    exit /b 1
)

echo   ✅ Container Android dimulai!
echo   📱 Emulator akan boot dalam 1-2 menit...
echo.

REM ============================================
REM START WEB SERVER
REM ============================================
echo ═══════════════════════════════════════════════════════════
echo   MENJALANKAN WEB SERVER
echo ═══════════════════════════════════════════════════════════
echo.
echo   Server akan berjalan di: http://localhost:8080
echo   noVNC Android di: http://localhost:6080
echo.
echo   Tekan Ctrl+C untuk menghentikan server.
echo.
echo ═══════════════════════════════════════════════════════════
echo.

REM Wait a bit for container to initialize
timeout /t 5 /nobreak >nul

REM Open browser
start "" "http://localhost:8080"

REM Run Go server
go run main.go

REM When server stops, also stop container
echo.
echo Menghentikan container Android...
docker stop android-web >nul 2>&1
docker rm android-web >nul 2>&1
echo Done!
