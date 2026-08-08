# Feature Spec — Multilingual SEO (#2)

**Status:** Roadmap / Tier-C bet · **Effort:** **L** (but phaseable to a de-risked **M** pilot) · **Recommendation:** Do NOT commit to the full 368×11 build yet. Ship a **1-language × metadata-only pilot** (see §10) and let it earn the rest.

> Design intentionally **lighter** than the other roadmap features. Multilingual SEO multiplies *surface area*, not *product*. Every page it adds is a translated re-skin of a page that already exists, so the whole feature is a projection over the existing generator. The hard part is not building it — it is **paying the translation-quality and freshness tax forever after.** This spec is honest about that tax and gates the commitment on it.

---

## 1. Overview & user value

**What it is.** Build-time generation of localized copies of the highest-value existing pages, at localized URLs (`/de/revolut`, `/it/n/revolut/`, etc.), with correct `hreflang` reciprocity, localized `<title>`/`<meta>`/OG/Twitter/JSON-LD, for a target set of languages: **DE, IT, FR, ES, PT, NL, PL, TR, JA, KO, ZH**.

**Why (SEO surface multiplication).** neobankbeat's entire growth thesis is programmatic long-tail SEO. A German user searching *"Revolut Gebühren Auslandseinsatz"* or *"beste Neobank Deutschland"* currently lands on an English page (or nothing). Localized pages capture query variants in-language and win featured snippets where the English page can't. With 368 banks × 11 languages the theoretical ceiling is ~4,000 profile pages plus localized hubs — a 10× surface increase.

**Why "lighter" / Tier-C.** It adds *no new data and no new interaction* — it is a translation projection over pages we already generate. That makes the engineering genuinely small. But translation is a **recurring liability**: every data refresh, every new bank, every copy tweak re-opens 11 translation obligations, and bad machine translation in a finance context (regulatory terms, "custodial", "e-money licence") actively *damages* trust and can earn manual-action/quality penalties. So the value is real but capped, and the maintenance tax is the deciding factor — hence Tier-C, and hence the "translate metadata & categories first, prose last (or never)" strategy in §5.

**User value, concretely:**
- Non-English organic visitors land on a page they can read → lower bounce, higher snippet capture.
- `hreflang` clusters tell Google these are locale variants of one canonical entity → no duplicate-content self-cannibalization.
- Localized OG/Twitter cards → better social CTR in-market.

**Explicit non-goals:** no in-page language switcher UX beyond a simple selector; no translation of the interactive homepage app (`app.js`) or the `fit/` wizard (client-side, high-churn, low SEO value — see §4); no user-generated locale detection/redirect (bad for SEO + accessibility); no translation of blog prose.

---

## 2. Data requirements

### 2.1 Schema V2 fields consumed (read-only)
i18n is a **pure consumer** of data.json. It renders the same fields the English pages render. The Schema V2 additions matter because they are **enum/tri-state, i.e. translate-once not translate-per-record** — which is exactly what makes localization affordable (§5). Consumed:

- Existing v1 enums (the cheap, high-value translation targets): `category` (traditional/hybrid/web3-native), `custody`, `regulation_type` (11 values), `region`, `active_regions`, `audience`, `kyc`, `ai`.
- Schema V2 enums/tri-states (translate the *labels*, values stay canonical): `features.*` (19 keys — `apple_pay`, `google_pay`, `api`, `webhooks`, `oauth`, `sandbox`, `business_accounts`, `virtual_cards`, `physical_cards`, `iban`, `self_custody`, `mpc`, `yield_bearing`, `savings`, `lending`, `investing`, `treasury`, `crypto`, `stablecoin_native`), `card_networks[]`, `card_form[]`, `card_funding[]`, `payment_rails[]`, `stablecoin_tickers[]`, `partners.*`.
- Numeric companions rendered as-is (locale-formatted, not translated): `fx_markup_pct`, `cashback_pct`, `yield_pct`, `founded`, `reported_users`.
- **`null`/absent = unverified** invariant is preserved verbatim: the localized "not verified" string is one translated label per language, and `null` never renders as the localized word for "no". (Universal consumer invariant from Schema V2.)

### 2.2 NEW artifacts this feature must add (FLAGGED)

None of these belong in data.json (per-record). They are **feature-owned translation assets**, checked into the repo so the build stays deterministic and offline (reproducibility job forbids live network in the core chain — Pipeline Audit §5).

1. **`i18n/locales.json`** — the locale registry. `[{code:"de", htmlLang:"de", label:"Deutsch", dir:"ltr", enabled:true, tier:"metadata"|"full"}]`. Single source for which languages exist and how deep each is translated. **NEW — flag.**
2. **`i18n/strings/<lang>.json`** — the **UI-chrome + enum-label dictionary**: every translatable *template string* and *enum value label* keyed by a stable id (e.g. `cat.traditional`, `custody.Custodial`, `reg.E-money`, `feat.apple_pay`, `label.not_verified`, `nav.directory`, `faq.what_is.q`). Finite, bank-independent, ~250–400 keys. This is the asset that makes the feature cheap: translate it once per language, reuse across all 368 pages. **NEW — flag.**
3. **`i18n/prose/<lang>/<slug>.json`** (optional, tier `full` only) — per-bank translated free prose (`note`, `story`, FAQ answers). This is the **expensive, high-liability** asset. Deliberately a *separate side-file per bank*, machine-drafted then human-reviewable, so we can ship metadata-tier without ever creating it, and populate it lazily. Missing file → page falls back to English prose with a labeled banner (see §5). **NEW — flag, but optional/deferred.**
4. **`i18n/glossary.csv`** — a **do-not-mistranslate / locked-term** glossary (regulatory + product terms: "E-money" → de "E-Geld", "custodial" → keep or locked translation, brand names never translated). Fed to the MT step; also the human-review checklist. **NEW — flag.**

> The important design decision: **no per-record translation in data.json.** Translations live in feature-owned side assets keyed by (lang, string-id) or (lang, slug). This keeps Schema V2 clean, keeps the `/data/` FIELDS-dictionary flow (flowtest 39) untouched, and lets the feature be deleted or paused without touching the dataset.

---

## 3. Page / URL structure and the generator seam

### 3.1 URL scheme
Path-prefix locales (best for programmatic SEO + trivially static on Vercel):

```
/de/                      → localized homepage-lite landing (NOT the app; a static hub, see §4)
/de/revolut/  (alias)     → localized profile (short pretty URL requested in the brief)
/de/n/revolut/            → canonical localized profile path (mirrors English /n/<slug>/)
/de/regulation/e-money/   → localized hub
/de/countries/germany/    → localized country lander
/de/vs/revolut-vs-n26/    → (full tier only; likely SKIP — see §5)
```

Decision: canonical localized profile path is **`/de/n/<slug>/`** (a 1:1 mirror of `/n/<slug>/`), and `/de/<slug>` is a generated **redirect alias** (via `vercel.json`) to satisfy the brief's "pretty URL" ask without forking canonical logic. English stays at the un-prefixed root (`x-default`).

### 3.2 The generator seam (from Pipeline Audit §2)
This is a **"wholly new top-level section" pattern (seam b)** applied as an outer loop, not a new hub family. Concretely, in `tests/build-pages.mjs`:

1. **Refactor, don't rewrite.** The page-emitting blocks already build an `html` string and `writeFileSync` it. Wrap the *subset of page types we localize* (profile, country, hub, the new `/de/` landing) so their template functions take a `locale` argument that defaults to `en`. `en` must produce **byte-identical** output to today (guard: reproducibility job).
2. **Localization primitives** (new small module `tests/i18n.mjs`, imported by build-pages.mjs):
   - `t(lang, key, ...args)` → dictionary lookup with English fallback.
   - `enumLabel(lang, field, value)` → localized enum label, English fallback, `null`→`t(lang,'label.not_verified')`.
   - `proseFor(lang, slug, field)` → returns translated prose or `{fallback:true, en:...}`.
   - `localePath(lang, path)` → `/de` + path (identity for `en`).
   - `hreflangCluster(path)` → for a given logical page, the set of `{lang, href}` across all enabled locales + `x-default`.
3. **Outer loop.** After the English pages are written, iterate `locales.json` where `enabled`. For each locale, re-run the (now locale-parameterized) profile/country/hub/landing emitters into `ROOT/<lang>/...`. Localized slug **stays the English slug** (URL slugs are not translated — keeps cross-locale joins and `hreflang` trivial, and avoids slug-collision churn).
4. **Register outputs (nothing is auto-discovered for non-hub pages — Pipeline Audit §2b):**
   - Push every localized URL into the `urls` array (build-pages.mjs ~line 1973) and into `sitemap.md`. Sitemap generation already rebuilds wholesale from slug lists — extend the accumulation to loop locales.
   - `lastmod` = `DATA_MODIFIED` (English data date) OR the git date of the corresponding `i18n/prose/...` file, whichever is later. Deterministic, from git — satisfies "no future lastmod" (flow 39) and the full-history requirement.
5. **`head()` extension.** Add optional `lang` + `hreflang` params to the central `head()` helper (build-pages.mjs:83): set `<html lang="...">`, emit the full reciprocal `<link rel="alternate" hreflang="..">` set + `hreflang="x-default"` → English, and set the **self-referential canonical to the localized URL** (flow 39 requires canonical == page's own URL — critical: localized pages canonical to *themselves*, not to English; hreflang is what links the cluster).
6. **Nav/footer.** Add a single language `<select>`/link-list to `footer.mjs` (single source; flow 27 requires every nav to list the same destinations in footer order). The selector links to the current page's locale alternates (reuse `hreflangCluster`).

### 3.3 What is generated per locale (tier-gated)
| Page type | metadata tier | full tier |
|---|---|---|
| `/xx/` landing hub | ✅ | ✅ |
| `/xx/n/<slug>/` profiles | ✅ (chrome+enums translated, prose = EN w/ banner) | ✅ (prose translated) |
| `/xx/countries/<c>/` | ✅ | ✅ |
| `/xx/<hub>/` (regulation, kyc, cards, for, regions) | ✅ | ✅ |
| `/xx/vs/...` comparisons | ❌ skip | ⚠️ optional (140 pairs × N langs = blast radius; default skip) |
| who-owns / alternatives | ❌ skip | ⚠️ optional |
| homepage app / fit wizard | ❌ never | ❌ never |

---

## 4. UX / interaction (matching existing design language, from UX Audit)

Localized pages reuse the **sub-page "article" shell** verbatim — same `blog/blog.css`, same tokens, same T/H/W triad, `header.hwrap` / `footer.fwrap` / `.eyebrow` / `.callout` / `.backbtn` / `.subscribe`. Only *text nodes* change. No new components, no new CSS file.

- **Language selector:** a mono-styled control in the header nav row (next to `#bwtoggle`) and mirrored in the footer. Styled as the existing `.dd`/dropdown or a plain `<select>` with `.pill` styling — no new pattern. Options link directly to the alternate URL (real `<a>`, works without JS; SEO-safe). Fires `nbevt('lang_switch',{to})`.
- **"Machine translation" honesty banner:** metadata-tier pages (English prose under localized chrome) and any MT-only full-tier page carry a small `.callout`-styled notice: localized string `label.mt_notice` ("Automatisch übersetzt · Originaldaten auf Englisch"), linking to the English canonical. This is both an honesty signal and a hedge against MT-quality penalties.
- **Typography:** Space Grotesk / Noto Sans Mono cover Latin-script langs (DE/IT/FR/ES/PT/NL/PL/TR) fine. **CJK (JA/KO/ZH) needs a font fallback** — Space Grotesk has no CJK glyphs. Add a `font-family` fallback chain (`system-ui`, `"Hiragino Sans"`, `"Noto Sans CJK"`, etc.) scoped to `:lang(ja), :lang(ko), :lang(zh)` in `blog.css`. **Do not self-host CJK webfonts** (multi-MB, kills the <110 KB markup / perf budget). This is a real polish cost and a reason to launch CJK last.
- **`dir`:** all 11 target languages are LTR, so no RTL work now. `locales.json` carries a `dir` field so adding AR/HE later is a data change, not a code change.
- **BW mode, analytics, skip-link, single `<main>`:** inherited unchanged (flows 34–36 keep passing since markup structure is identical).
- **Number/date formatting:** render `founded`, `%` companions, user counts with locale-aware separators at build time (`Intl.NumberFormat(lang)`), deterministic given a pinned Node/ICU version (pin in CI to protect reproducibility).

---

## 5. Translation pipeline, quality & the maintenance tax (the crux)

### 5.1 What to translate first — the tiered strategy
Translate in **strict value/cost order**. Each tier is independently shippable and independently pausable.

**Tier 0 — UI chrome + enum labels + metadata (DO FIRST).**
`i18n/strings/<lang>.json` (~250–400 finite keys) + generated `<title>`/`<meta description>`/OG/Twitter/JSON-LD label fields. This is **~90% of the SEO value for ~10% of the cost**: it's what search engines index and what shows in SERPs, it's *finite and bank-independent* (translate once, reuse across 368 pages × forever), and it contains the high-liability regulatory terms that most need a human (the §2.2 glossary). Enum labels (`category`, `custody`, `regulation_type`, `features.*`) are the same handful of strings on every page. **This tier alone justifies the feature.**

**Tier 1 — templated per-bank sentences.** The profile/country/hub prose is *largely templated* already ("X is a {category} neobank founded in {year}, headquartered in {hq}…"). Translate the **sentence templates** (finite, into `strings/<lang>.json`) and interpolate canonical data. This yields fluent localized prose for *most* of the page with **zero per-bank translation** — the single highest-leverage insight in this spec. Titles like `A vs B` become `A im Vergleich zu B`.

**Tier 2 — free prose (`note`, `story`, custom FAQ answers) — DEFER or NEVER.** This is the only genuinely per-bank, per-language translation. 368 × 11 × ~2 fields = the expensive, high-churn, high-liability corner. Default: **do not translate**; render English prose under localized chrome with the MT banner (§4). Populate `i18n/prose/<lang>/<slug>.json` lazily, only for top-traffic banks, only for top-traffic languages, human-reviewed.

### 5.2 The pipeline (offline, deterministic — respects Pipeline Audit §5)
The core build chain forbids live network (reproducibility job). So translation is a **separate, out-of-band step whose output is committed**, exactly like `build-jobs.mjs` is quarantined from the core chain:

```
tests/i18n-translate.mjs   (NEW, out-of-band, NOT in reproducibility chain)
  1. Diff: find string-ids / prose slugs new-or-changed since last run (git-based).
  2. Call MT API (DeepL for DE/IT/FR/ES/PT/NL/PL; DeepL/Google for TR/JA/KO/ZH),
     injecting i18n/glossary.csv locked terms + brand-name do-not-translate list.
  3. Write drafts into i18n/strings/<lang>.json (status:"mt") / i18n/prose/... .
  4. Human review flips status "mt" → "reviewed" (Tier 0 glossary terms REQUIRE review before enabled).
  5. Commit. build-pages.mjs consumes committed JSON only — fully offline & deterministic.
```
- Runs on its own workflow (like `refresh-jobs.yml`), never in `test.yml`'s core chain. `build-pages.mjs` never calls an API.
- **MT engine choice:** DeepL is materially better for DE/FR/IT/ES/PT/NL/PL finance copy; CJK/TR quality is the weakest and most in need of review — another reason CJK/TR launch last.

### 5.3 The maintenance tax — stated honestly
This is the whole reason it's Tier-C. Every one of these is a *recurring* cost, not a one-time build:

- **Fan-out on every change.** Change one enum label or template sentence → N languages re-translate + re-review. A daily `rebuild.yml` that restamps data doesn't re-translate (good), but any *copy* change does.
- **Data freshness vs. translation freshness skew.** English data updates daily via crons; translations lag. Metadata/template tiers (canonical-data interpolation) auto-stay-fresh (numbers/enums re-render), so **this skew is confined to Tier 2 free prose** — the main argument for deferring Tier 2.
- **New-bank tax.** Every bank added by `discover-neobanks.yml` silently owes 11 metadata translations. Mitigation: new banks auto-render at Tier 0/1 (templated, no human step); they only *lack* Tier 2 prose, which falls back to English gracefully.
- **Quality/penalty risk.** Bad MT in finance = trust damage + possible Google "auto-generated content" quality demotion, *worse than not existing*. The MT banner + human-reviewed glossary + template-over-freeform strategy are the hedges.
- **Review labor.** Realistically needs a per-language reviewer (contractor) for Tier 0 sign-off (~1 day/language once) and periodic Tier 2 spot-checks. Engineering can't self-serve 11 languages credibly.
- **Sheer page count in CI.** 368 profiles × 11 = ~4k new pages *before* hubs/countries. Flows 28/29/32/39 walk *every* page (>1600 today → potentially >6000). CI wall-time and the reproducibility `git diff` grow. Gate locales behind `enabled` so we scale count deliberately.

### 5.4 Recommendation on committing
**Commit to Tier 0 + Tier 1, for 1 pilot language (DE), profiles + countries + core hubs only. Defer Tier 2, CJK, comparisons, and who-owns/alternatives until the pilot proves organic lift.** Success metric: measurable non-English organic impressions/clicks (Search Console) on the `/de/` cluster within ~8–12 weeks. If it lifts, add languages one at a time (each is mostly a `strings/<lang>.json` + `enabled:true` data change). If it doesn't, the blast radius removed is trivial (delete the `/de/` tree + one flag) because we never entangled it with the dataset.

---

## 6. SEO / metadata / schema.org & how it passes flowtest/CI

Every localized page carries the **full** meta+OG+Twitter+JSON-LD block (UX Audit §4), localized, and must satisfy the same 39 flows. Specifics:

- **Flow 39 — self-referential canonical:** localized page canonicals to **itself** (`/de/n/revolut/`), NOT to English. Cluster linkage is via `hreflang` only. (Common i18n bug; call it out in review.)
- **`hreflang` reciprocity:** every page in a cluster lists every other locale + `x-default`→English. Generated from one `hreflangCluster()` source so reciprocity is guaranteed by construction. Add an **i18n-specific check** (extend flowtest or a `sync-hreflang.mjs --check`) asserting: every hreflang target resolves on disk (mirrors flow 28) and every cluster is symmetric.
- **Flow 39 — unique `<title>` per indexable page:** localized titles differ from English (different language) and from each other → uniqueness holds. Guard: ensure the `en` title and `de` title never coincide for the same page (they won't once translated; add a lint so an *untranslated* title doesn't sneak a duplicate).
- **Flow 29 — description ≤160 chars:** `clampDesc()` already enforces; note German/Finnish-style compounding runs long → clamp still applies, but write source strings short. CJK counts characters not bytes — verify `clampDesc` measures code points (it likely uses `.length`, which is fine for BMP; flag for CJK review).
- **Flow 39 — FAQ answers ≥40 chars:** localized FAQ answers must clear 40 chars in-language; templated answers do. Spot-risk: terse CJK answers — pad templates.
- **Flow 32 / sync-crumbs — BreadcrumbList on every page:** localized breadcrumbs use localized labels but same structure; `crumbs()` gets a `lang` param.
- **Flow 39 — sitemap ↔ disk both directions & no future lastmod:** localized URLs added to the same wholesale sitemap build; lastmod from git. ✅ by construction.
- **Flow 26 (hubs) invariants:** localized hubs must keep `<b>N of M tracked neobanks</b>` == tbody rows == ItemList numberOfItems. Numbers are canonical (not translated), so this holds; only the surrounding words localize.
- **Flow 31 — homepage markup <110 KB / vercel.json:** the `/de/` landing is a *separate* lightweight static file, not the app, so the homepage budget is untouched. Add localized-alias redirects to `vercel.json` (keep immutable app.js cache + security headers intact).
- **Flow 30 / sync-counts:** localized prose must NOT contain hardcoded "368"-style totals that drift (flow 25/39 stale-total heuristic). Localized number rendering pulls from canonical stats `S`; if a localized evergreen string states a count, anchor it in `sync-counts.mjs RULES` per language, OR (preferred) always interpolate the number rather than hardcode it.
- **Reproducibility job:** `en` output must be byte-identical post-refactor; localized output is deterministic (committed dictionaries + pinned ICU). Add localized pages to whichever committed builder emits them (build-pages.mjs) so `git diff` is clean.
- **`/data/` dictionary (flow 39):** unaffected — no new data.json fields, so no FIELDS-dictionary rows required. (A key reason to keep translations out of data.json.)

---

## 7. Effort estimate

**Overall: L**, decomposing to a **de-risked M pilot** + long-tail expansion.

| Chunk | Size | Notes |
|---|---|---|
| Refactor page emitters to take `locale` (en byte-identical) | M | The real engineering risk; touches the 156 KB generator carefully. |
| `tests/i18n.mjs` primitives (`t`, `enumLabel`, `proseFor`, `localePath`, `hreflangCluster`) | S | Small, pure. |
| `head()`/`crumbs()`/`footer.mjs` lang + hreflang extension | S | |
| `i18n/locales.json` + `strings/de.json` (Tier 0+1, translated & reviewed) | M | Mostly translation/review labor, not code. ~300 keys. |
| Language selector UI + MT banner + CJK font fallback CSS | S | Reuses existing patterns. |
| `sync-hreflang.mjs --check` + CI wiring, sitemap/urls loop | S | |
| `tests/i18n-translate.mjs` (out-of-band MT pipeline) + its workflow | M | Quarantined like build-jobs; glossary integration. |
| Per-language rollout (each additional language) | S each | Mostly `strings/<lang>.json` + `enabled:true`; CJK adds font/QA. |
| Tier 2 free-prose translation infra + review | L (deferred) | The expensive corner; don't build until proven. |

**Pilot (DE, Tier 0+1, profiles+countries+hubs): M.** Full 11-language + Tier 2: **L+** and mostly *ongoing operational* cost, not build cost.

---

## 8. Dependencies

- **HARD: Schema V2** must exist. i18n renders `features.*`, `card_networks[]`, `card_form[]`, `card_funding[]`, `payment_rails[]`, `stablecoin_tickers[]`, `partners.*`, and the numeric companions. It also depends on Schema V2's **`null` = unverified** invariant to render the localized "not verified" third state correctly. If i18n ships before V2, it simply localizes the v1 field set and picks up V2 fields when they land (additive, low coupling) — but the spec assumes V2.
- **HARD: generator refactor** to locale-parameterized emitters (own work, above).
- **Soft: MT vendor account** (DeepL) + a small budget + per-language human reviewer for Tier 0 sign-off. Out-of-band, not in CI.
- **Soft: CI budget** to absorb ~4–6× page count; may need flowtest sharding/timeout bumps.
- **Soft: CJK font fallback** decision in `blog.css`.
- **Interacts with crons:** `discover-neobanks.yml` (new banks auto-owe Tier 0/1, auto-satisfied by templates), `rebuild.yml` (re-renders localized pages from committed dictionaries — fine, deterministic). The MT step must be its own workflow, never in the core chain.

---

## 9. Top risks

1. **Machine-translation quality in a finance/regulatory context → trust damage + Google auto-generated-content demotion.** The failure mode is *worse than not shipping*: mistranslating "e-money licence" or "custodial" misleads users and can trigger quality penalties across the whole locale cluster. Mitigations: template-over-freeform (Tier 0/1), human-reviewed locked glossary, MT-honesty banner, defer freeform prose. **This is the make-or-break risk.**
2. **The recurring maintenance tax outweighs the SEO gain (Tier-C thesis).** 11 languages × daily-updating dataset × copy churn = perpetual re-translation/review obligation on a bet that may not pay. Mitigation: metadata/template tiers auto-stay-fresh; gate expansion on measured organic lift from the DE pilot; keep translations fully decoupled from data.json so pausing costs nothing.
3. **Canonical/hreflang misconfiguration self-cannibalizes or de-indexes.** Wrong canonical (localized → English) or non-reciprocal hreflang is the classic i18n SEO own-goal that can *lose* existing English rankings. Mitigation: single-source `hreflangCluster()`, self-referential canonical rule, dedicated `sync-hreflang.mjs --check` in CI.
4. **CI blast radius:** ~4–6× page count stresses flowtest wall-time and the reproducibility `git diff`; a translation-freshness/determinism slip turns the whole build red. Mitigation: `enabled` flag to scale locales deliberately; pin Node/ICU; MT strictly out-of-band with committed output.
5. **Refactor regression:** parameterizing the 156 KB generator risks the `en` output drifting → reproducibility job fails. Mitigation: `locale='en'` path must be a no-op producing byte-identical output; assert with a diff before adding any locale.

---

## 10. Recommended first commit (the pilot)

1. Refactor emitters to locale-aware (`en` byte-identical).
2. Ship `i18n/locales.json` with **DE only, tier `full` via templates (Tier 0+1), Tier 2 prose = English + banner**.
3. Generate `/de/n/<slug>/` + `/de/<slug>` alias, `/de/countries/*`, `/de/` landing, core `/de/<hub>/`.
4. hreflang cluster EN↔DE + x-default; `sync-hreflang.mjs --check` in CI.
5. Human-review `strings/de.json` (esp. glossary terms) before `enabled:true`.
6. Measure Search Console `/de/` organic for 8–12 weeks. **Expand only on proven lift.**

If the pilot doesn't move impressions, delete the `/de/` tree and one flag — zero dataset entanglement, near-zero sunk cost. That optionality is the entire reason to build it lighter.
