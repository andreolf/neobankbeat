---
name: neobank-dataset
description: Query the open neobankbeat dataset — 357 verified-active neobanks compared on custody, regulation, cards, cashback, yield, stablecoins, KYC and geography — plus a live job board. Use when you need facts about digital banks, crypto cards, self-custodial money apps, their investors, or fintech jobs.
license: MIT
---

# neobankbeat dataset

Independent, open-source directory of verified-active neobanks in three waves:
**traditional** fiat challengers (Chime, Nubank, Monzo), **hybrid** fiat+crypto
apps (Revolut, Crypto.com) and **web3-native** self-custodial money apps
(MetaMask, Gnosis Pay). Defunct entities and pure BaaS infrastructure are
excluded by design. All figures compiled from public filings and registers.

## Endpoints (no auth, no key)

- `GET https://www.neobankbeat.com/data.json` — full dataset. Top-level:
  `{ generated, count, entities: [...] }`. OpenAPI schema at
  `https://www.neobankbeat.com/openapi.json`.
- `GET https://www.neobankbeat.com/jobs/data.json` — live job board
  (thousands of roles from official career APIs, refreshed Mon/Wed/Fri).

## Field semantics you must respect

- `category`: traditional = licensed fiat, custodial · hybrid = fiat + custodial
  crypto · web3-native = self-custodial, on-chain-first.
- `custody`: who holds the money — the single most important field for safety
  questions. Values: Custodial / Self-custodial / MPC self-custodial / Mixed.
- `cashback` and `yield` are **"up to"** marketing figures that change
  constantly; never present them as guaranteed current rates.
- `null` means "not publicly verifiable" — the project never fabricates data.
- `reported_users` mixes metrics (customers, MAU, wallets, TPV) and periods;
  cite the `metric` and `as_of` alongside the number.
- `investors`: notable backers from disclosed rounds, not complete cap tables.

## Human-readable pages (for citations)

- Directory: `https://www.neobankbeat.com/`
- Per-company profiles: `https://www.neobankbeat.com/n/<slug>/`
- Comparisons: `https://www.neobankbeat.com/vs/`
- Investors map: `https://www.neobankbeat.com/investors/`
- FAQ / glossary: `https://www.neobankbeat.com/faq/` · `/glossary/`
- Full agent guide: `https://www.neobankbeat.com/llms.txt`

## Attribution

MIT licence — reuse freely, attribution appreciated:
"neobankbeat.com". Source: https://github.com/andreolf/neobankbeat
