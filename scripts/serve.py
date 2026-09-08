"""Serve static app files on localhost; never receive document uploads."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'docs'
print('Doc-Org: http://localhost:8080 — Beenden mit Strg+C')
ThreadingHTTPServer(('127.0.0.1',8080),partial(SimpleHTTPRequestHandler,directory=str(root))).serve_forever()
