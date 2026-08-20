from flask import Flask, jsonify
import psutil

app = Flask(__name__)

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

if __name__ == "__main__":
    app.run()