from flask import Flask, jsonify, render_template, redirect, url_for
import psutil

app = Flask(__name__)

# --------------
# API ROUTES
# -------------

@app.route("/api/health")
def health():
    return jsonify({"status":"ok"})

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