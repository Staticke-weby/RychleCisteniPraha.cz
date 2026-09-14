"""Vygeneruje obrázek pro sdílení (Open Graph), 1200x630.
Spouštět ručně:  python scripts/make-og-image.py
Vyžaduje Pillow (pip install Pillow).
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1200, 630
OUT = os.path.join("src", "assets", "img", "og-image.jpg")

GOLD = (231, 181, 63)
WHITE = (245, 247, 250)
MUTED = (176, 187, 200)
DARK1 = (11, 17, 27)
DARK2 = (16, 24, 38)


def font(bold, size):
    for name in (("segoeuib.ttf" if bold else "segoeui.ttf"), ("arialbd.ttf" if bold else "arial.ttf")):
        p = os.path.join("C:\\Windows\\Fonts", name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


# pozadí - vertikální gradient
img = Image.new("RGB", (W, H), DARK1)
d = ImageDraw.Draw(img)
for y in range(H):
    f = y / H
    d.line(
        [(0, y), (W, y)],
        fill=(
            int(DARK1[0] + (DARK2[0] - DARK1[0]) * f),
            int(DARK1[1] + (DARK2[1] - DARK1[1]) * f),
            int(DARK1[2] + (DARK2[2] - DARK1[2]) * f),
        ),
    )

# zlatý přeliv + dekorativní domeček vpravo
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([W - 520, -260, W + 280, 480], fill=(231, 181, 63, 80))
glow = glow.filter(ImageFilter.GaussianBlur(120))
img = Image.alpha_composite(img.convert("RGBA"), glow)

house = Image.new("RGBA", (W, H), (0, 0, 0, 0))
hd = ImageDraw.Draw(house)
lw = 12
hd.line([(770, 320), (975, 130), (1180, 320)], fill=GOLD + (70,), width=lw, joint="curve")
hd.line([(815, 290), (815, 540), (1135, 540), (1135, 290)], fill=GOLD + (70,), width=lw, joint="curve")
hd.line([(930, 540), (930, 400), (1020, 400), (1020, 540)], fill=GOLD + (70,), width=lw - 3, joint="curve")
img = Image.alpha_composite(img, house)
d = ImageDraw.Draw(img)

# logo
logo_path = os.path.join("src", "assets", "img", "logo.png")
if os.path.exists(logo_path):
    logo = Image.open(logo_path).convert("RGBA")
    lw2 = 420
    logo = logo.resize((lw2, round(logo.height * lw2 / logo.width)), Image.LANCZOS)
    img.paste(logo, (72, 74), logo)

# nadpis
f_title = font(True, 54)
title = "Profesionální čištění vozidel a úklidové služby v Praze"
lines = []
cur = ""
for w in title.split():
    t = (cur + " " + w).strip()
    if d.textlength(t, font=f_title) <= 660:
        cur = t
    else:
        lines.append(cur)
        cur = w
lines.append(cur)
y = 250
for ln in lines:
    d.text((72, y), ln, font=f_title, fill=WHITE)
    y += 66

# podtitul
d.text((72, y + 8), "Přijedeme až k vám  •  Praha a okolí", font=font(False, 30), fill=GOLD)

# spodní lišta s kontaktem
d.line([(72, 548), (1128, 548)], fill=(255, 255, 255, 40), width=2)
d.text((72, 566), "+420 777 480 443", font=font(True, 30), fill=GOLD)
url = "www.rychlecistenipraha.cz"
d.text((W - 72 - d.textlength(url, font=font(False, 28)), 568), url, font=font(False, 28), fill=MUTED)

img.convert("RGB").save(OUT, "JPEG", quality=88)
print("Uloženo: " + OUT + f" ({W}x{H})")
