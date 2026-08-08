# Feature Spec — Compare Mode (#3) + Visual Feature Matrix (#20)

**Status:** design / not yet built
**Depends on:** Schema V2 (`docs/roadmap/SCHEMA-V2.md`) — hard dependency for the matrix columns
**Author target:** implementable against `tests/build-pages.mjs` as it stands today

---

## 1. Overview & user value

Two tightly-coupled things:

- **#20 Visual Feature Matrix** — a scannable ✓ / ✗ / — / value grid of ~18 capability columns, GSMArena-style, replacing prose comparison. One row per bank, one column per capability. The unit of information is a glyph, not a sentence, so a reader scans a column ("who supports Apple Pay?") or a row ("what does Chime do?") in one pass.
- **#3 Compare Mode** — user assembles an arbitrary set of banks (2–4) and sees them side by side in that matrix, at a **shareable static URL**, with CSV/PDF export.

Today the site already has two comparison surfaces (see UX audit): the **homepage JS compare tray/overlay** (transposed `table.cmp`, max 4, `FIELDS` array, copy-link + share-on-X, Esc-to-close) and the **static `/vs/<a>-vs-<b>/` pages** (142 curated pairs, transposed field-row `<table>`). Both use the *same* narrow field vocabulary (Category, Audience, HQ, Custody, Regulation, Card, Cashback, Yield, FX, Services, Stablecoins, KYC, Regions, Users). Neither renders capabilities as a glyph matrix, and neither supports an arbitrary N-bank shareable comparison beyond the 142 hand-curated pairs.

This feature does three concrete things:

1. Adds a **capability-matrix renderer** (shared helper) that turns Schema V2 `features.*` tri-state booleans + normalized card/rail arrays into a ✓/✗/—/value grid, and drops it into the existing `/vs/` pages and homepage overlay.
2. Adds a new **`/compare/` section**: an index + a build-time set of **static comparison pages for arbitrary bank sets**, addressable by a deterministic slug, plus a client-side "build your own" flow on the homepage that resolves to those URLs (mirroring the existing `CMPSLUG` pattern).
3. Adds **CSV and PDF export** of any comparison, done statically (no server).

User value: the single most-requested neobank question ("does X do Apple Pay / IBAN / business accounts / crypto, and how does it compare to Y and Z?") answered in one glance, linkable, and exportable — the GSMArena playbook applied to neobanks.

---

## 2. Data requirements

### 2.1 Schema V2 fields consumed (all already specified in SCHEMA-V2.md)

The 18-column matrix maps directly onto Schema V2. Columns and their source fields:

| # | Column (matrix header) | Schema V2 source | Render |
|---|---|---|---|
| 1 | License / regulation | `regulation_type` (v1) + `license` (v1) | value chip |
| 2 | Country / region | `region` (v1) + `active_regions` (v1) | value |
| 3 | Card network | `card_networks[]` (v2, normalizes `card_network`) | value (Visa/MC chips) |
| 4 | IBAN | `features.iban` | ✓ / ✗ / — |
| 5 | Stablecoins | `features.stablecoin_native` + `stablecoin_tickers[]` (v2) | ✓ + ticker list |
| 6 | Crypto | `features.crypto` | ✓ / ✗ / — |
| 7 | Yield | `features.yield_bearing` + `yield_pct` (v2) + `yield` prose (v1) | value / ✓ |
| 8 | Savings | `features.savings` | ✓ / ✗ / — |
| 9 | AI assistant | `ai` (v1 enum) | value (underwriting/interface/agentic) |
| 10 | API | `features.api` (+ `features.webhooks`, `features.oauth`, `features.sandbox` in expanded view) | ✓ / ✗ / — |
| 11 | Business accounts | `features.business_accounts` | ✓ / ✗ / — |
| 12 | Cash withdrawals | **NEW — see 2.2** | ✓ / ✗ / — |
| 13 | Apple Pay | `features.apple_pay` | ✓ / ✗ / — |
| 14 | Google Pay | `features.google_pay` | ✓ / ✗ / — |
| 15 | Fees / plan cost | **NEW — see 2.2** | value |
| 16 | FX fees | `fx_markup_pct` (v2) + `fx_markup{}` (v1) | value (%) |
| 17 | Virtual cards | `features.virtual_cards` + `card_form[]` (v2) | ✓ / ✗ / — |
| 18 | Physical cards | `features.physical_cards` + `card_form[]` (v2) | ✓ / ✗ / — |

Supporting fields also surfaced in the expanded/exported view but not core columns: `features.self_custody`, `features.mpc`, `features.lending`, `features.investing`, `features.treasury`, `features.stablecoin_native`, `payment_rails[]`, `card_funding[]`, `partners{}`.

### 2.2 NEW fields needed beyond Schema V2 — flagged

Schema V2 covers 16 of the 18 vision columns. **Two columns have no home in V2 and must be added:**

- **`features.cash_withdrawals`** (tri-state bool) — "can you withdraw cash at ATMs." Not derivable from any v1 field and not in the V2 `features` list. Prose signal is ~0 (same class as apple_pay/api), so **manual-only** population. **Recommend: add to the V2 `features` block** as a 20th tri-state key rather than inventing a parallel structure — it obeys the identical `true|false|null` + "null = unverified" invariant and needs no new render path.
- **`fees` / plan cost** — the vision's "fees" column. V2 has `fx_markup_pct` and `cashback_pct`/`yield_pct` but **no monthly-fee / free-tier field.** Recommend a small structured companion mirroring the V2 provenance pattern (`fx_markup{}`): **`monthly_fee{ has_free_tier: bool|null, paid_from_pct|paid_from: string, currency, as_of, source }`**. Render as "Free" / "from €X/mo" / —. This is genuinely new; flag it to the schema owner. If it slips, ship the matrix with 17 columns and a placeholder — do not block on it.

Both new fields are **additive, null-default**, so they inherit the Schema V2 migration guarantee (Phase 1 adds keys null → zero generated pages change byte-for-byte → all 39 flowtest flows stay green). They also require a **`/data/` FIELDS dictionary row each** and an **openapi.json property each** (flowtest flow 39 asserts `/data/` documents every `data.json` field).

### 2.3 The `null` invariant (critical, non-negotiable)

Per the universal consumer invariant in SCHEMA-V2.md: **`null`/absent = unverified, never `false`.** The matrix must render three states, never two:

- `true` → `✓` (accent/lime)
- `false` → `✗` (muted)
- `null`/absent → `—` with `title="not verified"` and `aria-label="not verified"`

Collapsing `null` into `✗` is the one behavior that makes this feature actively misleading (it would assert "Chime has no API" when we simply haven't checked). A per-column footer shows "N of M verified" so readers can gauge coverage. This also means: on launch, most `features.*` are `null` (Pass A derives only the deterministic ones), so the matrix will be visibly sparse until Pass B/C populate it. **That is acceptable and honest**; do not fabricate to fill it.

---

## 3. Page / URL structure & generator seam

### 3.1 URLs

- **`/compare/`** — new top-level section index. Explains the matrix, links the full feature-matrix table, and lists notable/curated comparison sets. Analogous to `/vs/` index.
- **`/compare/<set-slug>/`** — one static page per curated N-bank comparison set (e.g. `/compare/chime-vs-current-vs-varo/`). Slug = the participating slugs joined by `-vs-`, **sorted alphabetically** for determinism and canonical-uniqueness (so `a-vs-b-vs-c` and `c-vs-a-vs-b` never both exist). This mirrors the existing `vsIndex` slug discipline.
- **`/features/`** (or `/matrix/`) — the **full Visual Feature Matrix**: all 368 banks × 18 columns, one giant scannable table, the #20 deliverable in its own right. This is effectively a new **hub-shaped page**.
- Existing **`/vs/<a>-vs-<b>/`** pages get the matrix *added* to them (extended, not replaced).

### 3.2 Which comparison sets to generate statically

We cannot generate all C(368, 3..4) sets. Generate a bounded, deterministic set:

- All 142 existing `vsIndex` pairs get a matrix (in-place, no new URL).
- A curated `compareIndex` array (hand-seeded like the existing `/vs/` curated-pairs list at build-pages.mjs:258) of high-intent 3–4 bank sets (e.g. "US challenger banks", "EU crypto cards", "SMB Europe"). Start ~30–60 sets. Each is a static `/compare/<slug>/` page.
- Optionally auto-derive sets per hub (e.g. top-N banks in each country/category) — deterministic from data.json, so reproducibility-safe. Keep the total bounded and stable.

The homepage "build your own" flow (arbitrary user selection) does **not** require a pre-generated page for every combination: it builds the matrix client-side from the same data and, for sharing, encodes the selected slugs into the URL — see 4.3.

### 3.3 Generator seam (from pipeline audit)

This is a **new top-level section** → follow pipeline-audit §2(b), the `/ai/` `/infra/` pattern, **not** the HUBS array:

1. Add a generation block in `tests/build-pages.mjs` that `head()`s + `writeFileSync`s:
   - `ROOT/compare/index.html`
   - `ROOT/compare/<slug>/index.html` for each `compareIndex` entry, accumulating slugs into `let compareSlugs = []`.
   - `ROOT/features/index.html` (the full matrix).
2. **Register every URL in the `urls` array (build-pages.mjs:1973)** and in the `sitemap.md` body (`~1973`, `~2073`) — nothing non-hub is auto-discovered. Add `...compareSlugs.map(...)` and the `/compare/`, `/features/` locs with `lastmod: DATA_MODIFIED`.
3. Add nav/footer links in **`tests/footer.mjs`** (`NAV_LINKS` and/or `FOOTER_LINKS` — single source; flow 27 asserts every page lists the same destinations in footer.mjs order). Add "compare" once.
4. The matrix renderer is a **new shared helper** in build-pages.mjs (e.g. `matrixTable(banks, cols)`) used by three call sites: `/vs/` pages, `/compare/` pages, `/features/`. Keep it pure/deterministic.
5. If any prose count is stated (e.g. "compare N capabilities across M banks"), anchor the digits in **`sync-counts.mjs` RULES** (flow 30/39) — otherwise a hardcoded 3xx total trips the stale-total heuristic.

`/features/` as a full 368-row table is large; it is one page, deterministic, no client JS needed for the base render. Keep it under control: server-render the table, add a small progressive-enhancement filter/search script (like the homepage) that is optional.

### 3.4 What must NOT change

`export-data.js` and app.js `D/X/V` are upstream of data.json. New V2 fields live in app.js `X` (extended map), not the positional `D` tuple (per SCHEMA-V2.md migration). The compare feature is a **pure consumer of data.json** — it adds no data-origin logic. This keeps it inside the reproducibility chain (test.yml:56-67): `build-pages.mjs` runs, output committed, `git diff` must be empty.

---

## 4. UX / interaction (matching existing design language)

### 4.1 The matrix table (static, shared)

Reuse the `/blog/blog.css` `article table` styling (mono uppercase `th`, dashed row borders, horizontal-scroll on mobile) and the T/H/W color triad + `.chip`. Concretely:

- **Layout**: banks as **columns**, capabilities as **rows** for 2–4 bank comparisons (matches the existing `/vs/` and overlay transposed layout — familiar, and narrow-column-friendly). For the full `/features/` matrix (368 banks), invert: **banks as rows, capabilities as columns** (you cannot have 368 columns). The shared helper takes an `orientation` param.
- **Glyphs**: `✓` in `--w` (lime) / `--accent`; `✗` in `--muted`; `—` for null in `--dim` with `title="not verified"`. Add a tiny `.cell-yes/.cell-no/.cell-na` class set in a page-local `<style>` (the country pages already precedent page-local `<style>` blocks like `.hubtable`).
- **Value cells** (card network, yield %, FX %, fees, AI): render the value in `var(--text)`; blanks `—` muted, exactly like current `/vs/` cells.
- **Sticky first column/header** on the full matrix for scannability (CSS `position: sticky`).
- **Legend** row: `✓ yes · ✗ no · — not verified`, mono, once per table.
- Every `<th>` gets `scope` (flow 34 asserts this). Category chips (`.chip.t/.h/.w`) in the bank header cells.
- Support `body.bw` high-contrast mode: glyphs must not rely on color alone — the ✓/✗/— shapes already carry meaning, which also satisfies WCAG (flow 33 contrast; do not encode state in color only).

### 4.2 Homepage "build your own" compare (extends existing tray/overlay)

The homepage already has the compare tray + overlay (`cmp` Set, max 4, `table.cmp`, `FIELDS`, copy-link, share-on-X, Esc). Extend it:

- Add the capability rows to the overlay's `FIELDS` array (or a second `CAPFIELDS` block rendered as the glyph matrix). Reuse the exact same glyph/null logic as the static helper (share a small formatting function; app.js is extracted from index.html by `build-app-js.mjs`, keep it self-contained).
- The overlay's existing **"copy link"** should produce a `/compare/…` URL (see 4.3) instead of / in addition to the homepage-anchor link, so the shared comparison lands on a real static page when possible.
- Raise nothing about the max-4 limit; keep it (columns stay readable).
- Wire `nbevt('compare_share', {...})` / `nbevt('compare_export', {...})` for the new actions (analytics convention, present on every page).

### 4.3 Shareable comparison URL

Two-tier, both static-friendly:

1. **Curated/known sets** → the real static page `/compare/<sorted-slug>/`. If the user's selection matches a generated set, link there directly (best for SEO + preview cards).
2. **Arbitrary sets** → since we can't pre-generate every combination, encode selection in the URL of the `/compare/` index page as a fragment or query the client reads: e.g. `/compare/#chime,current,varo` (slugs, comma-joined). A tiny script on `/compare/index.html` reads the fragment, looks the banks up in data.json, and renders the matrix client-side. **Use the fragment (`#`) not a query string** to keep it out of server logs and to satisfy the privacy rule against personal data in query strings (bank slugs aren't personal, but fragment is cleaner and needs no canonical churn). Canonical for `/compare/` stays `/compare/` (fragment ignored by crawlers → no duplicate-title/canonical problem, flow 39-safe).

Slug resolution logic must mirror the existing `CMPSLUG` in app.js and the slugify in build-pages.mjs (UX audit notes this is already kept in sync) so client and build agree.

### 4.4 Mobile layout

- 2–4 bank comparison (banks-as-columns): the shared `article table` already does horizontal-scroll on mobile via blog.css. Keep bank columns at a min-width, freeze the first (capability-label) column sticky so labels stay visible while scrolling bank columns. This is the GSMArena mobile pattern.
- Full `/features/` matrix on mobile: horizontal scroll with sticky bank-name first column; offer a "pick columns" toggle (progressive enhancement) to reduce visible columns. Provide an anchored per-capability jump list as a fallback.
- Glyphs remain legible at small sizes (they're text, they scale). Do not shrink below 14px.

---

## 5. SEO / metadata / schema.org & passing flowtest/CI

Every new page needs the full head block (audit §4) or it fails flows 29/32/39. Per page:

- **`<title>`** — unique (flow 39: no two indexable pages share a title). Pattern: `/compare/<slug>/` → "Chime vs Current vs Varo — feature comparison · neobankbeat"; `/features/` → "Neobank feature matrix — 18 capabilities across 368 apps · neobankbeat". The sorted-slug rule guarantees uniqueness.
- **`<meta description>`** ≤160 chars via `clampDesc()` (flow 29).
- **Exactly one `<link rel=canonical>`**, self-referential and absolute (flow 39: canonical == page's own URL). For `/compare/` the canonical is bare `/compare/` (fragment excluded).
- **OG/Twitter** + `og:image`. Convention `/og/<section>/<slug>.png` → need `/og/compare/<slug>.png` and `/og/features.png`. **`og:image` must resolve on disk (flow 29).** Precedent exists: the recent commits already added "custom social preview cards for CV match and fit pages," so there is an OG-generation path to follow. If per-set OG cards aren't ready at launch, point all `/compare/` pages at a single static `/og/compare.png` (still resolves, still passes) and iterate.
- **JSON-LD `@graph`** (flow 39: every block parses, each node typed; canonical matches):
  - `/compare/<slug>/` → `Article` (matches `/vs/` role) or `ItemList` of the compared `Organization`s + `FAQPage` (one Q: "How do X, Y and Z compare?") + `BreadcrumbList` (Home → compare → set). FAQ answer ≥40 chars (flow 39).
  - `/features/` → `Dataset`-flavored `CollectionPage` + `ItemList` (numbered, every bank) + `FAQPage` + `BreadcrumbList`. If `ItemList` is used, **`numberOfItems` must equal element count** (flow 39) and, if styled as a hub, the `<b>N of M tracked neobanks</b>` headline must equal tbody rows and ItemList count (flow 26).
- **BreadcrumbList on every page below `/`** (flow 32, `sync-crumbs.mjs --check`).
- **Every internal href resolves** (flow 28) — cross-links to `/n/<slug>/`, `/vs/`, `/data/` must all exist.
- **`/data/` documents new fields** (flow 39): add FIELDS rows for `features.cash_withdrawals` and `monthly_fee` (and confirm the V2 `features`/`fx_markup_pct`/`card_networks` rows are already added by the V2 migration). Also add to openapi.json properties.
- **Share text carries no dashes** (flow 35) — watch the X-share copy.
- **Reproducibility (test.yml:56-67):** the generator must be deterministic — sorted slugs, sorted bank order within a set, no clock dates (use `DATA_MODIFIED` from git), no live network. Commit the generated `/compare/`, `/features/`, and OG assets. `git diff` must be empty after CI re-runs `build-pages.mjs`.

### 5.1 CSV / PDF export (static approach)

- **CSV**: pure client-side. A button serializes the currently-displayed matrix (headers + rows, `null`→empty or "unverified") to a CSV string and triggers a `Blob` download (`data_download`/`compare_export` nbevt). No build artifact needed; works on both static pages and the homepage overlay. Zero server. **Optionally** also emit a committed static `/compare/<slug>.csv` per curated set at build time for a clean shareable link (deterministic, reproducibility-safe, but adds files — decide based on appetite).
- **PDF**: avoid a server and avoid heavy client libs. Two options, in order of preference:
  1. **Print stylesheet** — a `@media print` block that lays the matrix out cleanly (hide nav/footer/subscribe, force column widths, page-break rules) + a "Download PDF / Print" button calling `window.print()`. Users get a PDF via the browser's print-to-PDF. Zero dependency, works offline, matches the "all build-time static" constraint. **Recommended.**
  2. If a true one-click PDF file is required, generate committed static `/compare/<slug>.pdf` at build via a headless-render step — but this adds a non-deterministic-risk toolchain to the build and likely can't live in the core reproducibility chain (like `build-jobs.mjs`, it'd need its own workflow). **Not recommended for v1.**

Recommendation: ship **client-side CSV Blob + print-stylesheet PDF** for v1. Both are static, dependency-free, and pass CI untouched.

---

## 6. Effort estimate

**Overall: M (≈ 4–7 focused days), assuming Schema V2 Phase 1 keys exist and are at least partially populated.**

Breakdown:

- **Matrix renderer helper** (shared, tri-state glyphs, both orientations, sticky columns, bw/WCAG-safe) — **M-small, ~1 day.** The single highest-leverage piece.
- **`/vs/` in-place matrix injection** — **S, ~0.5 day.** Add the matrix under the existing "Side by side" table on 142 pages.
- **`/compare/` section** (index + curated set pages + curated `compareIndex` seed list + slug/sitemap/urls/footer wiring) — **M, ~1.5 days.** Bulk of the generator work + flowtest plumbing (titles, canonicals, breadcrumbs, descriptions, OG).
- **`/features/` full matrix page** (render 368×18, sticky, optional filter script) — **S–M, ~1 day.**
- **Homepage overlay extension** (capability rows, `/compare/` share URL, CSV button) — **S–M, ~1 day.**
- **CSV + print-PDF** — **S, ~0.5 day.**
- **OG cards** for `/compare/` + `/features/` — **S, ~0.5 day** (reuse the existing CV-match/fit OG path).
- **`/data/` FIELDS + openapi rows for the 2 new fields, sync-counts anchors, flowtest green** — **S, ~0.5 day.**

If the two NEW fields (`features.cash_withdrawals`, `monthly_fee`) also have to be **specced and populated**, add **+1–2 days** (mostly manual data entry, Pass C) — bumping toward the high end of M. If we ship with those two columns as placeholders, it stays comfortably M.

---

## 7. Dependencies

- **HARD: Schema V2** (`docs/roadmap/SCHEMA-V2.md`). The entire matrix is a consumer of `features.*`, `card_networks[]`, `card_form[]`, `card_funding[]`, `stablecoin_tickers[]`, `fx_markup_pct`, `yield_pct`, `payment_rails[]`. Without V2 the feature degenerates to the existing prose `/vs/` table. Specifically needs V2 **Phase 1** (keys exist, null-defaulted) to build the UI, and **Phase 2** (populated) for the matrix to be non-empty/useful.
- **HARD: two NEW fields** beyond V2 — `features.cash_withdrawals` and `monthly_fee{}` (§2.2). Get these into the V2 `features`/schema before or alongside build, or drop those two columns for v1.
- **SOFT: OG-card generation path** — reuse the one added in commit `fc7088759` (CV match / fit preview cards).
- **SOFT: flowtest/sync infrastructure** — `footer.mjs`, `sync-counts.mjs`, `sync-crumbs.mjs`, `/data/` FIELDS, openapi.json (all exist; just extend).
- No dependency on live APIs → stays in the core reproducible build (unlike jobs).

---

## 8. Top risks

1. **BIGGEST RISK — sparse, honest data makes the matrix look empty/broken at launch.** Because `null` = unverified and Pass A only fills the deterministic subset, most `features.*` cells will be `—` until the manual Pass C effort lands. A 368×18 grid of dashes reads as "this site knows nothing." The feature's usefulness is **gated on Schema V2 data coverage, not on the code.** Mitigation: launch `/features/` and `/compare/` only once coverage crosses a threshold on the core columns (apple_pay, google_pay, iban, api, business_accounts, virtual/physical cards) for the top ~50–100 banks; show explicit "N of M verified" per column so sparseness reads as transparency, not failure; consider gating the full 368-row matrix behind a "verified banks only" default view.
2. **Two vision columns (cash withdrawals, fees) have no schema home** — need net-new fields (§2.2); if the schema owner doesn't add them, the "18 columns from the vision" promise is unmet.
3. **`null`→`✗` collapse** anywhere in the render path turns the feature from "honest" to "actively wrong/defamatory" about providers. Must be enforced in the shared helper and unit-checked.
4. **Reproducibility/flowtest breakage** from any nondeterminism (unsorted set slugs, clock dates, per-set OG generation in the core chain) — fails test.yml's `git diff` gate. Mitigation: sorted slugs, `DATA_MODIFIED` dating, keep any headless rendering out of the core workflow.
5. **Combinatorial URL explosion** if we try to statically generate all N-bank sets. Bound it to a curated `compareIndex` + client-side fragment rendering for arbitrary sets.
