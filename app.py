from flask import Flask, jsonify, render_template, redirect, url_for
import psutil
import requests
import docker

client = docker.from_env()

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

@app.route("/api/jellyfin/status")
def jelly_stats():
    try:
        response = requests.get("http://localhost:8096/system/ping", timeout=2)
        if response.status_code == 200:
            return jsonify({"status": "online"})
    except requests.exceptions.RequestException:
        pass

    return jsonify({"status": "offline"})

@app.route("/api/jellyfin/start", methods=["POST"])
def start_jellyfin():
    try:
        container = client.containers.get("jellyfin")
        container.start()
        return jsonify({"success": True, "message": "Jellyfin gestart"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/jellyfin/stop", methods=["POST"])
def stop_jellyfin():
    try:
        container = client.containers.get("jellyfin")
        container.stop()
        return jsonify({"success": {"success": True, "message": "Jellyfin gestopt"}})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# ALL THE ADDGUARD ROUTES

@app.route("/api/adguard/status")
def adguard_stats():
    try:
        container = client.containers.get("adguardhome")
        if container.status == "running":
            return jsonify({"status": "online"})
    except Exception:
        pass
    return jsonify({"status": "offline"})

@app.route("/api/adguard/start", methods=["POST"])
def start_adguard():
    try:
        container = client.containers.get("adguardhome")
        container.start()
        return jsonify({"success": True, "message": "AdGuard gestart"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/adguard/stop", methods=["POST"])
def stop_adguard():
    try:
        container = client.containers.get("adguardhome")
        container.stop()
        return jsonify({"success": True, "message": "AdGuard gestopt"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

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
