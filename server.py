#!/usr/bin/env python3
"""
Simple HTTP Server for local development
Run: python server.py
Then open: http://localhost:8000/admin.html
"""
import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Server đang chạy tại http://localhost:{PORT}")
    print(f"Mở admin.html tại: http://localhost:{PORT}/admin.html")
    print("Nhấn Ctrl+C để dừng server")
    httpd.serve_forever()
