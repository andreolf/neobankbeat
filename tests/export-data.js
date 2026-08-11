/* Generates ../data.json from the live dataset in app.js.
   Run after any change to D / X / V:  cd tests && node export-data.js */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
/* the homepage loads its code from /app.js; jsdom would fetch that asynchronously,
   so it is folded back inline to keep this export synchronous */
const raw = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const src = (raw.match(/<script src="\/app\.js\?v=[0-9a-f]+"><\/script>/) || [])[0];
const html = src
  ? raw.replace(src, () => '<script>' + fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') + '</script>')
  : raw;
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
  const mapRow = r => {
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
    if (e.l) o.license = e.l;
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
  };
  const entities = D.map(mapRow);
  const emerging = (typeof EMERGING !== 'undefined' ? EMERGING : []).map(r => { const o = mapRow(r); o.status = 'emerging'; return o; });
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
    entities,
    emerging
  };
})()`);

/* SCHEMA V2 — PHASE 1 derivation pass. Deterministically derives the new
   machine-set keys from already-built source fields (no prose extraction).
   Tri-state rule: derived features are `true` or left `null` — never `false`.
   All manual-only keys (Phase 2+) stay null / [] here. Appended to the tail of
   each record after `slug`, so the diff is pure additions per entity. */
const NETMAP = { MC: 'Mastercard', Visa: 'Visa', Amex: 'Amex', RuPay: 'RuPay', Verve: 'Verve', Mada: 'Mada' };
/* funding_stage — heuristic investor-lens dimension. Explicit signals
   (Public/Acquired/Bootstrapped/Subsidiary/Series X/seed) are reliable; the
   $-amount fallback is a directional estimate. null = undisclosed. */
function fundingStage(o) {
  const fnd = String(o.funding || '');
  const all = `${fnd} ${o.note || ''} ${o.story || ''}`;
  if (/\bacquired\b/i.test(all)) return 'Acquired';
  if (/\bpublic\b|\bIPO\b|\blisted\b|nasdaq|nyse|\([A-Z]{2,5}\)/.test(fnd)) return 'Public';
  if (/bootstrapp|no outside investors|no investors/i.test(all)) return 'Bootstrapped';
  if (/majority|subsidiary|owned by|joint venture|\bJV\b|state-owned|central bank/i.test(fnd)) return 'Subsidiary / strategic';
  if (/pre-seed/i.test(fnd)) return 'Pre-seed';
  const sm = fnd.match(/series\s+([a-e])/i);
  if (sm) { const L = sm[1].toUpperCase(); return (L === 'C' || L === 'D' || L === 'E') ? 'Series C+' : 'Series ' + L; }
  if (/\bseed\b/i.test(fnd)) return 'Seed';
  const am = fnd.match(/\$\s?([\d.]+)\s*([bm])\b/i);
  if (am) {
    let v = parseFloat(am[1]); if (/b/i.test(am[2])) v *= 1000; // → $M
    if (v >= 300) return 'Series C+';
    if (v >= 80) return 'Series B';
    if (v >= 25) return 'Series A';
    if (v >= 3) return 'Seed';
    return 'Pre-seed';
  }
  return null;
}

function deriveV2(o) {
  const custody = o.custody, category = o.category, audience = o.audience;
  const cardType = o.card_type || '';
  const services = Array.isArray(o.services) ? o.services : [];

  const self_custody = (custody === 'Self-custodial' || custody === 'MPC self-custodial') ? true : null;
  const mpc = custody === 'MPC self-custodial' ? true : null;
  const crypto = (category === 'hybrid' || category === 'web3-native') ? true : null;
  const yield_bearing = o.yield != null ? true : null;
  const virtual_cards = services.includes('virtual-cards') ? true : null;
  const stablecoin_native = (o.stablecoins === true && category === 'web3-native') ? true : null;

  /* Pass B (heuristic): extract feature flags from the note/story/license prose.
     Conservative — a flag is set `true` only on a clear product signal; absence
     stays `null` (unverified), never `false`. Machine-drafted; human-reviewable. */
  const txt = `${o.note || ''} ${o.story || ''} ${o.license || ''}`.toLowerCase();
  const sig = re => re.test(txt) ? true : null;
  const apple_pay = sig(/apple pay/);
  const google_pay = sig(/google pay/);
  const api = sig(/\bapis?\b|open banking|programmable bank|developer platform|bank(?:ing)? api/);
  const webhooks = sig(/webhook/);
  const oauth = sig(/\boauth\b/);
  const sandbox = sig(/\bsandbox\b/);
  const savings = sig(/savings account|savings vault|high[- ]?yield savings|savings pods?|savings goals?|savings pots?/);
  const lending = sig(/\bloans?\b|lending|overdraft|\bbnpl\b|buy now.{0,6}pay later|credit line|salary advance|earned[- ]?wage|microloan/);
  const investing = sig(/\binvesting\b|brokerage|stock trading|trade stocks|\betfs?\b|mutual funds?|robo[- ]?advis|wealth management/);
  const treasury = sig(/\btreasury\b/);
  const iban = (services.includes('iban') || sig(/\biban\b/)) ? true : null;
  const physical_cards = (/physical|metal/i.test(cardType)) ? true : sig(/physical card|metal card/);
  const business_accounts = (audience === 'SMB & startups' || audience === 'freelancers & creators' || /business/i.test(cardType) || sig(/business account|for (?:smbs?|smes?|startups|founders)/)) ? true : null;

  const features = {
    apple_pay, google_pay, api, webhooks, oauth, sandbox,
    business_accounts, virtual_cards, physical_cards, iban,
    self_custody, mpc, yield_bearing, savings, lending,
    investing, treasury, crypto, stablecoin_native,
  };

  /* payment rails mentioned in prose (low-signal, but free when present) */
  const rails = [];
  for (const [re, name] of [[/\bsepa[\s-]?instant/, 'SEPA-Instant'], [/\bsepa\b/, 'SEPA'], [/\bfednow\b/, 'FedNow'], [/\bach\b/, 'ACH'], [/\bpix\b/, 'Pix'], [/\bupi\b/, 'UPI'], [/faster payments/, 'Faster Payments'], [/\bswift\b/, 'SWIFT'], [/\bwire transfer|\bwires?\b/, 'Wire']]) {
    if (re.test(txt) && !rails.includes(name)) rails.push(name);
  }

  const stablecoin_tickers = o.stablecoins === false ? [] : null;

  let card_networks = null;
  if (o.card_network != null) {
    const nets = [];
    for (let tok of String(o.card_network).split('/')) {
      tok = tok.replace(/\s*\([^)]*\)/g, '').trim();
      const mapped = NETMAP[tok];
      if (mapped && !nets.includes(mapped)) nets.push(mapped);
    }
    card_networks = nets.length ? nets : null;
  }

  const form = [];
  if (/virtual/i.test(cardType)) form.push('virtual');
  if (/physical/i.test(cardType)) form.push('physical');
  const card_form = form.length ? form : null;

  const fund = [];
  if (/debit/i.test(cardType)) fund.push('debit');
  if (/credit/i.test(cardType)) fund.push('credit');
  if (/prepaid/i.test(cardType)) fund.push('prepaid');
  if (/charge/i.test(cardType)) fund.push('charge');
  if (/bnpl/i.test(cardType)) fund.push('bnpl');
  const card_funding = fund.length ? fund : null;

  return {
    features,
    stablecoin_tickers,
    /* numeric %-companions left null: the prose rate fields are too noisy to
       parse a reliable headline figure ("100% of CDI", "0.5% over £1k/mo",
       "+1% weekend") — a wrong number is worse than an unverified one. */
    fx_markup_pct: null,
    cashback_pct: null,
    yield_pct: null,
    payment_rails: rails.length ? rails : null,
    card_networks,
    card_form,
    card_funding,
    timeline: null,
    partners: { issuer: null, partner_bank: null, treasury: null, identity: null, kyc_provider: null, card_network: null },
    funding_stage: fundingStage(o),
  };
}

(async () => {
  const { buildSlugMap } = await import('./slug.mjs');
  const all = [...out.entities, ...(out.emerging || [])];
  const smap = buildSlugMap(all.map(e => e.name));
  for (const o of all) {
    const derived = deriveV2(o);
    o.slug = smap.get(o.name); // slug first among the new tail keys
    Object.assign(o, derived);
  }
  const dest = path.join(__dirname, '..', 'data.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
  console.log('wrote ' + dest + ' — ' + out.entities.length + ' entities');
})();
