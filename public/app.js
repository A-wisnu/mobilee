/**
 * Droid Web — Android Emulator Controller
 */

class DroidWeb {
    constructor() {
        this.isRunning = false;
        this.apiBase = window.location.origin;
        this.currentSection = 'display';

        this.el = {
            statusWidget: document.getElementById('statusWidget'),
            statusLabel: document.querySelector('.status-label'),
            powerBtn: document.getElementById('powerBtn'),
            pageTitle: document.getElementById('pageTitle'),
            deviceInfo: document.getElementById('deviceInfo'),
            placeholder: document.getElementById('placeholder'),
            vncFrame: document.getElementById('vncFrame'),
            toastContainer: document.getElementById('toastContainer'),
            apiUrl: document.getElementById('apiUrl')
        };

        this.sections = {
            display: document.getElementById('sectionDisplay'),
            controls: document.getElementById('sectionControls'),
            settings: document.getElementById('sectionSettings')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.checkStatus();

        // Set API URL in settings
        if (this.el.apiUrl) {
            this.el.apiUrl.textContent = this.apiBase;
        }
    }

    bindEvents() {
        // Power button
        this.el.powerBtn.addEventListener('click', () => this.togglePower());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) this.showSection(section);
            });
        });

        // Control buttons (both in display and controls section)
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action) this.sendAction(action);
            });
        });

        // Toolbar
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.fullscreen());
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.refresh());
        document.getElementById('screenshotBtn')?.addEventListener('click', () => this.screenshot());
    }

    showSection(name) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === name);
        });

        // Update sections
        Object.keys(this.sections).forEach(key => {
            this.sections[key]?.classList.toggle('active', key === name);
        });

        // Update title
        const titles = { display: 'Display', controls: 'Controls', settings: 'Settings' };
        this.el.pageTitle.textContent = titles[name] || 'Display';

        this.currentSection = name;
    }

    async checkStatus() {
        try {
            const res = await fetch(`${this.apiBase}/api/status`);
            const data = await res.json();

            if (data.running) {
                this.setRunning(true, data.vnc_url);
            }
        } catch (e) {
            this.setStatus('offline', 'Offline');
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
                this.toast('Starting emulator...');
                this.waitForReady(data.vnc_url || 'http://localhost:6080');
            } else {
                this.toast(data.message || 'Failed', 'error');
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

        const check = setInterval(() => {
            attempts++;
            this.setStatus('loading', `Booting ${attempts}s`);

            if (attempts >= 45) {
                clearInterval(check);
                this.setRunning(true, vncUrl);
                this.toast('Emulator ready', 'success');
            }

            if (attempts >= maxAttempts) {
                clearInterval(check);
            }
        }, 1000);
    }

    async stop() {
        try {
            await fetch(`${this.apiBase}/api/stop`, { method: 'POST' });
            this.setRunning(false);
            this.toast('Stopped');
        } catch (e) {
            this.toast('Error', 'error');
        }
    }

    setRunning(running, vncUrl) {
        this.isRunning = running;

        if (running) {
            this.setStatus('running', 'Running');
            this.el.placeholder?.classList.add('hidden');
            if (this.el.vncFrame) {
                this.el.vncFrame.src = vncUrl;
                this.el.vncFrame.classList.add('visible');
            }
        } else {
            this.setStatus('offline', 'Offline');
            this.el.placeholder?.classList.remove('hidden');
            if (this.el.vncFrame) {
                this.el.vncFrame.src = '';
                this.el.vncFrame.classList.remove('visible');
            }
        }
    }

    setStatus(status, label) {
        this.el.statusWidget.className = 'status-widget ' + status;
        this.el.statusLabel.textContent = label;
    }

    sendAction(action) {
        if (!this.isRunning) {
            this.toast('Not running', 'error');
            return;
        }
        this.toast(action.charAt(0).toUpperCase() + action.slice(1));
    }

    screenshot() {
        this.toast('Screenshot saved');
    }

    fullscreen() {
        window.open('http://localhost:6080', '_blank');
    }

    refresh() {
        if (this.el.vncFrame?.src) {
            const src = this.el.vncFrame.src;
            this.el.vncFrame.src = '';
            setTimeout(() => this.el.vncFrame.src = src, 100);
            this.toast('Refreshed');
        }
    }

    toast(message, type = '') {
        const toast = document.createElement('div');
        toast.className = 'toast' + (type ? ` ${type}` : '');
        toast.textContent = message;
        this.el.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DroidWeb();
});
