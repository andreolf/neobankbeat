# We asked five open models who holds your money at 60 neobanks

*Run on 25 November 2026. Code and every raw answer: `dataset/articles/grounding-experiment/` in the [neobankbeat repository](https://github.com/andreolf/neobankbeat).*

## TL;DR

- We asked five open-weight models one question about 60 neobanks: does the company hold your money, or do you? From memory they were right 69% of the time, confidently wrong 15% and unsure 16%.
- The errors are not spread evenly. For traditional neobanks the models were wrong 2% of the time. For web3-native apps they were wrong 34% of the time, and for apps that are actually self-custodial they said "the company holds it" in 32% of answers.
- With one row of the [neobankbeat dataset](https://huggingface.co/datasets/neobankbeat/neobanks) pasted into the prompt, all five models answered every question correctly.
- The part we did not expect: the models also caught mistakes in our answer key. Reading their disagreements led to six corrections in the dataset, which shipped the same day.

## The setup

[neobankbeat](https://www.neobankbeat.com/) is an open, MIT-licensed directory of 398 verified-active neobanks. Each row records, among other things, who has custody of customer funds and what kind of licence stands behind the product, taken from regulator registers and the companies' own terms.

We drew 60 of them: a seeded random 25 traditional, 15 hybrid and 15 web3-native, plus five that looked like exceptions to their category (a "web3" app recorded as custodial, for example). The one entry recorded as mixed custody was left out because it has no single right answer. In the corrected key, 41 of the 60 are custodial and 19 are self-custodial.

Each model got two closed questions per neobank, with the name and website:

1. **Custody.** Who holds customer funds: the company or its partner, or the user? Or you do not know.
2. **Licence.** Does it hold a banking licence in its own name? Yes, no, or you do not know.

Each question was asked twice: once from memory, and once with the neobank's record from the dataset placed above the question. Temperature 0, one run, through Hugging Face Inference Providers.

| Model | Calls |
|---|---|
| deepseek-ai/DeepSeek-V4.1-Flash | 240 |
| google/gemma-4-31B-it | 240 |
| Qwen/Qwen3.8-27B | 240 |
| openai/gpt-oss-120b | 240 |
| meta-llama/Llama-3.3-70B-Instruct | 240 |

That is 1,200 answers. The whole run cost about $1.50 at list prices, nearly all of it the two reasoning models thinking.

## Result 1: custody, from memory

| Model | Right | Wrong | Unsure |
|---|---|---|---|
| DeepSeek-V4.1-Flash | 90% | 10% | 0% |
| gemma-4-31B-it | 72% | 13% | 15% |
| Qwen3.8-27B | 68% | 23% | 8% |
| gpt-oss-120b | 65% | 18% | 17% |
| Llama-3.3-70B-Instruct | 52% | 10% | 38% |
| **All five** | **69%** | **15%** | **16%** |

Two different failure styles show up. Llama-3.3-70B is the oldest model here and the most cautious: it says "I don't know" more than a third of the time and is rarely wrong when it does answer. Qwen3.8-27B and gpt-oss-120b answer more often and are wrong about one time in five. DeepSeek never declined and was right nine times in ten.

For a question about where someone's savings sit, the wrong answers matter more than the unsure ones.

## Result 2: the errors cluster where the stakes are

| Category | Right | Wrong | Unsure |
|---|---|---|---|
| Traditional | 87% | 2% | 10% |
| Hybrid | 72% | 12% | 15% |
| Web3-native | 43% | 34% | 23% |

Split by the true answer instead:

| The truth is | Right | Wrong | Unsure |
|---|---|---|---|
| The company holds it | 81% | 7% | 12% |
| The user holds it | 44% | 32% | 24% |

The models' default is "it's a financial app, so the company holds the money". That default is right for a bank and wrong for a self-custodial wallet with a card attached. Fiat24, Solid and Kontigo were each called custodial by four of the five models, and the 1inch Card by three. The reverse mistake happens too: four of five said KAST is self-custodial, when it holds funds through custody partners.

This is the long-tail problem in one table. The well-known challengers are answered well. The newer products, where the custody model is the whole point of the product, are answered worst.

## Result 3: with the record in the prompt

With the dataset row above the question:

| | Right | Wrong | Unsure |
|---|---|---|---|
| From memory (60 neobanks) | 69% | 15% | 16% |
| With the record (57 neobanks) | 100% | 0% | 0% |

All five models, all 285 answers. Three neobanks are left out of the second row because the record we showed for them was wrong; that story is the next section.

This is not a surprising result, and it is partly circular: the record states the custody model, so the test is whether the model reads it and prefers it over what it remembers. Every model did, including on the neobanks it had answered wrongly from memory a moment earlier.

The record is about 60 tokens.

## The models audited us

With the record in the prompt, the models still disagreed with our key on a handful of answers. When we read those answers, most of them were the models being right.

**Three rows contradicted themselves.** AllScale, XPlace and Kontigo were recorded with custody "Custodial", while the licence line of the same row described a self-custodial product. Given both statements, two models followed the licence line for XPlace and one for AllScale, and said so in their one-sentence reason. We went back to the sources. XPlace's terms say it "does not at any time take possession, custody, or control of your Digital Assets or private keys". AllScale's documentation says the private key "is in the hands of the user". Kontigo's terms describe its wallet as non-custodial, with some products held by third-party custodians. All three are now recorded as self-custodial.

**One row was misclassified.** Nagad was filed under "Licensed bank". Its own licence line said it runs on a mobile-money licence. All five models read the line and answered "no". The digital bank licence it was granted in June 2024 was suspended that August and is still under review.

**A sweep found two more.** Having seen the pattern, we searched all 398 rows for a custody field or licence type that disagreed with the row's own text. bKash had the same mobile-money problem as Nagad, and Plutus, an e-money card, was filed as self-custodial software. A test now fails the build if a custodial entry's licence line says self-custodial.

**Two rows exposed a badly worded question.** Marcus and FACILE are digital brands of licensed banks (Goldman Sachs Bank USA and Pacific National Bank). We asked whether each holds a licence "in its own name", the key said yes, and nearly every model said no, the bank does. The models answered the question we wrote. The key answered the question we meant.

**And the models respected "not verifiable".** For five self-custodial wallets the record's licence detail is blank, which the dataset defines as "not publicly verifiable". The key said "no bank licence". Most models answered "unknown" and cited the blank. That is the convention working as designed.

So the scores in this article are marked against the corrected key. For the three corrected custody rows, the from-memory answers are re-marked and the with-record answers are set aside, because the models were shown the faulty record.

For completeness, the licence question scored 74% right from memory and 90% with the record. Setting aside Marcus and FACILE it is 76% and 93%, with one wrong answer left out of 285. We would not lean on the licence numbers: the question needs rewriting before it measures anything cleanly.

The finding we will keep is the method. Asking several models the same closed question against a structured record, and reading every disagreement, found four bad rows in a 60-row sample that our own tests had not.

## Run it yourself

```bash
git clone https://github.com/andreolf/neobankbeat
cd neobankbeat/dataset/articles/grounding-experiment
pip install requests huggingface_hub
hf auth login
python run.py pilot   # 3 neobanks, 1 model
python run.py         # the full run, resumable
python run.py score   # tables from results.jsonl
```

`results.jsonl` in the same folder holds every answer from this run, with the model's one-sentence reason, and `python run.py score` reproduces the tables above from it. The 60 neobanks that were asked are listed in `sample.json`, so a fresh run uses the same ones.

## Limits

- **The dataset is the answer key.** "Right" means "agrees with neobankbeat". This run showed the key had errors in about one row in fifteen of the sample.
- **The sample is not random.** Five deliberately awkward rows were added, and web3-native apps are over-represented (19 of 60, against 59 of 398 in the directory). The 69% is not an estimate for all neobanks.
- **One run at temperature 0.** No repeated trials, so small differences between models mean little.
- **One model sometimes did not answer.** Qwen3.8-27B used its whole 6,000-token budget thinking on 12 memory questions, even after retries. Those count as unsure.
- **Closed questions only.** We did not test free-text answers, where a model can be vaguely right.
- **No retrieval step.** We handed each model the right row. A real system also has to find it.
