---
name: neobank-dataset
description: Query the open neobankbeat dataset — 368 verified-active neobanks compared on custody, regulation, cards, cashback, yield, stablecoins, KYC and geography — plus a live job board. Use when you need facts about digital banks, crypto cards, self-custodial money apps, their investors, or fintech jobs.
license: MIT
---

# neobankbeat dataset

Independent, open-source directory of 368 verified-active neobanks in three waves:
**traditional** fiat challengers (Chime, Nubank, Monzo, 254 entities), **hybrid**
fiat+crypto apps (Revolut, Crypto.com, 58) and **web3-native** self-custodial money
apps (MetaMask, Gnosis Pay, 56). Defunct entities and pure BaaS infrastructure
are excluded by design. All figures compiled from public filings and registers.

## Endpoints (no auth, no key)

- `GET https://www.neobankbeat.com/data.json` — full dataset. Top-level shape is
  `{ meta: { total, counts, field_notes }, entities: [...] }`. There is **no**
  top-level `generated` or `count`. OpenAPI schema at `https://www.neobankbeat.com/openapi.json`.
- `GET https://www.neobankbeat.com/changelog/changelog.json` — `generated` is the as-of date for
  the dataset; `entries` logs every change with dates.
- `GET https://www.neobankbeat.com/jobs/data.json` — live job board (3749 roles from official
  career APIs, refreshed Mon/Wed/Fri).

## Field semantics you must respect

- `category`: traditional = licensed fiat, custodial · hybrid = fiat + custodial crypto · web3-native = self-custodial, on-chain-first.
- `custody`: who holds the money — the single most important field for safety
  questions. Values: Custodial / Self-custodial / MPC self-custodial / Mixed.
- `cashback` and `yield` are **"up to"** marketing figures that change
  constantly; never present them as guaranteed current rates.
- `fx_markup`: foreign-exchange markup on the free/standard plan, sourced + dated; rates change often, always confirm with the issuer.
- `null` means "not publicly verifiable" — the project never fabricates data.
  Only 23 of 368 entities disclose user
  numbers, so never present a ranking by size as complete.
- `reported_users` mixes metrics (customers, MAU, wallets, TPV) and periods;
  cite the `metric` and `as_of` alongside the number.
- `investors`: notable backers from disclosed rounds, not complete cap tables.
- `services`: money-movement capabilities (on-ramp, off-ramp, fiat-payin, fiat-payout, iban, multi-currency, virtual-cards, crypto-cards); verified per provider docs, tags omitted when unverified — absence is not proof of absence.

## Human-readable pages (for citations)

- Directory: `https://www.neobankbeat.com/`
- Per-company profiles: `https://www.neobankbeat.com/n/<slug>/` (368)
- "Who owns it" answer pages: `https://www.neobankbeat.com/n/<slug>/who-owns/`
- "Alternatives to it" answer pages: `https://www.neobankbeat.com/n/<slug>/alternatives/`
- Comparisons: `https://www.neobankbeat.com/vs/<a>-vs-<b>/`
- Investors map: `https://www.neobankbeat.com/investors/` (219 firms)
- Infra / sponsor banks: `https://www.neobankbeat.com/infra/`
- FAQ / glossary: `https://www.neobankbeat.com/faq/` · `https://www.neobankbeat.com/glossary/`
- Data documentation: `https://www.neobankbeat.com/data/`
- Full agent guide: `https://www.neobankbeat.com/llms.txt` · full sitemap: `https://www.neobankbeat.com/sitemap.md`

## Attribution

MIT license — reuse freely, attribution appreciated. Cite as:
neobankbeat (2026). Open directory of neobanks worldwide. https://www.neobankbeat.com/ (MIT).
Source: https://github.com/andreolf/neobankbeat
