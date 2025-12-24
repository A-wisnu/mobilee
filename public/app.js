/**
 * Android Emulator Web - No ADB Version
 * Uses Docker + noVNC for display
 */

const apiBase = window.location.origin;
let isRunning = false;
let checkInterval = null;

// DOM Elements
const elements = {
    startBtn: null,
    stopBtn: null,
    statusIndicator: null,
    progressSection: null,
    progressFill: null,
    progressText: null,
    dockerInfo: null,
    placeholder: null,
    vncFrame: null,
    emulatorActions: null,
    toast: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    elements.startBtn = document.getElementById('startBtn');
    elements.stopBtn = document.getElementById('stopBtn');
    elements.statusIndicator = document.getElementById('statusIndicator');
    elements.progressSection = document.getElementById('progressSection');
    elements.progressFill = document.getElementById('progressFill');
    elements.progressText = document.getElementById('progressText');
    elements.dockerInfo = document.getElementById('dockerInfo');
    elements.placeholder = document.getElementById('placeholder');
    elements.vncFrame = document.getElementById('vncFrame');
    elements.emulatorActions = document.getElementById('emulatorActions');
    elements.toast = document.getElementById('toast');

    // Check Docker and status
    checkDocker();
    checkStatus();
});

// Check Docker availability
async function checkDocker() {
    try {
        const response = await fetch(`${apiBase}/api/check-docker`);
        const data = await response.json();

        if (data.status === 'error') {
            elements.dockerInfo.style.display = 'block';
            elements.startBtn.disabled = true;
            updateStatus('error', 'Docker tidak tersedia');
        }
    } catch (error) {
        console.error('Check docker error:', error);
    }
}

// Check emulator status
async function checkStatus() {
    try {
        const response = await fetch(`${apiBase}/api/status`);
        const data = await response.json();

        isRunning = data.running;

        if (data.running) {
            updateStatus('running', 'Emulator berjalan');
            elements.startBtn.style.display = 'none';
            elements.stopBtn.style.display = 'inline-flex';
            elements.emulatorActions.style.display = 'flex';
            showVNC(data.vnc_url);
        } else {
            updateStatus('stopped', 'Emulator tidak berjalan');
            elements.startBtn.style.display = 'inline-flex';
            elements.stopBtn.style.display = 'none';
            elements.emulatorActions.style.display = 'none';
            hideVNC();
        }
    } catch (error) {
        updateStatus('error', 'Server tidak tersedia');
    }
}

// Start emulator
async function startEmulator() {
    elements.startBtn.disabled = true;
    elements.progressSection.style.display = 'block';

    // Progress animation
    const steps = [
        { text: 'Memeriksa Docker...', progress: 10 },
        { text: 'Mendownload image Android...', progress: 30 },
        { text: 'Membuat container...', progress: 50 },
        { text: 'Memulai emulator...', progress: 70 },
        { text: 'Menunggu boot...', progress: 90 },
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
            elements.progressText.textContent = steps[stepIndex].text;
            elements.progressFill.style.width = steps[stepIndex].progress + '%';
            stepIndex++;
        }
    }, 2000);

    try {
        const response = await fetch(`${apiBase}/api/start`, { method: 'POST' });
        const data = await response.json();

        clearInterval(progressInterval);

        if (data.status === 'ok') {
            elements.progressText.textContent = 'Emulator dimulai! Tunggu 1-2 menit untuk boot...';
            elements.progressFill.style.width = '100%';

            showToast('Emulator dimulai!', 'success');

            // Start checking for VNC availability
            startVNCCheck(data.vnc_url);
        } else {
            showToast(data.message || 'Gagal memulai emulator', 'error');
            elements.startBtn.disabled = false;
            elements.progressSection.style.display = 'none';
        }
    } catch (error) {
        clearInterval(progressInterval);
        showToast('Error: ' + error.message, 'error');
        elements.startBtn.disabled = false;
        elements.progressSection.style.display = 'none';
    }
}

// Check VNC availability
function startVNCCheck(vncUrl) {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes

    checkInterval = setInterval(async () => {
        attempts++;
        elements.progressText.textContent = `Menunggu emulator boot... (${attempts}s)`;

        try {
            // Try to access VNC
            const response = await fetch(vncUrl, { mode: 'no-cors' });

            // If we get here, VNC might be ready
            if (attempts > 30) { // Give it at least 30 seconds
                clearInterval(checkInterval);
                showVNC(vncUrl);
                elements.progressSection.style.display = 'none';
                elements.startBtn.style.display = 'none';
                elements.stopBtn.style.display = 'inline-flex';
                elements.emulatorActions.style.display = 'flex';
                updateStatus('running', 'Emulator berjalan');
                isRunning = true;
            }
        } catch (e) {
            // VNC not ready yet
        }

        if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            elements.progressText.textContent = 'Timeout. Coba refresh halaman.';
            showToast('Emulator mungkin sudah berjalan. Coba refresh.', 'warning');
        }
    }, 1000);
}

// Stop emulator
async function stopEmulator() {
    if (checkInterval) {
        clearInterval(checkInterval);
    }

    try {
        const response = await fetch(`${apiBase}/api/stop`, { method: 'POST' });
        const data = await response.json();

        if (data.status === 'ok') {
            showToast('Emulator dihentikan', 'success');
            hideVNC();
            elements.startBtn.style.display = 'inline-flex';
            elements.startBtn.disabled = false;
            elements.stopBtn.style.display = 'none';
            elements.emulatorActions.style.display = 'none';
            elements.progressSection.style.display = 'none';
            updateStatus('stopped', 'Emulator tidak berjalan');
            isRunning = false;
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

// Show VNC iframe
function showVNC(url) {
    elements.placeholder.style.display = 'none';
    elements.vncFrame.src = url;
    elements.vncFrame.style.display = 'block';
}

// Hide VNC iframe
function hideVNC() {
    elements.placeholder.style.display = 'flex';
    elements.vncFrame.src = '';
    elements.vncFrame.style.display = 'none';
}

// Open fullscreen
function openFullscreen() {
    const vncUrl = `http://localhost:6080`;
    window.open(vncUrl, '_blank', 'width=400,height=800');
}

// Refresh VNC
function refreshVNC() {
    const currentSrc = elements.vncFrame.src;
    elements.vncFrame.src = '';
    setTimeout(() => {
        elements.vncFrame.src = currentSrc;
    }, 100);
}

// Update status indicator
function updateStatus(status, text) {
    const dot = elements.statusIndicator.querySelector('.status-dot');
    const textEl = elements.statusIndicator.querySelector('.status-text');

    elements.statusIndicator.className = 'status-indicator ' + status;
    textEl.textContent = text;
}

// Toast notification
function showToast(message, type = '') {
    elements.toast.textContent = message;
    elements.toast.className = 'toast show';
    if (type) elements.toast.classList.add(type);

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}
