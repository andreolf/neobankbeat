#!/usr/bin/env python3
"""Landscape ecosystem map with boxed sections and names under logos."""
import json, re, concurrent.futures, urllib.request, io
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path("/Users/francescoandreoli/neobankbeat")
CACHE = Path("/tmp/nb-logos"); CACHE.mkdir(exist_ok=True)

BG, PANEL, LINE = "#0A0A10", "#12121A", "#2A2A36"
TEXT, DIM, ACCENT = "#F2F2F5", "#8A8A99", "#FF5C16"
BLUE, PURPLE, GREEN, PEACH = "#89B0FF", "#D075FF", "#BAF24A", "#FFA680"

FDIR = Path("/tmp/nb-og-fonts")
def ttf(name):
    out = FDIR / (name + ".ttf")
    if not out.exists():
        from fontTools.ttLib import TTFont
        f = TTFont(ROOT / "fonts" / (name + ".woff2")); f.flavor = None; f.save(out)
    return str(out)
SGF, MONOF = ttf("space-grotesk"), ttf("noto-sans-mono")
def sg(size, w=700):
    f = ImageFont.truetype(SGF, size)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f
def mono(size, w=400):
    f = ImageFont.truetype(MONOF, size)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f

ents = json.loads((ROOT / "data.json").read_text())["entities"]
infra = json.loads((ROOT / "tests" / "infra-providers.json").read_text())
for e in ents:
    e["users"] = (e.get("reported_users") or {}).get("value_millions", 0) or 0

def dom_of(url):
    return re.sub(r"^https?://(www\.)?", "", url or "").split("/")[0]

def fetch(dom):
    out = CACHE / (dom.replace("/", "_") + ".png")
    if out.exists(): return
    try:
        req = urllib.request.Request(f"https://www.google.com/s2/favicons?domain={dom}&sz=128",
                                     headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=15).read()
        Image.open(io.BytesIO(raw)).convert("RGBA").save(out)
    except Exception: pass

# ── selections ──
bycat = lambda c: sorted([e for e in ents if e["category"] == c], key=lambda e: (-e["users"], e["name"].lower()))
trad, hyb, w3 = bycat("traditional"), bycat("hybrid"), bycat("web3-native")

ai_all = [e for e in ents if e.get("ai")]
ai_pick = (sorted([e for e in ai_all if e["ai"] == "underwriting"], key=lambda e: -e["users"])[:6] +
           sorted([e for e in ai_all if e["ai"] == "interface"], key=lambda e: -e["users"])[:5] +
           sorted([e for e in ai_all if e["ai"] == "agentic"], key=lambda e: -e["users"])[:6])

infra_items = [{"name": k, "domain": v["domain"], "n": len(v.get("clients", []))}
               for k, v in infra.items() if isinstance(v, dict) and v.get("domain")]
infra_items.sort(key=lambda v: (-v["n"], v["name"].lower()))

invc = {}
for e in ents:
    for iv in e.get("investors") or []:
        invc.setdefault(iv["name"], {"name": iv["name"], "domain": dom_of(iv["website"]), "n": 0})
        invc[iv["name"]]["n"] += 1
investors = sorted(invc.values(), key=lambda v: (-v["n"], v["name"].lower()))

ai_sorted = (sorted([e for e in ai_all if e["ai"] == "underwriting"], key=lambda e: -e["users"]) +
             sorted([e for e in ai_all if e["ai"] == "interface"], key=lambda e: -e["users"]) +
             sorted([e for e in ai_all if e["ai"] == "agentic"], key=lambda e: -e["users"]))
alldoms = set()
for items in [trad, hyb, w3, infra_items, investors]:
    for e in items:
        if e.get("domain"): alldoms.add(e["domain"])
with concurrent.futures.ThreadPoolExecutor(24) as ex:
    list(ex.map(fetch, alldoms))

# ── geometry ──
CELL_W, CELL_H, ICON = 100, 96, 54
PAD = 18
BAR = 40
M = 56
GAPX, GAPY = 22, 24

def box_w(cols): return PAD * 2 + cols * CELL_W
def box_h(rows): return BAR + PAD + rows * CELL_H + 6

import math
FULLCOLS = 24
def rows_of(n, cols): return math.ceil(n / cols)

W = M * 2 + box_w(FULLCOLS)
HEAD = 150
SECTIONS = [
    ("Traditional", BLUE, trad),
    ("Hybrid fiat + crypto", PURPLE, hyb),
    ("Web3-native", GREEN, w3),
    ("Infrastructure", PEACH, infra_items),
    ("The investors", "#E9E9EF", investors),
]
FOOT = 84
H = HEAD + sum(box_h(rows_of(len(s[2]), FULLCOLS)) + GAPY for s in SECTIONS) + FOOT

im = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(im)
def tw(t, f): return d.textbbox((0, 0), t, font=f)[2]

# spectrum top bar
for x in range(W):
    t = x / W
    if t < .5: a, b, u = (0x89, 0xB0, 0xFF), (0xD0, 0x75, 0xFF), t / .5
    else: a, b, u = (0xD0, 0x75, 0xFF), (0xBA, 0xF2, 0x4A), (t - .5) / .5
    c = tuple(round(a[i] + (b[i] - a[i]) * u) for i in range(3))
    d.line([(x, 0), (x, 6)], fill=c)

lf = sg(48)
lx = W / 2 - (tw("neobank", lf) + tw("beat", lf)) / 2
d.text((lx, 34), "neobank", font=lf, fill=TEXT)
d.text((lx + tw("neobank", lf), 34), "beat", font=lf, fill=ACCENT)
t2 = sg(27, 500)
sub = "The Neobank Ecosystem Landscape · July 2026"
d.text((W / 2 - tw(sub, t2) / 2, 100), sub, font=t2, fill=DIM)

def luminance(img):
    g = img.convert("LA").resize((16, 16))
    px = list(g.getdata())
    tot = sum(l * (a / 255) for l, a in px); wt = sum(a / 255 for l, a in px)
    return (tot / wt) if wt > 3 else 255

NAME_F = sg(15, 500)
NAME_S = sg(13, 500)
NICK = {"Andreessen Horowitz": "a16z", "Y Combinator": "YC", "Sequoia Capital": "Sequoia",
        "Ribbit Capital": "Ribbit", "Valar Ventures": "Valar", "General Catalyst": "Gen. Catalyst",
        "General Atlantic": "Gen. Atlantic", "QED Investors": "QED", "Peak XV Partners": "Peak XV",
        "Founders Fund": "Founders Fund", "Mercado Pago": "Mercado Pago", "Coinbase Card": "Coinbase Card",
        "Binance Card": "Binance Card", "Thought Machine": "Thought Mach.", "Community Federal Savings Bank": "CFSB",
        "Evolve Bank & Trust": "Evolve Bank", "Sutton Bank": "Sutton Bank", "Gemini Credit Card": "Gemini Card",
        "Airtel Payments Bank": "Airtel PB", "Jio Payments Bank": "Jio PB", "Banco Inter": "Banco Inter",
        "Bitget Wallet": "Bitget Wallet", "Avalanche Card": "Avalanche", "1inch Card": "1inch",
        "EtherFi Cash": "EtherFi", "Trust Wallet": "Trust Wallet"}
def draw_tile(cx, cy, item, color):
    x0 = cx + (CELL_W - ICON) // 2
    icon = None
    p = CACHE / ((item.get("domain") or "x").replace("/", "_") + ".png")
    if p.exists():
        try: icon = Image.open(p).convert("RGBA")
        except Exception: icon = None
    if icon is not None:
        bright = luminance(icon) > 235
        tile = Image.new("RGBA", (ICON, ICON), "#2A2A36" if not bright else "#E9E9EF")
        ic = ImageOps.contain(icon, (ICON - 14, ICON - 14))
        tile.alpha_composite(ic, ((ICON - ic.width) // 2, (ICON - ic.height) // 2))
        mask = Image.new("L", (ICON, ICON), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, ICON - 1, ICON - 1], radius=11, fill=255)
        im.paste(tile.convert("RGB"), (int(x0), int(cy)), mask)
    else:
        d.rounded_rectangle([x0, cy, x0 + ICON - 1, cy + ICON - 1], radius=11, fill=PANEL, outline=LINE)
        ltr = sg(26)
        ch = item["name"][0].upper()
        d.text((x0 + ICON / 2 - tw(ch, ltr) / 2, cy + 11), ch, font=ltr, fill=color)
    name = NICK.get(item["name"], item["name"])
    f = NAME_F if tw(name, NAME_F) <= CELL_W - 8 else NAME_S
    full = name
    while tw(name, f) > CELL_W - 8 and len(name) > 3:
        name = name[:-1]
    if name != full:
        name = name[:-1] + "…"
    d.text((cx + CELL_W / 2 - tw(name, f) / 2, cy + ICON + 7), name, font=f, fill="#C9C9D4")

def draw_box(x, y, cols, rows, title, color, items, shown, total):
    w, h = box_w(cols), box_h(rows)
    d.rounded_rectangle([x, y, x + w, y + h], radius=14, fill=PANEL, outline=LINE, width=2)
    # header bar
    d.rounded_rectangle([x, y, x + w, y + BAR], radius=14, fill=color)
    d.rectangle([x, y + BAR - 14, x + w, y + BAR], fill=color)
    hf = sg(21)
    d.text((x + PAD, y + 8), title, font=hf, fill="#0A0A10")
    cf = mono(15, 700)
    tail = f"{total} tracked" if total > shown else f"all {total}"
    d.text((x + w - PAD - tw(tail, cf), y + 12), tail, font=cf, fill="#0A0A10")
    # tiles
    grid = items[:shown]
    for i, it in enumerate(grid):
        col, row = i % cols, i // cols
        draw_tile(x + PAD + col * CELL_W, y + BAR + PAD + row * CELL_H, it, color)
    # "+N more" cell
    if total > shown:
        i = len(grid)
        col, row = i % cols, i // cols
        cx, cy = x + PAD + col * CELL_W, y + BAR + PAD + row * CELL_H
        x0 = cx + (CELL_W - ICON) // 2
        d.rounded_rectangle([x0, cy, x0 + ICON - 1, cy + ICON - 1], radius=11, outline=color, width=2)
        pf = sg(17)
        t = f"+{total - shown}"
        d.text((x0 + ICON / 2 - tw(t, pf) / 2, cy + 16), t, font=pf, fill=color)
        mf = NAME_F
        d.text((cx + CELL_W / 2 - tw("more", mf) / 2, cy + ICON + 7), "more", font=mf, fill=DIM)

y = HEAD
for title, color, items in SECTIONS:
    r = rows_of(len(items), FULLCOLS)
    draw_box(M, y, FULLCOLS, r, title, color, items, len(items), len(items))
    y += box_h(r) + GAPY

# footer
ff = mono(18)
d.text((M, y + 18), f"{len(trad)+len(hyb)+len(w3)} neobanks · {len(infra_items)} infra providers · {len(investors)} investors · open data, MIT", font=ff, fill=DIM)
r = "neobankbeat.com · who watches the neobanks?"
d.text((W - M - tw(r, ff), y + 18), r, font=ff, fill=ACCENT)

out = ROOT / "x-tweets" / "ecosystem-landscape-full.png"
im.save(out, "PNG", optimize=True)
print("wrote", out, im.size)
