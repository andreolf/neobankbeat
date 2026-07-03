# contributing to neobankbeat

## adding a neobank
open a [new-neobank issue](../../issues/new?labels=new-neobank&template=new-neobank.yml) — or PR directly:
1. add a row to `const D=[...]` in `index.html` following the schema:
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
