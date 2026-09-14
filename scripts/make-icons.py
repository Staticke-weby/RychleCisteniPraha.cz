"""Generuje PNG ikony (apple-touch + Android/maskable) pro web.
Spouštět ručně:  python scripts/make-icons.py
Vyžaduje Pillow (pip install Pillow).
"""
from PIL import Image, ImageDraw
import os

OUT = os.path.join("src", "assets", "icons")
os.makedirs(OUT, exist_ok=True)

DARK = (16, 24, 38, 255)
GOLD = (231, 181, 63, 255)
WHITE = (255, 255, 255, 255)


def draw_icon(size, maskable):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if maskable:
        d.rectangle([0, 0, size, size], fill=DARK)
        inset = size * 0.20
    else:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=DARK)
        inset = size * 0.15

    x0 = y0 = inset
    x1 = y1 = size - inset
    w, h = x1 - x0, y1 - y0
    lw = max(2, int(size * 0.05))

    apex = (x0 + w * 0.5, y0 + h * 0.05)
    left = (x0 + w * 0.03, y0 + h * 0.42)
    right = (x0 + w * 0.97, y0 + h * 0.42)
    d.line([left, apex, right], fill=GOLD, width=lw, joint="curve")

    bl = (x0 + w * 0.18, y0 + h * 0.34)
    br = (x0 + w * 0.82, y0 + h * 0.34)
    bbl = (x0 + w * 0.18, y0 + h * 0.88)
    bbr = (x0 + w * 0.82, y0 + h * 0.88)
    d.line([bl, bbl, bbr, br], fill=GOLD, width=lw, joint="curve")

    dl = (x0 + w * 0.38, y0 + h * 0.88)
    dr = (x0 + w * 0.62, y0 + h * 0.88)
    dt = (x0 + w * 0.38, y0 + h * 0.60)
    d.line([dt, dl, dr], fill=GOLD, width=max(2, lw - 2), joint="curve")

    # jiskřička
    cx, cy = x0 + w * 0.5, y0 + h * 0.55
    r = w * 0.07
    d.line([(cx - r, cy), (cx + r, cy)], fill=WHITE, width=max(1, lw - 3))
    d.line([(cx, cy - r), (cx, cy + r)], fill=WHITE, width=max(1, lw - 3))

    return im


for size in (180, 192, 512):
    draw_icon(size, False).save(os.path.join(OUT, f"icon-{size}.png"))
draw_icon(512, True).save(os.path.join(OUT, "maskable-512.png"))
print("Ikony uloženy do " + OUT)
