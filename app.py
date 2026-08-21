from flask import Flask, jsonify, render_template, redirect, url_for
import psutil
import requests

app = Flask(__name__)

# --------------
# API ROUTES
# -------------

@app.route("/api/health")
def health():
    return jsonify({"status":"ok"})

# API endpoint for the stats of the server

@app.route("/api/stats")
def stats(): 
    cpu_usage = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    return jsonify({
        "cpu": cpu_usage,
        "ram_percent": ram.percent,
        "disk_percent": disk.percent
    })

# ALL THE JELLYFIN SERVER ROUTES

@app.route("/api/jellyfin-status")
def jelly_stats():
    try:
        response = requests.get("http://localhost:8096/system/ping", timeout=2)
        if response.status_code == 200:
            return jsonify({"status": "online"})
    except requests.exceptions.RequestException:
        pass

    return jsonify({"status": "offline"})

# ------------
# WEB ROUTES
# ------------

@app.route("/")
def home():
    return redirect(url_for("dashboard"))

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

if __name__ == "__main__":
    app.run()
