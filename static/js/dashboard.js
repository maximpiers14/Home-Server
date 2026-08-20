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
        // Haal de actuele grootte op van het element op het scherm
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
        
        // Zorg dat de afmetingen kloppen als de pagina verandert
        const rect = this.canvas.getBoundingClientRect();
        if (this.width !== rect.width || this.height !== rect.height) {
            this.resize();
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Achtergrondboog
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, Math.PI, 0);
        this.ctx.lineWidth = 12;
        this.ctx.strokeStyle = '#334155';
        this.ctx.stroke();

        // Actieve boog
        const startAngle = Math.PI;
        const endAngle = Math.PI + (percent / 100) * Math.PI;

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
        this.ctx.lineWidth = 12;
        this.ctx.strokeStyle = this.color;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        // Wijzer
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

        // Middenpunt
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const cpuGauge = new GaugePainter('cpu-gauge', '#38bdf8'); // Blauw
    const ramGauge = new GaugePainter('ram-gauge', '#34d399'); // Groen

    async function fetchStats() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) throw new Error('Netwerkrespons was niet oké');
            const data = await response.json();

            // Update de meters
            cpuGauge.draw(data.cpu);
            ramGauge.draw(data.ram_percent);

            // Update de tekst
            document.getElementById('cpu-usage').innerText = data.cpu + '%';
            document.getElementById('ram-usage').innerText = data.ram_percent + '%';
            document.getElementById('disk-usage').innerText = data.disk_percent + '%';
            
        } catch (error) {
            console.error('Fout bij ophalen van statistieken:', error);
        }
    }

    fetchStats();
    setInterval(fetchStats, 500);
});