/* Generates ../data.json from the live dataset in index.html.
   Run after any change to D / X / V:  cd tests && node export-data.js */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'https://www.neobankbeat.com/',
  beforeParse(window) {
    window.Element.prototype.scrollIntoView = function () {};
    window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
  }
});
const w = dom.window;

const out = w.eval(`(function(){
  const entities = D.map(r => {
    const [name, c, region, hq, founded, cu, network, cardType, cashback, yld, stables, kyc, ni, domain, note] = r;
    const e = X[name] || {};
    const v = V[name] || {};
    const o = {
      name,
      category: CATNAME[c],
      audience: NICHE[ni],
      region,
      hq,
      founded,
      custody: CUST[cu],
      regulation_type: regTypeOf(r),
      card_network: network === "—" ? null : network,
      card_type: network === "—" ? null : cardType,
      cashback: cashback === "—" ? null : cashback,
      yield: yld === "—" ? null : yld,
      stablecoins: !!stables,
      kyc: KYC[kyc],
      domain: domain || null,
      website: domain ? "https://" + domain : null,
      active_regions: macrosOf(r).map(m => MACROS[m]),
      note
    };
    if (e.s) o.story = e.s;
    if (e.ai) o.ai = e.ai;
    if (e.l) o.licence = e.l;
    if (e.f) o.founders = e.f;
    if (e.m) o.funding = e.m;
    if (v.t) o.terms_url = v.t;
    if (v.p) o.privacy_url = v.p;
    if (v.x) o.x_handle = v.x;
    if (v.cc) o.countries = v.cc;
    if (typeof SV !== 'undefined' && SV[name]) o.services = SV[name];
    if (typeof FX !== 'undefined' && FX[name]) o.fx_markup = { markup: FX[name].r, as_of: FX[name].d, source: FX[name].u };
    if (typeof INV !== 'undefined' && INV[name]) o.investors = INV[name].map(iv => ({ name: iv[0], website: 'https://' + iv[1] }));
    if (USERMAP[name]) o.reported_users = { value_millions: USERMAP[name].v, metric: USERMAP[name].metric, as_of: USERMAP[name].yr };
    if (VOLMAP[name]) o.volume = { figure: VOLMAP[name].fig, metric: VOLMAP[name].metric, source: VOLMAP[name].src };
    return o;
  });
  return {
    meta: {
      name: "neobankbeat",
      description: "Open-source directory of verified-active neobanks: traditional, hybrid fiat+crypto, and web3-native self-custodial money apps.",
      url: "https://www.neobankbeat.com/",
      source: "https://github.com/andreolf/neobankbeat",
      license: "MIT",
      total: D.length,
      counts: {
        traditional: D.filter(r => r[1] === "T").length,
        hybrid: D.filter(r => r[1] === "H").length,
        web3_native: D.filter(r => r[1] === "W").length,
        niche_audience: D.filter(r => r[12] !== "g").length
      },
      field_notes: {
        category: "traditional = licensed fiat, custodial · hybrid = fiat + custodial crypto · web3-native = self-custodial, on-chain-first",
        rates: "cashback/yield are 'up to' figures that change constantly and vary by region — always confirm with the issuer",
        services: "money-movement capabilities (on-ramp, off-ramp, fiat-payin, fiat-payout, iban, multi-currency, virtual-cards, crypto-cards); verified per provider docs, tags omitted when unverified — absence is not proof of absence",
        fx_markup: "foreign-exchange markup on the free/standard plan, sourced + dated; rates change often, always confirm with the issuer",
        verification: "defunct neobanks and pure BaaS/infrastructure are excluded; unverified fields are null rather than guessed"
      }
    },
    entities
  };
})()`);

const dest = path.join(__dirname, '..', 'data.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
console.log('wrote ' + dest + ' — ' + out.entities.length + ' entities');
