# neobankbeat — voice guide

Fix the AI smell on hand-written surfaces first. Generated pages can stay dry; marketing cannot.

---

## Voice in one sentence

**A person who counted the neobanks and publishes the spreadsheet — not a product marketing page, not a compliance bot.**

---

## Tier 1 — human (rewrite these by hand)

- Homepage hero + sub
- FAQ intro + 3–5 highest-traffic answers
- Blog intros and conclusions
- Substack / X bio
- `/data/` landing prose
- Report executive summary

**Rule:** First person or direct address OK on Tier 1. Opinion OK when backed by a number from the dataset.

---

## Tier 2 — generated (can stay template-driven)

- 368 profile pages
- 140 `/vs/` comparisons
- 45 topic hubs, who-owns, alternatives
- Investor / infra index rows

**Rule:** Shorter sentences. Drop UI labels (`short answer`, `go deeper`). No em dashes in share text or social.

---

## Banned phrases (Tier 1)

| Phrase | Why | Replace with |
|--------|-----|----------------|
| verified-active | SEO tic; sounds robotic | "368 neobanks we track" or just the number |
| from the open dataset | repeated 1000× | "in our data" / "we track" / drop it |
| publicly disclosed | lawyer voice | "disclosed" or name the source |
| compiled from public sources | passive, vague | "we checked [regulator/filing]" |
| side by side | filler | "compared" or show the table |
| go deeper | template UI | specific link: "Compare Revolut vs Monzo" |
| short answer | template UI | remove label; just state the answer |
| narrative check | insider jargon | "AI in production" |
| stay on the beat | cute but brand-voice drift | "Subscribe" |
| It's worth noting / Importantly | AI transitions | delete |
| landscape | overused | "map" / "list" / "368 apps" |
| delve / dive into | AI | "look at" / "here's" |
| robust / comprehensive | empty | cut or replace with a number |
| In today's [X] | AI opener | delete |
| whether you're a [X] or [Y] | AI | delete |

---

## Sentence rules

1. **Lead with the number or the surprise.** "Only 127 of 368 hold a full banking license" beats "The neobank industry spans multiple regulatory models."
2. **One idea per sentence** on Tier 1. Generated pages can run longer.
3. **Max ~25 words** for hero, meta description, tweet-length claims.
4. **No em dashes** in social/share copy. Use a colon or period.
5. **Null is honest.** Say "unknown" or "not disclosed" — never hedge with "may" × 3.
6. **Disclaimers once.** Footer or page bottom. Not in every paragraph.

---

## Homepage hero — before / after

**Before (current):**
> who watches the neobanks?
> Every neobank in one place — from Chime, Nubank and Kaspi to Gnosis Pay, women-first banks and agent wallets. Compare custody, cards, yield, stablecoins, audience and geography, side by side.

**After (dataset wedge):**
> 368 neobanks. Verified. Open data.
> I track every active consumer neobank — custody, license, cards, regulation — and publish it as JSON. Only 127 are actually banks. The rest run on someone else's rails.

**After (directory wedge):**
> Compare neobanks on what matters.
> Custody, license, cards, yield — 368 apps, no affiliate links. Filter by region, KYC, stablecoins, or niche. Pick two and compare.

Pick one. Don't blend.

---

## FAQ — example fix

**Before:**
> answers grounded in the open dataset of 368 verified-active neobanks

**After:**
> 23 answers from the same data behind the directory — updated when the dataset changes.

---

## Blog — what's already good

Posts like *Why neobanks die* sound human:

- Opens with a concrete number ($245M/week)
- Named failures (WaveCrest, Synapse, Ready)
- Takes a position ("Demand is not the problem")

**Keep doing that.** Weaker posts read like encyclopedia entries — fold those into hubs, don't promote them on homepage.

---

## Builder changes (when ready)

In `tests/build-pages.mjs`:

| Current | Change |
|---------|--------|
| `<span class="k">short answer</span>` | Remove label; optional subtle lead-in only on hubs |
| `<span class="k">go deeper</span>` | Replace with specific CTA text per page type |
| `stay on the beat` subscribe box | `Subscribe` or `Monthly dataset updates` |
| `verified active` in meta templates | `tracked` or drop |
| Em dashes in generated prose | Colons or periods |
| Disclaimer on every page body | Footer only on Tier 2; profiles keep one line max |

These are cosmetic but remove the "same chatbot on every page" feel.

---

## Quick audit scorecard

Hand-written files to edit first:

| File | AI smell | Priority |
|------|----------|----------|
| `index.html` hero | High — listicle sub, "every…in one place" | P0 |
| `index.html` meta/JSON-LD | High — "verified-active" ×4 | P0 |
| `faq/index.html` intro | Medium | P1 |
| `data/index.html` | Medium — reads like API docs (OK) but hero could be sharper | P1 |
| `llms.txt` | Low — appropriate register for agents | keep |
| `blog/index.html` cards | Medium — "verified-active" in blurbs | P2 |
| LinkedIn article | Low — already strong | polish only |

Generated volume (~1,600 pages): **don't hand-edit.** Fix templates once in `build-pages.mjs`.

---

## Test before publishing (Tier 1)

Read it aloud. Fail if:

- [ ] Could appear on any fintech SEO site unchanged
- [ ] Three+ commas in one sentence
- [ ] "Utilize", "leverage", "delve", "landscape", "comprehensive"
- [ ] No number in the first two sentences
- [ ] Sounds embarrassed to have an opinion

---

*Draft — July 2026. Pair with `POSITIONING.md`.*
