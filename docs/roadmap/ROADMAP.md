# neobankbeat — Product Roadmap

*Synthesis of the Schema V2 and feature specs in this directory into one executable, phased plan.*

Companion specs (read alongside this doc):
[SCHEMA-V2.md](./SCHEMA-V2.md) ·
[FEATURE-compare.md](./FEATURE-compare.md) ·
[FEATURE-similar.md](./FEATURE-similar.md) ·
[FEATURE-search.md](./FEATURE-search.md) ·
[FEATURE-api-mcp.md](./FEATURE-api-mcp.md) ·
[FEATURE-i18n.md](./FEATURE-i18n.md)

---

## 1. Strategic framing

neobankbeat is a **static-first** site: every page is generated at build time from a single
368-row `data.json`, shipped as flat files, with **zero backend and zero runtime API cost**.
That constraint is not a limitation — it is the moat. A 368-entity dataset is small enough to
fully precompute, embed, index, and even vector-search *on the client*, so we get "app-like"
features (compare grids, similarity strips, semantic search, a public API, an MCP server) with
the operating cost, reproducibility, and trust profile of a static document. The build is
gated by a `git diff` reproducibility check and 39 flowtest flows; nondeterminism is the enemy,
not scale. **The single biggest unlock is the schema, not any one feature.** Today's data is
prose-heavy and lossy; almost every roadmap feature consumes the same new typed fields
(`features.*`, normalized card/rail arrays, numeric companions, `partners{}`). Populating
[Schema V2](./SCHEMA-V2.md) makes all of them good at once. So: **do the schema first, ship the
cheapest high-leverage consumer (Compare) second, and defer anything that needs a stateful
backend.**

---

## 2. Dependency graph

```
                          ┌───────────────────────────────┐
                          │   SCHEMA V2  (SCHEMA-V2.md)    │  ← ROOT UNLOCK
                          │  Phase 1: keys exist (null)    │
                          │  Phase 2: keys populated       │
                          └───────────────────────────────┘
                                        │
        ┌──────────────┬───────────────┼───────────────┬────────────────┐
        │              │               │               │                │
        ▼              ▼               ▼               ▼                ▼
   ┌─────────┐   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
   │ COMPARE │   │ SIMILAR  │    │  SEARCH  │    │ API+MCP  │    │   i18n    │
   │  (#3+   │   │  banks   │    │   (#1)   │    │ (#5+#25) │    │   (#2)    │
   │  #20)   │   │  (#6)    │    │          │    │          │    │           │
   └─────────┘   └──────────┘    └──────────┘    └──────────┘    └───────────┘
   hard-dep      hard-dep        SOFT-dep        SOFT-dep         hard-dep
   P1 build      P1 build        (ships on v1,   (ships on v1,    (renders V2
   P2 useful     P2 good lists   better on V2)   better on V2)    fields; needs
        │                                             │            locale refactor)
        │ needs +2 fields:                            │ needs +1 field:
        │  features.cash_withdrawals                  │  persisted `slug`
        │  monthly_fee{}                              │  (extract tests/slug.mjs)
        ▼                                             ▼
   both additive/null-default,                   shared slug.mjs feeds
   inherit V2 reproducibility                    both API + i18n URL layers
```

Legend:
- **hard-dep** — cannot ship (or is useless) before the dependency.
- **soft-dep** — ships on v1 data today; materially improves as V2 populates.
- **Phase 1 (P1)** = keys exist, null-defaulted. **Phase 2 (P2)** = nulls populated.

Notes that fall out of the graph:
- **Compare and Similar are the only two features with a hard V2 build-dependency** and both
  are gated on V2 *coverage* (Phase 2) for usefulness, not just key existence.
- **Compare needs two net-new fields** beyond V2 (`features.cash_withdrawals`, `monthly_fee{}`) —
  both additive/null-default, so fold them into the Schema V2 Phase 1 migration and get them for free.
- **API+MCP needs one net-new data requirement**: a persisted per-entity `slug`. The right move
  is to extract a shared `tests/slug.mjs` now (used by both page builders) and persist `slug`
  into `data.json` during the V2 Phase 1 additive migration. **i18n's URL layer wants the same
  stable slug**, so this single refactor de-risks two features.
- **Search and API are the safe early wins** — no hard V2 dependency, so they can run in
  parallel with V2 population and hedge schedule risk.
- **i18n is the terminal node** — it renders everything else and multiplies build cost 11×;
  it should be last and pilot-gated.

---

## 3. Phased sequence

Effort key: **S** ≈ ≤2 days · **M** ≈ 3–7 days · **L** ≈ 8+ days / multi-phase.

### Phase 0 — Schema V2 foundation *(do this first, no exceptions)*
- **Ships:** [Schema V2](./SCHEMA-V2.md) Phase 1 — all new keys added to `data.json`,
  null-defaulted, with deterministically-derivable ones machine-filled (Pass A from
  `custody`/`category`/`card_network`/`card_type`/`services`/`license`); the mandatory `/data/`
  FIELDS-dictionary row + `openapi.json` property per new key. **Bundle in the two Compare
  fields** (`features.cash_withdrawals`, `monthly_fee{}`) and **extract `tests/slug.mjs` +
  persist `slug`** while the additive migration is open.
- **Why now:** it is the root of the dependency graph; every downstream feature reads these keys.
  Because everything defaults to `null`, **zero generated pages change byte-for-byte** →
  reproducibility holds and all 39 flowtest flows stay green. Cheapest possible time to add fields.
- **Effort:** **M** (migration + dictionary/openapi rows + slug extraction).
- **Unlocks:** the ability to *build* Compare and Similar; the ability to *improve* Search and API.
- **Refs:** [SCHEMA-V2.md](./SCHEMA-V2.md), fields for Compare in [FEATURE-compare.md §2.2](./FEATURE-compare.md),
  slug requirement in [FEATURE-api-mcp.md](./FEATURE-api-mcp.md).

### Phase 1 — Data population *(the real work; runs continuously, overlaps everything after)*
- **Ships:** [Schema V2](./SCHEMA-V2.md) Phase 2 — fill nulls via Pass B (heuristic prose
  extraction into a **candidates side-file**, never straight to `data.json`) → Pass C (manual
  human confirmation). Prioritize the **core Compare columns** (apple_pay, google_pay, iban, api,
  business_accounts, virtual/physical cards) for the **top ~50–100 banks** first.
- **Why now:** every feature's *usefulness* — not its code — is gated on coverage. This is the
  bottleneck; start it the moment Phase 0 lands and let it run in the background of Phases 2–5.
- **Effort:** **L** (ongoing manual/editorial; the long pole of the whole roadmap).
- **Unlocks:** Compare/Similar go from "wall of em-dashes" to genuinely useful.
- **Refs:** [SCHEMA-V2.md §4](./SCHEMA-V2.md) (Pass A/B/C coverage plan).

### Phase 2 — Compare Mode + Visual Feature Matrix (#3, #20) *(first flagship consumer)*
- **Ships:** capability-matrix renderer (shared, pure helper) injected into `/vs/` pages;
  new `/compare/` section (index + curated static N-bank set pages + client-side `#slug,slug`
  fragment for arbitrary sets); full `/features/` matrix page; CSV Blob export + print-to-PDF.
- **Why now:** highest-leverage *visible* payoff from V2, and it directly showcases the new data.
  Plugs into the documented `/ai/`-style new-section seam in `build-pages.mjs` — no new workflow.
- **Effort:** **M** (~4–7 days; +1–2 if `monthly_fee`/`cash_withdrawals` need manual fill).
- **Gate:** launch `/features/` and `/compare/` only once core columns are populated for the top
  ~50–100 banks; default to a **"verified only" view** with per-column "N of M verified" counts so
  sparse data reads as transparency, not breakage. Enforce **`null` never renders as `✗`**.
- **Unlocks:** the matrix renderer + `/compare/` slugs are reused by Search facets and the API.
- **Refs:** [FEATURE-compare.md](./FEATURE-compare.md).

### Phase 3 — Similar Banks (#6) *(cheap, page-less multiplier)*
- **Ships:** build-time "you may also like" strip on every `/n/<slug>/` profile, from a 9-block
  weighted similarity over V2 fields. No new URLs, no runtime JS, reuses `altPeers`/`rebuild.yml`.
- **Why now:** near-zero marginal cost once V2 is populated, and it raises engagement on the 369
  highest-traffic pages. Naturally follows Compare (same field consumption, same reproducibility machinery).
- **Effort:** **M** (~2.5–4 days, dominated by weight tuning + QA; **S** if shipped early on v1 data).
- **Gate:** co-known-only comparison, Bayesian shrinkage (`k0=3`), a `SIM_FLOOR`, and "render
  nothing if <3 peers clear the floor" — all QA'd against *populated* data to avoid bad twins.
- **Unlocks:** internal-linking / SEO lift; no downstream code dependency.
- **Refs:** [FEATURE-similar.md](./FEATURE-similar.md).

### Phase 4 — Static Semantic Search (#1) + Public API & MCP (#5, #25) *(parallelizable; V2-soft)*
- **Ships:**
  - **Search:** client-side hybrid BM25 + precomputed MiniLM vectors + query→facet search over
    368 banks; new `/search/` section; zero backend.
  - **API+MCP:** static `/api/*` JSON surface (slim list / paginated / facet shards + full
    per-entity + search index, CORS'd) built via `tests/build-agents.mjs`; then the
    `@neobankbeat/mcp` stdio package (`search_banks`/`get_bank`/`compare_banks`/`similar_banks`)
    that fetches the static API at runtime so it auto-syncs.
- **Why now:** both are **soft-dep** — they ship on v1 data and improve as V2 populates, so they
  can run in parallel with Phase 1 population and de-risk the schedule. They also expose the V2
  investment to machines (agents, MCP clients) and to power users.
- **Effort:** Search **M** (~5–8 days). API+MCP **L** (M for static API + M for MCP package; 3 phases).
- **Gate — reproducibility:** Search's `vectors.bin`/`index.json` must be **byte-identical** across
  runs → pinned model revision, vendored/locked int8 weights (no build-time network fetch),
  `build_date` from git `DATA_MODIFIED` not wall clock, `--check` mode. API depends on the
  persisted `slug` from Phase 0.
- **Unlocks:** search index + API shards are consumed by the MCP server and can back Compare's
  client-side arbitrary-set resolution.
- **Refs:** [FEATURE-search.md](./FEATURE-search.md), [FEATURE-api-mcp.md](./FEATURE-api-mcp.md).

### Phase 5 — Multilingual SEO (#2) *(last; pilot-gated, expansion earns its way)*
- **Ships:** DE-only pilot first — localized page projection at path-prefix URLs (`/de/n/revolut/`
  + `/de/revolut` alias), auto hreflang, localized metadata/OG/JSON-LD, **metadata + templated-prose
  tiers only** (finite enums/templates, human-reviewed locked glossary, MT-honesty banner). No
  freeform per-bank prose.
- **Why now:** it renders *every* V2 field, so it should follow population; it 11×'s build size and
  carries real quality risk, so it goes last and only after the data it displays is trustworthy.
- **Effort:** **L** overall; the DE pilot is a de-risked **M**. Requires a locale-parameterization
  refactor of the 156 KB `build-pages.mjs` with **`en` output byte-identical** (reproducibility gate).
- **Gate:** **do not commit the full 368×11 build.** Ship DE-only; expand to further locales *only*
  on measured Search Console organic lift. A bad MT build is worse than not shipping.
- **Unlocks:** international organic reach — but is a leaf node; nothing depends on it.
- **Refs:** [FEATURE-i18n.md](./FEATURE-i18n.md).

---

## 4. Tiering — all 25 vision items get a home

Four tiers by *architecture*, not priority:
**A** static-buildable-now · **B** static + client-compute · **C** build-time i18n ·
**D** needs-backend / defer.

The seven items with `#` numbers below are the ones fully specced in this directory; the
remainder are reconstructed from the product vision and slotted by architecture so nothing is
orphaned. Exact vision numbering for un-specced items may differ — the **tier** is the decision.

| # | Vision item | Tier | Where it lives |
|---|---|---|---|
| 1 | **Static semantic search** | B | [FEATURE-search.md](./FEATURE-search.md) — Phase 4 |
| 2 | **Multilingual SEO / i18n** | C | [FEATURE-i18n.md](./FEATURE-i18n.md) — Phase 5 |
| 3 | **Compare mode** | B | [FEATURE-compare.md](./FEATURE-compare.md) — Phase 2 |
| 4 | Faceted filtering / advanced facets | A | Schema V2 `features.*` + build-time facet pages |
| 5 | **Public REST API** | A | [FEATURE-api-mcp.md](./FEATURE-api-mcp.md) — Phase 4 |
| 6 | **Similar / "you may also like" banks** | A | [FEATURE-similar.md](./FEATURE-similar.md) — Phase 3 |
| 7 | Infra / partner map explorer | A | Schema V2 `partners{}` → static `/infra/` pages |
| 8 | Timeline / history per bank | A | Schema V2 `timeline[]` → build-time render on `/n/` |
| 9 | License / regulation explorer | A | existing `license` + `/regulation/` static pages |
| 10 | Geographic map & country pages | A | existing `/countries/` + map (already static) |
| 11 | Stablecoin / ticker filter pages | A | Schema V2 `stablecoin_tickers[]` → static facet pages |
| 12 | Fee / FX / yield ranking tables | A | Schema V2 numeric companions → sorted static tables |
| 13 | Data export / download (CSV/JSON) | B | client-side Blob export (Compare pattern) + `data.json` |
| 14 | Embeddable badge / widget | B | static SVG/iframe snippet, no backend |
| 15 | Monthly report / dataset snapshots | A | already shipping (`/report/`), generated from `data.json` |
| 16 | Glossary / education pages | A | existing `/glossary/` static pages |
| 17 | RSS / changelog feeds | A | build-time feed from `timeline[]` + git history |
| 18 | Recommendation quiz / "find my bank" | B | client-side scoring over `features.*`, no state |
| 19 | Card-network / rails filter pages | A | Schema V2 `card_networks[]`/`payment_rails[]` facets |
| 20 | **Visual feature matrix** | B | [FEATURE-compare.md](./FEATURE-compare.md) — Phase 2 |
| 21 | User reviews / ratings | **D** | needs user accounts + moderation + DB — defer |
| 22 | Live metrics / uptime / price tickers | **D** | needs polling infra + stateful store — defer |
| 23 | Alerts / watchlists / notifications | **D** | needs accounts + delivery + cron — defer |
| 24 | Community submissions / crowdsourcing | **D** | needs auth + moderation queue — use PRs instead |
| 25 | **MCP server** | A | [FEATURE-api-mcp.md](./FEATURE-api-mcp.md) — Phase 4 (package, not site) |

Everything in tiers **A/B/C** is compatible with the static-first moat and lands in Phases 0–5.
Everything in tier **D** is called out explicitly below.

---

## 5. Cut / defer — what we deliberately do NOT do soon

These break the no-backend moat: they require a stateful store, authenticated users, background
jobs, or on-call ops. Each would convert neobankbeat from a reproducible static document into a
service with uptime, abuse-surface, privacy, and maintenance obligations. **Defer all of them
until there is a proven demand signal that justifies standing up a backend** — and even then,
prefer the static-compatible substitute.

- **User reviews / ratings (#21)** — needs accounts, moderation, spam/defamation liability, and a
  write path into a DB. Static substitute: none; keep the dataset editorial and cite sources.
- **Live metrics / uptime / price tickers (#22)** — needs continuous polling + a time-series store;
  destroys build reproducibility (values change every run). Static substitute: the monthly
  `/report/` snapshots and `timeline[]` events, dated from git.
- **Alerts / watchlists / notifications (#23)** — needs user accounts, stored preferences, a
  delivery channel, and cron. Static substitute: the existing newsletter + RSS/changelog feeds (#17).
- **Community submissions / crowdsourcing (#24)** — needs auth + a moderation queue. Static
  substitute: **GitHub PRs against `data.json`** — already the contribution path (`CONTRIBUTING.md`).
- **GraphQL / dynamic query API** — static hosting cannot do arbitrary server-side filtering;
  a serverless function would break the deterministic-build/reproducibility guarantee. Static
  substitute: pre-generated single-facet shards + the search index + **client/MCP-side in-memory
  filtering** (documented plainly in [FEATURE-api-mcp.md](./FEATURE-api-mcp.md)). Explicitly reject
  serverless functions for query filtering.

Rule of thumb: **if a feature's output changes without a `data.json` change, it does not belong in
the static build.** Route it to the newsletter, the report, or a PR — not to a server.

---

## 6. Start here

**Recommendation: Schema V2 first, Compare second.** They are the root unlock and its cheapest,
most visible consumer. Concretely:

> **First PR-sized task — "Schema V2 Phase 1: additive keys + slug extraction."**
> In one branch:
> 1. Extract `tests/slug.mjs` as the single shared slug function (used by both page builders today),
>    and persist a `slug` field onto every `data.json` entity via the additive migration.
> 2. Add all Schema V2 keys to `data.json` **null-defaulted**, machine-filling only the Pass A
>    deterministically-derivable ones — **plus** the two Compare fields (`features.cash_withdrawals`,
>    `monthly_fee{}`) so they ride the same additive wave.
> 3. Add the mandatory `/data/` FIELDS-dictionary row **and** `openapi.json` property for every new key.
> 4. Verify the reproducibility gate: **zero page bytes change** (everything is `null`), all 39
>    flowtest flows green, `git diff` on generated pages is empty.
>
> This PR ships no user-visible change on purpose — it is the safe, reversible foundation that every
> other feature builds on. The very next PR starts Pass B/C population of the core Compare columns
> for the top ~50–100 banks, at which point [FEATURE-compare.md](./FEATURE-compare.md) can begin.

Total rough effort across Phases 0–5: **~1 M (schema) + ongoing L (population) + ~2 M + 1 M/S +
1 M + 1 L (search+api+mcp) + 1 L (i18n)** — call it **one focused quarter to a strong static core
(Phases 0–4), with i18n as a following-quarter, pilot-gated bet.**
