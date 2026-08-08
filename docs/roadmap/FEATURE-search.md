# Feature #1 — Static Semantic Search

Status: DESIGN. Owner: search. Depends on: **Schema v2** (soft, not hard — see §7).
Scope: natural-language discovery over the 368-bank dataset with **zero backend and zero
runtime API cost**. Everything — embeddings, index, ranking — is precomputed at build time
and shipped as static JSON; search runs 100% in the browser.

Target queries:
- "European neobanks supporting stablecoins"
- "banks similar to Revolut"
- "which banks support USDC"
- "self-custodial wallets with a Visa card in LatAm"
- "cheapest FX for travel"

---

## 1. Overview & user value

Today discovery is (a) the homepage faceted filter UI in `app.js` (exact structured
filters: category pills, region/custody dropdowns, capability checkboxes, substring search
across name/country/niche/note) and (b) ~40 pre-baked topic-hub cuts under
`/regulation/ /kyc/ /regions/ /for/ /cards/ /countries/`. Both require the user to already
know the axis they want. Neither answers a fuzzy natural-language question, and neither
does "similar to X".

This feature adds a single search box that accepts prose and returns ranked banks, by
combining three signals computed in the browser:

1. **Keyword/lexical** (BM25-style) over a per-bank text document.
2. **Vector/semantic** (cosine over precomputed embeddings) for paraphrase/synonym recall
   ("stablecoin" ≈ "USDC" ≈ "digital dollar").
3. **Facet extraction** — parse structured intent out of the query (region=Europe,
   feature=stablecoin, network=Visa) and **boost/filter** on Schema v2 structured fields
   so a query that names a known region or capability doesn't rely on fuzzy text alone.

Plus a **"similar to X"** mode: cosine over the same embedding vectors gives related-banks
without any query typing, reusing the vectors we already ship.

User value: one box answers questions the facet UI can't phrase, surfaces the long tail of
368 banks, and powers a "related searches"/"you might also filter by" affordance that
funnels into the existing hubs and profiles (good for SEO internal-linking too).

**Non-goals:** no LLM at runtime, no server, no per-query network call, no analytics-driven
personalization. The index is a build artifact committed to the repo like every other
generated file.

---

## 2. Architecture at a glance

```
BUILD TIME (Node, deterministic, in the reproducibility chain)
  data.json (368 entities, Schema v2)
      │
      ├─ tests/build-search-index.mjs   (NEW builder)
      │     1. compose per-bank doc text  (name + structured fields + prose)
      │     2. embed each doc  → 384-dim float vector  (local ONNX model, no network)
      │     3. build lexical postings (tokenize, term→doc, doc lengths for BM25)
      │     4. quantize vectors int8, pack, write artifacts
      │
      ├─► /search/index.json         (lexical postings + doc metadata + facet fields)
      ├─► /search/vectors.bin        (int8 quantized embeddings, 368 × 384)
      └─► /search/meta.json          (model id, dims, scale, vocab stats, build date)

  tests/build-pages.mjs  →  /search/index.html   (the search page shell + JSON-LD)

RUNTIME (browser, static)
  /search/  page  →  loads /search/search.js (ES module)
       fetch index.json + vectors.bin (once, cached immutable)
       query → { lexical BM25 } ⊕ { embed(query) · vectors cosine } ⊕ { facet boost }
       → ranked list rendered into the existing card/list DOM
```

Everything under `/search/` is committed. No runtime embedding of the *documents* (done at
build). The only runtime embedding is the **query string**, done client-side (see §4.2).

---

## 3. Build-time index

### 3.1 Per-bank document composition

For each of the 368 entities, `build-search-index.mjs` composes one weighted text document.
Field selection is deliberate — structured Schema v2 fields carry more signal than prose:

| segment | source fields | weight (lexical field-boost) |
|---|---|---|
| title | `name` | 5× |
| category/audience | `category`, `audience`, `region`, `active_regions`, `countries` | 3× |
| capabilities | `features.*` keys where `true` (expanded to phrases, e.g. `apple_pay`→"Apple Pay", `self_custody`→"self custody non-custodial"), `services`, `stablecoin_tickers`, `payment_rails`, `card_networks`, `card_form`, `card_funding` | 3× |
| regulation/custody | `regulation_type`, `custody`, `kyc`, `license`, `partners.partner_bank`, `partners.issuer` | 2× |
| prose | `note`, `story`, `yield`, `cashback`, `fx_markup.markup` | 1× |

Capability expansion is a small hand-authored synonym map (`FEATURE_PHRASES` in the
builder): each `features.*` key → a phrase bag ("USDC","USDT","stablecoin","digital
dollar" for `stablecoin_native`/`stablecoin_tickers`). This is what lets "which banks
support USDC" hit banks whose prose never literally says USDC. `null`/`false` features
contribute **nothing** (never emit "no Apple Pay" — that would poison the vector).

The **same composed doc text** feeds both the embedding model and the lexical tokenizer,
so the two signals see the same corpus.

### 3.2 Embedding model (build-time, local, no network)

- Model: **`Xenova/all-MiniLM-L6-v2`** (384-dim, ~23M params) run via
  **`@xenova/transformers`** (Transformers.js) in Node with the **ONNX / quantized**
  weights. Chosen because: (a) it runs identically in Node (build) and browser (query)
  from the *same* package, so query and doc vectors share one embedding space; (b) weights
  are bundled/cached locally — **no runtime API, no OpenAI/Anthropic cost**, satisfying the
  "no runtime API cost" mandate; (c) 384 dims × 368 docs is tiny.
- Deterministic: fixed model revision pinned in `package.json`; mean-pooled + L2-normalized
  output is deterministic for a given input, so the artifact is byte-stable across CI runs
  (required by the reproducibility job — see §6). Pin the model files (vendored under
  `tests/models/` or a locked npm dep with integrity hash) so CI never fetches at build.
- Cost: one-time ~seconds of CPU at build for 368 short docs. No GPU needed.

### 3.3 Artifact format & size

Three files under `/search/`:

**`vectors.bin`** — 368 × 384 **int8-quantized** embeddings.
- Each float component (already in ~[-1,1] after L2-norm) scaled by 127 → int8.
- Size: 368 × 384 × 1 byte = **~141 KB raw**, ~40–70 KB gzip (Vercel serves gzip/br).
- A single `scale` float in `meta.json` reverses quantization at load. int8 cosine recall
  loss vs float32 is negligible at this corpus size; float32 would be 565 KB (avoid).

**`index.json`** — lexical + facet metadata:
```jsonc
{
  "docs": [
    { "i": 0, "slug": "chime", "name": "Chime", "cat": "traditional",
      "region": "US", "len": 84,
      "facets": { "features": ["yield_bearing","physical_cards"],
                  "stablecoin_tickers": [], "card_networks": ["Visa"],
                  "payment_rails": ["ACH"], "region": "US",
                  "active_regions": ["North America"], "kyc": "Yes" } }
    /* …368 */
  ],
  "postings": { "stablecoin": [[12,3],[45,1],…], "usdc": [[12,2],…], … }, // term → [docIdx, tf]
  "df": { "stablecoin": 36, … },      // document frequency for IDF
  "avgdl": 79.4, "N": 368
}
```
- Est. size: vocab ~4–6k terms over short docs → **~120–200 KB raw**, ~30–50 KB gzip.
- `facets` duplicates the structured Schema v2 fields the query→facet mapper needs, so the
  runtime never re-parses `data.json` (which is 336 KB — we do **not** ship it to the
  search page).

**`meta.json`** — `{ model:"Xenova/all-MiniLM-L6-v2", rev:"…", dims:384, quant:"int8",
scale:0.00787, build_date:<DATA_MODIFIED>, N:368 }`. Drives runtime dequant + a version
guard so a stale cached `vectors.bin` can't mismatch a new `index.json`.

**Total shipped:** ~300–350 KB raw / **~90–130 KB gzip**, fetched once and cached
immutable. Comparable to one hero image. Acceptable for a search page (not loaded on every
page — only when the user visits `/search/` or focuses the box, see §4.4).

### 3.4 Builder placement in the pipeline

- New file `tests/build-search-index.mjs`, invoked from `build-pages.mjs` at the end
  (alongside its existing `dynamic import` of `build-agents.mjs`/`sync-counts.mjs`), OR
  registered as its own step in `test.yml`'s reproducibility block. It **must** be in the
  reproducibility chain so `git diff` stays clean (§6). Because the embedding output is
  deterministic and dates come from `DATA_MODIFIED` (git date of `data.json`, per the
  pipeline audit's git-date rule) not the wall clock, the artifact is reproducible.
- Reads `/data.json` (`const E = data.entities`) exactly like `build-pages.mjs`.
- The `/search/` **page** itself is generated by `build-pages.mjs` as a new top-level
  section (seam in §5), not by the index builder.

---

## 4. Runtime search (client-side, static)

### 4.1 Library / algorithm

No heavy dependency. Two small pieces, both shippable as a single `~/search/search.js`
ES module (kept out of `app.js` so it doesn't bloat the homepage bundle):

- **Lexical: BM25**, hand-rolled (~60 lines) over the shipped `postings`/`df`/`avgdl`.
  BM25 (k1=1.2, b=0.75) with the field-boosts baked into term-frequency at build time.
  Rolling our own avoids pulling MiniSearch/Lunr/FlexSearch and lets us share the exact
  tokenizer with the builder. (MiniSearch is the fallback if we'd rather not maintain BM25,
  but its index would duplicate what we already ship.)
- **Vector: brute-force cosine** over 368 int8 vectors. 368 × 384 dot products per query is
  trivial (<1 ms). No ANN index (HNSW/IVF) needed at this scale — that complexity is
  unjustified for 368 records. This is a stated design win of the small corpus.
- **Query embedding:** `@xenova/transformers` in the browser (WASM backend) embeds the
  **query string only** — the model (~23 MB quantized) is lazy-loaded from a pinned CDN/self-
  hosted path on first search and cached by the browser. This is the one non-trivial runtime
  cost; mitigations in §4.4. It is still $0 and serverless.

### 4.2 Hybrid ranking

```
score(doc) = wL · norm(bm25(doc, q))            // lexical
           + wV · norm(cosine(qVec, docVec))     // semantic
           + wF · facetBoost(doc, parsedFacets)  // structured
           − hardFilter(doc, parsedFacets)       // exclude on strong constraints
```
- `wL=0.4, wV=0.4, wF=0.2` as defaults (tunable constants at top of module).
- `norm()` is min-max over the current result set so the two channels are comparable.
- **facetBoost**: +weight per matched structured facet (see §4.3).
- **hardFilter**: only for high-confidence structured constraints the user clearly stated
  (e.g. an explicit region token, or "USDC" when `stablecoin_tickers` exists) — and, per the
  Schema v2 universal invariant, a feature filter matches `true` only and **must not exclude
  `null`** (unverified) as if it were `false`. Instead unverified banks are down-ranked, not
  dropped, and the UI shows "· N unverified" (§4.5).

### 4.3 Query → facet mapping (boost structured Schema v2 fields)

A build-time-generated `FACET_LEXICON` (emitted into `index.json` or inlined in the module)
maps trigger phrases → structured field constraints. Derived from the actual enum values in
`data.json` so it stays in sync:

| query phrase(s) | Schema v2 field → value |
|---|---|
| "europe", "european", "EU", "eurozone" | `region`=Europe / `active_regions`⊇Europe |
| "US", "american", "united states" | `region`=US / `countries`⊇United States |
| "latam", "latin america" | `active_regions`⊇LatAm |
| "stablecoin", "usdc", "usdt", "eurc", "digital dollar" | `stablecoin_tickers` non-empty (+ specific ticker if named) |
| "self-custody", "non-custodial", "own keys" | `features.self_custody`=true (authoritative via `custody`) |
| "mpc" | `features.mpc`=true |
| "apple pay" / "google pay" | `features.apple_pay` / `google_pay`=true |
| "api", "developer", "webhooks", "sandbox" | `features.api`/`webhooks`/`sandbox`=true |
| "business", "smb", "company account" | `features.business_accounts`=true |
| "virtual card" / "physical card" | `card_form`⊇virtual / physical |
| "credit", "debit", "prepaid", "bnpl" | `card_funding`⊇… |
| "visa", "mastercard", "amex" | `card_networks`⊇… |
| "iban" | `features.iban`=true |
| "fednow", "sepa", "sepa instant", "pix", "upi" | `payment_rails`⊇… |
| "yield", "savings", "earn", "interest" | `features.yield_bearing`/`savings`=true (rank by `yield_pct`) |
| "cashback", "rewards" | `cashback` present (rank by `cashback_pct`) |
| "cheap fx", "travel", "no fx fee", "low markup" | rank ascending by `fx_markup_pct` |
| "lending", "loan", "credit line" | `features.lending`=true |
| "no kyc", "anonymous" | `kyc`=No |
| "licensed bank", "e-money", "vasp", "mica" | `regulation_type`=… |
| "similar to X", "like X", "alternative to X" | switch to **similar-mode** (§4.6) with X resolved to a slug |

The mapper is intentionally a curated lexicon (not another ML model) so it's deterministic,
debuggable, and directly keyed to Schema v2 enums. When a bank name appears in the query
("banks like Revolut", "Revolut competitors") it resolves against the `docs[].name` list.

Numeric facets (`fx_markup_pct`, `yield_pct`, `cashback_pct`) drive **sort/boost**, not
filter, when phrases like "cheapest"/"best"/"highest" appear.

### 4.4 Loading strategy (keep it static & cheap)

- The search box is on `/search/` and also injectable into the homepage header later, but
  the **index + model load lazily**: `index.json` + `vectors.bin` fetch on page load of
  `/search/` (or on first focus of an embedded box); the **embedding model loads on first
  keystroke-submit**, not on page load, with a visible "warming up semantic search…" state.
- **Progressive enhancement / graceful degradation:** lexical BM25 works the instant
  `index.json` lands (tens of KB) — the user gets keyword results immediately. The vector
  channel activates when the model finishes loading; until then results are lexical-only +
  facet boost. If WASM/model fails (old browser, blocked CDN), search stays fully functional
  as keyword+facet. The semantic layer is strictly additive.
- Artifacts served with `Cache-Control: immutable` (mirror the existing `app.js ?v=` +
  `vercel.json` immutable pattern) using a `?v=<meta.build_date/hash>` query string so a new
  build busts the cache.

### 4.5 UX / interaction — matching the existing design language

Reuse the sub-page "article shell" (from the UX audit): `header.hwrap` + `main.wrap#main` +
`footer.fwrap`, `blog/blog.css`, skip link, `#bwtoggle` bw-mode, `nbevt()` analytics.

- **Search box:** a single `<input type="search">` styled like the homepage `#q` (mono font,
  `--accent` focus ring), full-width, with rotating example-query placeholder
  ("European neobanks supporting stablecoins", "banks like Revolut", "which banks support
  USDC"). Deep-linkable: `/search/?q=…` (mirrors the homepage `/?q=` deep-link convention),
  so hubs/profiles can link straight into a pre-run query — great for internal SEO links.
- **Results:** reuse the **exact card anatomy** from `app.js` `render()` — `.card` →
  `.chead` (logo-box via Google favicon + initial fallback, name, category chip keyed to the
  T/H/W triad) → `.specs` k/v grid → `.cnote` → `.cfoot`. Card markup is generated by a
  shared render fn so the search page and homepage look identical. Each card links to
  `/n/<slug>/`.
- **Matched-facet chips:** above the results, an `.activebar` of removable `.fchip`s shows
  what the query parsed to ("region: Europe ✕", "stablecoins ✕", "network: Visa ✕") —
  reusing the homepage active-filter-bar pattern. Removing a chip re-ranks. This makes the
  fuzzy→structured translation legible and editable, and bridges NL search into the familiar
  facet model.
- **Tri-state honesty (Schema v2 invariant):** feature filters render the "· N unverified"
  affordance; unverified banks aren't hidden, they're de-emphasized with the em-dash `—`
  "not verified" convention already used in the `vs/` tables. Never present `null` as `false`.
- **Empty / no-results state:** show the top facet suggestions + "browse all 368" link.
- **Colors/type:** `--accent` for the single active/CTA state, mono for all
  labels/chips/controls, Space Grotesk for headings; `body.bw` supported.

### 4.6 Search suggestions & related searches UX

- **As-you-type suggestions:** a lightweight autocomplete backed by (a) the 368 bank names
  and (b) a curated list of ~30 canonical queries generated at build time from the facet
  lexicon crossed with populated enums (only suggest cuts that have ≥1 match), e.g.
  "self-custodial banks in Europe", "banks with Apple Pay", "USDC-supporting cards". Shown in
  a `.dd-menu`-style dropdown (reusing the homepage custom-dropdown styling).
- **Related searches (below results):** after a query, show 4–6 sibling queries derived from
  the parsed facets — swap/relax one facet ("…in Europe" → "…in LatAm", drop "stablecoins",
  add "business accounts"). Rendered as `.pill`/chip links to `/search/?q=…`. This doubles as
  internal-linking fuel and nudges users toward the pre-baked hubs when a facet maps 1:1 to an
  existing hub (e.g. a region facet links to `/regions/<slug>/`).
- **"Similar to" entry points:** each `/n/<slug>/` profile and the existing
  `/n/<slug>/alternatives/` page gets a "find similar with search" link into
  `/search/?similar=<slug>`, which runs cosine-only similar-mode (§4.2) — same vectors, no
  query text. This is the "banks similar to Revolut" path and reuses the shipped vectors for
  free.

---

## 5. Page/URL structure & generator seam

- **New top-level section `/search/`** — this is the pipeline audit's **"wholly new
  top-level section" seam (§2b)**, not the HUBS seam (search is one interactive page, not a
  data cut). Steps, following the audit's checklist exactly:
  1. Add a generation block in `build-pages.mjs` that `head()`s + `writeFileSync`s
     `ROOT/search/index.html` with a `WebApplication`/`SearchAction` + `BreadcrumbList`
     JSON-LD (see §6).
  2. Register `/search/` in the `urls` array (build-pages.mjs:1973) and in the `sitemap.md`
     body — nothing is auto-discovered for non-hub pages.
  3. Add a nav/footer link in `tests/footer.mjs` (`NAV_LINKS` + `FOOTER_LINKS`) — single
     source; flow 27 asserts nav↔footer parity across all pages.
  4. The static assets `/search/search.js`, `/search/index.json`, `/search/vectors.bin`,
     `/search/meta.json` are emitted by `build-search-index.mjs` (index/vectors/meta) and a
     small committed source file (`search.js`, versioned via `?v=` like `app.js`).
- **No new hub families**, so the HUBS array (line 436) and `FAMH/FAMLBL/byFam` maps are
  untouched. (A later, separate feature could add `/features/<key>/` HUBS cuts powered by the
  same Schema v2 `features.*` — noted in SCHEMA-V2 §5 — but that's out of scope here.)
- `sync-counts.mjs`: the search page prose should avoid hardcoded "368" strings, or anchor
  them in `RULES` so flow 30/25 stale-total heuristics stay green (the total lives in
  `meta.json` at runtime anyway).

---

## 6. SEO / metadata / schema.org & passing flowtest/CI

The `/search/` page must satisfy the structural invariants (flows 26–39). Concretely:

- **Unique `<title>`** (flow 39: no two indexable pages share a title) — e.g.
  "Search — natural-language neobank discovery · neobankbeat".
- **Self-referential `<link rel=canonical>`** = `https://www.neobankbeat.com/search/`
  (flow 39 asserts canonical == page's own URL). The `?q=`/`?similar=` variants keep the
  bare `/search/` canonical (query state is client-side, not separate indexable URLs).
- **`<meta name=description>` ≤160 chars** (flow 29), exactly one canonical.
- **`og:image`** at `/og/search.png` (convention `/og/<section>.png`) that resolves on disk
  (flow 29) + Twitter card block — full OG/Twitter block per the SEO audit.
- **JSON-LD `@graph`** with a `WebSite`+`SearchAction` (`potentialAction` /
  `query-input`) so the site advertises a search endpoint, plus `WebApplication` and
  **`BreadcrumbList`** (flow 32 requires a breadcrumb on every page below `/`; flow 39
  requires every node typed and JSON parses). A `FAQPage` (e.g. "How does search work?",
  "Is my query sent anywhere?" — answer: no, it runs in your browser) satisfies the FAQ
  presence checks and reinforces the privacy/static story.
- **Every internal href resolves** (flow 28): related-search chips point to `/search/?q=…`
  (the `/search/` file exists) and to real hub/profile URLs; suggestion links validated
  against emitted slugs.
- **Accessibility (flows 33–38):** WCAG AA contrast (reuse tokens), skip link + single
  `<main>`, keyboard-operable search + suggestion dropdown (arrow keys, Enter, Esc — mirror
  the homepage custom-dropdown a11y), `<th scope>` if any results table is used, no dashes in
  share text.
- **Homepage bundle guard (flow 31):** `search.js` is a **separate** cacheable file with a
  `?v=<hash>` (do **not** inline into `app.js`; homepage inline JS must stay <4 KB and markup
  <110 KB). If we later embed a search box in the homepage header, only a tiny loader stub is
  added there; the engine stays in `/search/search.js`.
- **Reproducibility (test.yml:56-67):** `build-search-index.mjs` runs in the chain; its
  output (`index.json`, `vectors.bin`, `meta.json`) is committed and byte-stable
  (deterministic embeddings, git-date not clock, pinned model). Any nondeterminism (unpinned
  model rev, float noise, network fetch at build) breaks the `git diff` gate — this is the
  single most important CI constraint (§9).
- **`/data/` dictionary (flow 39):** the search artifacts are *derived*, not new
  `data.json` fields, so they don't need FIELDS rows. But Schema v2's new fields do (that's
  Schema v2's migration responsibility, not this feature's).

---

## 7. Dependencies

- **Schema v2 (soft dependency, not a hard blocker).** The query→facet mapping (§4.3),
  tri-state facet honesty (§4.5), numeric ranking (fx/yield/cashback), and `stablecoin_tickers`
  precision ("which banks support USDC") are all **materially better** with Schema v2's
  `features.*`, `stablecoin_tickers`, `card_networks`, `payment_rails`, `card_form/funding`,
  and `_pct` companions. But the **core hybrid search ships on v1 today**: BM25 + embeddings
  over v1 prose + v1 structured fields (`category`, `region`, `custody`, `stablecoins` bool,
  `services` for the 24 tagged, `card_network`/`card_type` strings). Recommended sequencing:
  ship v1-based search first; upgrade the facet lexicon + facet payload as Schema v2 fields
  populate (Phase 2). No code rewrite — the facet map and doc composer just read richer
  fields as they appear, and `null` is handled from day one.
- **`@xenova/transformers`** (build + runtime) with a pinned model revision, vendored/locked so
  CI never fetches. New dev dependency.
- **Pipeline seams:** `build-pages.mjs` (new `/search/` block + `urls[]`), `footer.mjs`
  (nav/footer link), `test.yml` reproducibility (new builder step), `vercel.json` (immutable
  cache header for `/search/*.bin|json|js`).
- No dependency on any runtime service, DB, or API. That is the whole point.

## 8. NEW fields needed beyond Schema v2

**None required.** Schema v2's `features.*`, `stablecoin_tickers`, `card_networks`,
`payment_rails`, `card_form`, `card_funding`, `fx_markup_pct`, `cashback_pct`, `yield_pct`,
`partners.*`, and `timeline[]` cover every facet and ranking signal the query mapper needs.

Two **optional, non-blocking** niceties (build-time derived, not authored into `data.json`):
- a curated `FACET_LEXICON` (phrase→field map) — lives in the builder/module, not the schema;
- an optional `search_boost` hand-tuned weight for a handful of flagship banks — deferable,
  and if ever wanted it belongs in a builder config, not `data.json`.

So this feature adds **no new `data.json` fields** on top of Schema v2.

---

## 9. Effort estimate — **M** (≈ 5–8 focused days)

| chunk | size | notes |
|---|---|---|
| `build-search-index.mjs` (doc composer, feature-phrase map, embed via transformers.js, int8 quantize, write 3 artifacts) | M | most of the risk is determinism + pinning the model |
| `search.js` runtime (BM25 + int8 cosine + hybrid scorer + facet mapper + query-embed lazy load) | M | ~300–400 lines, no framework |
| query→facet lexicon (§4.3) keyed to real enums | S | curated, derived from data.json enums |
| `/search/` page generation in `build-pages.mjs` + JSON-LD + OG + footer/nav + sitemap | S | follows the documented "new section" seam |
| suggestions + related-searches + similar-mode UX | S–M | reuses card/chip/dropdown components |
| flowtest greening (titles, canonical, breadcrumb, a11y, reproducibility) + vercel cache header | S | mechanical once the seam is followed |
| tuning weights / QA over the 5 canonical queries | S | |

Not **S** because of the deterministic-embedding-in-CI work and a genuinely new client
engine; not **L** because the corpus is tiny (no ANN, no server, no new schema). Ship v1
first, layer Schema v2 facets as they land.

---

## 10. Top risks

1. **Build reproducibility (highest).** The reproducibility job fails on any `git diff`.
   Embedding output must be byte-identical across CI runs and dev machines: pin the exact
   model revision, vendor/lock the ONNX weights so no network fetch happens at build, fix the
   quantization math, and derive `build_date` from `DATA_MODIFIED` (git) not the clock. If int8
   quantization or float pooling isn't bit-stable across platforms, `vectors.bin` will churn
   and break CI. Mitigation: generate on CI's platform, commit that artifact, and add a
   `--check` mode to the builder mirroring the other sync scripts.
2. **Semantic-model download weight at runtime.** The ~23 MB quantized MiniLM on first query
   is the one heavy client cost. Mitigation: lazy-load only on first semantic query, ship
   lexical+facet results instantly (progressive enhancement), self-host the model with immutable
   caching, and consider a lighter/int8 model or a fully-lexical fallback for slow connections.
3. **Facet-mapper precision on v1 data / null honesty.** Before Schema v2 populates, many
   capability facets are unknown; a naive "has Apple Pay" filter over mostly-`null` data returns
   almost nothing and looks broken. Mitigation: honor the Schema v2 invariant from day one
   (match `true`, down-rank `null`, never exclude-as-false, always show "· N unverified"), and
   gate capability facets on coverage before promoting them in suggestions.
4. **Hybrid rank quality / weight tuning.** Bad `wL/wV/wF` balance makes NL results feel
   random. Mitigation: a small fixture of the 5 canonical queries with expected top-5 banks as a
   lightweight test; tune constants against it.
5. **Bundle/perf budget & flow 31.** Keep the engine out of `app.js`; `/search/` assets must
   not regress the homepage inline-JS/markup caps. Low risk if kept in `/search/`.
