/* build-jobs.mjs — the neobank jobs aggregator.
   Pulls live postings from public ATS APIs (Greenhouse / Lever / Ashby /
   Workable / SmartRecruiters) of tracked neobanks, classifies them into
   departments + regions, and emits:
     jobs/data.json        full normalized job list
     jobs/index.html       the board (filters client-side, top jobs baked for SEO)
     jobs/<dept>/index.html per-department SEO pages
   run: node build-jobs.mjs   (re-run any time to refresh listings)          */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8')).entities;

/* ── world map: reuse the homepage dot-matrix grid ── */
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const GRID = eval('[' + idx.match(/const GRID=\[([\s\S]*?)\];/)[1] + ']');
const L2M = eval('(' + idx.match(/const L2M=(\{[^}]+\})/)[1] + ')');
const MACRO2REGION = { NA: 'north-america', EU: 'europe', LATAM: 'latin-america', AF: 'africa', MENA: 'mena', ASIA: 'asia', OC: 'oceania' };
const MMCOL = { NA: '#89B0FF', EU: '#D075FF', LATAM: '#FF5C16', AF: '#BAF24A', MENA: '#FFA680', ASIA: '#CCE7FF', OC: '#E5FFC3' };
const slugify = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ── confirmed sources (probe-ats.mjs) — tracked neobanks only ── */
const SOURCES = [
  // [display, dataset entity name, ats, slug]
  ['Brex', 'Brex', 'gh', 'brex'],
  ['Crypto.com', 'Crypto.com', 'lever', 'crypto'],
  ['Tide', 'Tide', 'gh', 'tide'],
  ['Robinhood', 'Robinhood', 'gh', 'robinhood'],
  ['Neo Financial', 'Neo Financial', 'ashby', 'neofinancial'],
  ['Coinbase', 'Coinbase Card', 'gh', 'coinbase'],
  ['Ramp', 'Ramp', 'ashby', 'ramp'],
  ['Nubank', 'Nubank', 'gh', 'nubank'],
  ['SoFi', 'SoFi', 'gh', 'sofi'],
  ['N26', 'N26', 'gh', 'n26'],
  ['Monzo', 'Monzo', 'gh', 'monzo'],
  ['Moniepoint', 'Moniepoint', 'gh', 'moniepoint'],
  ['Chime', 'Chime', 'gh', 'chime'],
  ['Kraken', 'Krak', 'ashby', 'kraken.com'],
  ['Mercury', 'Mercury', 'gh', 'mercury'],
  ['Bitpanda', 'Bitpanda', 'gh', 'bitpanda'],
  ['Qonto', 'Qonto', 'lever', 'qonto'],
  ['Wealthsimple', 'Wealthsimple', 'ashby', 'wealthsimple'],
  ['Relay', 'Relay', 'ashby', 'relayfi'],
  ['Allica Bank', 'Allica Bank', 'ashby', 'allica-bank'],
  ['Gemini', 'Gemini Credit Card', 'gh', 'gemini'],
  ['KOHO', 'KOHO', 'ashby', 'koho'],
  ['Lunar', 'Lunar', 'ashby', 'lunar'],
  ['Ether.fi', 'EtherFi Cash', 'ashby', 'ether.fi'],
  ['Phantom', 'Phantom', 'ashby', 'phantom'],
  ['Consensys (MetaMask)', 'MetaMask', 'gh', 'consensys'],
  ['Fi Money', 'Fi Money', 'lever', 'epifi'],
  ['Found', 'Found', 'ashby', 'found'],
  ['Current', 'Current', 'gh', 'current'],
  /* deep-probe additions (probe-deep.mjs, verified by board identity) */
  ['Wise', 'Wise', 'smartr', 'wise'],
  ['OKX', 'OKX Card', 'gh', 'okx'],
  ['Banco Inter', 'Banco Inter', 'gh', 'inter'],
  ['C6 Bank', 'C6 Bank', 'gh', 'c6bank'],
  ['Bybit', 'Bybit Card', 'gh', 'bybit'],
  ['PayPay', 'PayPay Bank', 'gh', 'paypay'],
  ['EQ Bank', 'EQ Bank', 'lever', 'eqbank'],
  ['PhonePe', 'PhonePe', 'gh', 'phonepe'],
  ['YouTrip', 'YouTrip', 'workable', 'youtrip'],
  ['Rho', 'Rho', 'ashby', 'rho'],
  ['OakNorth', 'OakNorth', 'ashby', 'oaknorth'],
  ['FamPay', 'FamPay', 'lever', 'fampay'],
  ['Trust Wallet', 'Trust Wallet', 'ashby', 'trust-wallet'],
  ['Greenlight', 'Greenlight', 'lever', 'greenlight'],
  ['Novo', 'Novo', 'ashby', 'novo'],
  ['Judo Bank', 'Judo Bank', 'smartr', 'judobank'],
  ['Neon', 'Neon', 'lever', 'neon'],
  ['Branch', 'Branch', 'gh', 'branch'],
  ['Bitso', 'Bitso', 'gh', 'bitso'],
  ['1inch', '1inch Card', 'lever', '1inch'],
  ['Trust Bank', 'Trust Bank', 'gh', 'trustbank'],
  ['Dave', 'Dave', 'ashby', 'dave'],
  ['Solflare', 'Solflare', 'smartr', 'solflare'],
  ['Comun', 'Comun', 'ashby', 'comun'],
  ['GoHenry', 'GoHenry', 'ashby', 'gohenry'],
  ['Dakota', 'Dakota', 'ashby', 'dakota'],
  ['Meow', 'Meow', 'ashby', 'meow'],
  ['True Link', 'True Link', 'ashby', 'truelinkfinancial'],
  ['Airtm', 'Airtm', 'lever', 'airtm'],
  ['CoinJar', 'CoinJar', 'smartr', 'coinjar'],
  ['Up', 'Up', 'gh', 'up'],
  ['Plasma One', 'Plasma One', 'ashby', 'plasma'],
  ['Umba', 'Umba', 'smartr', 'umba'],
  ['PalmPay', 'PalmPay', 'smartr', 'palmpay'],
  ['Brubank', 'Brubank', 'smartr', 'brubank'],
  ['Trade Republic', 'Trade Republic', 'gh', 'traderepublic'],
  /* custom-scraper additions — companies without a standard public ATS API */
  ['Starling Bank', 'Starling Bank', 'workable', 'starling-bank'],
  ['Kuda', 'Kuda', 'workable', 'kuda'],
  ['Klarna', 'Klarna', 'deel', 'klarna'],
  ['bunq', 'bunq', 'bunq', 'bunq'],
];

/* ── department taxonomy ── */
const DEPTS = [
  ['engineering', 'Engineering', /engineer|developer|devops|sre|site reliab|security|appsec|infosec|\bqa\b|quality|ios|android|mobile dev|backend|back-end|frontend|front-end|full.?stack|platform|infrastructure|architect|blockchain|smart contract|solidity|technical lead|software|systems|database|dba|network/i],
  ['data', 'Data & AI', /data scientist|data analyst|data engineer|analytics|machine learning|\bml\b|\bai\b|artificial intel|business intelligence|\bbi\b|quantitative|research scientist/i],
  ['product', 'Product', /product manager|product owner|product lead|product director|head of product|product analyst|product operations|technical program|program manager|tpm/i],
  ['design', 'Design', /designer|design lead|\bux\b|\bui\b|user research|content design|brand design|creative/i],
  ['compliance', 'Compliance & Risk', /compliance|aml|anti.?money|financial crime|fincrime|fraud|risk|mlro|audit|regulatory|sanctions|bsa\b|screening/i],
  ['onboarding', 'Onboarding & KYC', /kyc|kyb|onboarding|verification|due diligence|identity/i],
  ['support', 'Customer Support', /support|customer service|customer care|customer experience|customer success|complaints|disputes|service agent|helpdesk|call cent/i],
  ['sales', 'Sales & Partnerships', /sales|account executive|business development|partnership|\bbd\b|account manager|relationship manager|revenue|commercial|go.to.market|gtm/i],
  ['marketing', 'Marketing & Growth', /marketing|growth|seo\b|content|brand|social media|community|public relations|\bpr\b|communications|copywrit|influencer|performance media|crm\b|lifecycle/i],
  ['finance', 'Finance & Treasury', /treasury|accountant|accounting|fp&a|financial analyst|financial controller|payroll|\btax\b|capital markets|credit analyst|underwrit|collections|reconciliation|settlement/i],
  ['operations', 'Operations', /operations|\bops\b|banking operations|payment operations|procurement|workplace|facilities|logistics|vendor|process/i],
  ['people', 'People & Legal', /recruiter|talent|people|human resources|\bhr\b|legal|counsel|lawyer|paralegal|employment|office manager|executive assistant|chief of staff|admin/i],
];
function classify(title, deptHint) {
  const hay = `${deptHint || ''} · ${title}`;
  for (const [id, , re] of DEPTS) if (re.test(hay)) return id;
  return 'other';
}

/* ── region classifier from location strings ── */
const REGION_RULES = [
  ['remote', /\bremote\b|anywhere|work from home|distributed/i],
  ['europe', /\b(uk|united kingdom|london|manchester|dublin|ireland|germany|berlin|munich|frankfurt|austria|vienna|france|paris|lyon|spain|madrid|barcelona|portugal|lisbon|porto|italy|milan|rome|netherlands|amsterdam|belgium|brussels|luxembourg|switzerland|zurich|geneva|zug|denmark|copenhagen|aarhus|sweden|stockholm|norway|oslo|finland|helsinki|poland|warsaw|krakow|czech|prague|slovakia|hungary|budapest|romania|bucharest|bulgaria|sofia|serbia|belgrade|greece|athens|estonia|tallinn|latvia|riga|lithuania|vilnius|malta|cyprus|croatia|ukraine|kyiv|europe|emea|eu\b)/i],
  ['north-america', /\b(us|usa|united states|new york|nyc|san francisco|sf\b|bay area|chicago|austin|dallas|houston|denver|seattle|boston|miami|atlanta|los angeles|salt lake|phoenix|portland|charlotte|columbus|tempe|oakland|washington|d\.c\.|canada|toronto|vancouver|montreal|calgary|ottawa|waterloo|north america)/i],
  ['latin-america', /\b(brazil|brasil|s[aã]o paulo|mexico|cdmx|ciudad de m[eé]xico|argentina|buenos aires|colombia|bogot[aá]|medell[ií]n|chile|santiago|peru|lima|uruguay|montevideo|costa rica|latam|latin america)/i],
  ['africa', /\b(nigeria|lagos|abuja|kenya|nairobi|south africa|johannesburg|cape town|ghana|accra|egypt|cairo|morocco|casablanca|uganda|kampala|tanzania|rwanda|kigali|senegal|dakar|ivory coast|c[oô]te d|africa)/i],
  ['mena', /\b(uae|dubai|abu dhabi|saudi|riyadh|jeddah|qatar|doha|bahrain|kuwait|oman|jordan|amman|lebanon|beirut|israel|tel aviv|t[uü]rkiye|turkey|istanbul|middle east)/i],
  ['asia', /\b(india|bangalore|bengaluru|mumbai|delhi|gurgaon|gurugram|hyderabad|pune|chennai|singapore|hong kong|japan|tokyo|korea|seoul|china|shanghai|beijing|shenzhen|taiwan|taipei|philippines|manila|indonesia|jakarta|malaysia|kuala lumpur|thailand|bangkok|vietnam|ho chi minh|hanoi|pakistan|karachi|bangladesh|dhaka|sri lanka|kazakhstan|almaty|uzbekistan|tashkent|apac|asia)/i],
  ['oceania', /\b(australia|sydney|melbourne|brisbane|perth|new zealand|auckland|wellington)/i],
];
const REGION_LABELS = { remote: 'Remote', europe: 'Europe', 'north-america': 'North America', 'latin-america': 'Latin America', africa: 'Africa', mena: 'MENA', asia: 'Asia', oceania: 'Oceania', other: 'Other' };
function region(loc, isRemote) {
  if (isRemote) return 'remote';
  for (const [id, re] of REGION_RULES) if (re.test(loc || '')) return id;
  return 'other';
}

/* ── salary: structured ATS fields are almost always disabled, but US/UK
   pay-transparency rules push ranges into the description text ── */
const stripHtml = h => String(h || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#?\w+;/g, ' ').replace(/<[^>]+>/g, ' ');
function fmtSalary(txt) {
  if (!txt) return null;
  const m = /([$£€]|USD|CAD|EUR|GBP|CHF|C\$)\s?(\d{2,3}(?:[,.]\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])\s*(?:[-–—]|to)\s*(?:[$£€]|USD|CAD|EUR|GBP|C\$)?\s?(\d{2,3}(?:[,.]\d{3})+|\d{2,3}(?:\.\d)?\s?[kK])/.exec(txt);
  if (!m) return null;
  const num = s => { s = s.trim().toLowerCase(); return s.endsWith('k') ? parseFloat(s) * 1000 : parseFloat(s.replace(/[,.](?=\d{3})/g, '')); };
  const lo = num(m[2]), hi = num(m[3]);
  if (!(lo >= 30000 && hi > lo && hi < 2000000)) return null;  // filters hourly/monthly noise
  const sym = { usd: '$', eur: '€', gbp: '£', cad: 'C$', 'c$': 'C$', chf: 'CHF' }[m[1].toLowerCase()] || m[1];
  return `${sym}${Math.round(lo / 1000)}–${Math.round(hi / 1000)}K`;
}

/* ── workplace type: Lever/Ashby expose workplaceType; Greenhouse is inferred
   from location text, then a "hybrid" mention in the description ── */
function workplaceOf(explicit, loc, desc) {
  const e = String(explicit || '').toLowerCase();
  if (e.includes('remote')) return 'remote';
  if (e.includes('hybrid')) return 'hybrid';
  if (e.includes('onsite') || e.includes('on-site')) return 'onsite';
  const l = String(loc || '');
  if (/\bremote\b|anywhere|distributed|work from home/i.test(l)) return 'remote';
  if (/\bhybrid\b/i.test(l)) return 'hybrid';
  if (/\bhybrid\b/i.test(String(desc || '').slice(0, 5000))) return 'hybrid';
  return 'onsite';
}

/* ── visa sponsorship: flagged only when the posting offers it and doesn't negate it ── */
const VISA_YES = /visa sponsorship|sponsor(?:ship)? (?:a |for |of )?(?:work )?(?:visa|permit)|work (?:visa|permit) sponsorship|relocation (?:and|&) visa|visa support/i;
const VISA_NO = /(?:not?|unable|cannot|can't|won't|will not)[^.]{0,80}?sponsor|no visa sponsorship|without (?:visa )?sponsorship|sponsorship (?:is )?not (?:available|offered|provided)|must (?:already )?(?:have|hold|possess)[^.]{0,50}?(?:right to work|work authori[sz]ation)/i;
function visaOf(desc) {
  const d = String(desc || '');
  return VISA_YES.test(d) && !VISA_NO.test(d) ? true : undefined;
}

/* ── custom scrapers: no public ATS API, but the career sites are parseable ── */
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/* Klarna runs on Deel's job board (jobs.deel.com/klarna) — a Next.js app whose
   flight payload embeds the full jobPostings array server-side */
async function deelRows(slug) {
  const r = await fetch(`https://jobs.deel.com/${slug}`, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': BROWSER_UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  const flight = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)]
    .map(m => JSON.parse('"' + m[1] + '"')).join('');
  const un = flight.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  const start = un.indexOf('"jobPostings":[');
  if (start < 0) throw new Error('jobPostings not found in flight payload');
  const chunks = un.slice(start).split(/(?=\{"id":"[0-9a-f-]{36}","jobId")/).slice(1);
  return chunks.map(c => {
    const pick = re => (c.match(re) || [])[1] || '';
    const id = pick(/^\{"id":"([0-9a-f-]{36})"/);
    const title = pick(/"title":"([^"]{3,120})"/);
    const locs = [...c.matchAll(/"location":\{"id":"[^"]+","name":"([^"]+)"/g)].map(m => m[1]);
    const dept = pick(/"department":\{"id":"[^"]+","name":"([^"]+)"/);
    const posted = pick(/"createdAt":"(\d{4}-\d{2}-\d{2})/);
    return { t: title, u: `https://jobs.deel.com/${slug}/job-details/${id}/overview`, l: locs.join(' · '), d: dept || null, p: posted, s: '', w: null };
  }).filter(x => x.t && /^[0-9a-f-]{36}/.test(x.u.split('/job-details/')[1] || ''));
}

/* bunq's careers site is a Framer page with server-rendered position cards:
   <a href="./positions/slug"> … <h3>Title</h3> … Location · Team */
async function bunqRows() {
  const r = await fetch('https://careers.bunq.com/positions', { signal: AbortSignal.timeout(30000), headers: { 'user-agent': BROWSER_UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  const anchors = [...html.matchAll(/<a[^>]+href="\.\/positions\/([a-z0-9-]+)"/g)];
  const seen = new Set();
  return anchors.map((m, i) => {
    const slug = m[1];
    if (seen.has(slug)) return null;
    seen.add(slug);
    const block = html.slice(m.index, anchors[i + 1] ? anchors[i + 1].index : m.index + 6000);
    const title = ((block.match(/<h3[^>]*>([^<]{3,100})<\/h3>/) || [])[1] || '').replace(/&amp;/g, '&').trim();
    /* card markup: Locations → repeated data-framer-name="Name" <p>City</p>, then Department → <p>Team</p> */
    const locs = [...block.matchAll(/data-framer-name="Name"[^>]*>\s*<p[^>]*>([^<]{2,40})<\/p>/g)].map(x => x[1].replace(/&amp;/g, '&').trim());
    const dept = ((block.match(/data-framer-name="Department"[\s\S]{0,900}?<p[^>]*>([^<]{2,50})<\/p>/) || [])[1] || '').replace(/&amp;/g, '&').trim();
    return title ? { t: title, u: `https://careers.bunq.com/positions/${slug}`, l: locs.join(' · ') || 'Amsterdam', d: dept || null, p: null, s: '', w: null } : null;
  }).filter(Boolean);
}

/* ── fetch + normalize ── */
async function fetchSource([display, entityName, ats, slug]) {
  const ent = E.find(e => e.name === entityName);
  const profile = ent ? `/n/${slugify(ent.name)}/` : null;
  if (ats === 'deel' || ats === 'bunq') {
    try {
      /* retry — transient socket failures are common with 69 boards fetching at once */
      let raw, err;
      for (let a = 0; a < 3; a++) {
        try { raw = ats === 'deel' ? await deelRows(slug) : await bunqRows(); err = null; break; }
        catch (e) { err = e; await new Promise(res => setTimeout(res, 2000 * (a + 1))); }
      }
      if (err) throw err;
      return raw.filter(x => x.t && x.u).map(x => ({
        title: x.t.trim(), url: x.u, company: display, profile,
        location: (x.l || '').trim() || 'Not specified',
        dept: classify(x.t, x.d), region: region(`${x.l} ${x.t}`, false), posted: x.p || null,
        salary: null, wp: workplaceOf(null, x.l, ''), visa: undefined,
      }));
    } catch (err) { console.error(`  !! ${display}: ${err.message}`); return []; }
  }
  const url = ats === 'gh'
    ? `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`
    : ats === 'lever'
      ? `https://api.lever.co/v0/postings/${slug}?mode=json`
      : ats === 'workable'
        ? `https://apply.workable.com/api/v1/widget/accounts/${slug}?details=false`
        : ats === 'smartr'
          ? `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`
          : `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  try {
    let j;
    for (let attempt = 0; ; attempt++) {  // content=true payloads are heavy; retry, then fall back to the light listing
      try {
        const u = attempt === 2 && ats === 'gh' ? url.replace('?content=true', '') : url;
        const r = await fetch(u, { signal: AbortSignal.timeout(attempt ? 90000 : 25000), headers: { 'user-agent': 'neobankbeat-jobs/1.0', accept: 'application/json' } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        j = await r.json();
        break;
      } catch (e) { if (attempt >= 2) throw e; }
    }
    if (ats === 'smartr' && j.totalFound > (j.content || []).length) {  // paginate past 100
      for (let off = 100; off < j.totalFound && off < 1000; off += 100) {
        const r = await fetch(`${url}&offset=${off}`, { signal: AbortSignal.timeout(25000), headers: { 'user-agent': 'neobankbeat-jobs/1.0', accept: 'application/json' } });
        if (r.ok) j.content.push(...(await r.json()).content || []);
      }
    }
    let rows = [];
    if (ats === 'gh') rows = (j.jobs || []).map(x => ({
      t: x.title, u: x.absolute_url, l: x.location?.name || '', d: null, p: (x.updated_at || '').slice(0, 10),
      s: stripHtml(x.content), w: null,
    }));
    else if (ats === 'lever') rows = (Array.isArray(j) ? j : []).map(x => ({
      t: x.text, u: x.hostedUrl, l: x.categories?.location || '', d: x.categories?.team || x.categories?.department || null,
      p: x.createdAt ? new Date(x.createdAt).toISOString().slice(0, 10) : '',
      s: (x.descriptionPlain || '') + ' ' + (x.additionalPlain || ''), w: x.workplaceType,
    }));
    else if (ats === 'workable') rows = (j.jobs || []).map(x => ({
      t: x.title, u: x.url || x.shortlink, l: [x.city, x.state, x.country].filter(Boolean).join(', '),
      d: x.department || x.function || null, p: x.published_on || '', r: !!x.telecommuting,
      s: '', w: x.telecommuting ? 'remote' : null,
    }));
    else if (ats === 'smartr') rows = (j.content || []).map(x => ({
      t: x.name, u: `https://jobs.smartrecruiters.com/${slug}/${x.id}`,
      l: [x.location?.city, (x.location?.country || '').toUpperCase()].filter(Boolean).join(', '),
      d: x.function?.label || x.department?.label || null, p: (x.releasedDate || '').slice(0, 10),
      r: !!x.location?.remote, s: '', w: x.location?.remote ? 'remote' : x.location?.hybrid ? 'hybrid' : null,
    }));
    else rows = (j.jobs || []).map(x => ({
      t: x.title, u: x.jobUrl || x.applyUrl, l: [x.location, ...(x.secondaryLocations || []).map(s => s.location)].filter(Boolean).join(' · '),
      d: x.department || x.team || null, p: (x.publishedDate || '').slice(0, 10), r: !!x.isRemote,
      s: x.descriptionPlain || '', w: x.workplaceType || (x.isRemote ? 'remote' : null),
    }));
    return rows.filter(x => x.t && x.u).map(x => ({
      title: x.t.trim(), url: x.u, company: display, profile,
      location: (x.l || '').trim() || 'Not specified',
      dept: classify(x.t, x.d), region: region(`${x.l} ${x.t}`, x.r), posted: x.p || null,
      salary: fmtSalary(x.s), wp: workplaceOf(x.w, x.l, x.s), visa: visaOf(x.s),
    }));
  } catch (err) {
    console.error(`  !! ${display}: ${err.message}`);
    return [];
  }
}

console.log('fetching live postings from', SOURCES.length, 'ATS boards…');
/* pool of 8 — firing all ~70 boards at once causes random socket failures */
async function pooled(items, fn, size = 8) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  }));
  return out;
}
const all = (await pooled(SOURCES, fetchSource)).flat();
// safety: if the APIs are having a bad day, refuse to overwrite a good board
if (all.length < 2000) {
  console.error(`only ${all.length} jobs fetched (expected 4000+) — aborting to avoid publishing a broken board`);
  process.exit(1);
}
all.sort((a, b) => (b.posted || '').localeCompare(a.posted || '') || a.company.localeCompare(b.company));
const TODAY = new Date().toISOString().slice(0, 10);

const byDept = {};
for (const j of all) byDept[j.dept] = (byDept[j.dept] || 0) + 1;
const byCompany = {};
for (const j of all) byCompany[j.company] = (byCompany[j.company] || 0) + 1;
const nCompanies = Object.keys(byCompany).length;

/* company → logo domain (google favicon service, same as the directory) */
const COMPANY_META = {};
for (const [display, entityName] of SOURCES) {
  const ent = E.find(e => e.name === entityName);
  const dom = ent?.domain || (ent?.website || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null;
  if (dom) COMPANY_META[display] = dom;
}
const logoImg = co => COMPANY_META[co]
  ? `<img class="jlogo" loading="lazy" alt="" src="https://www.google.com/s2/favicons?domain=${esc(COMPANY_META[co])}&amp;sz=64" onerror="this.style.visibility='hidden'">`
  : `<span class="jlogo jlogo-fb">${esc(co.charAt(0))}</span>`;

fs.mkdirSync(path.join(ROOT, 'jobs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'jobs', 'data.json'), JSON.stringify({ generated: TODAY, count: all.length, companies: nCompanies, logos: COMPANY_META, jobs: all }));

/* ── shared page chrome ── */
const CSS = `
:root{--acc:var(--accent,#FF5C16)}
.jhero{margin-top:8px}
.jstats{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}
.jstat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 18px}
.jstat .n{font-family:'Noto Sans Mono',monospace;font-size:20px;font-weight:700}
.jstat .l{font-family:'Noto Sans Mono',monospace;font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-top:2px}
main.wrap{max-width:1150px}
.jhero,main.wrap>article{max-width:760px}
.jlayout{display:grid;grid-template-columns:248px minmax(0,1fr);gap:30px;align-items:start;margin-top:10px}
.jmain{min-width:0}
/* sidebar is taller than the viewport → let it scroll on its own instead of
   trapping the lower filters until the job list runs out */
.jside{position:sticky;top:16px;display:flex;flex-direction:column;gap:14px;max-height:calc(100vh - 32px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--line) transparent;padding-right:6px;margin-right:-6px}
.jside::-webkit-scrollbar{width:5px}
.jside::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px}
.jside::-webkit-scrollbar-track{background:transparent}
#jsearch{width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--text);font-family:'Noto Sans Mono',monospace;font-size:12.5px;padding:10px 12px;box-sizing:border-box}
#jsearch:focus{outline:none;border-color:var(--acc)}
.jsec{font-family:'Noto Sans Mono',monospace;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--dim)}
.jsec::before{content:"—— ";color:var(--acc)}
.jmap{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 12px 9px}
.jmapgrid{display:grid;gap:0;line-height:0}
.jmapgrid span{width:3.4px;height:3.4px;border-radius:50%;display:inline-block}
.jmapgrid span.sea{background:transparent}
.jmapgrid span[data-region]{cursor:pointer}
.jmap.hasfilter span[data-region]{opacity:.18}
.jmap.hasfilter span.actv{opacity:1;filter:brightness(1.3)}
.jmap[data-hov] span[data-region]{opacity:.25}
.jmap[data-hov] span.hov{opacity:1;filter:brightness(1.3)}
.jmaplabel{font-family:'Noto Sans Mono',monospace;font-size:9.5px;color:var(--dim);margin-top:8px;min-height:12px}
.sidelist{display:flex;flex-direction:column}
.srow{display:flex;justify-content:space-between;align-items:center;gap:8px;font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--muted);background:none;border:none;border-radius:7px;padding:6px 9px;cursor:pointer;text-decoration:none;text-align:left;width:100%;box-sizing:border-box}
.srow:hover{background:var(--panel);color:var(--text)}
.srow.on{background:var(--acc);color:#0A0A10;font-weight:700}
.srow .c{color:var(--dim);font-size:10.5px}
.srow.on .c{color:#0A0A10;opacity:.7}
.jclear{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--acc);background:none;border:none;cursor:pointer;text-align:left;padding:2px 9px;display:none}
.jbar{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-family:'Noto Sans Mono',monospace;font-size:11.5px;color:var(--muted);margin-bottom:10px}
.jbar b{color:var(--text);font-size:14px}
.joblist{display:flex;flex-direction:column;gap:6px}
.job{display:flex;align-items:center;gap:12px;background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:9px 14px;text-decoration:none;transition:border-color .12s;min-width:0}
.job:hover{border-color:var(--acc)}
.jlogo{flex:0 0 auto;width:22px;height:22px;border-radius:6px;object-fit:contain;background:var(--panel2,#141420)}
.jlogo-fb{display:inline-flex;align-items:center;justify-content:center;font-family:'Noto Sans Mono',monospace;font-size:11px;font-weight:700;color:var(--muted);border:1px solid var(--line)}
.job .visa{font-family:'Noto Sans Mono',monospace;font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:#BAF24A;border:1px solid color-mix(in srgb,#BAF24A 35%,transparent);border-radius:99px;padding:2px 8px;white-space:nowrap}
.job .t{font-weight:700;font-size:13.5px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1 1 0;min-width:150px}
.job .co{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--acc);white-space:nowrap;flex:0 0 auto}
.job .loc{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 1 auto;max-width:200px}
.job .sal{font-family:'Noto Sans Mono',monospace;font-size:10.5px;font-weight:700;color:var(--w,#BAF24A);border:1px solid color-mix(in srgb,var(--w,#BAF24A) 35%,transparent);border-radius:99px;padding:1px 8px;white-space:nowrap}
.jtag{font-family:'Noto Sans Mono',monospace;font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:var(--dim);border:1px solid var(--line);border-radius:99px;padding:2px 8px;white-space:nowrap}
.job .apply{font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--acc);white-space:nowrap;margin-left:auto}
.jmore{text-align:center;margin:16px 0}
.jmore button{font-family:'Noto Sans Mono',monospace;font-size:13px;background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:11px 22px;cursor:pointer}
.jmore button:hover{border-color:var(--acc)}
.cogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin:16px 0}
.cocard{display:flex;align-items:center;gap:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;text-decoration:none;min-width:0}
.cocard:hover{border-color:var(--acc)}
.cocard .jlogo{width:26px;height:26px;border-radius:7px}
.cocard .n{font-weight:700;color:var(--text);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cocard .c{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--muted);margin-top:2px}
.cocard>div{min-width:0}
@media(max-width:860px){
  .jlayout{grid-template-columns:minmax(0,1fr);gap:16px}
  /* sidebar collapses into compact filter rows: search, map, then one
     horizontally-swipeable chip row per section — no more endless scroll */
  .jside{position:static;gap:10px;max-height:none;overflow:visible;padding-right:0;margin-right:0}
  .jmap{width:100%;max-width:none;box-sizing:border-box;text-align:center}
  .jmapgrid{width:max-content;margin:0 auto}
  .jmaplabel{text-align:center}
  .sidelist{flex-direction:row;overflow-x:auto;gap:6px;padding-bottom:4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .sidelist::-webkit-scrollbar{display:none}
  .srow{flex:0 0 auto;width:auto;border:1px solid var(--line);border-radius:999px;padding:6px 12px;background:var(--panel);gap:6px}
  .srow .c{font-size:10px}
  .jsec{margin-bottom:-4px}
  .job{flex-wrap:wrap;row-gap:3px}
  .job .t{flex:1 1 100%;white-space:normal}
  .job .loc{max-width:150px}
  .job .apply{display:none}
}
`;

const head = (title, desc, canonical, ld) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#0A0A10">
<meta property="og:type" content="website">
<meta property="og:site_name" content="neobankbeat">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://www.neobankbeat.com/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://www.neobankbeat.com/og.png">
<link rel="icon" href="/favicon.ico" sizes="64x64">
<link rel="icon" type="image/png" href="/favicon.png" sizes="64x64">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/noto-sans-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/blog/blog.css">
<style>${CSS}</style>
<script defer src="/_vercel/insights/script.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-E3KE01L5DL"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-E3KE01L5DL")</script>
<script type="application/ld+json">
${JSON.stringify(ld)}
</script>
</head>
<body>
<header>
  <div class="hwrap">
    <a href="/" class="logo">neobank<span class="dot">beat</span></a>
    <nav class="hnav" aria-label="Primary">
      <a href="/">directory</a>
      <a href="/#newssec">news</a>
      <a href="/#datasec">data</a>
      <a href="/#methodology">methodology</a>
      <a href="/blog/">blog</a>
      <a href="/report/">report</a>
      <a href="/jobs/" class="on">jobs</a>
      <button class="bwbtn" id="bwtoggle" aria-pressed="false">◐ black &amp; white</button>
    </nav>
  </div>
</header>
`;

const bwScript = `<script>(function(){var b=document.getElementById('bwtoggle');if(!b)return;function set(on){document.body.classList.toggle('bw',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'◑ color':'◐ black & white';try{localStorage.setItem('nbbw',on?'1':'0')}catch(e){}}try{if(localStorage.getItem('nbbw')==='1')set(true)}catch(e){}b.addEventListener('click',function(){set(!document.body.classList.contains('bw'))})})();</script>`;

const foot = `
<footer><div class="fwrap">
  <span>© neobankbeat · MIT</span>
  <a href="/">directory</a><a href="/blog/">blog</a><a href="/faq/">faq</a><a href="/glossary/">glossary</a><a href="/investors/">investors</a><a href="/report/">report</a><a href="/jobs/">jobs</a><a href="/data.json">data.json</a><a href="https://github.com/andreolf/neobankbeat">github</a>
</div></footer>
${bwScript}
</body>
</html>
`;

const jobCard = j => `<a class="job" href="${esc(j.url)}" target="_blank" rel="noopener">
  ${logoImg(j.company)}
  <span class="t">${esc(j.title)}</span>
  <span class="co">${esc(j.company)}</span>
  <span class="loc">${esc(j.location)}</span>
  ${j.salary ? `<span class="sal">${esc(j.salary)}</span>` : ''}
  ${j.visa ? '<span class="visa">visa ✓</span>' : ''}
  <span class="jtag">${DEPTS.find(d => d[0] === j.dept)?.[1] || 'Other'}</span>
  <span class="apply">apply →</span>
</a>`;

/* ── sidebar: search + dot-matrix world map + department/region lists ── */
const mapCols = Math.max(...GRID.map(r => r.length));
const mapDots = GRID.map(row => {
  let out = '';
  for (let i = 0; i < mapCols; i++) {
    const m = L2M[row[i] || '.'];
    out += m
      ? `<span data-region="${MACRO2REGION[m]}" style="background:${MMCOL[m]}"></span>`
      : '<span class="sea"></span>';
  }
  return out;
}).join('');

const byRegion = {};
for (const j of all) byRegion[j.region] = (byRegion[j.region] || 0) + 1;
const salN = all.filter(j => j.salary).length;
const byWp = {};
for (const j of all) byWp[j.wp] = (byWp[j.wp] || 0) + 1;
const visaN = all.filter(j => j.visa).length;
const WP_LABELS = { remote: 'Remote only', hybrid: 'Hybrid', onsite: 'On-site' };

function sidebar(activeDept) {
  const deptRows = [...DEPTS.map(d => [d[0], d[1]]), ['other', 'Other']]
    .filter(([id]) => byDept[id])
    .map(([id, label]) => activeDept !== null
      ? `<a class="srow${id === activeDept ? ' on' : ''}" href="${id === activeDept ? '/jobs/' : `/jobs/${id}/`}">${label}<span class="c">${byDept[id]}</span></a>`
      : `<button class="srow" data-dept="${id}">${label}<span class="c">${byDept[id]}</span></button>`).join('\n');
  const regionRows = Object.entries(REGION_LABELS)
    .filter(([id]) => byRegion[id])
    .map(([id, label]) => `<button class="srow" data-region="${id}">${label}<span class="c">${byRegion[id]}</span></button>`).join('\n');
  return `<aside class="jside">
    <input id="jsearch" type="search" placeholder="search title, company, city…" aria-label="Search jobs">
    <div class="jmap" id="jmap" title="click a region to filter">
      <div class="jmapgrid" style="grid-template-columns:repeat(${mapCols},3.4px)">${mapDots}</div>
      <div class="jmaplabel" id="jmaplabel">click a region to filter</div>
    </div>
    <div class="jsec">department</div>
    <div class="sidelist">${deptRows}</div>
    <div class="jsec">workplace</div>
    <div class="sidelist">
${Object.entries(WP_LABELS).filter(([id]) => byWp[id]).map(([id, label]) => `      <button class="srow" data-wp="${id}">${label}<span class="c">${byWp[id]}</span></button>`).join('\n')}
      <button class="srow" data-visa="1">Visa sponsorship<span class="c">${visaN}</span></button>
      <button class="srow" data-sal="1">Salary disclosed<span class="c">${salN}</span></button>
    </div>
    <div class="jsec">region</div>
    <div class="sidelist">${regionRows}</div>
    <button class="jclear" id="jclear">× clear all filters</button>
  </aside>`;
}

const filterScript = (preset) => `<script>
let JOBS=[],LOGOS={},shown=0,f={dept:${preset ? `'${preset}'` : 'null'},region:null,q:'',sal:false,wp:null,visa:false};
const PRESET=${preset ? `'${preset}'` : 'null'};
const STEP=80,list=document.getElementById('jlist'),more=document.getElementById('jmore');
const deptName=${JSON.stringify(Object.fromEntries(DEPTS.map(d => [d[0], d[1]])))};deptName.other='Other';
const regName=${JSON.stringify(REGION_LABELS)};
const regCount=${JSON.stringify(byRegion)};
fetch('/jobs/data.json').then(r=>r.json()).then(d=>{JOBS=d.jobs;LOGOS=d.logos||{};render(true)});
function match(j){return (!f.dept||j.dept===f.dept)&&(!f.region||j.region===f.region)&&(!f.sal||j.salary)&&(!f.wp||j.wp===f.wp)&&(!f.visa||j.visa)&&(!f.q||(j.title+' '+j.company+' '+j.location).toLowerCase().includes(f.q))}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function card(j){const a=document.createElement('a');a.className='job';a.href=j.url;a.target='_blank';a.rel='noopener';
const lg=LOGOS[j.company]?'<img class="jlogo" loading="lazy" alt="" src="https://www.google.com/s2/favicons?domain='+esc(LOGOS[j.company])+'&sz=64" onerror="this.style.visibility=\\'hidden\\'">':'<span class="jlogo jlogo-fb">'+esc(j.company.charAt(0))+'</span>';
a.innerHTML=lg+'<span class="t"></span><span class="co"></span><span class="loc"></span>'+(j.salary?'<span class="sal">'+esc(j.salary)+'</span>':'')+(j.visa?'<span class="visa">visa ✓</span>':'')+'<span class="jtag">'+deptName[j.dept]+'</span><span class="apply">apply →</span>';
a.querySelector('.t').textContent=j.title;a.querySelector('.co').textContent=j.company;a.querySelector('.loc').textContent=j.location;return a}
function render(reset){if(!JOBS.length)return;if(reset){list.innerHTML='';shown=0}
const hits=JOBS.filter(match);
document.querySelectorAll('#jcount').forEach(el=>el.textContent=hits.length.toLocaleString('en-US'));
const batch=hits.slice(shown,shown+STEP);batch.forEach(j=>list.appendChild(card(j)));shown+=batch.length;
more.style.display=shown<hits.length?'':'none';
document.getElementById('jclear').style.display=(f.region||f.q||f.sal||f.wp||f.visa||(f.dept&&f.dept!==PRESET))?'block':'none'}
more.querySelector('button').addEventListener('click',()=>render(false));
document.getElementById('jsearch').addEventListener('input',e=>{f.q=e.target.value.toLowerCase().trim();render(true)});
document.querySelectorAll('button[data-dept]').forEach(c=>c.addEventListener('click',()=>{
const v=c.dataset.dept;f.dept=f.dept===v?null:v;
document.querySelectorAll('button[data-dept]').forEach(x=>x.classList.toggle('on',x.dataset.dept===f.dept));render(true)}));
function setRegion(v){f.region=f.region===v?null:v;
document.querySelectorAll('button[data-region]').forEach(x=>x.classList.toggle('on',x.dataset.region===f.region));
syncMap();render(true)}
document.querySelectorAll('button[data-region]').forEach(c=>c.addEventListener('click',()=>setRegion(c.dataset.region)));
document.querySelectorAll('button[data-sal]').forEach(c=>c.addEventListener('click',()=>{f.sal=!f.sal;c.classList.toggle('on',f.sal);render(true)}));
document.querySelectorAll('button[data-visa]').forEach(c=>c.addEventListener('click',()=>{f.visa=!f.visa;c.classList.toggle('on',f.visa);render(true)}));
document.querySelectorAll('button[data-wp]').forEach(c=>c.addEventListener('click',()=>{
const v=c.dataset.wp;f.wp=f.wp===v?null:v;
document.querySelectorAll('button[data-wp]').forEach(x=>x.classList.toggle('on',x.dataset.wp===f.wp));render(true)}));
/* the map is a filter: click a continent */
const jmap=document.getElementById('jmap'),jlbl=document.getElementById('jmaplabel');
function syncMap(){jmap.classList.toggle('hasfilter',!!f.region);
jmap.querySelectorAll('span[data-region]').forEach(s=>s.classList.toggle('actv',s.dataset.region===f.region));
jlbl.textContent=f.region?regName[f.region]+' · '+(regCount[f.region]||0)+' roles — click again to clear':'click a region to filter'}
jmap.addEventListener('click',e=>{const r=e.target.dataset&&e.target.dataset.region;if(r)setRegion(r)});
jmap.addEventListener('mouseover',e=>{const r=e.target.dataset&&e.target.dataset.region;
if(r){jmap.dataset.hov=r;jmap.querySelectorAll('span[data-region]').forEach(s=>s.classList.toggle('hov',s.dataset.region===r));
jlbl.textContent=regName[r]+' · '+(regCount[r]||0)+' roles'}});
jmap.addEventListener('mouseleave',()=>{delete jmap.dataset.hov;jmap.querySelectorAll('.hov').forEach(s=>s.classList.remove('hov'));syncMap()});
document.getElementById('jclear').addEventListener('click',()=>{
f.region=null;f.q='';f.sal=false;f.wp=null;f.visa=false;if(!PRESET)f.dept=null;
document.getElementById('jsearch').value='';
document.querySelectorAll('.srow.on').forEach(x=>{if(!x.href)x.classList.remove('on')});
syncMap();render(true)});
</script>`;

/* ── index page ── */
const topCompanies = Object.entries(byCompany).sort((a, b) => b[1] - a[1]);
const indexHtml = head(
  `Neobank jobs — ${all.length.toLocaleString('en-US')} live roles at ${nCompanies} digital banks`,
  `Live job board for the neobank industry: ${all.length.toLocaleString('en-US')} open roles at ${nCompanies} tracked neobanks — engineering, compliance, onboarding, sales, support and more. Pulled directly from official career APIs, refreshed ${TODAY}.`,
  'https://www.neobankbeat.com/jobs/',
  { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Neobank jobs', url: 'https://www.neobankbeat.com/jobs/', description: `${all.length} live roles at ${nCompanies} neobanks, aggregated from official career APIs.`, isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: 'https://www.neobankbeat.com' } }
) + `
<main class="wrap">
  <div class="eyebrow">the job board</div>
  <article class="jhero">
  <h1>neobank <em>jobs</em></h1>
  <p class="meta">Every role below is pulled <b>directly from the official career APIs</b> of neobanks in the directory — no stale scrapes, no middlemen. Apply links go straight to the company. Refreshed <b>${TODAY}</b>.</p>
  </article>

  <div class="jstats">
    <div class="jstat"><div class="n">${all.length.toLocaleString('en-US')}</div><div class="l">live roles</div></div>
    <div class="jstat"><div class="n">${nCompanies}</div><div class="l">neobanks hiring</div></div>
    <div class="jstat"><div class="n">${salN}</div><div class="l">with disclosed salary</div></div>
  </div>

  <div class="jlayout">
    ${sidebar(null)}
    <div class="jmain">
      <div class="jbar"><span><b id="jcount">${all.length.toLocaleString('en-US')}</b> roles</span><span>newest first · refreshed ${TODAY}</span></div>
      <div class="joblist" id="jlist">
${all.slice(0, 80).map(jobCard).join('\n')}
      </div>
      <div class="jmore" id="jmore"><button>show more roles</button></div>
    </div>
  </div>

  <article>
  <h2>who's hiring</h2>
  <div class="cogrid">
${topCompanies.map(([co, n]) => {
  const src = SOURCES.find(s => s[0] === co);
  const ent = src && E.find(e => e.name === src[1]);
  const href = ent ? `/n/${slugify(ent.name)}/` : '#';
  return `    <a class="cocard" href="${href}">${logoImg(co)}<div><div class="n">${esc(co)}</div><div class="c">${n} open role${n === 1 ? '' : 's'}</div></div></a>`;
}).join('\n')}
  </div>

  <h2>browse by department</h2>
  <div class="cogrid">
${DEPTS.filter(([id]) => byDept[id]).map(([id, label]) =>
  `    <a class="cocard" href="/jobs/${id}/"><div class="n">${label}</div><div class="c">${byDept[id]} open role${byDept[id] === 1 ? '' : 's'}</div></a>`).join('\n')}
  </div>

  <h2>how this board works</h2>
  <p>neobankbeat tracks ${E.length} verified-active neobanks. For every one that exposes a public careers API (Greenhouse, Lever or Ashby), this board pulls the live postings, classifies them by department and region, and links you straight to the official application page — the same aggregator model as web3.career, but for digital banking. No accounts, no reposts, no fees. A company missing? <a href="https://github.com/andreolf/neobankbeat/issues/new?labels=jobs-source&amp;template=add-jobs-source.yml">submit it here</a> — drop the careers-page link and we'll wire it in.</p>
  <p style="font-size:12.5px;color:var(--dim)">Listings belong to the respective companies and change constantly; this board refreshes on regeneration (last: ${TODAY}). neobankbeat is independent and earns nothing from applications.</p>
  </article>
</main>
${filterScript(null)}
${foot}`;
fs.writeFileSync(path.join(ROOT, 'jobs', 'index.html'), indexHtml);

/* ── department pages ── */
const DEPT_COPY = {
  engineering: 'Backend, mobile, platform, security and SRE roles across the industry — from licensed-bank core banking to self-custodial smart-account stacks.',
  data: 'Data science, analytics, ML and AI roles — credit models, fraud detection, personalisation and the data platforms underneath.',
  product: 'Product managers and program leads shaping accounts, cards, credit and crypto rails.',
  design: 'Product designers, UX researchers and brand designers making banking feel effortless.',
  compliance: 'AML, financial crime, fraud, risk and regulatory roles — the fastest-growing hiring line in digital banking.',
  onboarding: 'KYC, KYB, verification and customer due-diligence roles — the front door of every regulated money app.',
  support: 'Customer support and experience roles, from chat support to complaints and disputes.',
  sales: 'Sales, partnerships and business development — especially strong in SMB and B2B neobanking.',
  marketing: 'Growth, performance, content, community and brand roles.',
  finance: 'Treasury, accounting, FP&A, credit and payments-settlement roles inside the money machines.',
  operations: 'Banking ops, payment ops and the operational backbone of running a digital bank.',
  people: 'Talent, people, legal and workplace roles at hiring neobanks.',
};
for (const [id, label] of DEPTS) {
  const rows = all.filter(j => j.dept === id);
  if (!rows.length) continue;
  const dir = path.join(ROOT, 'jobs', id);
  fs.mkdirSync(dir, { recursive: true });
  const html = head(
    `${label} jobs at neobanks — ${rows.length} live roles`,
    `${rows.length} live ${label.toLowerCase()} roles at ${new Set(rows.map(r => r.company)).size} neobanks, pulled from official career APIs. ${DEPT_COPY[id] || ''} Refreshed ${TODAY}.`,
    `https://www.neobankbeat.com/jobs/${id}/`,
    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${label} jobs at neobanks`, url: `https://www.neobankbeat.com/jobs/${id}/`, isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: 'https://www.neobankbeat.com' } }
  ) + `
<main class="wrap">
  <div class="eyebrow"><a href="/jobs/" style="color:inherit;text-decoration:none">the job board</a> · ${label.toLowerCase()}</div>
  <article class="jhero">
  <h1>${label.toLowerCase()} <em>jobs</em> at neobanks</h1>
  <p class="meta"><b><span id="jcount">${rows.length}</span> live roles</b> at ${new Set(rows.map(r => r.company)).size} digital banks · ${DEPT_COPY[id] || ''} Refreshed ${TODAY}.</p>
  </article>

  <div class="jlayout">
    ${sidebar(id)}
    <div class="jmain">
      <div class="jbar"><span><b id="jcount">${rows.length}</b> roles</span><span>newest first · refreshed ${TODAY}</span></div>
      <div class="joblist" id="jlist">
${rows.slice(0, 80).map(jobCard).join('\n')}
      </div>
      <div class="jmore" id="jmore"><button>show more roles</button></div>
    </div>
  </div>

  <article><p style="margin-top:24px"><a href="/jobs/">← all neobank jobs</a> · listings pulled from official Greenhouse/Lever/Ashby APIs · apply links go straight to the company.</p></article>
</main>
${filterScript(id)}
${foot}`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

console.log(`jobs board built · ${all.length} roles · ${nCompanies} companies · ${Object.keys(byDept).length} departments · refreshed ${TODAY}`);
