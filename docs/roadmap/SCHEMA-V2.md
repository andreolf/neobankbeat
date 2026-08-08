# Schema v2 — target data model for neobankbeat

Status: DESIGN (no data written yet). Owner: dataset. Scope: define the normalized
target schema that ~12 downstream features (side-by-side compare, visual feature
matrix, similar-banks, benchmarks, faceted + semantic search) build on.

This document is the contract. It does **not** modify `data.json`. It specifies the
target shape, the null semantics, provenance for every value, and a migration path
that keeps the 369 `n/` pages, the sitemap, and all 39 flowtest flows green while
fields land incrementally.

---

## 0. Design principles

1. **Additive only.** Every existing field in the 32-field v1 schema is kept, at its
   existing key and type. v2 adds keys; it renames/removes nothing in phase 1.
   Renames (if any) happen last, behind a compatibility shim.
2. **`null` = unverified, never `false`.** Absence of a boolean capability means "we
   have not confirmed this", not "the bank lacks it." This is already the house rule
   (`meta.field_notes.verification`: "unverified fields are null rather than guessed").
   Every new boolean is tri-state: `true` / `false` / `null`. `false` is a *positive
   claim* that the capability is absent and must itself be sourced.
3. **Structured companion, prose retained.** Where a capability is trapped in prose
   (`yield`, `cashback`, `fx_markup.markup`), the prose string stays; v2 adds a typed
   companion next to it. Nothing that renders today loses its source string.
4. **Provenance pattern is reused, not reinvented.** v1 already models dated, sourced
   values as `{value, as_of, source}` (`fx_markup`, `reported_users`, `volume`). Every
   new sourced value follows the same `{…, as_of, source}` triple.
5. **Controlled vocabularies over free text.** New multi-valued fields are `string[]`
   drawn from a fixed, documented enum. Unknown → omit the tag, never invent one.

---

## 1. Existing fields — kept as-is (phase 0 baseline)

All 32 v1 fields are retained unchanged. Summary of what stays and any v2 note:

| field | v1 type | v2 disposition |
|---|---|---|
| `name` | string | keep |
| `category` | enum (traditional/hybrid/web3-native) | keep |
| `audience` | enum (17) | keep |
| `region` | enum (11; fix dirty `US/UK`) | keep; normalize the one dirty value |
| `hq` | string | keep |
| `founded` | int | keep |
| `custody` | enum (Custodial/Self-custodial/MPC self-custodial/Mixed) | keep — authoritative source for `features.self_custody`/`features.mpc` |
| `regulation_type` | enum (11) | keep |
| `card_network` | messy string | keep for back-compat; **superseded by `card_networks[]`** |
| `card_type` | free-text (55 distinct) | keep for back-compat; **superseded by `card_form[]` + `card_funding[]` + `features.business_accounts`** |
| `cashback` | prose | keep; add companion `cashback_pct` |
| `yield` | prose | keep; add companion `yield_pct` + `features.yield_bearing` |
| `stablecoins` | bool | keep the bool; **add `stablecoin_tickers[]`** (new key, does not overwrite) |
| `kyc` | enum (Yes/Card only/No) | keep |
| `domain`,`website`,`x_handle`,`terms_url`,`privacy_url` | string/url | keep |
| `active_regions` | string[] (7) | keep |
| `countries` | string[] | keep |
| `note`,`story` | prose | keep — primary extraction source for `features.*` |
| `license` | string | keep — extraction source for `partners.partner_bank`/`issuer` |
| `founders` | comma-string | keep; **add `founders_list[]`** (normalized array) |
| `funding` | prose | keep |
| `investors` | `[{name,website}]` | keep |
| `reported_users` | `{value_millions,metric,as_of}` | keep |
| `ai` | enum (underwriting/interface/agentic) | keep |
| `services` | string[] (8-tag) | keep — **folded into and superseded by `features.*`** but retained as-is in phase 1 |
| `fx_markup` | `{markup,as_of,source}` | keep the object; **add numeric `fx_markup_pct`** (see §2.3) |
| `volume` | `{figure,metric,source}` | keep |

Rationale for keeping `card_network`/`card_type`/`services` even though superseded:
the homepage `app.js` positional tuple `D[]`, the `VS_FIELDS` table (build-pages.mjs:797),
and the CSV mirror all read them today. They are frozen v1 surface. New code reads the
new keys; old code keeps working. Deprecation is a separate, later phase.

---

## 2. New fields added by v2

### 2.1 `features` — typed capability object (tri-state booleans)

The headline addition. One object per bank, each key `true | false | null`
(`null` = unverified). Absent key is treated as `null`.

```jsonc
"features": {
  "apple_pay":         null,   // wallet
  "google_pay":        null,   // wallet
  "api":               null,   // public/partner API
  "webhooks":          null,   // dev
  "oauth":             null,   // dev
  "sandbox":           null,   // dev
  "business_accounts": null,   // account type
  "virtual_cards":     null,   // card form-factor
  "physical_cards":    null,   // card form-factor
  "iban":              null,   // account feature
  "self_custody":      null,   // custody model
  "mpc":               null,   // custody model
  "yield_bearing":     null,   // earn
  "savings":           null,   // earn
  "lending":           null,   // credit
  "investing":         null,   // wealth
  "treasury":          null,   // business cash mgmt
  "crypto":            null,   // holds/trades crypto
  "stablecoin_native": null    // stablecoin-first product
}
```

| key | type | allowed | provenance |
|---|---|---|---|
| `apple_pay` | bool\|null | true/false/null | **manual** — 0 mentions in prose corpus; must be sourced fresh from provider docs |
| `google_pay` | bool\|null | " | **manual** — same, absent today |
| `api` | bool\|null | " | prose ("api"/"developer" 1 hit) + **manual**; seed `true` from `services` payment tags where doc'd |
| `webhooks` | bool\|null | " | **manual** (dev docs) |
| `oauth` | bool\|null | " | **manual** (dev docs) |
| `sandbox` | bool\|null | " | **manual** (dev docs) |
| `business_accounts` | bool\|null | " | derive `true` from `audience` in {SMB, freelancers, business} and from `card_type` containing "Business"; else **manual** |
| `virtual_cards` | bool\|null | " | derive from `services` ⊇ `virtual-cards` and `card_type` containing "Virtual"; else prose/**manual** |
| `physical_cards` | bool\|null | " | derive from `card_type` containing "physical"/"Debit"/"Prepaid" + `card_network` present; else **manual** (0 clean prose hits) |
| `iban` | bool\|null | " | derive `true` from `services` ⊇ `iban`; prose "iban" 3 hits; else **manual** |
| `self_custody` | bool\|null | " | **derive deterministically** from `custody` ∈ {Self-custodial, MPC self-custodial}; authoritative |
| `mpc` | bool\|null | " | **derive deterministically** from `custody` == "MPC self-custodial"; authoritative |
| `yield_bearing` | bool\|null | " | derive `true` when `yield` non-null; refine with `yield_pct` |
| `savings` | bool\|null | " | prose "savings/vaults" 12 hits + `yield` label scan; else **manual** |
| `lending` | bool\|null | " | prose "lending/credit" 13 hits + `card_type` "credit"/"BNPL"; else **manual** |
| `investing` | bool\|null | " | prose scan (stocks/ETF/brokerage) + **manual** |
| `treasury` | bool\|null | " | prose scan + `audience` business + **manual** |
| `crypto` | bool\|null | " | derive `true` from `category` ∈ {hybrid, web3-native}; refine per docs |
| `stablecoin_native` | bool\|null | " | derive from `stablecoins==true` AND `category`==web3-native; prose "stablecoin" 36 hits; **manual** confirm |

Seeding rule: a booleans that can be *deterministically* derived from an existing
authoritative field (`self_custody`, `mpc`, `crypto`, `yield_bearing`) may be
machine-set at migration time and marked provenance=`derived`. Everything else starts
`null` and is filled by the two-pass process in §4. Heuristic prose extraction may set
a **candidate** value but it is not committed to `data.json` until a human confirms;
until then the key stays `null`.

### 2.2 `stablecoin_tickers` — string[]

Replaces the boolean's information loss. Which stablecoins are actually supported.

- type: `string[] | null` (null = unverified; `[]` = verified none, e.g. a pure fiat bank)
- allowed (controlled): `USDC, USDT, EURC, EURT, PYUSD, DAI, USDe, USDS, FDUSD, USDP, GUSD, RLUSD, other`
- provenance: prose "stablecoin" scan (36 hits) seeds candidates; **manual** confirm against docs. `stablecoins==false` → `[]`.
- keeps `stablecoins` (bool) untouched for back-compat; the bool becomes `tickers!=null && tickers.length>0`.

### 2.3 `fx_markup_pct` — number|null

Extract the numeric rate the audit flagged as "unextracted" inside `fx_markup.markup` prose.

- type: `number | null` (percent, e.g. `0` for interbank/no-markup, `2.75`, `0.5`; null = unverified)
- lives alongside the existing `fx_markup` object; does **not** replace `fx_markup.markup`/`as_of`/`source`
- provenance: **prose extraction** from `fx_markup.markup` (21 have it) with manual review; the object's existing `as_of`/`source` already date it
- semantics note: `0` is a real value (no markup), distinct from `null` (unknown)

### 2.4 `payment_rails` — string[]

Instant/interbank rails supported — powers "banks on FedNow", "SEPA Instant" cuts.

- type: `string[] | null` (null = unverified)
- allowed (controlled): `SEPA, SEPA-Instant, FedNow, ACH, Wire, SWIFT, Pix, UPI, FPS, Interac, PromptPay, SPEI, iDEAL, BLIK, other`
- provenance: **manual** from docs; seed from `region`/`countries` only as a candidate (e.g. EU → SEPA candidate), never auto-committed

### 2.5 `card_networks` — string[]  (normalizes `card_network`)

- type: `string[] | null` (null = unverified; `[]` = no card product)
- allowed: `Visa, Mastercard, Amex, Discover, UnionPay, RuPay, Verve, Mada, Maestro, Interac, other`
- provenance: **deterministic split** of existing `card_network` string on `/` and known combos; the messy tail ("Visa/Amex", "RuPay/UPI") maps cleanly. Fully machine-derivable at migration.
- `card_network==null` → leave `card_networks` null; `card_network=="None"` → `[]`

### 2.6 `card_form` + `card_funding` — string[]  (normalizes `card_type`)

Splits the conflated 55-value free-text `card_type` into orthogonal axes.

- `card_form`: `string[] | null` — allowed `virtual, physical` (null = unverified; `[]` = no card)
- `card_funding`: `string[] | null` — allowed `debit, credit, prepaid, charge, bnpl` (null = unverified)
- provenance: **deterministic parse** of `card_type` (virtual/physical → form; debit/credit/prepaid/BNPL → funding; "Business" → sets `features.business_accounts=true`). One-off tail ("wooden card", "Card + UPI") parsed best-effort, remainder → **manual**.

### 2.7 `cashback_pct` + `yield_pct` — number|null companions

- `cashback_pct`: `number | null` — headline "up to" percent (e.g. `2` for "Up to 2%"; null when the prose is a pure label like "Rewards")
- `yield_pct`: `number | null` — headline APY percent (e.g. `2` for "~2% APY"; null for labels like "Savers")
- provenance: **prose extraction** — only 54/139 `cashback` and 43/200 `yield` carry a %-number; the rest stay null. Prose `cashback`/`yield` strings retained verbatim.
- caveat carried in `meta.field_notes.rates`: these are "up to" and change constantly.

### 2.8 `timeline` — structured event array

Turns founding/funding/launch history into queryable events (powers profile timelines,
"recently launched X", changelog-style feeds).

```jsonc
"timeline": [
  { "date": "2013",       "type": "founded",   "description": "Founded in San Francisco", "source": null, "tags": [] },
  { "date": "2024-03",    "type": "funding",   "description": "Series G, ~$2.3B total",    "source": "https://…", "tags": ["series-g"] },
  { "date": "2025-06",    "type": "launch",    "description": "Launched Apple Pay support","source": "https://…", "tags": ["apple_pay"] }
]
```

- type: `array` of objects; `null`/absent allowed (unverified → omit)
- per-event fields:
  - `date`: string, ISO-ish `YYYY` | `YYYY-MM` | `YYYY-MM-DD` (partial dates allowed)
  - `type`: enum — `founded, funding, launch, license, expansion, milestone, rebrand, shutdown, partnership`
  - `description`: string (≤160 chars, one line)
  - `source`: url | null
  - `tags`: string[] — free but SHOULD reference `features.*` keys or country/region codes for cross-linking
- provenance: seed `founded` → one `founded` event, `funding` prose → `funding` events (**extraction**); everything else **manual**. Dates come from the field, never the build clock (respects the pipeline's git-date rule).

### 2.9 `partners` — infra map object

Powers the `/infra/` map, issuer-concentration benchmarks, "who actually holds the money".

```jsonc
"partners": {
  "issuer":        null,   // card issuer / processor (e.g. "Marqeta", "Stripe Issuing")
  "partner_bank":  null,   // sponsor/BaaS bank holding deposits (e.g. "The Bancorp")
  "treasury":      null,   // treasury/custody provider for reserves
  "identity":      null,   // identity/AML provider
  "kyc_provider":  null,   // KYC vendor (e.g. "Onfido", "Sumsub")
  "card_network":  null    // scalar network for the infra graph; mirror of card_networks primary
}
```

- each value: `string | null` (null = unverified). Multi-valued cases use `"A, B"` or promote to `string[]` in a later phase — phase 1 keeps scalars for simplicity.
- provenance: `partner_bank`/`issuer` seeded by **extraction** from existing `license` prose ("Partner banks (The Bancorp, Stride)") — the license field already names sponsors for 347/368; the rest **manual**.

---

## 3. Backward-compatible migration path

The pipeline audit is the binding constraint: `data.json` is committed source;
`build-pages.mjs` reads `E = data.entities`; CI re-runs all builders and fails on any
`git diff`; flowtest flow 39 requires `/data/` to document **every** `data.json` field
and every `regulation_type` enum value.

### Phase order (each phase is independently shippable and green)

**Phase 0 — freeze + document intent.** This doc. No data change. No code change.

**Phase 1 — additive keys, null-filled.** Add the new keys to `data.json` entities with
`null`/`[]`/`{…:null}` defaults (deterministically derivable ones — `card_networks`,
`card_form`, `card_funding`, `stablecoins→features.self_custody/mpc/crypto`,
`stablecoin_tickers[]` for fiat banks — may be machine-filled in the same pass). Because
every new key defaults to null and no existing key changes, **no generated page changes
byte-for-byte** and reproducibility stays green.
Required companion edits in the *same* commit:
1. `tests/build-pages.mjs` `FIELDS` dictionary (line ~936): add one row per new
   top-level key (`features`, `stablecoin_tickers`, `fx_markup_pct`, `payment_rails`,
   `card_networks`, `card_form`, `card_funding`, `cashback_pct`, `yield_pct`,
   `timeline`, `partners`). Flow 39 asserts `/data/` documents every field — this row
   is mandatory or CI fails.
2. `openapi.json` — add the new properties to the entity schema (already tracked/dirty).
3. `dataset/.staging/*` + CSV/JSONL mirrors regenerate from the derived pipeline; the CSV
   flattener needs new columns for `features.*` (one boolean column each) — extend it so
   the mirror stays a faithful flatten.
4. Leave `export-data.js` (app.js `D/X/V` → data.json) as-is unless the homepage tuple
   grows; new fields live in `X` (extended) not the positional `D`.

**Phase 2 — populate.** Fill nulls per §4 over successive commits. Each commit only
changes `data.json` values (null→concrete) plus any page that renders them. Pages that
render a newly-non-null field will change; that is expected and committed. No schema
change, so no flowtest structural risk beyond the normal count-sync (`sync-counts.mjs`).

**Phase 3 — consume.** New generator code (feature matrix, compare v2, similar-banks)
reads the new keys. New pages/hubs follow the existing seams (HUBS array for cuts;
`urls[]` + sitemap + footer for new sections) and must pass flows 26/28/29/32/39.

**Phase 4 — deprecate (optional, later).** Only after all consumers read the new keys:
retire `card_network`/`card_type` string reads behind a shim, fold `services` into
`features`. Never in the same release as introduction.

### Why the 369 `n/` pages don't break
They break only if a rendered value changes or a required invariant (unique title,
self-canonical, breadcrumb, ≤160-char desc, sitemap membership) is violated. Phase 1
renders nothing new (all nulls) → zero page diff. Phase 2 changes only the profile
body where a field became non-null → title/canonical/breadcrumb/sitemap untouched.
`DATA_MODIFIED` (git date of data.json) restamps `dateModified` on data pages the day
each commit lands — expected and reproducible under full-history CI.

---

## 4. Data-quality / coverage plan

~19 capability booleans × 368 banks. The honest path is two passes, and **null is a
first-class shipped value** — coverage grows over time, it is not a launch blocker.

### Pass A — deterministic derivation (machine, committed immediately)
From existing authoritative fields, no guessing:
- `features.self_custody`, `features.mpc` ← `custody`
- `features.crypto` ← `category` ∈ {hybrid, web3-native}
- `features.yield_bearing` ← `yield` non-null
- `features.iban`, `features.virtual_cards` ← `services` tags (for the 24 tagged)
- `features.business_accounts` ← `audience` ∈ business set OR `card_type`~"Business"
- `card_networks`, `card_form`, `card_funding` ← split of `card_network`/`card_type`
- `stablecoin_tickers=[]` where `stablecoins==false`
- `partners.partner_bank`/`issuer` ← parse of `license`
These land in Phase 1 with provenance `derived`.

### Pass B — heuristic prose-extraction (machine, *candidates only, not committed*)
Scan `note`+`story` (and `fx_markup.markup`) for keyword patterns → propose candidate
values into a **side file** (`dataset/.staging/candidates.json`), never straight into
`data.json`. Known yields per the audit: stablecoin 36, business 31, self-custody 20,
lending 13, savings 12, remittance 9, fx 8. Apple/Google Pay, API/webhooks/oauth/sandbox,
physical cards → ~0 prose signal, so these are **manual-only** from the start.

### Pass C — manual verification (human, commits null→true/false)
A reviewer confirms each candidate against provider docs and sets the committed value,
or sets `false` as a positive "confirmed absent" claim, or leaves `null`. Priority order:
top-by-users banks first (compare/matrix are most valuable there), then by category.
Optional `_verified_at`/`_source` sidecar per bank can date the capability review.

### Surfacing "null = unverified" honestly in the UI
This is a product-integrity requirement, not decoration:
- Feature matrix / compare table render **three distinct states**: `true` → filled
  check (accent), `false` → explicit "no" / empty-circle, `null` → an em-dash `—` with
  `title="not verified"` (mirrors the existing `vs/` table convention where blanks are
  muted `—`). Never collapse `null` into `false`.
- Faceted search: a "has Apple Pay" filter matches `true` only; it must **not** exclude
  `null` as if it were `false` — instead show a "· N unverified" affordance so users
  know coverage is partial.
- A per-page/per-field coverage note reuses the standing disclaimer language:
  "absence is not proof of absence" (already in `meta.field_notes.services`).
- `meta.field_notes` gains entries for `features`, `payment_rails`, `card_networks`,
  and the `_pct` companions restating the tri-state rule.

---

## 5. What each new field group unlocks (downstream features)

| new field group | features it unlocks |
|---|---|
| `features.*` (19 booleans) | **visual feature matrix** (banks × capabilities grid); **faceted search** (checkbox facets: has Apple Pay, has API, business accounts…); **similar-banks** (Jaccard/cosine over the boolean vector); **compare v2** rows; capability hub pages (`/features/apple-pay/`, `/features/api/` as HUBS cuts) |
| `stablecoin_tickers[]` | stablecoin-support matrix & filters (which chains/tokens), "banks that support USDC" cuts, better `stablecoin-cards` page |
| `fx_markup_pct`, `cashback_pct`, `yield_pct` | **numeric benchmarks** (rank/percentile by FX markup, best yield, best cashback); range sliders in faceted search; "cheapest FX" leaderboards; sortable compare |
| `payment_rails[]` | rails facets ("supports FedNow", "SEPA Instant"), country-fit matching, remittance/cross-border cuts |
| `card_networks[]` | clean card-network facet + matrix; network-concentration benchmark |
| `card_form[]` + `card_funding[]` | orthogonal card facets (virtual vs physical, debit vs credit vs BNPL); card comparison matrix |
| `timeline[]` | profile timeline component; "recently launched"/"newly funded" feeds; changelog-style discovery; dated provenance for the semantic index |
| `partners.*` | **infra map** (`/infra/` issuer/sponsor graph); issuer-concentration & partner-bank benchmarks; "who holds the money" trust signals; supply-chain risk cuts |
| all of the above | **semantic search** corpus enrichment — normalized capabilities + rails + partners + timeline give the embedding far more structured signal than v1 prose |

---

## 6. Reference: exact new key names (for other feature designs)

Downstream designs MUST reference these exact keys:

- `features` → `features.apple_pay`, `features.google_pay`, `features.api`,
  `features.webhooks`, `features.oauth`, `features.sandbox`,
  `features.business_accounts`, `features.virtual_cards`, `features.physical_cards`,
  `features.iban`, `features.self_custody`, `features.mpc`, `features.yield_bearing`,
  `features.savings`, `features.lending`, `features.investing`, `features.treasury`,
  `features.crypto`, `features.stablecoin_native`  (each `true|false|null`)
- `stablecoin_tickers`  (`string[]|null`)
- `fx_markup_pct`  (`number|null`)
- `cashback_pct`, `yield_pct`  (`number|null`)
- `payment_rails`  (`string[]|null`)
- `card_networks`  (`string[]|null`)
- `card_form`, `card_funding`  (`string[]|null`)
- `timeline`  (`array of {date,type,description,source,tags}`)
- `partners` → `partners.issuer`, `partners.partner_bank`, `partners.treasury`,
  `partners.identity`, `partners.kyc_provider`, `partners.card_network`  (`string|null`)

Invariant for all consumers: treat `null`/absent as **unverified**, never as `false`
or "not supported". Render it as a distinct third state.
