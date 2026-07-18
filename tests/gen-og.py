#!/usr/bin/env python3
"""Generate per-page OG images (1200x630) for profiles, blog posts and /ai/.

Deterministic output (no timestamps in PNGs) so unchanged cards don't churn git.
Run from repo root:  /tmp/nbchart-venv/bin/python tests/gen-og.py
Requires: pillow, fonttools, brotli (for woff2 -> ttf conversion).
"""
import json, os, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
BG = "#0A0A10"
PANEL = "#12121A"
LINE = "#23232E"
TEXT = "#F2F2F5"
DIM = "#8A8A99"
ACCENT = "#FF5C16"
CAT = {"traditional": ("#89B0FF", "traditional"),
       "hybrid": ("#D075FF", "hybrid crypto"),
       "web3-native": ("#BAF24A", "web3-native")}

# ── fonts: convert repo woff2 -> ttf once ──
FDIR = Path("/tmp/nb-og-fonts"); FDIR.mkdir(exist_ok=True)
def ttf(name):
    out = FDIR / (name + ".ttf")
    if not out.exists():
        from fontTools.ttLib import TTFont
        f = TTFont(ROOT / "fonts" / (name + ".woff2"))
        f.flavor = None
        f.save(out)
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

def tw(d, txt, font):
    return d.textbbox((0, 0), txt, font=font)[2]

def base_card():
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    # three-wave gradient top bar (blue -> purple -> green), like the homepage spectrum
    for x in range(W):
        t = x / W
        if t < .5:
            a, b, u = (0x89, 0xB0, 0xFF), (0xD0, 0x75, 0xFF), t / .5
        else:
            a, b, u = (0xD0, 0x75, 0xFF), (0xBA, 0xF2, 0x4A), (t - .5) / .5
        c = tuple(round(a[i] + (b[i] - a[i]) * u) for i in range(3))
        d.line([(x, 0), (x, 7)], fill=c)
    # logo
    lf = sg(44)
    d.text((64, 48), "neobank", font=lf, fill=TEXT)
    d.text((64 + tw(d, "neobank", lf), 48), "beat", font=lf, fill=ACCENT)
    tag = mono(17)
    d.text((W - 64 - tw(d, "who watches the neobanks?", tag), 62), "who watches the neobanks?", font=tag, fill=DIM)
    # footer
    d.line([(64, H - 78), (W - 64, H - 78)], fill=LINE, width=2)
    ff = mono(19)
    d.text((64, H - 56), "neobankbeat.com", font=ff, fill=ACCENT)
    d.text((W - 64 - tw(d, "open data · MIT", ff), H - 56), "open data · MIT", font=ff, fill=DIM)
    return im, d

def fit(d, txt, max_w, start, floor=34, bold=True):
    s = start
    while s > floor and tw(d, txt, sg(s, bold)) > max_w:
        s -= 2
    return sg(s, bold)

def chip(d, x, y, txt, color, size=20):
    f = mono(size, bold=True)
    w = tw(d, txt, f)
    d.rounded_rectangle([x, y, x + w + 28, y + size + 18], radius=(size + 18) // 2, outline=color, width=2)
    d.text((x + 14, y + 8), txt, font=f, fill=color)
    return x + w + 28 + 14

def save(im, rel):
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "PNG", optimize=True)

def slugify(name):
    s = name.lower()
    s = re.sub(r"[àáâãä]", "a", s); s = re.sub(r"[èéêë]", "e", s); s = re.sub(r"[ìíîï]", "i", s)
    s = re.sub(r"[òóôõö]", "o", s); s = re.sub(r"[ùúûü]", "u", s); s = re.sub(r"[ñ]", "n", s)
    s = re.sub(r"[çć]", "c", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "x"

AITAG = {"underwriting": "AI underwriting in production",
         "interface": "AI assistant as the interface",
         "agentic": "banking for AI agents"}

def entity_card(e):
    im, d = base_card()
    color, label = CAT[e["category"]]
    y = 168
    x = chip(d, 64, y, label, color)
    if e.get("ai"):
        x = chip(d, x, y, "ai · " + e["ai"], ACCENT)
    if e.get("stablecoins"):
        chip(d, x, y, "stablecoins", "#BAF24A" if e["category"] != "web3-native" else DIM)
    name_f = fit(d, e["name"], W - 128, 96)
    d.text((60, 236), e["name"], font=name_f, fill=TEXT)
    y2 = 236 + name_f.size + 34
    m1 = mono(24)
    facts = " · ".join(v for v in [e.get("hq", "—"), "est. " + str(e.get("founded", "—")), e.get("custody", "")] if v and v != "—")
    d.text((64, y2), facts[:78], font=m1, fill=DIM)
    reg = e.get("regulation_type", "")
    line3 = []
    if reg and reg != "Unclassified": line3.append(reg)
    ru = e.get("reported_users")
    if ru: line3.append(f"{ru['value_millions']}M {ru['metric']}")
    if line3:
        d.text((64, y2 + 42), " · ".join(line3)[:78], font=m1, fill=TEXT)
    return im

def blog_card(title, date, tag):
    im, d = base_card()
    chip(d, 64, 158, tag or "deep dive", ACCENT)
    # wrap title over up to 3 lines
    words = title.split()
    for size in range(64, 33, -2):
        f = sg(size)
        lines, cur = [], ""
        for w_ in words:
            t = (cur + " " + w_).strip()
            if tw(d, t, f) <= W - 128: cur = t
            else: lines.append(cur); cur = w_
        lines.append(cur)
        if len(lines) <= 3: break
    y = 226
    for ln in lines[:3]:
        d.text((60, y), ln, font=f, fill=TEXT); y += f.size + 12
    d.text((64, min(y + 18, H - 130)), date + " · neobankbeat blog", font=mono(22), fill=DIM)
    return im

def ai_page_card(n_total, n_u, n_i, n_a):
    im, d = base_card()
    chip(d, 64, 158, "narrative check", ACCENT)
    f = sg(72)
    d.text((60, 226), "AI neobanks, verified", font=f, fill=TEXT)
    m = mono(24)
    d.text((64, 330), f"{n_total} of 368 tracked have AI in production", font=m, fill=TEXT)
    d.text((64, 380), f"{n_u} underwriting · {n_i} interface · {n_a} agentic", font=m, fill=DIM)
    d.text((64, 430), "verified against filings, disclosures & product docs", font=m, fill=DIM)
    return im

def main():
    data = json.loads((ROOT / "data.json").read_text())
    ents = data["entities"] if isinstance(data, dict) else data
    # uniquify slugs exactly like build-pages.mjs (first come keeps the slug, then -2, -3…)
    taken, slugs = set(), {}
    for e in ents:
        s = base = slugify(e["name"]); i = 2
        while s in taken: s = f"{base}-{i}"; i += 1
        taken.add(s); slugs[e["name"]] = s
    for e in ents:
        save(entity_card(e), f"og/n/{slugs[e['name']]}.png")
    print("profile cards:", len(ents))

    n_blog = 0
    for p in sorted((ROOT / "blog").iterdir()):
        idx = p / "index.html"
        if not idx.is_file(): continue
        h = idx.read_text()
        t = re.search(r"<title>([^<]*?)(?: · neobankbeat)?</title>", h)
        dt = re.search(r'<p class="meta"><b>([^<]+)</b>', h)
        tg = re.search(r'<div class="eyebrow">([^<]*)</div>', h)
        if not t: continue
        title = t.group(1).replace("&amp;", "&")
        tag = re.sub(r"<[^>]+>", "", tg.group(1)) if tg else "deep dive"
        save(blog_card(title, dt.group(1) if dt else "", tag), f"og/blog/{p.name}.png")
        n_blog += 1
    print("blog cards:", n_blog)

    tagged = [e for e in ents if e.get("ai")]
    save(ai_page_card(len(tagged),
                      sum(1 for e in tagged if e["ai"] == "underwriting"),
                      sum(1 for e in tagged if e["ai"] == "interface"),
                      sum(1 for e in tagged if e["ai"] == "agentic")), "og/ai.png")
    print("ai page card: 1")

if __name__ == "__main__":
    sys.exit(main())
