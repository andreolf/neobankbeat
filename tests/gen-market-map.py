#!/usr/bin/env python3
"""Full neobank ecosystem map: 368 neobanks by wave + AI tags + infra + investors."""
import json, concurrent.futures, urllib.request, io, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path("/Users/francescoandreoli/neobankbeat")
CACHE = Path("/tmp/nb-logos"); CACHE.mkdir(exist_ok=True)

BG, PANEL, LINE = "#0A0A10", "#12121A", "#23232E"
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
catmap = {"traditional": "T", "hybrid": "H", "web3-native": "W"}
for e in ents:
    e["c"] = catmap[e["category"]]
    e["users"] = (e.get("reported_users") or {}).get("value_millions", 0) or 0

def dom_of(url):
    return re.sub(r"^https?://(www\.)?", "", url or "").split("/")[0]

# investors with 2+ portfolio companies, ranked
invc = {}
for e in ents:
    for iv in e.get("investors") or []:
        k = iv["name"]
        invc.setdefault(k, {"name": k, "domain": dom_of(iv["website"]), "n": 0})
        invc[k]["n"] += 1
investors = sorted([v for v in invc.values() if v["n"] >= 2], key=lambda v: (-v["n"], v["name"].lower()))

infra_items = sorted(
    [{"name": k, "domain": v["domain"], "type": v.get("type", "")} for k, v in infra.items()
     if isinstance(v, dict) and v.get("domain")],
    key=lambda v: (v["type"], v["name"].lower()))

AI_ORDER = {"underwriting": 0, "interface": 1, "agentic": 2}
ai_items = sorted([e for e in ents if e.get("ai")], key=lambda e: (AI_ORDER[e["ai"]], -e["users"], e["name"].lower()))

def fetch(dom):
    out = CACHE / (dom.replace("/", "_") + ".png")
    if out.exists():
        return
    try:
        req = urllib.request.Request(
            f"https://www.google.com/s2/favicons?domain={dom}&sz=128",
            headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=15).read()
        Image.open(io.BytesIO(raw)).convert("RGBA").save(out)
    except Exception:
        pass

alldoms = ([e["domain"] for e in ents if e.get("domain")] +
           [v["domain"] for v in infra_items] + [v["domain"] for v in investors])
with concurrent.futures.ThreadPoolExecutor(24) as ex:
    list(ex.map(fetch, set(alldoms)))
print("logo cache:", sum(1 for d in set(alldoms) if (CACHE / (d.replace('/', '_') + '.png')).exists()), "/", len(set(alldoms)))

# ── layout ──
TILE, GAP, COLS = 56, 12, 21
MARG = 72
W = MARG * 2 + COLS * TILE + (COLS - 1) * GAP

def rows_for(n):
    return (n + COLS - 1) // COLS

waves = [(CAT := None, )]  # placeholder to keep linters calm
sections = [
    ("the neobanks — traditional", BLUE, f"{sum(1 for e in ents if e['c']=='T')}", "licensed & partner-bank fiat apps",
     sorted([e for e in ents if e["c"] == "T"], key=lambda e: (-e["users"], e["name"].lower()))),
    ("hybrid fiat + crypto", PURPLE, f"{sum(1 for e in ents if e['c']=='H')}", "banking plus custodial crypto",
     sorted([e for e in ents if e["c"] == "H"], key=lambda e: (-e["users"], e["name"].lower()))),
    ("web3-native", GREEN, f"{sum(1 for e in ents if e['c']=='W')}", "self-custodial money apps",
     sorted([e for e in ents if e["c"] == "W"], key=lambda e: (-e["users"], e["name"].lower()))),
    ("ai in production", ACCENT, f"{len(ai_items)}",
     f"{sum(1 for e in ai_items if e['ai']=='underwriting')} underwriting · {sum(1 for e in ai_items if e['ai']=='interface')} interface · {sum(1 for e in ai_items if e['ai']=='agentic')} agentic — verified, not marketing",
     ai_items),
    ("the infra they run on", PEACH, f"{len(infra_items)}", "BIN sponsors · BaaS · core banking · card processors · stablecoin rails",
     infra_items),
    ("the investors behind them", TEXT, f"{len(investors)}", "funds with 2+ tracked neobanks in portfolio, most active first",
     investors),
]

HEAD_H, SECT_H, FOOT_H = 224, 78, 96
H = HEAD_H + sum(SECT_H + rows_for(len(g)) * (TILE + GAP) + 30 for *_, g in sections) + FOOT_H

im = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(im)

for x in range(W):
    t = x / W
    if t < .5: a, b, u = (0x89, 0xB0, 0xFF), (0xD0, 0x75, 0xFF), t / .5
    else: a, b, u = (0xD0, 0x75, 0xFF), (0xBA, 0xF2, 0x4A), (t - .5) / .5
    c = tuple(round(a[i] + (b[i] - a[i]) * u) for i in range(3))
    d.line([(x, 0), (x, 6)], fill=c)

def tw(txt, font):
    return d.textbbox((0, 0), txt, font=font)[2]

lf = sg(46)
d.text((MARG, 44), "neobank", font=lf, fill=TEXT)
d.text((MARG + tw("neobank", lf), 44), "beat", font=lf, fill=ACCENT)
tagf = mono(19)
d.text((W - MARG - tw("neobankbeat.com", tagf), 58), "neobankbeat.com", font=tagf, fill=DIM)
tf = sg(40)
d.text((MARG, 122), "the neobank ecosystem, mapped. all of it.", font=tf, fill=TEXT)
sf = mono(20)
d.text((MARG, 178), "368 neobanks · 67 with AI in production · 107 infra providers · 69 repeat investors · july 2026", font=sf, fill=DIM)

def luminance(img):
    g = img.convert("LA").resize((16, 16))
    px = list(g.getdata())
    tot = sum(l * (a / 255) for l, a in px); wt = sum(a / 255 for l, a in px)
    return (tot / wt) if wt > 3 else 255

y = HEAD_H
R = 12
for label, color, count, sub, items in sections:
    hf = sg(26)
    d.text((MARG, y + 2), label, font=hf, fill=color)
    cf = mono(20)
    d.text((MARG + tw(label, hf) + 18, y + 9), f"· {count}", font=cf, fill=DIM)
    subf = mono(16)
    d.text((W - MARG - tw(sub, subf), y + 12), sub, font=subf, fill=DIM)
    d.line([(MARG, y + 46), (W - MARG, y + 46)], fill=LINE, width=2)
    y += SECT_H
    for i, e in enumerate(items):
        col, row = i % COLS, i // COLS
        x0 = MARG + col * (TILE + GAP)
        y0 = y + row * (TILE + GAP)
        icon = None
        p = CACHE / ((e.get("domain") or "x").replace("/", "_") + ".png")
        if p.exists():
            try: icon = Image.open(p).convert("RGBA")
            except Exception: icon = None
        if icon is not None:
            bright = luminance(icon) > 235
            tile_bg = "#2A2A36" if not bright else "#E9E9EF"
            tile = Image.new("RGBA", (TILE, TILE), tile_bg)
            ic = ImageOps.contain(icon, (TILE - 16, TILE - 16))
            tile.alpha_composite(ic, ((TILE - ic.width) // 2, (TILE - ic.height) // 2))
            mask = Image.new("L", (TILE, TILE), 0)
            ImageDraw.Draw(mask).rounded_rectangle([0, 0, TILE - 1, TILE - 1], radius=R, fill=255)
            im.paste(tile.convert("RGB"), (x0, y0), mask)
        else:
            d.rounded_rectangle([x0, y0, x0 + TILE - 1, y0 + TILE - 1], radius=R, fill=PANEL, outline=LINE)
            ltr = sg(28)
            ch = e["name"][0].upper()
            d.text((x0 + TILE / 2 - tw(ch, ltr) / 2, y0 + 12), ch, font=ltr, fill=color if color != TEXT else DIM)
    y += rows_for(len(items)) * (TILE + GAP) + 30

d.line([(MARG, H - 64), (W - MARG, H - 64)], fill=LINE, width=2)
ff = mono(19)
d.text((MARG, H - 48), "open data · MIT · data.json · every entity verified & sourced", font=ff, fill=DIM)
d.text((W - MARG - tw("who watches the neobanks?", ff), H - 48), "who watches the neobanks?", font=ff, fill=ACCENT)

out = ROOT / "x-tweets" / "ecosystem-map.png"
im.save(out, "PNG", optimize=True)
print("wrote", out, im.size)
