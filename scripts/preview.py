#!/usr/bin/env python3
"""Serve a local preview without stale browser caches. Never used in production."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
class Preview(SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Cache-Control','no-store')
  super().end_headers()
root=Path(__file__).resolve().parent.parent
print('Preview: http://127.0.0.1:8766/',flush=True)
ThreadingHTTPServer(('127.0.0.1',8766),partial(Preview,directory=str(root))).serve_forever()
