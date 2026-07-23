---
license: mit
language:
  - en
pretty_name: "neobankbeat — open directory of neobanks worldwide"
tags:
  - finance
  - fintech
  - neobank
  - banking
  - stablecoin
  - crypto
  - web3
size_categories:
  - n<1K
source_datasets:
  - original
task_categories:
  - tabular-classification
  - text-retrieval
configs:
  - config_name: default
    data_files: "data.json"
---

# neobankbeat — open directory of neobanks worldwide

A verified, machine-readable directory of **368 active neobanks** — traditional
(licensed fiat), hybrid (fiat + custodial crypto), and web3-native
(self-custodial) — curated from primary sources and updated in the open.

- **Live site:** https://www.neobankbeat.com/
- **Canonical data:** https://www.neobankbeat.com/data.json
- **Source & issues:** https://github.com/andreolf/neobankbeat
- **License:** MIT — free to use, including commercially, with attribution appreciated.
- **Updated:** rolling; see the [changelog](https://www.neobankbeat.com/changelog/).

## What's in it

Each entity is an object under `entities` in `data.json`. Fields include:

| Field | Meaning |
|---|---|
| `name`, `hq`, `founded`, `domain`, `website` | identity |
| `category` | `traditional` · `hybrid` · `web3-native` |
| `custody` | who holds the money (custodial / self-custodial / MPC / mixed) |
| `regulation_type` | licensed bank · partner-bank (BaaS) · e-money · payment institution · VASP/MSB · self-custodial software · … |
| `licence` | plain-text licence / sponsor-bank detail |
| `card_network`, `card_type`, `cashback`, `yield` | card & rewards |
| `stablecoins`, `services` | stablecoin support; money-movement capabilities (on/off-ramp, IBAN, virtual/crypto cards, multi-currency) |
| `fx_markup` | foreign-exchange markup on the free/standard plan, with source + as-of date |
| `kyc`, `audience` | KYC posture; audience/niche |
| `active_regions`, `countries` | geography |
| `reported_users`, `funding`, `investors` | scale & backing (where disclosed) |
| `ai` | verified in-production AI use: `underwriting` · `interface` · `agentic` |

Top-level `meta` carries counts, field notes and the verification methodology.

## Methodology

Defunct neobanks and pure BaaS/infrastructure providers are excluded from the
count. Unverified fields are `null` rather than guessed. Rates (cashback, yield,
FX) are "up to" figures that change often — always confirm with the issuer.

## Citation

> neobankbeat (2026). *Open directory of neobanks worldwide.* https://www.neobankbeat.com/ (MIT).

## Load it

```python
import json, urllib.request
data = json.load(urllib.request.urlopen("https://www.neobankbeat.com/data.json"))
print(data["meta"]["total"], "neobanks")
for e in data["entities"][:5]:
    print(e["name"], "·", e["category"], "·", e["regulation_type"])
```
