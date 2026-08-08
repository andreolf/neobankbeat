# Feature Spec — Similar Banks (#6)

_"Neobanks you may also like." Precompute, at build time, the top-N most similar
banks for every one of the 368 entities using a weighted similarity over Schema
v2 fields, and embed the result as a strip on each `/n/<slug>/` profile. Fully
static, deterministic, zero runtime cost._

Status: roadmap / design. Depends on **Schema V2** (see
`docs/roadmap/SCHEMA-V2.md`). Companion to the existing
`/n/<slug>/alternatives/` pages — this spec explains why the two coexist rather
than collapse into one.

---

## 1. Overview & user value

The site already ships one similarity surface: `altPeers()` in
`tests/build-pages.mjs` (line ~180) powers `/n/<slug>/alternatives/`. That
function answers a **substitution** question — "where can I use it, who holds the
money, how is it regulated, who is it for" — and deliberately filters to peers
that **overlap in region** (you can't switch to a bank you can't sign up for).
Reported users are a tiebreak; feature parity is not modelled at all (Schema v1
had no feature vector to model).

"Similar Banks" answers a different, broader question: **"this product's shape —
what it does, how it's built — what else looks like it, anywhere?"** It is the
Netflix "because you watched X" rail, not the "cheaper substitute in your
country" list. Concretely it differs from alternatives on three axes:

| | `/…/alternatives/` (exists) | Similar Banks (this spec) |
|---|---|---|
| Question | best substitute I can actually use | closest product by shape/capability |
| Region gate | **required** overlap | **not** gated (cross-border allowed) |
| Signal | geography + custody + licence + audience | full Schema-v2 **feature vector** + payments + crypto + AI |
| Surface | its own SEO page (369 dirs) | **embedded strip** on the profile, no new URL |
| Intent | commercial ("switch to") | exploratory ("more like this") |

User value: (a) a discovery rail that keeps crawlers and readers moving between
the 368 profiles along capability lines (internal-link equity, dwell time);
(b) it exposes the Schema-v2 feature investment directly ("similar because both
do Apple Pay + IBAN + self-custody"), which the alternatives page can't; (c) it
needs no new indexable pages, so it adds almost nothing to the flowtest surface.

**Design decision: embed, do not add pages.** The task framing is "embedded on
n/ pages." We keep alternatives as the SEO page and make Similar Banks a strip
on the existing profile. This avoids ~368 new titles/canonicals/breadcrumbs
(flow 39), new sitemap rows, and OG images, and sidesteps the "two near-identical
peer pages compete for the same query" cannibalization risk.

---

## 2. Data requirements

### 2.1 Schema V2 fields consumed (all already specified in SCHEMA-V2.md)

The similarity vector is built **only** from verified, structured fields. Every
field below is either a v1 field kept unchanged or a new v2 key — **no new field
is introduced by this feature** (see 2.3).

**Geography** (v1): `active_regions[]`, `countries[]`
**Audience / positioning** (v1): `audience`, `category`
**Custody** (v1): `custody`
**Licensing** (v1): `regulation_type`
**AI** (v1): `ai`
**Features** (v2): the 19 tri-state booleans —
`features.apple_pay`, `features.google_pay`, `features.api`,
`features.webhooks`, `features.oauth`, `features.sandbox`,
`features.business_accounts`, `features.virtual_cards`,
`features.physical_cards`, `features.iban`, `features.self_custody`,
`features.mpc`, `features.yield_bearing`, `features.savings`,
`features.lending`, `features.investing`, `features.treasury`,
`features.crypto`, `features.stablecoin_native`
**Payments** (v2): `payment_rails[]`, `card_networks[]`, `card_form[]`,
`card_funding[]`
**Crypto** (v2): `stablecoin_tickers[]`, plus `features.crypto` /
`features.stablecoin_native` (above), and the v1 `stablecoins` bool as fallback
when tickers are absent

Not used for scoring (too sparse / prose / provenance-only): `timeline[]`,
`partners{}`, `funding`, `note`, `story`, `fx_markup*`, `cashback*`, `yield*`,
`reported_users`, `volume`. `reported_users.value_millions` is used as the
**final tiebreak only** (mirrors `altPeers`), never as a similarity signal — 23
of 368 disclose it, so weighting it warps every list toward the same giants.

### 2.2 The tri-state / unverified rule (load-bearing)

SCHEMA-V2's universal invariant is **`null`/absent = unverified, never
`false`**. The similarity function must honour this, or it will invent
similarity out of missing data:

- A feature comparison only contributes when the field is **non-null on both
  entities**. `null` on either side = the feature is skipped for that pair (it
  is neither a match nor a mismatch).
- The denominator for the features block is the count of **co-known** features
  for that pair, not 19. Two banks that each verified only `apple_pay` and agree
  are not "5% similar on features"; they are 100% similar on the one dimension
  both disclose.
- To stop a single co-known feature from producing a spuriously perfect
  features score, the features block is **confidence-shrunk** by co-known count
  (see 3.3). This is the one place the design must be careful; everything else
  is a straight weighted sum.

### 2.3 New fields needed beyond Schema V2

**None are required.** The feature computes entirely from v2 fields at build
time and writes its output into generated HTML (and an optional JSON artifact,
3.6) — data.json stays the single source of truth and is not mutated.

**Two optional editorial-override keys** (flag as _nice-to-have, not blocking_).
If we ever want to hand-curate a rail, add to the entity object in the app.js `X`
(extended) map, not the positional `D` tuple:

- `sim_pin[]` — array of bank names to force into the top of a given entity's
  similar list (e.g. an obvious peer the vector misses).
- `sim_exclude[]` — array of names to suppress (e.g. a defunct clone).

If added, they must get a `/data/` FIELDS-dictionary row and an `openapi.json`
property like every other v2 key (flow 39), and default to absent → zero page
diff. Recommend **shipping v1 of the feature without them** and adding only if
QA of the generated lists surfaces bad pairs.

---

## 3. The similarity function

Computed once per build, in-process, in `tests/build-pages.mjs`. Pure function
of `data.json`; deterministic; O(368²) ≈ 135k pair evaluations — sub-second.

### 3.1 Shape

`sim(e, x) → number in [0,1]`, a weighted average of per-block sub-scores. Each
block returns a score in `[0,1]` **and** a flag for whether it was computable
(both sides had enough non-null data). Blocks that aren't computable for a pair
are dropped from both numerator and denominator, so the overall score is always
a clean weighted mean over the blocks that actually had data — never diluted by
one bank's missing fields.

```
sim(e,x) = Σ_b  w_b · score_b(e,x)   /   Σ_b  w_b        (only over computable b)
```

### 3.2 Blocks, weights, and per-block scoring

Weights are the **relative importance of each capability dimension** and are the
main tuning knob. Proposed defaults (sum = 100, expressed as points; normalized
by the denominator above):

| block | weight | score_b(e,x) definition |
|---|---:|---|
| **features** | 26 | shrunk Jaccard/agreement over co-known tri-state features (3.3) |
| **category** | 12 | 1 if `category` equal else 0 (traditional / hybrid / web3-native) |
| **custody** | 12 | 1 if `custody` equal; 0.5 if both self-custodial-family (Self-custodial / MPC self-custodial) but not identical; else 0 |
| **payments** | 12 | mean of Jaccard(`card_networks`), Jaccard(`card_form`), Jaccard(`card_funding`), Jaccard(`payment_rails`) over the arrays present on both |
| **audience** | 10 | 1 if equal; but if both == `general`, only 0.4 (general is the mode, weak signal); else 0 |
| **regulation_type** | 8 | 1 if equal else 0 (11-value clean enum) |
| **crypto** | 8 | mean of: agreement on `features.crypto`, agreement on `features.stablecoin_native`, Jaccard(`stablecoin_tickers`); falls back to `stablecoins` bool agreement when tickers absent |
| **geography** | 8 | `5·Jaccard(active_regions) + 2·Jaccard(countries)` normalized to [0,1]; **note: not a gate here** (unlike alternatives) — geography is one weak block so cross-border twins can still surface |
| **ai** | 4 | 1 if both have the same non-null `ai` value; 0 if both non-null and differ; block **non-computable** if either `ai` absent (67/368 have it) |

Rationale for the ranking: features is the whole point of Schema v2, so it
dominates. Category + custody + regulation + audience are the structural
"what kind of thing is this" axes (also the ones `altPeers` already trusts).
Payments and crypto are the concrete capability axes v2 unlocked. Geography is
demoted to a weak signal (the opposite of alternatives) so that, e.g., Nubank
surfaces Chime-shaped peers globally rather than only Latin-American ones. AI is
a small bonus that only fires when both disclose it.

### 3.3 Features block (the careful part)

For the pair `(e,x)`, let `K` = set of the 19 features that are **non-null on
both**. If `|K| == 0`, the features block is **non-computable** (dropped). Else:

```
agree   = count of f in K where e.features[f] === x.features[f]
raw     = agree / |K|
shrink  = |K| / (|K| + k0)          // k0 = 3, confidence shrink toward 0.5
score_features = 0.5 + (raw − 0.5) · shrink
```

`k0 = 3` means a pair with only 1–2 co-known features is pulled toward the
neutral 0.5 (we don't trust it), while a pair co-knowing 8+ features gets nearly
its raw agreement. This is the standard Bayesian-shrinkage trick and keeps sparse
early-migration data (Schema-v2 Pass B/C is phased) from producing garbage twins.

Optionally weight `positive` agreement (both `true`) above `negative` agreement
(both `false`) — sharing Apple Pay is a stronger signal than both lacking
lending. v1: treat them equally (simpler, still sound); revisit if lists look
dominated by feature-poor banks clustering on shared `false`s.

### 3.4 Jaccard helper

Reuse the existing `jac()` closure inside `altPeers` (identical semantics:
intersection / union, 0 when either set empty). Factor it to a module-level
`jac()` so both `altPeers` and `simPeers` share it (DRY; no behaviour change to
alternatives).

### 3.5 Ranking, tiebreaks, self-exclusion

```
simPeers(e, n = 6):
  candidates = E.filter(x => x !== e)
  score each with sim(e,x)
  drop x where sim < SIM_FLOOR (default 0.12 — avoids "similar" strips of noise)
  apply sim_exclude / sim_pin if present (3 / 2.3)
  sort by sim desc,
          then reported_users.value_millions desc (tiebreak, like altPeers),
          then name.localeCompare (stable, deterministic)
  return top n
```

`SIM_FLOOR` guarantees we never render a rail of unrelated banks for a weird
outlier; if fewer than 3 clear the floor, **render no strip** for that entity
(same eligibility pattern as `altEligible`). Determinism: the final
`localeCompare` tiebreak makes output byte-stable across machines (required by
the reproducibility job — see 5).

### 3.6 Optional machine artifact

Emit `/n/<slug>/similar.json` (or one bundled `/data/similar.json` keyed by
slug) listing `[{name, slug, score}]` per bank — cheap, deterministic, and
useful for the agent/LLM parallel surface (`llms-full.txt`, `data.json`
already advertise machine data). If emitted it must be added to the `urls`/
sitemap accumulators and, for the bundled form, documented on `/data/`. Recommend
**bundled `/data/similar.json`** (one file, one sitemap row) over 368 tiny files.
Ship this in a follow-up; the HTML strip is the MVP.

---

## 4. Page / URL structure & the generator seam

**No new URLs.** Everything renders into the existing profile page
`/n/<slug>/index.html`.

### 4.1 The seam

The profile page is generated in the `E.forEach` profile block of
`tests/build-pages.mjs` (the same block that already emits the
`<a href="/n/${slug}/alternatives/">…alternatives</a>` cross-link at line
~759). The change:

1. Add module-level `jac()` (factored out of `altPeers`) and a new
   `simPeers(e, n)` + `sim(e, x)` next to `altPeers` (~line 180). Precompute
   once: `const SIM = new Map(E.map(e => [e.name, simPeers(e, 6)]));` before the
   profile loop, so each profile is an O(1) lookup and any future consumer
   (vs pages, `/data/similar.json`) reuses the same map.
2. In the profile template, inject a **"Similar banks" section** (markup in 4.2)
   after the facts table / investors block and before the `.subscribe` block,
   only when `SIM.get(e.name).length >= 3`.
3. No `HUBS`/`fam()` involvement (that seam is for new directories). No new
   entry in the `urls[]` array, no sitemap change (unless 3.6 artifact is
   shipped). No `footer.mjs` nav change (it's an on-page rail, not a section).

### 4.2 Markup & design language (from the UX audit)

Reuse the existing profile card vocabulary; do **not** invent components. The
strip is a compact grid of peer cards, matching the `.chip` T/H/W triad and mono
labels:

```html
<h2>Similar neobanks</h2>
<p class="meta">Closest matches to <b>{name}</b> by product shape — features,
custody, payments and licensing across the 368-bank dataset. Similarity from
verified fields only; unverified fields are ignored, not counted against a bank.
Not a ranking or an endorsement.</p>
<ul class="simgrid">
  <li class="simcard">
    <a href="/n/{peerSlug}/">
      <span class="logo-box"><img loading="lazy" alt=""
        src="https://www.google.com/s2/favicons?domain={peerDomain}&sz=64"
        onerror="…initial fallback…"></span>
      <span class="cname">{peerName}</span>
      <span class="chip {t|h|w}">{category}</span>
      <span class="simwhy">shared: Apple Pay · IBAN · self-custody</span>
    </a>
  </li>
  …6 items…
</ul>
```

- **`simwhy` line** = the top 2–3 human-readable reasons this peer scored, drawn
  from the highest-contributing blocks (shared category / same custody / shared
  features via the `SVLABEL`/`AITAG`-style label maps already in the file). This
  is the "because you watched X" explanation and the feature's differentiator vs
  the alternatives page. Reasons are computed from the same `sim()` internals,
  so they never contradict the score.
- Colours/typography: `--accent` for the single hover/link accent, mono for the
  `chip`/`simwhy` micro-labels, Space Grotesk for names — all existing tokens.
  Add a small `.simgrid`/`.simcard` block to `blog/blog.css` (the shared
  sub-page stylesheet), or a page-local `<style>` if we want to keep it scoped
  (country pages already precedent page-local styles). Prefer `blog.css`
  (single source, reused by any future consumer).
- Respect `body.bw` (uses the same vars, so it inherits for free).
- Wire `nbevt('similar_click', {from, to})` on the card links (analytics
  convention; every interaction fires `nbevt`).
- **Cross-link both ways with alternatives**: where a bank has both an
  alternatives page and a similar strip, the strip footer adds
  `<p class="meta">Looking for a substitute you can use today? See {name}
  alternatives →</p>` pointing to `/n/{slug}/alternatives/`. Clarifies the two
  surfaces to the reader and to crawlers.

---

## 5. SEO / schema.org / how it passes flowtest & CI

Because the feature adds no page, most of the 39-flow surface is untouched. The
concrete obligations:

- **Flow 28 (every internal href resolves):** all `simcard` links point to
  `/n/{peerSlug}/`, which always exists (peers are drawn from `E`). Safe by
  construction.
- **Flow 29 (meta desc ≤160, one canonical, og:image resolves):** unchanged —
  we edit page **body**, not `<head>`. Do **not** touch title/description/
  canonical, so flow 39's "no two indexable pages share a title" and
  "canonical == own URL" stay green.
- **Flow 39 (JSON-LD parses, each node typed; ItemList numberOfItems == count):**
  Two options for the strip's structured data:
  - **(a, recommended for MVP) add no JSON-LD** for the strip. It's an on-page
    discovery rail of internal links; the profile's existing `@graph`
    (`WebPage` + `Organization` + `FAQPage` + `BreadcrumbList`) is untouched and
    keeps passing. Lowest risk.
  - **(b, follow-up) add an `ItemList` node** ("Similar neobanks") to the
    profile `@graph`. If we do, `numberOfItems` **must** equal the rendered
    `<li>` count exactly (flow 39 asserts this) and every `ListItem` needs
    `position`+`name`+`url`. The alternatives page already does exactly this
    (`ItemList` with positioned items) — copy that pattern verbatim.
- **Flow 33–38 (a11y):** `<h2>` heading in document order; the strip is a
  `<ul>`; images have `alt=""` (decorative, name is text); links are real `<a>`;
  colour contrast uses existing AA-passing tokens; no new `<th>` (not a table)
  so the `scope` rule (37) is N/A. Keyboard operability is free (native links).
- **Flow 26 / 27 / 31 / 32:** untouched (no hub, no nav/footer change, no
  homepage markup-size change, no new sub-`/` page needing a breadcrumb).
- **Flow 30 / sync-counts:** the strip prose says "the 368-bank dataset" — that
  `368`/`3xx` literal must be anchored in `sync-counts.mjs` `RULES` (or phrased
  without a hardcoded total, e.g. "across the full dataset") to avoid the
  stale-total heuristic. Prefer the count-free phrasing in generated markup so
  we don't add a sync rule for it. Any count we do print should come from
  `E.length` at build time, not a literal.
- **Reproducibility job (test.yml:56-67 — the real gate):** the strip changes
  the bytes of every profile page, and those bytes are a **pure function of
  data.json** (deterministic `sim()` + `localeCompare` tiebreak, no clock, no
  network, no random). So: run `build-pages.mjs`, commit the regenerated
  `/n/**` pages, and `git diff` stays empty in CI. **This is the one operational
  cost** — the alternatives precedent already regenerates these dirs, so the
  workflow chain (`rebuild.yml` daily + reproducibility check) absorbs it with
  no new plumbing. The daily `rebuild.yml` keeps strips fresh as data.json
  changes; no separate cron (unlike `build-jobs.mjs`, this hits no live API).

### 5.1 How it stays in sync when data changes

Single mechanism, already load-bearing on the site: **the strip is regenerated
from data.json on every build.** There is no stored/cached similarity table to
drift. When a Schema-v2 field is populated (Pass B/C), the next `build-pages.mjs`
run recomputes every list; `rebuild.yml` runs that daily and commits diffs; the
reproducibility job fails any PR that edited data.json but forgot to rebuild.
Determinism (§3.5) guarantees the same input → same bytes, so "in sync" is
enforced by CI, not by discipline.

---

## 6. Effort estimate — **M** (≈2.5–4 dev-days once Schema V2 data exists)

| task | size |
|---|---|
| Factor `jac()` to module scope; add `sim()` + block scorers + shrinkage | S (0.5d) |
| `simPeers()` + `SIM` precompute map + floor/eligibility + tiebreaks | S (0.5d) |
| `simwhy` reason extraction (reuse `SVLABEL`/`AITAG` label maps) | S (0.5d) |
| Profile-template strip markup + `.simgrid`/`.simcard` CSS in `blog.css` + `bw` check | M (0.5–1d) |
| Weight/floor tuning + eyeball QA across ~30 diverse banks (giants, web3, SMB, single-market) to catch bad twins | M (0.5–1d) |
| Optional `/data/similar.json` + `/data/` doc row + sitemap (follow-up) | S (0.5d) |
| Commit regenerated `/n/**`, green the reproducibility job locally, flowtest pass | S (0.25d) |

Effort is dominated by **tuning/QA**, not code — the alternatives function is a
working template, so the machinery is low-risk; getting weights that produce
non-embarrassing lists is the real work. If shipped **before** Schema-v2 Pass
B/C populates features, the feature degrades gracefully (features/payments/crypto
blocks become non-computable for most pairs and it falls back to the same
signals `altPeers` uses) — so it can ship as **S** on v1 data and improve for
free as v2 coverage lands.

---

## 7. Dependencies

- **Hard: Schema V2** — the whole value proposition is similarity over the v2
  feature/payments/crypto vector (`features.*`, `payment_rails`, `card_networks`,
  `card_form`, `card_funding`, `stablecoin_tickers`). Without it, this is just a
  rename of `altPeers` and not worth building. Specifically it needs **Schema-v2
  Phase 1** (keys exist, null-defaulted) to run at all, and **Phase 2** (nulls
  populated by Pass A/B/C) to produce good lists. Phase 1 alone → correct but
  thin (falls back to v1 structural signals).
- **Hard: none beyond that.** No new schema field is required (§2.3). No runtime
  JS, no new workflow, no live API.
- **Soft: `/data/` dictionary + `openapi.json`** only if the optional
  `sim_pin`/`sim_exclude` overrides or the `/data/similar.json` artifact are
  shipped (both flag-gated as follow-ups).
- Reuses existing infra: `slugs` map, `E`, `jac`, `SVLABEL`/`AITAG` label maps,
  `blog.css` tokens, `nbevt`, the reproducibility/`rebuild.yml` chain.

---

## 8. Top risks

1. **Bad twins from sparse tri-state data (highest).** Early in Schema-v2
   rollout, most `features.*` are `null`. Without the co-known-only rule (§2.2)
   and shrinkage (§3.3), banks would cluster on accidental agreement (or on
   shared `false`s / shared missingness) and the strip would show nonsense. The
   shrink `k0` and `SIM_FLOOR` are the guardrails; they need real QA against
   populated data, and the "render nothing if <3 clear the floor" escape hatch
   must be honoured.
2. **Cannibalizing / confusing overlap with `/alternatives/`.** Two peer
   surfaces on one profile can look redundant to users and to Google. Mitigation:
   the explicit region-gated-vs-shape framing (§1), the cross-link (§4.2), and
   keeping Similar Banks page-less (no competing URL). If QA shows the two lists
   are ~identical for most banks, reconsider whether the extra rail earns its
   place — or feed the shape-similarity into the alternatives ranking instead.
3. **Reproducibility churn.** The strip makes every profile's bytes depend on the
   whole dataset, so a single new data.json row can re-sort strips across many
   pages, producing large `git diff`s on unrelated profiles and noisy PRs. It's
   correct and CI-safe, but reviewers may be surprised by "why did editing Chime
   change 40 other pages?" Mitigation: document the behaviour; the daily
   `rebuild.yml` already absorbs it. (Determinism itself is not at risk given the
   `localeCompare` final tiebreak — but any accidental non-determinism, e.g.
   `Object.keys` order over `features`, would break the reproducibility job, so
   iterate features in a fixed declared order.)
4. **Weight subjectivity.** The 9 block weights are judgement calls; there's no
   ground-truth "similar" label to fit against. Risk of endless bikeshedding.
   Mitigation: ship the §3.2 defaults, treat them as config constants at the top
   of the sim code, and only retune on concrete bad-list evidence from QA.
