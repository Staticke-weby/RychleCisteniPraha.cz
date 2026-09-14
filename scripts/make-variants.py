"""Generuje responzivní WebP a AVIF varianty obrázků.
Spouštět ručně po výměně obrázků:  python scripts/make-variants.py
Vyžaduje Pillow (pip install Pillow).
"""
from PIL import Image
import os, glob

SRC = os.path.join("src", "assets", "img")
OUT = os.path.join(SRC, "opt")
WIDTHS = [400, 800, 1200]

os.makedirs(OUT, exist_ok=True)

files = []
for ext in ("*.jpg", "*.jpeg", "*.png"):
    files.extend(glob.glob(os.path.join(SRC, ext)))
files.sort()

count = 0
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    is_png = f.lower().endswith(".png")
    im = Image.open(f)
    im = im.convert("RGBA") if is_png else im.convert("RGB")
    w, h = im.size
    widths = sorted({min(x, w) for x in WIDTHS} | {w})
    for width in widths:
        if width < 64:
            continue
        resized = im.resize((width, max(1, round(h * width / w))), Image.LANCZOS)
        base = os.path.join(OUT, f"{name}-{width}")
        resized.save(base + ".webp", "WEBP", quality=82, method=6)
        resized.save(base + ".avif", "AVIF", quality=55)
        count += 1

print(f"Hotovo: {count} variant ({len(files)} obrázků)")
