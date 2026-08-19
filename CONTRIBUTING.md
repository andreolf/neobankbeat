# contributing to neobankbeat

## adding a neobank
open a [new-neobank issue](../../issues/new?labels=new-neobank&template=new-neobank.yml) — or PR directly:
1. add a row to `const D=[...]` in `app.js` following the schema:
   `[name, category(T/H/W), region, "City, CC", founded, custody(C/S/M/X), network, cardType, cashback, yield, stablecoins(0/1), kyc(Y/N/CO), niche, domain, one-liner]`
2. optionally add a verified-links entry to `const V={...}`: `{t: termsURL, p: privacyURL, x: "XHandle", in:{"Founder":"linkedinURL"}, cc:["Country",...]}`
3. inclusion bar: verified, currently operating, consumer/SMB-facing money app. no pure BaaS/infrastructure, no defunct entities.

## fixing data
open a [data-fix issue](../../issues/new?labels=data-fix&template=data-fix.yml) with a source link proving the correction.

## rules
- never guess a URL or a founder's LinkedIn — a missing field beats a wrong one
- volume/user figures need a citable public source (filing, IR page, or PR)
- run `node tests/flowtest.js` before submitting a PR
- after any change to `D`/`X`/`V`, regenerate the machine-readable export: `cd tests && node export-data.js` (writes `data.json` at the repo root — commit it with your change)
- then regenerate the static pages: `node build-pages.mjs` (rebuilds `/n/`, `/vs/` and `sitemap.xml` from `data.json` — commit those too)

## regional chapters
a chapter is on-ground ownership of one region: a running **radar** of sourced developments (e.g. [`radar/africa.json`](radar/africa.json), rendered at [/africa/](https://www.neobankbeat.com/africa/)) plus **data stewardship** — auditing and maintaining that region's rows in the dataset, and reviewing regional additions before they merge.

- radar entries by PR to the region's file in `radar/`: `date` (ISO), `title`, `body` (2–4 sentences, why it matters), `source` (URL — no source, no entry), optional `slugs` of tracked neobanks (rendered as profile links). newest first. the build fails on entries missing required fields.
- same rules as the dataset: sourced claims only, null over guesses, nobody pays to be featured.
- the trial to hold a chapter: **four sourced radar entries + one full audit pass of the region's data**. then your name and byline go on the chapter page.
- want to open one (LatAm, Southeast Asia, MENA…)? [open an issue](../../issues/new) and make the case.
