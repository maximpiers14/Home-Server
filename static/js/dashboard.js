'use strict';

class GaugePainter {
    constructor(canvasId, color) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.color = color;
        
        this.resize();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.scale = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * this.scale;
        this.canvas.height = rect.height * this.scale;
        this.ctx.scale(this.scale, this.scale);
        
        this.width = rect.width;
        this.height = rect.height;
        this.radius = Math.min(this.width / 2, this.height) * 0.85;
        this.centerX = this.width / 2;
        this.centerY = this.height * 0.95;
    }

    draw(percent) {
        if (!this.ctx) return;
        
        const rect = this.canvas.getBoundingClientRect();
        if (this.width !== rect.width || this.height !== rect.height) {
            this.resize();
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, Math.PI, 0);
        this.ctx.lineWidth = 12;
        this.ctx.strokeStyle = '#334155';
        this.ctx.stroke();

        const startAngle = Math.PI;
        const endAngle = Math.PI + (percent / 100) * Math.PI;

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
        this.ctx.lineWidth = 12;
        this.ctx.strokeStyle = this.color;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        const angle = startAngle + (percent / 100) * Math.PI;
        const needleLength = this.radius * 0.85;
        const needleX = this.centerX + Math.cos(angle) * needleLength;
        const needleY = this.centerY + Math.sin(angle) * needleLength;

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(needleX, needleY);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const cpuGauge = new GaugePainter('cpu-gauge', '#38bdf8');
    const ramGauge = new GaugePainter('ram-gauge', '#34d399');

    async function fetchStats() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) throw new Error('Netwerkrespons was niet oké');
            const data = await response.json();

            cpuGauge.draw(data.cpu);
            ramGauge.draw(data.ram_percent);

            document.getElementById('cpu-usage').innerText = data.cpu + '%';
            document.getElementById('ram-usage').innerText = data.ram_percent + '%';
            document.getElementById('disk-usage').innerText = data.disk_percent + '%';
            
        } catch (error) {
            console.error('Fout bij ophalen van statistieken:', error);
        }
    }

    async function checkJellyfinStatus() {
        try {
            const response = await fetch('/api/jellyfin/status');
            const data = await response.json();
            
            const statusEl = document.getElementById('jellyfin-status');
            if (!statusEl) return;

            if (data.status === 'online') {
                statusEl.innerText = "Online ●";
                statusEl.style.color = "#22c55e";
            } else {
                statusEl.innerText = "Offline ●";
                statusEl.style.color = "#ef4444";
            }
        } catch (error) {
            console.error('Fout bij ophalen van Jellyfin status:', error);
            const statusEl = document.getElementById('jellyfin-status');
            if (statusEl) {
                statusEl.innerText = "Error ●";
                statusEl.style.color = "#f59e0b";
            }
        }
    }

    async function controlJellyfin(action) {
        const messageEl = document.getElementById('jellyfin-message');
        
        if (messageEl) {
            if (action === 'start') {
                messageEl.innerText = "Server wordt gestart...";
                messageEl.style.color = "#f59e0b";
            } else {
                messageEl.innerText = "Server wordt gestopt...";
                messageEl.style.color = "#f59e0b";
            }
        }

        try {
            const response = await fetch(`/api/jellyfin/${action}`, { method: 'POST' });
            const data = await response.json();
            console.log(data.message);
            
            setTimeout(() => {
                if (messageEl) {
                    messageEl.innerText = action === 'start' ? "Server is gestart!" : "Server is gestopt!";
                    messageEl.style.color = "#22c55e";
                    
                    setTimeout(() => { messageEl.innerText = ""; }, 3000);
                }
            }, 1500);

        } catch (error) {
            console.error(`Fout bij ${action} van Jellyfin:`, error);
            if (messageEl) {
                messageEl.innerText = "Actie mislukt!";
                messageEl.style.color = "#ef4444";
            }
        }
    }

    const startBtn = document.getElementById('jellyfin-start-btn');
    const stopBtn = document.getElementById('jellyfin-stop-btn');

    if (startBtn) {
        startBtn.addEventListener('click', () => controlJellyfin('start'));
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => controlJellyfin('stop'));
    }

    fetchStats();
    checkJellyfinStatus();

    setInterval(fetchStats, 500);
    setInterval(checkJellyfinStatus, 500);
});