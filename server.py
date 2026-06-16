"""
THYMOS Platform — Local Development Server
Run: python server.py
Open: http://localhost:3000
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from urllib.parse import unquote

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Security headers applied to every response
SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
    'Content-Security-Policy': (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.stripe.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "connect-src 'self' https://*.supabase.co https://api.stripe.com http://localhost:* http://127.0.0.1:*; "
        "img-src 'self' data: blob:; "
        "frame-src https://js.stripe.com https://buy.stripe.com;"
    ),
    'X-XSS-Protection': '1; mode=block',
}

# MIME types
MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.ics': 'text/calendar',
}


class ThymosHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        for header, value in SECURITY_HEADERS.items():
            self.send_header(header, value)
        # Cache control for dev
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return MIME_TYPES.get(ext, 'application/octet-stream')

    def do_GET(self):
        # Block access to backup files
        decoded = unquote(self.path)
        if 'backup' in decoded.lower():
            self.send_error(403, 'Access denied')
            return
        # Block access to .sql files
        if decoded.lower().endswith('.sql'):
            self.send_error(403, 'Access denied')
            return
        # Block access to .py files
        if decoded.lower().endswith('.py'):
            self.send_error(403, 'Access denied')
            return
        # Block access to .bat/.sh files
        if decoded.lower().endswith(('.bat', '.sh')):
            self.send_error(403, 'Access denied')
            return
        # Block access to .md files
        if decoded.lower().endswith('.md'):
            self.send_error(403, 'Access denied')
            return
        super().do_GET()

    def log_message(self, format, *args):
        # Colored output
        status = args[1] if len(args) > 1 else ''
        color = '\033[92m' if str(status).startswith('2') else '\033[93m' if str(status).startswith('3') else '\033[91m'
        reset = '\033[0m'
        sys.stderr.write(f"  {color}{args[0]}{reset} — {status}\n")


def main():
    os.chdir(DIRECTORY)

    with socketserver.TCPServer(("", PORT), ThymosHandler) as httpd:
        httpd.allow_reuse_address = True
        url = f"http://localhost:{PORT}"

        print()
        print("  ╔═══════════════════════════════════════╗")
        print("  ║     THYMOS Platform — Dev Server      ║")
        print("  ╠═══════════════════════════════════════╣")
        print(f"  ║  Local:   {url:<27}  ║")
        print(f"  ║  Admin:   {url + '/admin.html':<27}  ║")
        print("  ║  Status:  Running                     ║")
        print("  ║  Headers: Security ON                 ║")
        print("  ╠═══════════════════════════════════════╣")
        print("  ║  Ctrl+C to stop                       ║")
        print("  ╚═══════════════════════════════════════╝")
        print()

        # Open browser
        webbrowser.open(url)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Server stopped.")
            httpd.shutdown()


if __name__ == '__main__':
    main()
