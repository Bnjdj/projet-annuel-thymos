"""
THYMOS — IA Server local
Sert de proxy entre le frontend et les outils IA:
- Analyse video (video-analyzer.py)
- Chat IA (Ollama direct, pas besoin de proxy)

Usage: python server.py
Port: 8081
"""

import http.server
import json
import subprocess
import sys
import os
import threading
from pathlib import Path

PORT = 8081
SCRIPT_DIR = Path(__file__).parent
VIDEO_ANALYZER = SCRIPT_DIR / "video-analyzer.py"

# Store ongoing analyses
analyses = {}
analysis_counter = 0


class ThymosAPIHandler(http.server.BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/analyze-video":
            self.handle_analyze_video()
        else:
            self.send_error(404)

    def do_GET(self):
        if self.path.startswith("/api/analysis-status/"):
            self.handle_analysis_status()
        elif self.path.startswith("/api/analysis-result/"):
            self.handle_analysis_result()
        else:
            self.send_error(404)

    def handle_analyze_video(self):
        global analysis_counter
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        data = json.loads(body)

        url = data.get("url", "")
        frames = data.get("frames", 12)

        if not url:
            self.send_json({"error": "URL manquante"}, 400)
            return

        analysis_counter += 1
        analysis_id = f"analysis_{analysis_counter}"

        analyses[analysis_id] = {
            "status": "running",
            "url": url,
            "progress": "Demarrage...",
            "result": None
        }

        # Run analysis in background thread
        thread = threading.Thread(
            target=self.run_analysis,
            args=(analysis_id, url, frames)
        )
        thread.daemon = True
        thread.start()

        self.send_json({"id": analysis_id, "status": "started"})

    def run_analysis(self, analysis_id, url, frames):
        output_file = SCRIPT_DIR / f"analysis_{analysis_id}.txt"
        try:
            analyses[analysis_id]["progress"] = "Telechargement video..."
            result = subprocess.run(
                [sys.executable, str(VIDEO_ANALYZER), url,
                 "-o", str(output_file),
                 "-f", str(frames)],
                capture_output=True,
                text=True,
                timeout=1800  # 30 min max
            )

            if result.returncode == 0 and output_file.exists():
                with open(output_file, "r", encoding="utf-8") as f:
                    report = f.read()
                analyses[analysis_id]["status"] = "complete"
                analyses[analysis_id]["result"] = report
                analyses[analysis_id]["progress"] = "Termine"
            else:
                analyses[analysis_id]["status"] = "error"
                analyses[analysis_id]["progress"] = f"Erreur: {result.stderr[:500]}"

        except subprocess.TimeoutExpired:
            analyses[analysis_id]["status"] = "error"
            analyses[analysis_id]["progress"] = "Timeout (>30min)"
        except Exception as e:
            analyses[analysis_id]["status"] = "error"
            analyses[analysis_id]["progress"] = str(e)

    def handle_analysis_status(self):
        analysis_id = self.path.split("/")[-1]
        if analysis_id in analyses:
            self.send_json({
                "status": analyses[analysis_id]["status"],
                "progress": analyses[analysis_id]["progress"]
            })
        else:
            self.send_json({"error": "Analyse introuvable"}, 404)

    def handle_analysis_result(self):
        analysis_id = self.path.split("/")[-1]
        if analysis_id in analyses and analyses[analysis_id]["result"]:
            self.send_json({
                "status": "complete",
                "result": analyses[analysis_id]["result"]
            })
        elif analysis_id in analyses:
            self.send_json({
                "status": analyses[analysis_id]["status"],
                "progress": analyses[analysis_id]["progress"]
            })
        else:
            self.send_json({"error": "Analyse introuvable"}, 404)

    def send_json(self, data, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def log_message(self, format, *args):
        print(f"[THYMOS API] {args[0]}")


def main():
    server = http.server.HTTPServer(("", PORT), ThymosAPIHandler)
    print(f"=== THYMOS IA Server ===")
    print(f"API: http://localhost:{PORT}")
    print(f"Endpoints:")
    print(f"  POST /api/analyze-video  {{url, frames}}")
    print(f"  GET  /api/analysis-status/<id>")
    print(f"  GET  /api/analysis-result/<id>")
    print(f"")
    print(f"Ctrl+C pour arreter")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nArret du serveur.")
        server.server_close()


if __name__ == "__main__":
    main()
