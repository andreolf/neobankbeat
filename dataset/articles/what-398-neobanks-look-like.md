# Grounding LLM answers about neobanks: a verified 398-row dataset

*Figures as of 25 November 2026, counted from the neobankbeat dataset. Updated the same day: six entries were corrected after [a test with open models](https://github.com/andreolf/neobankbeat/pull/164), and the figures below reflect that.*

## TL;DR

- "Is this app a bank?" and "who holds my money?" are questions people now put to a model. The honest answer changes with licences, acquisitions and terms of service, so it is a poor fit for whatever the model memorised in training.
- [neobankbeat](https://www.neobankbeat.com/) is an open, MIT-licensed table of 398 verified-active neobanks, one row each, built from regulator registers, filings and the companies' own terms. It is small enough to put in a context window and structured enough to filter.
- Below: how to load it with `datasets`, how to turn a row into grounding text, and four things the table says about the category that the famous five or six names would not tell you.

## Why this needs grounding

Three properties make neobank facts awkward for a model working from memory:

1. **They change.** A partner-bank app buys a charter; an e-money licence is granted or withdrawn; a wallet adds custody. The row for Chime, for example, records a pending bank acquisition announced in September 2026.
2. **The label misleads.** "Bank", "neobank" and "web3" are marketing words. The legal arrangement behind them is a separate fact, and it is the one that decides what happens to your money.
3. **The long tail is thin.** Most text about the category is about a handful of companies. The other 390 have little written about them, which is where a model is most likely to guess.

A small table with a source behind each field is a cheap fix for all three.

## Load it

```python
from datasets import load_dataset

ds = load_dataset(
    "json",
    data_files="https://www.neobankbeat.com/data.json",
    field="entities",
    split="train",
)
print(len(ds))  # 398
```

This reads the canonical file the site serves, so it is always current. A copy also lives on the Hub at [`neobankbeat/neobanks`](https://huggingface.co/datasets/neobankbeat/neobanks); it is refreshed less often than the site.

## Turn a row into grounding text

The fields that matter most for a safety question are `custody`, `regulation_type` and `license`. A minimal retrieval step is a name lookup and a short template:

```python
by_name = {r["name"].lower(): r for r in ds}

def ground(name):
    r = by_name.get(name.lower())
    if r is None:
        return f"{name} is not in the neobankbeat directory of verified-active neobanks."
    return (
        f"{r['name']} ({r['category']}, founded {r['founded']}, based in {r['hq']}). "
        f"Custody: {r['custody']}. Arrangement: {r['regulation_type']}. "
        f"Licence detail: {r['license'] or 'not publicly verifiable'}. "
        f"Source: https://www.neobankbeat.com/n/{r['slug']}/"
    )

print(ground("Chime"))
```

Two conventions are worth passing on to the model in your system prompt. A `null` means "not publicly verifiable", never zero or no. And `cashback` and `yield` are "up to" marketing figures, so they should be quoted as such and not as current rates.

If you are building an agent instead of a pipeline, the site also publishes an [OpenAPI description](https://www.neobankbeat.com/openapi.json), an [`llms.txt`](https://www.neobankbeat.com/llms.txt) and an [agent skills index](https://www.neobankbeat.com/.well-known/agent-skills/index.json). No key is needed.

## What the table says: four findings

### 1. Who actually holds the money?

In 339 of the 398 (85%), the company holds your balance for you, the way a bank does. In 58 the keys stay with the user: 53 are fully self-custodial and 5 split the key with the app using MPC. One is mixed.

The category does not settle it. The dataset sorts neobanks into traditional (275), hybrid (64) and web3-native (59). All 275 traditional ones are custodial, as you would expect. But two of the web3-native apps are custodial too, and two hybrid apps leave the keys with the user. A model that infers custody from the word "web3" will be wrong about those.

### 2. What stands behind them?

Only 139 of the 398 (35%) hold a banking licence of their own.

| Arrangement | Neobanks | Share |
|---|---|---|
| Licensed bank | 139 | 35% |
| Partner-bank model | 86 | 22% |
| Self-custodial software | 52 | 13% |
| E-money institution | 51 | 13% |
| VASP / MSB / crypto licences | 25 | 6% |
| Payment institution | 16 | 4% |
| Everything else | 29 | 7% |

So roughly two in three "banks" in the category are not banks in the legal sense. A partner-bank app depends on another company's charter, and an e-money institution safeguards funds without deposit insurance in most places.

### 3. Where are they based?

The United States is home to 69 of them and the United Kingdom to 29. After that: Nigeria and the UAE have 15 each, France and Singapore 13, Brazil and India 12, Mexico and Switzerland 11, Argentina 10.

Another 26 state no home country at all. Twenty of those are self-custodial wallets, which have no customer balances to domicile; the other six are custodial crypto apps that do not publish one.

### 4. Who backs them?

132 entries have at least one disclosed funding round, naming 219 investors between them.

| Investor | Neobanks in the directory |
|---|---|
| Ribbit Capital | 14 |
| Tiger Global | 13 |
| SoftBank | 12 |
| Tencent | 12 |
| Y Combinator | 10 |
| DST Global | 9 |
| Valar Ventures | 9 |

These are notable backers from announced rounds, not cap tables, so the true counts are higher.

### Reproduce the four

```python
df = ds.to_pandas()

print(df["custody"].value_counts())
print(df.groupby(["category", "custody"]).size())
print(df["regulation_type"].value_counts())
print(df["hq"].str.split(", ").str[-1].value_counts().head(15))
print(df["investors"].explode().dropna().str["name"].value_counts().head(15))
```

## What the data cannot tell you

- **Size.** A row is a row. Nubank and a 2,000-user startup count the same in every figure above. User numbers exist for only some entries, and companies report different metrics, so they are not safe to add up.
- **The dead.** The directory lists only neobanks that are verifiably active. Closed ones are removed, so this is a picture of survivors. "Not in the directory" does not mean "does not exist".
- **Anything unverified.** A blank means we could not confirm it from a primary source. Nothing is estimated.
- **How much grounding helps.** This article does not measure model accuracy with and without the table. That experiment is the obvious next one.

Corrections are welcome and happen in the open: [github.com/andreolf/neobankbeat](https://github.com/andreolf/neobankbeat).
