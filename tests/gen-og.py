#!/usr/bin/env python3
"""Generate per-page OG images (1200x630) for profiles, blog posts and /ai/.

Deterministic output (no timestamps in PNGs) so unchanged cards don't churn git.
Run from repo root:  /tmp/nbchart-venv/bin/python tests/gen-og.py
Requires: pillow, fonttools, brotli (for woff2 -> ttf conversion).
"""
import concurrent.futures, io, json, os, re, sys, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

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

# ── company logos (self-hosted override, then favicon service cache) ──
LOGO_DIR = ROOT / "logos"
LOGO_CACHE = Path("/tmp/nb-logos"); LOGO_CACHE.mkdir(exist_ok=True)

def fetch_logo(dom):
    out = LOGO_CACHE / (dom.replace("/", "_") + ".png")
    if out.exists(): return
    try:
        req = urllib.request.Request(f"https://www.google.com/s2/favicons?domain={dom}&sz=128",
                                     headers={"User-Agent": "Mozilla/5.0"})
        raw = urllib.request.urlopen(req, timeout=15).read()
        Image.open(io.BytesIO(raw)).convert("RGBA").save(out)
    except Exception: pass

def luminance(img):
    g = img.convert("LA").resize((16, 16))
    px = list(g.getdata())
    tot = sum(l * (a / 255) for l, a in px); wt = sum(a / 255 for l, a in px)
    return (tot / wt) if wt > 3 else 255

def _logo_tile_from_icon(icon, size):
    bright = luminance(icon) > 235
    tile = Image.new("RGBA", (size, size), "#E9E9EF" if bright else "#1C1C26")
    ic = ImageOps.contain(icon, (size - 24, size - 24))
    tile.alpha_composite(ic, ((size - ic.width) // 2, (size - ic.height) // 2))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=size // 5, fill=255)
    tile.putalpha(mask)
    return tile

def logo_tile(dom, size, slug=None):
    """Rounded logo tile, or None if no logo available."""
    if slug:
        override = LOGO_DIR / f"{slug}.png"
        if override.exists():
            try: return _logo_tile_from_icon(Image.open(override).convert("RGBA"), size)
            except Exception: pass
    p = LOGO_CACHE / ((dom or "x").replace("/", "_") + ".png")
    if not p.exists(): return None
    try: return _logo_tile_from_icon(Image.open(p).convert("RGBA"), size)
    except Exception: return None

def entity_card(e, slug=None):
    im, d = base_card()
    color, label = CAT[e["category"]]
    logo = logo_tile(e.get("domain"), 150, slug)
    if logo is not None:
        im.paste(logo, (W - 64 - 150, 152), logo)
    y = 168
    x = chip(d, 64, y, label, color)
    if e.get("ai"):
        x = chip(d, x, y, "ai · " + e["ai"], ACCENT)
    if e.get("stablecoins"):
        chip(d, x, y, "stablecoins", "#BAF24A" if e["category"] != "web3-native" else DIM)
    name_w = W - 128 - (170 if logo is not None else 0)
    name_f = fit(d, e["name"], name_w, 96)
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

def ai_page_card(n_total, n_all, n_u, n_i, n_a):
    im, d = base_card()
    chip(d, 64, 158, "narrative check", ACCENT)
    f = sg(72)
    d.text((60, 226), "AI neobanks, verified", font=f, fill=TEXT)
    m = mono(24)
    d.text((64, 330), f"{n_total} of {n_all} tracked have AI in production", font=m, fill=TEXT)
    d.text((64, 380), f"{n_u} underwriting · {n_i} interface · {n_a} agentic", font=m, fill=DIM)
    d.text((64, 430), "verified against filings, disclosures & product docs", font=m, fill=DIM)
    return im

INVESTOR = "#FFD166"
INFRA = "#D075FF"
JOBS = "#BAF24A"
VS = "#89B0FF"
BLUE = "#89B0FF"
PURPLE = "#D075FF"

def inv_dom(site):
    return re.sub(r"^https?://", "", str(site or "")).split("/")[0]

def org_card(name, chip_label, chip_color, line2, line3="", domain=None):
    im, d = base_card()
    logo = logo_tile(domain, 150) if domain else None
    if logo is not None:
        im.paste(logo, (W - 64 - 150, 152), logo)
    chip(d, 64, 158, chip_label[:28], chip_color)
    name_w = W - 128 - (170 if logo is not None else 0)
    name_f = fit(d, name, name_w, 88)
    d.text((60, 226), name, font=name_f, fill=TEXT)
    m = mono(24)
    y2 = 226 + name_f.size + 28
    d.text((64, y2), line2[:92], font=m, fill=TEXT)
    if line3:
        d.text((64, y2 + 44), line3[:92], font=m, fill=DIM)
    return im

def section_card(chip_label, title, subtitle, chip_color=ACCENT):
    im, d = base_card()
    chip(d, 64, 158, chip_label, chip_color)
    words = title.split()
    for size in range(72, 36, -2):
        f = sg(size)
        lines, cur = [], ""
        for w_ in words:
            t = (cur + " " + w_).strip()
            if tw(d, t, f) <= W - 128: cur = t
            else: lines.append(cur); cur = w_
        lines.append(cur)
        if len(lines) <= 2: break
    y = 226
    for ln in lines[:2]:
        d.text((60, y), ln, font=f, fill=TEXT); y += f.size + 10
    if subtitle:
        d.text((64, min(y + 20, H - 130)), subtitle[:95], font=mono(22), fill=DIM)
    return im

def jobs_card(dept_label, n_roles, n_companies):
    im, d = base_card()
    chip(d, 64, 158, dept_label.lower(), JOBS)
    title = "Neobank jobs" if dept_label == "Job board" else f"{dept_label} jobs"
    name_f = fit(d, title, W - 128, 68)
    d.text((60, 226), title, font=name_f, fill=TEXT)
    m = mono(24)
    d.text((64, 330), f"{n_roles:,} live roles · {n_companies} neobanks hiring", font=m, fill=TEXT)
    d.text((64, 380), "official Greenhouse, Lever & Ashby APIs", font=m, fill=DIM)
    return im

def match_card(n_roles, n_companies):
    im, d = base_card()
    chip(d, 64, 158, "cv match · private", ACCENT)
    title = "Match your CV to neobank jobs"
    name_f = fit(d, title, W - 128, 62)
    d.text((60, 226), title, font=name_f, fill=TEXT)
    m = mono(24)
    d.text((64, 330), f"Scored against {n_roles:,} live roles · {n_companies} companies", font=m, fill=TEXT)
    d.text((64, 380), "PDF · Word · PNG — runs in your browser, nothing stored", font=m, fill=DIM)
    return im

def fit_hub_card(n_all):
    return section_card("find your fit", "Which neobank fits you?",
                        f"8-step check · {n_all} verified profiles · no affiliates", ACCENT)

def fit_country_card(h1):
    return section_card("find your fit", h1, "8-step fit check · ranked from open data · no affiliates", ACCENT)

def investor_card(name, n_banks, site, top_banks):
    dom = inv_dom(site)
    line2 = f"{n_banks} neobank{'s' if n_banks != 1 else ''} backed"
    line3 = " · ".join(top_banks[:4]) if top_banks else ""
    return org_card(name, "investor", INVESTOR, line2, line3, dom or None)

def infra_card(name, typ, domain, n_clients):
    chip = typ.split("/")[0].strip()[:22]
    line2 = typ[:72]
    line3 = f"{n_clients} tracked client{'s' if n_clients != 1 else ''}" if n_clients else "mapped from public disclosures"
    return org_card(name, chip, INFRA, line2, line3, domain)

def hub_card(family_label, h1, n_rows, n_total):
    return section_card(family_label, h1, f"{n_rows} of {n_total} tracked neobanks · verified active", BLUE)

def main():
    data = json.loads((ROOT / "data.json").read_text())
    ents = data["entities"] if isinstance(data, dict) else data
    # uniquify slugs exactly like build-pages.mjs (first come keeps the slug, then -2, -3…)
    taken, slugs = set(), {}
    for e in ents:
        s = base = slugify(e["name"]); i = 2
        while s in taken: s = f"{base}-{i}"; i += 1
        taken.add(s); slugs[e["name"]] = s
    doms = sorted({e["domain"] for e in ents if e.get("domain")})
    with concurrent.futures.ThreadPoolExecutor(24) as ex:
        list(ex.map(fetch_logo, doms))
    for e in ents:
        save(entity_card(e, slugs[e['name']]), f"og/n/{slugs[e['name']]}.png")
    print("profile cards:", len(ents))

    # slugs with hand-made OG images (e.g. cropped from the ecosystem poster)
    OG_CUSTOM = {"neobank-ecosystem-map"}
    n_blog = 0
    for p in sorted((ROOT / "blog").iterdir()):
        idx = p / "index.html"
        if not idx.is_file(): continue
        if p.name in OG_CUSTOM: continue
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
    n_all = len(ents)
    save(ai_page_card(len(tagged), n_all,
                      sum(1 for e in tagged if e["ai"] == "underwriting"),
                      sum(1 for e in tagged if e["ai"] == "interface"),
                      sum(1 for e in tagged if e["ai"] == "agentic")), "og/ai.png")
    print("ai page card: 1")

    counts = data.get("meta", {}).get("counts", {})
    trad, hyb, web3 = counts.get("traditional", 0), counts.get("hybrid", 0), counts.get("web3_native", 0)

    # ── section landing cards (major pages that aren't entity-specific) ──
    sections = [
        ("data", "Open neobank dataset", f"{n_all} neobanks as JSON · MIT license", ACCENT),
        ("vs", "Neobank comparisons", "custody · cards · yield · regulation side by side", VS),
        ("browse", "Browse the dataset", "by license, KYC, region, card and audience", BLUE),
        ("changelog", "Dataset changelog", "every addition, removal and update — public", ACCENT),
        ("newsletters", "Neobank newsletters", "the reading list worth your inbox", PURPLE),
        ("cards", "Stablecoin cards", "crypto cards you can spend anywhere", "#BAF24A"),
        ("investors", "Investors in neobanks", "who funds the challengers — mapped to portfolios", INVESTOR),
        ("infra", "Infra for neobanks", "sponsor banks, BaaS rails and card processors", INFRA),
    ]
    for slug, title, sub, col in sections:
        save(section_card(slug.replace("-", " "), title, sub, col), f"og/{slug}.png")
    print("section cards:", len(sections))

    # ── /fit/ hub + country landers ──
    fit_dir = ROOT / "fit"
    if fit_dir.is_dir():
        save(fit_hub_card(n_all), "og/fit/hub.png")
        n_fit = 1
        for child in sorted(fit_dir.iterdir()):
            if not child.is_dir() or not (child / "index.html").is_file():
                continue
            html = (child / "index.html").read_text()
            h1m = re.search(r"<h1>(.*?)</h1>", html, re.S)
            if not h1m:
                continue
            h1 = re.sub(r"<[^>]+>", "", h1m.group(1)).replace("&amp;", "&")
            save(fit_country_card(h1), f"og/fit/{child.name}.png")
            n_fit += 1
        print("fit cards:", n_fit)

    # ── investors: /investors/<slug>/ ──
    inv = {}
    for e in ents:
        for iv in e.get("investors") or []:
            n = iv["name"]
            if n not in inv:
                inv[n] = {"site": iv.get("website", ""), "banks": []}
            inv[n]["banks"].append(e["name"])
    inv_doms = sorted({inv_dom(v["site"]) for v in inv.values() if inv_dom(v["site"])})
    with concurrent.futures.ThreadPoolExecutor(24) as ex:
        list(ex.map(fetch_logo, inv_doms))
    bank_by_name = {e["name"]: e for e in ents}
    for name, v in sorted(inv.items(), key=lambda x: (-len(x[1]["banks"]), x[0])):
        slug = slugify(name) or "investor"
        top = sorted(v["banks"], key=lambda n: -((bank_by_name.get(n, {}).get("reported_users") or {}).get("value_millions", 0) or 0))[:4]
        save(investor_card(name, len(v["banks"]), v["site"], top), f"og/investors/{slug}.png")
    print("investor cards:", len(inv))

    # ── infra: /infra/<slug>/ ──
    prov_path = ROOT / "tests" / "infra-providers.json"
    if prov_path.is_file():
        prov = json.loads(prov_path.read_text())
        prov.pop("_comment", None)
        prov_doms = sorted({v.get("domain", "") for v in prov.values() if v.get("domain")})
        with concurrent.futures.ThreadPoolExecutor(24) as ex:
            list(ex.map(fetch_logo, prov_doms))
        for name, v in sorted(prov.items(), key=lambda x: x[0]):
            slug = slugify(name) or "provider"
            save(infra_card(name, v.get("type", "provider"), v.get("domain"), len(v.get("clients") or [])), f"og/infra/{slug}.png")
        print("infra cards:", len(prov))

    # ── jobs: /jobs/ and /jobs/<dept>/ ──
    jobs_path = ROOT / "jobs" / "data.json"
    if jobs_path.is_file():
        jobs = json.loads(jobs_path.read_text()).get("jobs") or []
        n_companies = len({j["company"] for j in jobs})
        save(jobs_card("Job board", len(jobs), n_companies), "og/jobs.png")
        save(match_card(len(jobs), n_companies), "og/jobs/match.png")
        depts = {}
        for j in jobs:
            depts.setdefault(j.get("dept") or "other", []).append(j)
        dept_labels = {
            "engineering": "Engineering", "data": "Data & AI", "product": "Product",
            "design": "Design", "compliance": "Compliance & Risk", "onboarding": "Onboarding & KYC",
            "support": "Customer Support", "sales": "Sales & Partnerships",
            "marketing": "Marketing & Growth", "finance": "Finance & Treasury",
            "operations": "Operations", "people": "People & Legal", "other": "Other",
        }
        for dept_id, rows in sorted(depts.items()):
            label = dept_labels.get(dept_id, dept_id.title())
            cos = len({j["company"] for j in rows})
            save(jobs_card(label, len(rows), cos), f"og/jobs/{dept_id}.png")
        print("jobs cards:", 2 + len(depts))

    # ── topic hubs: /regulation/<slug>/ etc. — read titles from built pages ──
    fam_lbl = {"regulation": "by regulation", "kyc": "by KYC", "regions": "by region",
               "for": "by audience", "cards": "by card", "countries": "by country"}
    n_hub = 0
    for fam in fam_lbl:
        fam_dir = ROOT / fam
        if not fam_dir.is_dir(): continue
        for child in sorted(fam_dir.iterdir()):
            idx = child / "index.html"
            if not child.is_dir() or not idx.is_file(): continue
            html = idx.read_text()
            h1m = re.search(r"<h1>(.*?)</h1>", html, re.S)
            nm = re.search(r"<b>(\d+) of (\d+) tracked neobanks</b>", html)
            if not h1m: continue
            h1 = re.sub(r"<[^>]+>", "", h1m.group(1)).replace("&amp;", "&")
            n_rows = int(nm.group(1)) if nm else 0
            n_tot = int(nm.group(2)) if nm else n_all
            save(hub_card(fam_lbl[fam], h1, n_rows, n_tot), f"og/{fam}/{child.name}.png")
            n_hub += 1
    print("hub cards:", n_hub)

if __name__ == "__main__":
    sys.exit(main())
