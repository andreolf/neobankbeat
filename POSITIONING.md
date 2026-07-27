# neobankbeat — positioning (draft)

One page. Pick a wedge, say it everywhere, demote everything else.

---

## The problem we solve

Nobody can answer basic questions about neobanks with verified data:

- How many exist? (Analyst PDFs disagree. Wikipedia is stale. VC decks count funding rounds, not live products.)
- Is this app actually a bank? (Most aren't. The word "neobank" hides e-money, BaaS, and self-custodial software behind the same label.)
- Who holds the money? (Custody model determines whether FDIC, safeguarding, or your own keys apply.)
- Who died? (Defunct products vanish from marketing; the industry doesn't keep a public graveyard.)

neobankbeat answers these from primary sources, in the open, with a changelog that includes removals.

---

## Three possible wedges

### A. Dataset-first (recommended)

**One line:** The open dataset of every verified-active neobank — custody, license, cards, regulation — MIT-licensed, updated in public.

**For:** Researchers, journalists, devs, LLM builders, analysts who want citeable JSON not a sales deck.

**Proof:** `data.json`, Hugging Face/Kaggle mirrors, changelog, 368 entities with null when unverifiable.

**Primary CTA:** Download the data / cite the dataset.

**Directory role:** The interactive proof that the data is real — not the headline product.

**Why this wedge:** Most differentiated. Hard to copy (verification labour). Compounds (citations, HF, academic use). Directory alone competes with every fintech listicle.

---

### B. Directory-first

**One line:** Compare 368 neobanks side by side — custody, license, cards, yield — no affiliate links.

**For:** Consumers choosing an app, journalists writing a comparison piece, operators benchmarking competitors.

**Proof:** Live filters, compare up to four, `/vs/` head-to-heads.

**Primary CTA:** Search the directory / compare two apps.

**Dataset role:** "Also available as JSON" in footer and `/data/`.

**Risk:** Sounds like every "best neobanks 2026" list. SEO-heavy, harder to explain why you're different from NerdWallet or a VC landscape map.

---

### C. Industry map-first

**One line:** Map the neobank industry — who exists, who funds them, who powers them, who died.

**For:** VCs, strategics, operators, policy people tracing concentration risk (Synapse, sponsor banks, investor overlap).

**Proof:** Investor map (219 firms), infra map (106 providers), deaths blog, ecosystem poster.

**Primary CTA:** Explore the map / read the report.

**Risk:** Smallest addressable audience. Reads insider-y. Harder to grow without existing distribution.

---

## Recommendation: A (dataset-first)

Lead with **"368 neobanks, verified, as open data."** The directory is how you *show* the data. Investors, infra, jobs, blog are depth for people who already care — not co-equal homepage stories.

### Homepage hierarchy (proposed)

1. **Hero:** dataset promise + one proof stat (e.g. "Only 127 hold a full banking license")
2. **Primary action:** Browse directory OR download `data.json` — pick one as the orange button
3. **Secondary:** Latest changelog entry, one blog post, subscribe
4. **Footer/nav:** everything else (jobs, report, investors, infra, hubs)

### Nav demotion (not removal)

Keep all sections. Change visual hierarchy:

- **Primary nav:** Directory · Data · Blog
- **Secondary nav:** Browse · Compare · Changelog
- **Footer columns:** Investors · Infra · Jobs · Report · Glossary · FAQ

### External surfaces (must match)

| Surface | Current | Proposed |
|---------|---------|----------|
| X bio | varies | "Open dataset of 368 neobanks. Custody, license, cards. MIT." |
| Substack | report-focused | "What changed in the dataset this month" |
| HF/Kaggle | dataset mirrors | primary GTM channel for wedge A |
| LinkedIn article | ecosystem poster | fine — link back to dataset + one killer stat |

---

## GTM sequence (before more growth hacking)

1. **Pick wedge A** — rewrite hero, meta, X bio, Substack tagline (1 day)
2. **Voice pass** — see `VOICE.md`; hand-edit 10 surfaces (2 days)
3. **One audience, one channel** — e.g. "fintech researchers on X + HF" for 4 weeks; measure citations, `data.json` fetches, GitHub stars
4. **Then** programmatic SEO, IndexNow, hubs — tactics amplify a clear story

---

## What we are not

- Not a neobank. Not affiliated with any listed entity.
- Not financial advice. Comparison data, not recommendations.
- Not a complete cap table or investor database — notable backers from disclosed rounds only.
- Not real-time rates — cashback/yield are "up to" marketing figures; we cite `as_of` or null.

---

## Success signals (12 weeks)

- Inbound: "I cited neobankbeat in my paper/post/deck"
- `data.json` requests / HF dataset downloads trending up
- GitHub issues from strangers (data fixes, new neobanks) — means someone is using it
- One press or newsletter mention that describes us as a *dataset*, not a "helpful website"

---

*Draft — July 2026. Revisit after picking wedge and running 4-week GTM test.*
