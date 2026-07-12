# The $245M week most neobanks won't survive

**Subtitle:** Crypto-card top-ups just hit an all-time high. That's the problem.

---

Last week, crypto-card top-ups crossed **$245 million in a single week** — an all-time high, 18% above anything ever recorded, per [Paymentscan](https://paymentscan.xyz).

![Weekly crypto card volumes hit $245M — chart by Paymentscan](IMAGE:paymentscan)

Champagne, right? Not quite.

Here's the uncomfortable read: most of the companies riding that chart won't exist when the market is ten times bigger. Not because demand disappears — $245M a week proves demand is the *least* of their problems. They'll die because of what they built underneath.

I track 365 verified-active neobanks at [neobankbeat](https://www.neobankbeat.com), with custody, licence and issuer structure documented for every one. Today the dataset tells one story louder than any other, so let me walk you through it.

## One number to hold onto

Of the 365 neobanks we track, **only 92 hold a full banking licence.**

The other 273 operate on rented rails — e-money licences, partner banks, BIN sponsors, card issuers. Every one of those relationships is a kill switch that someone else's compliance team can flip. Overnight. Without asking you.

![Only 92 of 365 neobanks hold their own banking licence](IMAGE:licence)

Don't believe me? The graveyard keeps receipts.

## The graveyard has a pattern

**2018 — WaveCrest.** Visa terminates one Gibraltar issuer, and most of Europe's crypto cards die in a single stroke. Bitwala, TenX, Cryptopay — different brands, same corpse.

**2020 — Wirecard.** The FCA freezes Wirecard Card Solutions, and "real" fintechs like Curve and Pockit go dark for days. Customer funds frozen. Nothing crypto about it.

**2022 — FTX.** Commingled customer funds are an insolvency bomb, whatever the terms of service say.

**2023 — Binance.** Loses Visa in Europe in July. Loses Mastercard in Latin America two months later. Card program gone by Christmas. Network confidence is a compliance judgment — when it goes, it goes fast.

**2026 — Ready.** This June, the self-custodial card formerly known as Argent cut off every user outside the EEA with **one hour's notice**, because its issuer (Kulipa, a Paris e-money institution) tightened its footprint. The assets were safe on-chain. The card was still dead. Self-custody protects your money, not your spending rail.

Five failures across eight years, one mechanism: **the customer-facing brand didn't control the layer it died on.** The names change. The lesson doesn't.

## The concentration nobody prices in

Here's what our issuer data shows, and it should feel familiar: all 35 web3-native card programs we track sit on a *handful* of BIN sponsors and issuing platforms.

Rain sits behind Karta and Hyperbeat's card. Baanx behind MetaMask Card. Wirex behind COCA. DCS, Immersve and Fiat24 split Bitget Wallet's geography three ways. Marqeta behind BFinance.

That's the WaveCrest topology of 2018 — one layer more professional. When one of these sponsors sneezes, a dozen brands catch pneumonia at the same time.

![One sponsor, many brands: the BIN-sponsor layer under self-custody cards](IMAGE:issuers)

And the bar keeps rising. Starling — a *fully licensed UK bank* — got fined £29M because its screening system checked customers against only a fraction of the sanctions list for years. If that's the standard applied to a licensed bank, imagine the diligence a card network runs on a two-year-old stablecoin startup doing $245M weeks.

## The question that kills yield products

Every "earn up to 15%" headline eventually meets one sentence from a banking partner, a regulator, or an insolvency court:

*"Show me the ledger entry for user X's balance."*

If the answer requires reconstructing it from pool accounting, there is no answer. FTX is the terminal case study. This is why we record yield claims verbatim in the dataset instead of endorsing them — a headline APY tells you nothing about whether the ledger underneath survives that question.

Europe adds a twist most teams haven't priced in: **MiCA prohibits paying interest on e-money tokens.** Euro stablecoin balances can't earn as stablecoins. The compliant path runs through tokenized T-bills and RWA wrappers — yield from an underlying asset, not from the token. Whoever industrializes that first owns European earn.

## Even your compliance vendor is now a risk

In February, researchers reported that a database linked to KYC provider IDMerit had exposed roughly **a billion identity records** across 26 countries (the company disputes its systems were breached). Sit with that: the identity data you're legally required to collect is also the data you're liable for. Choosing who holds it is a survival decision, not a procurement line item.

## How to read the chart

The $245M week isn't a card story or a yield story. It's a stress test arriving on schedule. As volume grows, issuer diligence tightens, network reviews deepen, and the gap between "shipped fast in year one" and "rebuilt everything in year two" becomes existential. Sometimes year two doesn't come.

When you compare neobanks, the fields that predict survival aren't cashback and APY. They're the boring ones: **licence type, custody model, and who actually issues the card.** We put them on every profile for exactly this reason.

→ Browse all 365, with licence and issuer structure sourced per entity: [neobankbeat.com](https://www.neobankbeat.com)
→ The full stablecoin-card comparison: [neobankbeat.com/stablecoin-cards](https://www.neobankbeat.com/stablecoin-cards/)
→ The long-form version of this piece, with every claim linked: [neobankbeat.com/blog/why-neobanks-die](https://www.neobankbeat.com/blog/why-neobanks-die/)

*Every figure above is reproducible from the open dataset ([data.json](https://www.neobankbeat.com/data.json), MIT licence). Nothing here is investment or legal advice. If you spotted an error, reply to this email — it gets fixed.*
