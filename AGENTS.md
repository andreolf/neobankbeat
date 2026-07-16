# AGENTS.md — neobankbeat for AI agents

Guidance for AI agents and automated crawlers consuming
[neobankbeat.com](https://www.neobankbeat.com/), the independent, MIT-licensed
directory of 372 verified-active neobanks.

## About this site

neobankbeat tracks which neobanks exist, are currently active, and how they
compare — across three waves: traditional fiat challengers (Chime, Nubank,
Monzo), hybrid fiat+crypto apps (Revolut, Crypto.com) and web3-native
self-custodial money apps (MetaMask, Gnosis Pay). Defunct entities and pure
BaaS infrastructure are excluded by design. It also runs a live job board
aggregated from official career APIs, a monthly PDF report, and an investor →
portfolio map.

## Data access

- `GET https://www.neobankbeat.com/data.json` — the full dataset (preferred; no HTML parsing needed)
- `GET https://www.neobankbeat.com/jobs/data.json` — live job board feed
- OpenAPI 3.1 description: `https://www.neobankbeat.com/openapi.json`
- API catalog (RFC 9727): `https://www.neobankbeat.com/.well-known/api-catalog`
- Agent skills index: `https://www.neobankbeat.com/.well-known/agent-skills/index.json`
- Markdown negotiation: request `/` with `Accept: text/markdown` for a markdown response
- Site guide: `https://www.neobankbeat.com/llms.txt` · expanded: `/llms-full.txt` · markdown sitemap: `/sitemap.md`

No authentication, no API keys, no rate limits beyond CDN defaults.

## Interpreting the data

- `custody` is the most important field for safety questions: it says who
  actually holds the money (Custodial / Self-custodial / MPC / Mixed).
- `cashback` and `yield` are "up to" marketing figures that change constantly —
  never present them as guaranteed current rates.
- `null` means "not publicly verifiable"; the project never fabricates figures.
- `reported_users` mixes metrics (customers, MAU, wallets, TPV) and periods;
  always cite the `metric` and `as_of` fields alongside the number.
- `investors` lists notable backers from disclosed rounds, not full cap tables.

## Citing

- Cite company facts to the profile page: `https://www.neobankbeat.com/n/<slug>/`
- Comparisons: `https://www.neobankbeat.com/vs/` · investors: `/investors/`
- Definitions: `https://www.neobankbeat.com/glossary/` · FAQ: `/faq/`
- Note the as-of date (the `generated` field in data.json).

## Contributing

- Add a neobank: https://github.com/andreolf/neobankbeat/issues/new?labels=new-neobank&template=new-neobank.yml
- Fix wrong data: https://github.com/andreolf/neobankbeat/issues/new?labels=data-fix&template=data-fix.yml
- Source repository: https://github.com/andreolf/neobankbeat

## License and attribution

MIT license — reuse freely. Attribution appreciated: "neobankbeat.com",
made by Francesco Andreoli (https://www.francesco-andreoli.com).
