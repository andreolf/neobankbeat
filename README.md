# neobankbeat 🦊

**who watches the neobanks?** — an independent, open-source directory of 357 neobanks across three waves: **traditional** (Chime, Nubank, Kaspi…), **hybrid** fiat+crypto (Revolut, Cash App, RedotPay…), and **web3-native** self-custodial money apps (MetaMask, Gnosis Pay, Payy…), plus the niche-audience generation and super-app wallets.

inspired by [Walletbeat](https://beta.walletbeat.eth.limo) and [L2Beat](https://l2beat.com). built accordingly.

**live:** deploy `index.html` anywhere — it's a single self-contained file (Vercel: drop it in, done).

## what's inside

- **directory** — 357 verified-active entities; filter by category, custody, region, country, audience niche, regulation, stablecoin support; side-by-side compare tray
- **map** — dot-matrix world map with region → country drill-down, plus a floating mini-map on every page
- **data** — nine charts: reported users, founding waves (clickable year splits), researched volume watch (every figure links to its filing), the stablecoin card curve, region × category matrix, the neobank paradox, global banked adults, stablecoin supply 2030 scenarios, how stablecoins get spent
- **profiles** — verified terms & privacy links, official X handles (click any logo), founder LinkedIns (verified tier only), countries of operation, users/volume tiles, peers
- **library** — 14 vetted industry reports (direct PDFs flagged) + the full resources stack
- **news** — headline watch

## data principles

1. **verified-active only** — defunct neobanks and pure BaaS/infrastructure are excluded by design
2. **no fabricated links** — unverified fields fall back to honest search links, never guessed URLs
3. **sources on everything** — volume figures link to filings; charts cite their reports
4. **"up to" rates** — cashback/yield figures change constantly; always confirm with the issuer

## contributing

the whole dataset lives in `index.html` as `const D=[...]` (one row per entity) with a verified-links layer in `const V={...}`. two ways to contribute:

- **[+ submit a neobank](../../issues/new?labels=new-neobank&template=new-neobank.yml)** — pre-filled template
- **[suggest a correction](../../issues/new?labels=data-fix&template=data-fix.yml)** — spotted a wrong figure or dead link?

## tests

104+ assertions across 20 user flows (rendering, filters, map drill-down, profiles, compare, intake, charts, views):

```bash
cd tests && npm install && node flowtest.js
```

## license

MIT — do whatever, credit appreciated. made with ❤ & 🦊 by [francesco](https://www.francesco-andreoli.com) · still early
