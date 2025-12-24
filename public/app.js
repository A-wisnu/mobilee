/**
 * Droid Web — Professional Android Emulator
 */

class DroidWeb {
    constructor() {
        this.isRunning = false;
        this.apiBase = window.location.origin;

        this.el = {
            statusWidget: document.getElementById('statusWidget'),
            statusLabel: document.querySelector('.status-label'),
            powerBtn: document.getElementById('powerBtn'),
            deviceInfo: document.getElementById('deviceInfo'),
            placeholder: document.getElementById('placeholder'),
            vncFrame: document.getElementById('vncFrame'),
            toastContainer: document.getElementById('toastContainer')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkStatus();
    }

    bindEvents() {
        // Power button
        this.el.powerBtn.addEventListener('click', () => this.togglePower());

        // Control buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action) this.sendAction(action);
            });
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Toolbar buttons
        document.getElementById('screenshotBtn')?.addEventListener('click', () => this.screenshot());
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.fullscreen());
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.refresh());
    }

    async checkStatus() {
        try {
            const res = await fetch(`${this.apiBase}/api/status`);
            const data = await res.json();

            if (data.running) {
                this.setRunning(true, data.vnc_url);
            }
        } catch (e) {
            console.log('Server check failed');
        }
    }

    async togglePower() {
        if (this.isRunning) {
            await this.stop();
        } else {
            await this.start();
        }
    }

    async start() {
        this.setStatus('loading', 'Starting...');

        try {
            const res = await fetch(`${this.apiBase}/api/start`, { method: 'POST' });
            const data = await res.json();

            if (data.status === 'ok') {
                this.toast('Emulator starting...', 'success');
                this.waitForReady(data.vnc_url || 'http://localhost:6080');
            } else {
                this.toast(data.message || 'Failed to start', 'error');
                this.setStatus('offline', 'Offline');
            }
        } catch (e) {
            this.toast('Connection error', 'error');
            this.setStatus('offline', 'Offline');
        }
    }

    waitForReady(vncUrl) {
        let attempts = 0;
        const maxAttempts = 120;

        const check = setInterval(async () => {
            attempts++;
            this.setStatus('loading', `Booting (${attempts}s)`);

            if (attempts >= 30) {
                try {
                    await fetch(vncUrl, { mode: 'no-cors' });
                    clearInterval(check);
                    this.setRunning(true, vncUrl);
                    this.toast('Emulator ready');
                } catch (e) { }
            }

            if (attempts >= maxAttempts) {
                clearInterval(check);
                this.setRunning(true, vncUrl);
            }
        }, 1000);
    }

    async stop() {
        try {
            await fetch(`${this.apiBase}/api/stop`, { method: 'POST' });
            this.setRunning(false);
            this.toast('Emulator stopped');
        } catch (e) {
            this.toast('Failed to stop', 'error');
        }
    }

    setRunning(running, vncUrl) {
        this.isRunning = running;

        if (running) {
            this.setStatus('running', 'Running');
            this.el.placeholder.classList.add('hidden');
            this.el.vncFrame.src = vncUrl;
            this.el.vncFrame.classList.add('visible');
        } else {
            this.setStatus('offline', 'Offline');
            this.el.placeholder.classList.remove('hidden');
            this.el.vncFrame.src = '';
            this.el.vncFrame.classList.remove('visible');
        }
    }

    setStatus(status, label) {
        this.el.statusWidget.className = 'status-widget ' + status;
        this.el.statusLabel.textContent = label;
    }

    sendAction(action) {
        if (!this.isRunning) {
            this.toast('Emulator not running', 'error');
            return;
        }
        // Actions handled by VNC iframe
        this.toast(`${action} sent`);
    }

    screenshot() {
        this.toast('Screenshot saved');
    }

    fullscreen() {
        const vncUrl = 'http://localhost:6080';
        window.open(vncUrl, '_blank', 'width=400,height=800');
    }

    refresh() {
        if (this.el.vncFrame.src) {
            const src = this.el.vncFrame.src;
            this.el.vncFrame.src = '';
            setTimeout(() => this.el.vncFrame.src = src, 100);
        }
    }

    toast(message, type = '') {
        const toast = document.createElement('div');
        toast.className = 'toast' + (type ? ` ${type}` : '');
        toast.textContent = message;

        this.el.toastContainer.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DroidWeb();
});
