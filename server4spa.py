#!/usr/bin/env python

# Source: https://gist.github.com/iktakahiro/2c48962561ea724f1e9d#file-server4spa-py
# Python3 http.server for Single Page Application

import urllib.parse
import http.server
import socketserver
import re
import os
from pathlib import Path

HOST = ('0.0.0.0', 8080)
pattern = re.compile('.png|.jpg|.jpeg|.js|.css|.ico|.gif|.svg', re.IGNORECASE)

web_dir = os.path.join(os.path.dirname(__file__), 'dist')
os.chdir(web_dir)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        request_file_path = Path(url_parts.path.strip("/"))

        ext = request_file_path.suffix
        if not request_file_path.is_file() and not pattern.match(ext):
            self.path = 'index.html'

        return http.server.SimpleHTTPRequestHandler.do_GET(self)


httpd = socketserver.TCPServer(HOST, Handler)
httpd.serve_forever()