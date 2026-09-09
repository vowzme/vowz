#!/usr/bin/env python3
"""Generate Vowz premium splash screens (ivory + gold) with logo + tagline.

Run: python3 scripts/generate-splash.py
Keeps the white-glossy install-asset convention (edges stay near-white).
"""
import os
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "/tmp/knowledge/skill/canvas-design/canvas-fonts"
SERIF = os.path.join(FONT_DIR, "Italiana-Regular.ttf")
SANS = os.path.join(FONT_DIR, "InstrumentSans-Regular.ttf")
LOGO = os.environ.get("VOWZ_LOGO", "/mnt/user-uploads/image-5.png")
OUT = "public/splash"

NAVY = (0, 31, 63)
GOLD = (212, 175, 55)
IVORY_TOP = (255, 255, 255)
IVORY_MID = (252, 249, 242)
IVORY_BOT = (246, 241, 231)

SIZES = [
    ("iphone-750x1334", 750, 1334),
    ("iphone-1242x2208", 1242, 2208),
    ("iphone-1125x2436", 1125, 2436),
    ("iphone-828x1792", 828, 1792),
    ("iphone-1242x2688", 1242, 2688),
    ("iphone-1170x2532", 1170, 2532),
    ("iphone-1179x2556", 1179, 2556),
    ("iphone-1290x2796", 1290, 2796),
    ("ipad-1536x2048", 1536, 2048),
    ("ipad-1668x2388", 1668, 2388),
    ("ipad-2048x2732", 2048, 2732),
]


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def trim(im):
    bbox = im.convert("RGBA").getchannel("A").getbbox()
    return im.crop(bbox) if bbox else im


def background(w, h):
    bg = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(bg)
    for y in range(h):
        t = y / max(h - 1, 1)
        c = lerp(IVORY_TOP, IVORY_MID, t / 0.55) if t < 0.55 else lerp(IVORY_MID, IVORY_BOT, (t - 0.55) / 0.45)
        d.line([(0, y), (w, y)], fill=c)
    # soft gold halo behind the mark
    halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    cx, cy = w / 2, h * 0.44
    r = w * 0.62
    steps = 90
    for i in range(steps):
        f = i / steps
        rr = r * (1 - f)
        alpha = int(16 * f * f)
        hd.ellipse([cx - rr, cy - rr * 0.72, cx + rr, cy + rr * 0.72], fill=GOLD + (alpha,))
    bg = Image.alpha_composite(bg.convert("RGBA"), halo).convert("RGB")
    return bg


def text_tracked(draw, xy, text, font, fill, tracking):
    x, y = xy
    total = sum(draw.textlength(ch, font=font) + tracking for ch in text) - tracking
    x -= total / 2
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return total


def build(w, h):
    img = background(w, h)
    d = ImageDraw.Draw(img)
    unit = min(w, h)

    # thin gold frame, inset so PNG edges stay ivory
    inset = round(unit * 0.055)
    d.rectangle([inset, inset, w - inset, h - inset], outline=GOLD + (0,) if False else GOLD, width=max(1, round(unit / 700)))
    # corner ticks in navy for a crafted, letterpress feel
    tick = round(unit * 0.035)
    lw = max(2, round(unit / 380))
    for (cx, cy, dx, dy) in [(inset, inset, 1, 1), (w - inset, inset, -1, 1), (inset, h - inset, 1, -1), (w - inset, h - inset, -1, -1)]:
        d.line([(cx, cy), (cx + dx * tick, cy)], fill=NAVY, width=lw)
        d.line([(cx, cy), (cx, cy + dy * tick)], fill=NAVY, width=lw)

    # logo
    logo = trim(Image.open(LOGO).convert("RGBA"))
    target_w = round(w * 0.66)
    logo = logo.resize((target_w, round(logo.height * target_w / logo.width)), Image.LANCZOS)
    lx = (w - logo.width) // 2
    ly = round(h * 0.44 - logo.height / 2)
    img.paste(logo, (lx, ly), logo)

    # divider: gold hairline with a diamond
    dy = ly + logo.height + round(unit * 0.075)
    seg = round(w * 0.16)
    hair = max(1, round(unit / 800))
    d.line([(w / 2 - seg - unit * 0.03, dy), (w / 2 - unit * 0.03, dy)], fill=GOLD, width=hair)
    d.line([(w / 2 + unit * 0.03, dy), (w / 2 + seg + unit * 0.03, dy)], fill=GOLD, width=hair)
    dsz = round(unit * 0.012)
    d.polygon([(w / 2, dy - dsz), (w / 2 + dsz, dy), (w / 2, dy + dsz), (w / 2 - dsz, dy)], fill=GOLD)

    # tagline
    ts = round(unit * 0.058)
    tf = ImageFont.truetype(SERIF, ts)
    text_tracked(d, (w / 2, dy + round(unit * 0.05)), "Where Vows Come Alive", tf, NAVY, unit * 0.006)

    # footer wordmark
    ff = ImageFont.truetype(SANS, round(unit * 0.024))
    text_tracked(d, (w / 2, h - inset - round(unit * 0.075)), "VOWZ.ME", ff, (150, 130, 80), unit * 0.012)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, w, h in SIZES:
        build(w, h).save(os.path.join(OUT, f"{name}.png"), optimize=True)
        print("wrote", name)


if __name__ == "__main__":
    main()
