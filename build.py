#!/usr/bin/env python3
"""Baut assets/css/site.css und assets/js/site.js aus src/ (minifiziert) und setzt in allen Seiten
eine neue Versionsnummer (?v=…), damit Browser die neuen Dateien laden.

Aufruf:  npm install && python3 build.py     (braucht Node.js)
"""
import hashlib, pathlib, re, subprocess, sys, os

ROOT = pathlib.Path(__file__).parent
LOCAL = ROOT / "node_modules" / ".bin" / "esbuild"
ESBUILD = os.environ.get("ESBUILD", str(LOCAL) if LOCAL.exists() else "npx --yes esbuild@0.25").split()

def run(args):
    subprocess.run(ESBUILD + args, check=True, cwd=ROOT)

run(["src/site.css", "--minify", "--outfile=assets/css/site.css", "--log-level=warning"])
run(["src/site.js", "--minify", "--format=esm", "--target=es2020", "--outfile=assets/js/site.js", "--log-level=warning"])
# 3D-Modul: eigene Quellen in src/ring/ plus three.js (vorher einmal `npm install` ausführen)
run(["src/ring.js", "--bundle", "--minify", "--format=esm", "--target=es2020", "--legal-comments=eof", "--outfile=assets/js/ring.js", "--log-level=warning"])

h = hashlib.sha1()
for f in ["assets/css/site.css", "assets/js/site.js", "assets/js/ring.js", "assets/js/map.js", "assets/map/region.json"]:
    h.update((ROOT / f).read_bytes())
ver = h.hexdigest()[:8]
n = 0
for page in sorted(ROOT.glob("*.html")):
    s = page.read_text(encoding="utf-8")
    t = re.sub(r"\?v=[0-9a-f]{8}", f"?v={ver}", s)
    if t != s:
        page.write_text(t, encoding="utf-8"); n += 1
print(f"Version {ver} in {n} Seiten gesetzt.")
