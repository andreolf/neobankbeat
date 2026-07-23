#!/usr/bin/env python3
"""Regenerate the homepage social card  ->  ../og.png  (1200x630).

Counts are read live from ../data.json so the card can never drift from the
dataset again. Deterministic output (no timestamps).
Run from repo root:  /tmp/nbchart-venv/bin/python tests/gen-og-home.py
Requires: pillow, fonttools, brotli.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
BG = "#0A0A10"
TEXT = "#EDEDF2"
DIM = "#8A8A9A"
ACCENT = "#FF5C16"
BLUE, PURPLE, GREEN = "#89B0FF", "#D075FF", "#BAF24A"

# ── fonts: convert repo woff2 -> ttf once ──
FDIR = Path("/tmp/nb-og-fonts"); FDIR.mkdir(exist_ok=True)
def ttf(name):
    out = FDIR / (name + ".ttf")
    if not out.exists():
        from fontTools.ttLib import TTFont
        f = TTFont(ROOT / "fonts" / (name + ".woff2")); f.flavor = None; f.save(out)
    return str(out)

SG, MONO = ttf("space-grotesk"), ttf("noto-sans-mono")
def sg(size, bold=True):
    f = ImageFont.truetype(SG, size)
    try: f.set_variation_by_axes([700 if bold else 500])
    except Exception: pass
    return f
def mono(size, bold=False):
    f = ImageFont.truetype(MONO, size)
    try: f.set_variation_by_axes([700 if bold else 400])
    except Exception: pass
    return f
def tw(d, txt, font): return d.textbbox((0, 0), txt, font=font)[2]

c = json.loads((ROOT / "data.json").read_text())["meta"]["counts"]
total = json.loads((ROOT / "data.json").read_text())["meta"]["total"]
trad, hyb, web3 = c["traditional"], c["hybrid"], c["web3_native"]

im = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(im)
MARG = 80

# logo (top-left)
lf = sg(36)
d.text((MARG, 66), "neobank", font=lf, fill=TEXT)
d.text((MARG + tw(d, "neobank", lf), 66), "beat", font=lf, fill=ACCENT)

# headline
h1 = sg(76)
y = 250
x = MARG
for word, col in [("who ", TEXT), ("watches ", TEXT), ("the ", TEXT), ("neobanks", ACCENT), ("?", TEXT)]:
    d.text((x, y), word, font=h1, fill=col)
    x += tw(d, word, h1)
sub = mono(19)
d.text((MARG, y + 96), f"{total} verified-active neobanks \u00b7 custody \u00b7 cards \u00b7 yield \u00b7 stablecoins \u00b7 regulation",
       font=sub, fill=DIM)

# stats row
stats = [(str(total), "tracked", TEXT), (str(trad), "traditional", BLUE),
         (str(hyb), "hybrid crypto", PURPLE), (str(web3), "web3-native", GREEN)]
nf, lf2 = mono(46, bold=True), mono(15)
sx, sy = MARG, H - 150
for n, lab, col in stats:
    d.text((sx, sy), n, font=nf, fill=col)
    d.text((sx, sy + 58), lab.upper(), font=lf2, fill=DIM)
    sx += max(tw(d, n, nf), tw(d, lab.upper(), lf2)) + 60

# bottom spectrum bar, weighted by category counts
bh, tot = 12, trad + hyb + web3
x = 0
for flex, col in [(trad, BLUE), (hyb, PURPLE), (web3, GREEN)]:
    wpx = round(W * flex / tot)
    d.rectangle([x, H - bh, x + wpx, H], fill=col)
    x += wpx
d.rectangle([x, H - bh, W, H], fill=GREEN)

out = ROOT / "og.png"
im.save(out, "PNG", optimize=True)
print(f"wrote {out} \u2014 {total}/{trad}/{hyb}/{web3}")
