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

    // Herbruikbare functie voor het beheren van willekeurige containers/services
    function setupServiceControl(serviceName, apiPrefix) {
        const startBtn = document.getElementById(`${serviceName}-start-btn`);
        const stopBtn = document.getElementById(`${serviceName}-stop-btn`);
        const statusEl = document.getElementById(`${serviceName}-status`);

        async function checkStatus() {
            try {
                const response = await fetch(`/api/${apiPrefix}/status`);
                if (!response.ok) throw new Error('Status respons niet oké');
                const data = await response.json();
                
                if (!statusEl) return;

                if (data.status === 'online') {
                    statusEl.innerText = "Online ●";
                    statusEl.style.color = "#22c55e";
                } else {
                    statusEl.innerText = "Offline ●";
                    statusEl.style.color = "#ef4444";
                }
            } catch (error) {
                console.error(`Fout bij ophalen van ${serviceName} status:`, error);
                if (statusEl) {
                    statusEl.innerText = "Error ●";
                    statusEl.style.color = "#f59e0b";
                }
            }
        }

        async function controlAction(action) {
            if (startBtn) startBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = true;

            try {
                const response = await fetch(`/api/${apiPrefix}/${action}`, { method: 'POST' });
                const data = await response.json();
                console.log(data.message);
                
                setTimeout(checkStatus, 2000);
            } catch (error) {
                console.error(`Fout bij ${action} van ${serviceName}:`, error);
            } finally {
                setTimeout(() => {
                    if (startBtn) startBtn.disabled = false;
                    if (stopBtn) stopBtn.disabled = false;
                }, 3000);
            }
        }

        if (startBtn) {
            startBtn.addEventListener('click', () => controlAction('start'));
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => controlAction('stop'));
        }

        // Initieel aanroepen en op interval zetten
        checkStatus();
        setInterval(checkStatus, 2000);
    }

    // Initialiseer zowel Jellyfin als AdGuard via de schone herbruikbare functie
    setupServiceControl('jellyfin', 'jellyfin');
    setupServiceControl('adguard', 'adguard');

    // Systeemstatistieken ophalen
    fetchStats();
    setInterval(fetchStats, 2000);
});