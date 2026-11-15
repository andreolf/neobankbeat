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
import { BLOG_CSS_HREF, FOOTER_HTML, navHtml } from './footer.mjs';
import { clampDesc, crumbs } from './meta.mjs';
import { readHomepageJs } from './homepage-js.mjs';
import { jobMatchCss, jobMatchHtml, jobMatchScript } from './job-match.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8')).entities;

/* ── world map: reuse the homepage dot-matrix grid ── */
const idx = readHomepageJs();
const GRID = eval('[' + idx.match(/const GRID=\[([\s\S]*?)\];/)[1] + ']');
const L2M = eval('(' + idx.match(/const L2M=(\{[^}]+\})/)[1] + ')');
const MACRO2REGION = { NA: 'north-america', EU: 'europe', LATAM: 'latin-america', AF: 'africa', MENA: 'mena', ASIA: 'asia', OC: 'oceania' };
const MMCOL = { NA: '#89B0FF', EU: '#D075FF', LATAM: '#FF5C16', AF: '#BAF24A', MENA: '#FFA680', ASIA: '#CCE7FF', OC: '#E5FFC3' };
const slugify = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BASE = 'https://www.neobankbeat.com';

function jobSlug(company, url) {
  const co = slugify(company);
  let tail = 'role';
  try {
    const u = new URL(url);
    tail = u.pathname.match(/\/jobs\/(\d+)/)?.[1]
      || u.pathname.match(/\/([a-f0-9-]{36})(?:\/|$)/i)?.[1]
      || u.pathname.match(/\/postings\/([^/]+)/)?.[1]
      || u.pathname.split('/').filter(Boolean).pop()
      || u.hostname.replace(/^www\./, '');
  } catch { /* malformed url — fall back */ }
  return `${co}-${slugify(String(tail)).slice(0, 64)}`.replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#?\w+;/g, ' ')
    /* some ATS feeds ship mojibake dashes as C0 controls, which are invalid in HTML */
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '-');
}

function htmlToText(html) {
  let h = decodeHtml(html);
  h = h.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  h = h.replace(/<br\s*\/?>/gi, '\n');
  h = h.replace(/<\/(p|div|h[1-6]|li|tr|section|article|blockquote)>/gi, '\n\n');
  h = h.replace(/<li[^>]*>/gi, '\n• ');
  h = h.replace(/<h[1-6][^>]*>/gi, '\n\n');
  h = h.replace(/<[^>]+>/g, '');
  return h.replace(/\n{3,}/g, '\n\n').replace(/[^\S\n]+/g, ' ').trim();
}

const INLINE_SECTIONS = [
  'Team/ Role Paragraph', "What you'll do", 'What you will do', "What we're looking for",
  'Requirements', 'Qualifications', 'Nice to have', 'Who you are', 'About the role',
  'About the team', 'Responsibilities', 'Benefits', 'Our offer', 'Your profile',
  'Skills', 'Experience', 'The role', 'Job description', 'In this role', 'About you',
  'A bit about the role', 'A bit about you', 'How you will make an impact',
];

function splitInlineSections(text) {
  let t = text;
  for (const label of INLINE_SECTIONS) {
    const re = new RegExp(`\\s+(${label.replace(/[/'\\]/g, '\\$&')}):\\s*`, 'gi');
    t = t.replace(re, `\n\n$1:\n\n`);
  }
  return t.replace(/\s+•\s+/g, '\n• ').replace(/\s+(\d+)\.\s+(?=[A-Z])/g, '\n$1. ');
}

function normDesc(raw) {
  const t = splitInlineSections(htmlToText(raw));
  return t.replace(/\n{3,}/g, '\n\n').trim().slice(0, 14000);
}

const SECTION_HDR = /^(?:#{1,3}\s*)?(?:Team\/\s*Role Paragraph|What you(?:'|’)ll do|What you will do|What we(?:'|’)re looking for|Requirements|Qualifications|Nice to have|Who you are|About (?:the role|the team|you)|Responsibilities|Benefits|Our offer|Your profile|Skills|Experience|The role|Job description|In this role|A bit about (?:the role|you)|How you will make an impact)(?:\s*\/\s*[^:]*)?\s*:?\s*$/i;
const BULLET_RE = /^[•\-\*–—]\s+/;
const NUM_RE = /^\d+[.)]\s+/;

function descBody(text) {
  const t = String(text || '').trim();
  if (t.length < 80) return '<p class="jnodesc">This listing is synced from the company careers API. The full job description is on their application page — use the button below.</p>';

  const lines = t.split(/\n/).map(l => l.trim()).filter(Boolean);
  let html = '', inList = false, para = [];
  const flushPara = () => {
    if (!para.length) return;
    html += `<p>${esc(para.join(' '))}</p>\n`;
    para = [];
  };
  const closeList = () => { if (inList) { html += '</ul>\n'; inList = false; } };

  for (const line of lines) {
    if (SECTION_HDR.test(line) || (/^[A-Z][A-Za-z0-9/&'’\-\s]{2,55}:\s*$/.test(line) && line.length < 70)) {
      flushPara(); closeList();
      html += `<h3>${esc(line.replace(/:\s*$/, ''))}</h3>\n`;
      continue;
    }
    if (BULLET_RE.test(line) || NUM_RE.test(line)) {
      flushPara();
      if (!inList) { html += '<ul>\n'; inList = true; }
      html += `<li>${esc(line.replace(BULLET_RE, '').replace(NUM_RE, ''))}</li>\n`;
      continue;
    }
    closeList();
    para.push(line);
    if (para.join(' ').length > 480) flushPara();
  }
  flushPara(); closeList();
  return html || `<p>${esc(t.slice(0, 5000))}</p>`;
}

const ogIf = (...parts) => {
  const rel = path.join('og', ...parts);
  return fs.existsSync(path.join(ROOT, rel)) ? `https://www.neobankbeat.com/og/${parts.join('/')}` : undefined;
};

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
  ['Nubank', 'Nubank', 'ashby', 'nubank'],
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

function leverDesc(x) {
  let t = [x.descriptionPlain, x.additionalPlain, x.openingPlain].filter(Boolean).join('\n\n');
  if (t.trim().length < 80 && x.lists?.length) {
    t = x.lists.map(l => `${l.text}\n${htmlToText(l.content)}`).join('\n\n');
  }
  return t;
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
        salary: null, wp: workplaceOf(null, x.l, ''), visa: undefined, description: normDesc(x.s),
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
      s: x.content || '', w: null,
    }));
    else if (ats === 'lever') rows = (Array.isArray(j) ? j : []).map(x => ({
      t: x.text, u: x.hostedUrl, l: x.categories?.location || '', d: x.categories?.team || x.categories?.department || null,
      p: x.createdAt ? new Date(x.createdAt).toISOString().slice(0, 10) : '',
      s: leverDesc(x), w: x.workplaceType,
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
      pid: String(x.id),
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
      description: normDesc(x.s),
    }));
  } catch (err) {
    console.error(`  !! ${display}: ${err.message}`);
    return [];
  }
}

const companyAts = new Map(SOURCES.map(s => [s[0], { ats: s[2], slug: s[3] }]));

async function enrichJobDescription(j) {
  if ((j.description || '').length >= 80) return;
  const src = companyAts.get(j.company);
  if (!src) return;
  const { ats, slug } = src;
  const hdrs = { accept: 'application/json', 'user-agent': 'neobankbeat-jobs/1.0' };
  try {
    if (ats === 'smartr') {
      const id = j.url.match(/\/(\d+)\/?$/)?.[1];
      if (!id) return;
      const r = await fetch(`https://api.smartrecruiters.com/v1/companies/${slug}/postings/${id}`, { signal: AbortSignal.timeout(20000), headers: hdrs });
      if (!r.ok) return;
      const p = await r.json();
      const sections = p.jobAd?.sections || {};
      const html = sections.jobDescription?.text
        || Object.entries(sections).filter(([k]) => k !== 'companyDescription').map(([, s]) => s?.text).filter(Boolean).join('\n\n');
      if (html) j.description = normDesc(html);
    } else if (ats === 'workable') {
      const sc = j.url.match(/\/j\/([A-F0-9]+)/i)?.[1];
      if (!sc) return;
      const r = await fetch(`https://apply.workable.com/api/v2/accounts/${slug}/jobs/${sc}`, { signal: AbortSignal.timeout(20000), headers: hdrs });
      if (!r.ok) return;
      const p = await r.json();
      const html = [p.description, p.requirements, p.benefits].filter(Boolean).join('\n\n');
      if (html) j.description = normDesc(html);
    } else if (ats === 'deel') {
      const r = await fetch(j.url, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': BROWSER_UA } });
      if (!r.ok) return;
      const page = await r.text();
      const flight = [...page.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)].map(m => JSON.parse('"' + m[1] + '"')).join('');
      const m = flight.replace(/\\"/g, '"').match(/"description":"((?:\\.|[^"])*)"/);
      if (m) {
        const raw = JSON.parse('"' + m[1] + '"');
        if (raw.length >= 80) j.description = normDesc(raw);
      }
    } else if (ats === 'bunq') {
      const r = await fetch(j.url, { signal: AbortSignal.timeout(30000), headers: { 'user-agent': BROWSER_UA } });
      if (!r.ok) return;
      const page = await r.text();
      const paras = [...page.matchAll(/<p[^>]*class="framer-text[^"]*"[^>]*>([\s\S]*?)<\/p>/g)]
        .map(x => htmlToText(x[1])).filter(p => p.length > 40);
      if (paras.length) j.description = normDesc(paras.join('\n\n'));
    }
    if ((j.description || '').length >= 80) {
      j.salary = j.salary || fmtSalary(j.description);
      j.visa = j.visa ?? visaOf(j.description);
    }
  } catch { /* enrichment is best-effort */ }
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
const needDesc = all.filter(j => (j.description || '').length < 80);
if (needDesc.length) {
  console.log(`enriching ${needDesc.length} job descriptions from detail APIs…`);
  await pooled(needDesc, enrichJobDescription, 10);
}
// safety: if the APIs are having a bad day, refuse to overwrite a good board
if (all.length < 2000) {
  console.error(`only ${all.length} jobs fetched (expected 4000+) — aborting to avoid publishing a broken board`);
  process.exit(1);
}
/* A board that answers but is empty is invisible otherwise: the company just
   silently stops appearing. Greenhouse/Lever slugs rot when a company migrates
   ATS (PhonePe moved to SmartRecruiters, Up's board was withdrawn — both
   retired above after 404ing every run for weeks). Listing them each run means
   the next rot shows up in the cron log instead of after someone notices a
   missing employer. */
const silent = SOURCES.map(([co]) => co).filter(co => !all.some(j => j.company === co));
if (silent.length) console.log(`no roles returned by: ${silent.join(', ')}`);
all.sort((a, b) => (b.posted || '').localeCompare(a.posted || '') || a.company.localeCompare(b.company));
const takenJobIds = new Set();
for (const j of all) {
  let base = jobSlug(j.company, j.url), id = base, n = 2;
  while (takenJobIds.has(id)) { id = `${base}-${n++}`; }
  takenJobIds.add(id);
  j.id = id;
  j.path = `/jobs/j/${id}/`;
}
const TODAY = new Date().toISOString().slice(0, 10);

const jobTitleKey = j => `${j.title} at ${j.company}`;
/* Titles have to be unique, and a company often posts one role several times.
   The tie-break used to be the page's whole id, so 2,000 search results read
   "… · ramp-29d188c7-0529-4bc8-a04a-57902df2a7ae — neobank jobs". The location
   settles most ties by itself; a short requisition reference settles the rest,
   and the full id is kept only as the last resort that guarantees uniqueness. */
const jobRef = (j) => (j.id.match(/-(\d{4,})(?:-\d+)?$/) || j.id.match(/-([0-9a-f]{8})-[0-9a-f]{4}-/) || [null, j.id.slice(-8)])[1];
const jobTitles = new Map();
{
  const tally = (key) => { const c = {}; for (const j of all) c[key(j)] = (c[key(j)] || 0) + 1; return c; };
  const where = (j) => (j.location && j.location !== 'Not specified' ? j.location : '');
  const k1 = jobTitleKey, k2 = (j) => `${k1(j)} — ${where(j)}`, k3 = (j) => `${k2(j)} · ref ${jobRef(j)}`;
  const c1 = tally(k1), c2 = tally(k2), c3 = tally(k3);
  for (const j of all) {
    const t = c1[k1(j)] === 1 ? k1(j)
      : where(j) && c2[k2(j)] === 1 ? k2(j)
        : c3[k3(j)] === 1 ? (where(j) ? k3(j) : `${k1(j)} · ref ${jobRef(j)}`)
          : `${k2(j)} · ${j.id}`;
    jobTitles.set(j.id, `${t} — neobank jobs`);
  }
}
const jobPageTitle = (j) => jobTitles.get(j.id);

const byDept = {};
for (const j of all) byDept[j.dept] = (byDept[j.dept] || 0) + 1;
const byCompany = {};
for (const j of all) byCompany[j.company] = (byCompany[j.company] || 0) + 1;
const nCompanies = Object.keys(byCompany).length;

/* ── one page per hiring company: /jobs/at/<slug>/ ──
   Half of all search clicks to this site are job searches, and the queries name
   the employer ("vagas c6 bank", "banco inter vagas"). They used to land on a
   single listing, which ranks for a few weeks and then disappears with the role.
   A company page is the URL that outlives its listings. */
const companySlug = co => slugify(co);
const companyPath = co => `/jobs/at/${companySlug(co)}/`;
const companyEntity = co => { const src = SOURCES.find(s => s[0] === co); return (src && E.find(e => e.name === src[1])) || null; };

/* company → logo domain (google favicon service, same as the directory) */
const COMPANY_META = {};
for (const [display, entityName] of SOURCES) {
  const ent = E.find(e => e.name === entityName);
  const dom = ent?.domain || (ent?.website || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null;
  if (dom) COMPANY_META[display] = dom;
}
/* self-hosted logo (downloaded once into /logos/jobs/), with a lazy Google
   fallback only if the local file is missing — no per-render third-party fetch */
const logoSlug = d => String(d).toLowerCase().replace(/[^a-z0-9]/g, '-');
const logoImg = co => COMPANY_META[co]
  ? `<img class="jlogo" loading="lazy" alt="" src="/logos/jobs/${logoSlug(COMPANY_META[co])}.png" onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=${esc(COMPANY_META[co])}&amp;sz=64'">`
  : `<span class="jlogo jlogo-fb">${esc(co.charAt(0))}</span>`;

fs.mkdirSync(path.join(ROOT, 'jobs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'jobs', 'data.json'), JSON.stringify({ generated: TODAY, count: all.length, companies: nCompanies, logos: COMPANY_META, jobs: all }));
const inBrazil = j => /\b(brazil|brasil)\b|são paulo|sao paulo|rio de janeiro|belo horizonte|, (SP|RJ|MG|PR|RS|SC|DF|BA|PE|CE|GO)$/i.test(j.location || '');

/* ── job alerts (api/alerts/*) ──
   The sign-up box and the weekly digest are served by the edge functions in
   /api/alerts; this is everything they need from the build. alerts.json is the
   board without the descriptions (data.json is 21MB, this is under 1MB), and
   alerts-topics.json is the list of things a person may subscribe to, which the
   sign-up endpoint checks a request against.

   `live` is a committed switch, not an environment variable: the boxes must not
   appear until the mail and storage accounts exist, and flipping it should be a
   reviewable one-line change. */
const ALERTS_LIVE = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'alerts-config.json'), 'utf8')).live === true;
{
  const brHq = co => /,\s*BR$/.test(companyEntity(co)?.hq || '');
  fs.writeFileSync(path.join(ROOT, 'jobs', 'alerts.json'), JSON.stringify({
    generated: TODAY,
    companies: Object.fromEntries(Object.keys(byCompany).sort().map(co => [companySlug(co), co])),
    jobs: all.filter(j => j.posted && !Number.isNaN(Date.parse(j.posted))).map(j => ({
      id: j.id, title: j.title, co: companySlug(j.company), dept: j.dept, loc: j.wp === 'remote' ? 'Remote' : j.location,
      posted: j.posted, path: j.path, ...(inBrazil(j) || brHq(j.company) ? { br: 1 } : {}),
    })),
  }));
  fs.writeFileSync(path.join(ROOT, 'jobs', 'alerts-topics.json'), JSON.stringify({
    companies: Object.fromEntries(SOURCES.map(x => [companySlug(x[0]), x[0]])),
    depts: [...DEPTS.map(d => d[0]), 'other'],
    br: true,
  }));
}
const ALERT_WORDS = {
  en: { cta: 'Get alerts', ph: 'you@example.com', note: 'At most one email a week, only when there is something new. One-click unsubscribe. We keep your address and this choice, nothing else.', how: 'How it works',
    ok: 'Check your inbox: confirm the link we just sent and the alert is on.', email: 'That does not look like an email address.', slow_down: 'Too many tries from here. Please wait an hour.', busy: 'Sign-ups are full for today. Please try again tomorrow.', server: 'That did not work. Please try again in a moment.' },
  pt: { cta: 'Receber alertas', ph: 'voce@exemplo.com', note: 'No máximo um e-mail por semana, só quando houver novidade. Cancelamento em um clique. Guardamos seu endereço e esta escolha, mais nada.', how: 'Como funciona',
    ok: 'Veja sua caixa de entrada: confirme no link que acabamos de enviar e o alerta fica ativo.', email: 'Isso não parece um endereço de e-mail.', slow_down: 'Muitas tentativas daqui. Aguarde uma hora.', busy: 'As inscrições de hoje acabaram. Tente de novo amanhã.', server: 'Não deu certo. Tente de novo em instantes.' },
};
/* the sign-up box: empty string until alerts are live, so a page never shows a
   form that cannot work */
const alertBox = (topic, lang, heading) => {
  if (!ALERTS_LIVE) return '';
  const w = ALERT_WORDS[lang];
  return `<form class="jalert" data-topic="${topic}" data-lang="${lang}" novalidate>
    <label for="jalert-email">${heading}</label>
    <div class="jalert-row"><input id="jalert-email" type="email" name="email" required autocomplete="email" placeholder="${w.ph}"><button type="submit">${w.cta}</button></div>
    <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">
    <p class="jalert-note" role="status">${w.note} <a href="/jobs/alerts/">${w.how}</a></p>
  </form>
  <script>(function(){var f=document.querySelector('form.jalert');if(!f)return;var M=${JSON.stringify(Object.fromEntries(['ok', 'email', 'slow_down', 'busy', 'server'].map(k => [k, w[k]])))},n=f.querySelector('.jalert-note'),b=f.querySelector('button');
f.addEventListener('submit',function(e){e.preventDefault();b.disabled=true;
fetch('/api/alerts/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:f.email.value,topic:f.dataset.topic,lang:f.dataset.lang,website:f.website.value})})
.then(function(r){return r.json()}).then(function(j){if(j&&j.ok){n.textContent=M.ok;f.querySelector('.jalert-row').hidden=true;try{window.nbevt&&nbevt('job_alert_signup',{topic:f.dataset.topic})}catch(_){}}else{n.textContent=M[j&&j.error]||M.server;b.disabled=false}})
.catch(function(){n.textContent=M.server;b.disabled=false})})})();</script>`;
};

/* ── feeds — RSS of the newest postings ──
   The board has had one feed for everything. A job seeker follows an employer
   or a line of work, not 3,800 roles, so each company page and each department
   page gets its own: the same items, filtered. They are also what a job alert
   is made of, whoever ends up sending it. */
const writeFeed = (file, { title, link, self, desc, rows, lang = 'en' }) => {
  const cdata = s => `<![CDATA[${String(s).replace(/\]\]>/g, ']]&gt;')}]]>`;
  const rfc822 = d => new Date(d + 'T09:00:00Z').toUTCString().replace('GMT', '+0000');
  const items = rows.filter(j => j.posted && !Number.isNaN(Date.parse(j.posted))).slice(0, 60).map(j => `  <item>
    <title>${cdata(`${j.title} — ${j.company}`)}</title>
    <link>${esc(BASE + j.path)}</link>
    <guid isPermaLink="true">${esc(BASE + j.path)}</guid>
    <pubDate>${rfc822(j.posted)}</pubDate>
    <category>${esc(DEPTS.find(d => d[0] === j.dept)?.[1] || 'Other')}</category>
    <description>${cdata([j.company, j.location, j.salary, j.wp, j.visa ? 'visa sponsorship' : null].filter(Boolean).join(' · '))}</description>
  </item>`).join('\n');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(title)}</title>
  <link>${link}</link>
  <description>${esc(desc)}</description>
  <language>${lang}</language>
  <lastBuildDate>${new Date().toUTCString().replace('GMT', '+0000')}</lastBuildDate>
  <atom:link href="${self}" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>
`);
};
const newestFirst = (a, b) => (Date.parse(b.posted) || 0) - (Date.parse(a.posted) || 0);
fs.mkdirSync(path.join(ROOT, 'jobs'), { recursive: true });
writeFeed(path.join(ROOT, 'jobs', 'feed.xml'), {
  title: 'neobank jobs · neobankbeat', link: `${BASE}/jobs/`, self: `${BASE}/jobs/feed.xml`, rows: all,
  desc: `The newest roles at ${nCompanies} hiring neobanks, pulled directly from official career APIs. Full board: neobankbeat.com/jobs — raw data: /jobs/data.json.`,
});
for (const co of Object.keys(byCompany)) {
  writeFeed(path.join(ROOT, 'jobs', 'at', companySlug(co), 'feed.xml'), {
    title: `${co} jobs · neobankbeat`, link: `${BASE}${companyPath(co)}`, self: `${BASE}${companyPath(co)}feed.xml`,
    rows: all.filter(j => j.company === co).sort(newestFirst),
    desc: `The newest open roles at ${co}, from its official careers page.`,
  });
}
for (const [id, label] of [...DEPTS.map(d => [d[0], d[1]]), ['other', 'Other']]) {
  if (!byDept[id]) continue;
  writeFeed(path.join(ROOT, 'jobs', id, 'feed.xml'), {
    title: `${label} jobs at neobanks · neobankbeat`, link: `${BASE}/jobs/${id}/`, self: `${BASE}/jobs/${id}/feed.xml`,
    rows: all.filter(j => j.dept === id).sort(newestFirst),
    desc: `The newest ${label.toLowerCase()} roles at hiring neobanks, from official career APIs.`,
  });
}
/* the line a page shows for its feed */
const followLine = (href, what) => `<p class="meta">Follow ${what}: <a href="${href}">RSS feed</a> of new roles, for any feed reader or feed-to-email service.</p>`;

/* ── shared page chrome ── */
const CSS = `
:root{--acc:var(--accent,#FF5C16)}
.jhero{margin-top:8px}
.jstats{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}
.jstat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 18px}
.jstat .n{font-family:'Noto Sans Mono',monospace;font-size:20px;font-weight:700}
.jstat .l{font-family:'Noto Sans Mono',monospace;font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-top:2px}
main.wrap{max-width:1150px}
footer .fwrap{max-width:1150px} /* footer follows the wide jobs layout, not the 760px blog column */
.jhero,main.wrap>article{max-width:760px}
.jlayout{display:grid;grid-template-columns:248px minmax(0,1fr);gap:30px;align-items:start;margin-top:10px}
.jmain{min-width:0}
/* sidebar is taller than the viewport → let it scroll on its own instead of
   trapping the lower filters until the job list runs out */
.jside{position:sticky;top:16px;display:flex;flex-direction:column;gap:14px;max-height:calc(100vh - 32px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--line) transparent;padding-right:6px;margin-right:-6px}
.jside::-webkit-scrollbar{width:5px}
.jside::-webkit-scrollbar-thumb{background:var(--line);border-radius:99px}
.jside::-webkit-scrollbar-track{background:transparent}
#jsearch{width:100%;background:var(--panel);border:1px solid rgba(255,255,255,.38);border-radius:10px;color:var(--text);font-family:'Noto Sans Mono',monospace;font-size:12.5px;padding:10px 12px;box-sizing:border-box;transition:border-color .15s}
#jsearch::placeholder{color:var(--dim)}
#jsearch:hover{border-color:rgba(255,255,255,.6)}
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
.jdate{font-family:'Noto Sans Mono',monospace;font-size:10.5px;color:var(--dim);white-space:nowrap}
.job .apply{font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--acc);white-space:nowrap;margin-left:auto}
.jback{font-family:'Noto Sans Mono',monospace;font-size:12.5px;color:var(--muted);text-decoration:none;display:inline-block;margin-bottom:14px}
.jback:hover{color:var(--acc)}
.jhead{margin:0 0 8px;font-size:clamp(1.6rem,4vw,2.1rem)}
.jmeta{font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--muted);margin:0 0 6px;line-height:1.7}
.jmeta span{display:inline-block;margin-right:12px}
.jdesc{font-size:14px;line-height:1.65;color:var(--text);margin:20px 0;max-width:760px}
.jdesc p{margin:0 0 14px}
.jdesc h3{font-size:14.5px;font-weight:700;color:var(--text);margin:22px 0 10px;font-family:'Noto Sans Mono',monospace;letter-spacing:.03em}
.jdesc h3:first-child{margin-top:0}
.jdesc ul{margin:0 0 16px;padding-left:1.2em}
.jdesc li{margin:0 0 8px}
.jdesc li::marker{color:var(--acc)}
.jnodesc{color:var(--muted);font-size:13.5px}
.japply{display:inline-block;background:var(--acc);color:#0A0A10;font-weight:700;font-family:'Noto Sans Mono',monospace;font-size:13.5px;border-radius:10px;padding:12px 20px;text-decoration:none;margin:8px 0 4px}
.japply:hover{filter:brightness(1.05)}
.jalert{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:16px 0;max-width:560px}
.jalert label{display:block;font-weight:700;font-size:14px;color:var(--text);margin-bottom:9px}
.jalert-row{display:flex;gap:8px;flex-wrap:wrap}
.jalert-row[hidden]{display:none}
.jalert input[type=email]{flex:1 1 200px;min-width:0;background:var(--bg);border:1px solid var(--line);border-radius:9px;color:var(--text);font-family:'Noto Sans Mono',monospace;font-size:13px;padding:10px 12px}
.jalert input[type=email]:focus{outline:none;border-color:var(--acc)}
.jalert button{background:var(--acc);border:0;border-radius:9px;color:#0A0A10;font-family:'Noto Sans Mono',monospace;font-size:12.5px;font-weight:700;padding:10px 16px;cursor:pointer}
.jalert button:disabled{opacity:.55;cursor:default}
.jalert-note{font-size:12px;color:var(--muted);margin:9px 0 0;line-height:1.5}
.jfoot{font-size:12px;color:var(--dim);margin-top:22px;max-width:760px;line-height:1.6}
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

const head = (title, desc, canonical, ld, ogImage, opts = {}) => `<!DOCTYPE html>
<html lang="${opts.lang || 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(clampDesc(desc))}">
<link rel="canonical" href="${canonical}">
${(opts.alts || []).map(([hl, href]) => `<link rel="alternate" hreflang="${hl}" href="${href}">\n`).join('')}${opts.feed ? `<link rel="alternate" type="application/rss+xml" title="${esc(opts.feed[1])}" href="${opts.feed[0]}">\n` : ''}<meta name="theme-color" content="#0A0A10">
<meta property="og:type" content="website">
<meta property="og:site_name" content="neobankbeat">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage || 'https://www.neobankbeat.com/og.png'}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@neobankbeat">
<meta name="twitter:image" content="${ogImage || 'https://www.neobankbeat.com/og.png'}">
<link rel="alternate" type="application/rss+xml" title="neobank jobs · newest roles" href="/jobs/feed.xml">
<link rel="icon" href="/favicon.ico" sizes="64x64">
<link rel="icon" type="image/png" href="/favicon.png" sizes="64x64">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/noto-sans-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="${BLOG_CSS_HREF}">
<style>${CSS}</style>
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};window.nbevt=function(n,d){try{va('event',{name:n,data:d||{}})}catch(_){}try{gtag('event',n,d||{})}catch(_){}}</script>
<script defer src="/_vercel/insights/script.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-E3KE01L5DL"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());if(!(navigator.webdriver||/^(800x600|1280x1200|1366x1366|1280x1600|1024x1024)$/.test(screen.width+"x"+screen.height)))gtag("config","G-E3KE01L5DL")</script>
<script type="application/ld+json">
${JSON.stringify(ld)}
</script>
</head>
<body>
<a class="skip" href="#main">skip to content</a>
<header>
  <div class="hwrap">
    <a href="/" class="logo">neobank<span class="dot">beat</span></a>
    <nav class="hnav" aria-label="Primary">
${navHtml('/jobs/')}
      <button class="bwbtn" id="bwtoggle" aria-pressed="false">◐ black &amp; white</button>
    </nav>
  </div>
</header>
`;

const bwScript = `<script>(function(){var b=document.getElementById('bwtoggle');if(!b)return;function set(on){document.body.classList.toggle('bw',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'◑ color':'◐ black & white';try{localStorage.setItem('nbbw',on?'1':'0')}catch(e){}}try{if(localStorage.getItem('nbbw')==='1')set(true)}catch(e){}b.addEventListener('click',function(){set(!document.body.classList.contains('bw'))})})();
/* job_apply: list clicks + detail-page apply button */
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.job,a.japply');if(!a)return;
var co=(a.querySelector('.co')||{}).textContent||a.dataset.company||'';
var ti=((a.querySelector('.t')||{}).textContent||a.dataset.title||'').slice(0,120);
var dept=(a.querySelector('.jtag')||{}).textContent||a.dataset.dept||'';
nbevt('job_apply',{company:co,title:ti,dept:dept,external:!!a.classList.contains('japply')})});</script>`;

const foot = `
${FOOTER_HTML}
${bwScript}
</body>
</html>
`;

const ago = p => {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(p)) / 86400000));
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 31) return `${days}d ago`;
  return new Date(p).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const jobCard = j => `<a class="job" href="${esc(j.path)}">
  ${logoImg(j.company)}
  <span class="t">${esc(j.title)}</span>
  <span class="co">${esc(j.company)}</span>
  <span class="loc">${esc(j.location)}</span>
  ${j.salary ? `<span class="sal">${esc(j.salary)}</span>` : ''}
  ${j.visa ? '<span class="visa">visa ✓</span>' : ''}
  <span class="jtag">${DEPTS.find(d => d[0] === j.dept)?.[1] || 'Other'}</span>
  ${j.posted && !Number.isNaN(Date.parse(j.posted)) ? `<span class="jdate">${ago(j.posted)}</span>` : ''}
  <span class="apply">check more →</span>
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
function ago(p){const t=Date.parse(p);if(isNaN(t))return'';const d=Math.max(0,Math.floor((Date.now()-t)/86400000));
if(d===0)return'today';if(d===1)return'1d ago';if(d<31)return d+'d ago';
return new Date(t).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
function card(j){const a=document.createElement('a');a.className='job';a.href='/jobs/j/'+j.id+'/';
const lg=LOGOS[j.company]?'<img class="jlogo" loading="lazy" alt="" src="/logos/jobs/'+LOGOS[j.company].toLowerCase().replace(/[^a-z0-9]/g,'-')+'.png" onerror="this.onerror=null;this.src=\\'https://www.google.com/s2/favicons?domain='+esc(LOGOS[j.company])+'&sz=64\\'">':'<span class="jlogo jlogo-fb">'+esc(j.company.charAt(0))+'</span>';
a.innerHTML=lg+'<span class="t"></span><span class="co"></span><span class="loc"></span>'+(j.salary?'<span class="sal">'+esc(j.salary)+'</span>':'')+(j.visa?'<span class="visa">visa ✓</span>':'')+'<span class="jtag">'+deptName[j.dept]+'</span>'+(j.posted&&ago(j.posted)?'<span class="jdate">'+ago(j.posted)+'</span>':'')+'<span class="apply">check more →</span>';
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

/* ── JobPosting structured data: freshest dated roles, for Google Jobs.
   Only roles with a posted date qualify (datePosted is required). ── */
const isDated = j => !!(j.posted && !Number.isNaN(Date.parse(j.posted)));
const jobPosting = j => {
  const descText = (j.description && j.description.length >= 80)
    ? j.description.slice(0, 8000)
    : `${j.title} at ${j.company}${j.location ? ` — ${j.location}` : ''}. Apply on the official ${j.company} careers page.`;
  return {
    '@type': 'JobPosting',
    title: j.title,
    description: descText,
    datePosted: j.posted,
    validThrough: j.posted && !Number.isNaN(Date.parse(j.posted))
      ? new Date(Date.parse(j.posted) + 60 * 86400000).toISOString().slice(0, 10)
      : undefined,
    hiringOrganization: { '@type': 'Organization', name: j.company, sameAs: `https://www.neobankbeat.com${j.profile}` },
    ...(j.wp === 'remote'
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: j.location || 'Worldwide' } }
      : { jobLocation: { '@type': 'Place', address: jobAddress(j.location) } }),
    ...(j.salary ? { baseSalary: { '@type': 'MonetaryAmount', value: j.salary } } : {}),
    ...(employmentType(j) ? { employmentType: employmentType(j) } : {}),
    directApply: false,
    url: `${BASE}${j.path}`,
    identifier: { '@type': 'PropertyValue', name: j.company, value: j.url },
  };
};
/* The careers APIs do not say whether a role is full-time, and every posting
   was marked FULL_TIME anyway, interns included. Claim a type only when the
   title states one. */
function employmentType(j) {
  const t = j.title || '';
  if (/\bintern(ship)?\b|\btrainee\b|\bwerkstudent/i.test(t)) return 'INTERN';
  if (/\bpart[- ]time\b/i.test(t)) return 'PART_TIME';
  if (/\btemporary\b|\bfixed[- ]term\b/i.test(t)) return 'TEMPORARY';
  if (/\bcontractor\b|\(contract\)|\bfreelance/i.test(t)) return 'CONTRACTOR';
  if (/\bfull[- ]time\b/i.test(t)) return 'FULL_TIME';
  return undefined;
}
/* A structured address needs a country, and the feeds write locations a dozen
   ways ("Toronto, ON", "CA", "São Paulo, SP"), where a two-letter tail is as
   often a state as a country. Only a spelled-out country is trusted; anything
   else stays the plain string it always was. */
const JOB_COUNTRIES = { 'united states': 'US', usa: 'US', 'united kingdom': 'GB', uk: 'GB', brazil: 'BR', brasil: 'BR', singapore: 'SG', canada: 'CA', malaysia: 'MY', austria: 'AT', nigeria: 'NG', india: 'IN', philippines: 'PH', uae: 'AE', 'united arab emirates': 'AE', malta: 'MT', spain: 'ES', germany: 'DE', poland: 'PL', thailand: 'TH', 'türkiye': 'TR', turkey: 'TR', hungary: 'HU', slovenia: 'SI', kenya: 'KE', australia: 'AU', lithuania: 'LT', ireland: 'IE', estonia: 'EE', mexico: 'MX', japan: 'JP', france: 'FR', italy: 'IT', portugal: 'PT', netherlands: 'NL', switzerland: 'CH', argentina: 'AR', colombia: 'CO', 'south africa': 'ZA', egypt: 'EG', indonesia: 'ID', vietnam: 'VN', 'south korea': 'KR', sweden: 'SE', denmark: 'DK', cyprus: 'CY', luxembourg: 'LU', belgium: 'BE', 'hong kong sar': 'HK', 'hong kong': 'HK' };
function jobAddress(loc) {
  if (!loc) return '—';
  if (/[;|/]|\bor\b|·/.test(loc)) return loc;
  const parts = loc.split(',').map((x) => x.trim()).filter(Boolean);
  const cc = JOB_COUNTRIES[(parts[parts.length - 1] || '').toLowerCase()];
  if (!cc) return loc;
  if (parts.length === 1) return { '@type': 'PostalAddress', addressCountry: cc };
  return { '@type': 'PostalAddress', addressLocality: parts[0],
    ...(parts.length === 3 ? { addressRegion: parts[1] } : {}), addressCountry: cc };
}
const jobsLd = list => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: list
    .filter(j => j.posted && !Number.isNaN(Date.parse(j.posted)))
    .slice(0, 50)
    .map((j, i) => ({ '@type': 'ListItem', position: i + 1, item: jobPosting(j) })),
});

const jobDetailBackScript = `<script>
(function(){
  if(location.pathname.indexOf('/jobs/j/')!==0)return;
  var from=/[?&]from=match(?:&|$)/.test(location.search)
    ||!!sessionStorage.getItem('nbb_jm')
    ||/\\/jobs\\/match\\//.test(document.referrer||'');
  if(!from)return;
  var a=document.querySelector('a.jback');
  if(a){a.href='/jobs/match/#jmres';a.textContent='← your CV matches';}
})();
</script>`;

function jobDetailHtml(j) {
  const deptLabel = DEPTS.find(d => d[0] === j.dept)?.[1] || 'Other';
  const wpLabels = { remote: 'Remote only', hybrid: 'Hybrid', onsite: 'On-site' };
  const canon = `${BASE}${j.path}`;
  const shortTitle = j.title.length > 72 ? `${j.title.slice(0, 69)}…` : j.title;
  const descMeta = `${j.title} at ${j.company} — ${j.location}. ${deptLabel}. Pulled from the official careers API. Apply on ${j.company}'s site.`;
  const metaLine = [
    j.location && `<span>${esc(j.location)}</span>`,
    `<span>${esc(deptLabel)}</span>`,
    j.wp && `<span>${esc(wpLabels[j.wp] || j.wp)}</span>`,
    j.salary && `<span>${esc(j.salary)}</span>`,
    j.visa && '<span>visa sponsorship</span>',
    j.posted && !Number.isNaN(Date.parse(j.posted)) && `<span>posted ${ago(j.posted)}</span>`,
  ].filter(Boolean).join('');
  const profileLink = j.profile
    ? `<a href="${esc(j.profile)}">${esc(j.company)} profile</a>`
    : esc(j.company);
  return head(
    jobPageTitle(j),
    descMeta,
    canon,
    [
      ...(isDated(j) ? [{ '@context': 'https://schema.org', ...jobPosting(j) }] : []),
      { '@context': 'https://schema.org', ...crumbs(['jobs', `${BASE}/jobs/`], [shortTitle.toLowerCase(), canon]) },
    ],
    ogIf('jobs.png'),
  ) + `
<main class="wrap" id="main">
  <a class="jback" href="/jobs/">← all jobs</a>
  <article style="max-width:760px">
    <div class="eyebrow"><a href="/jobs/${esc(j.dept)}/" style="color:inherit;text-decoration:none">${deptLabel.toLowerCase()}</a> · <a href="${companyPath(j.company)}" style="color:inherit;text-decoration:none">${esc(j.company)}</a></div>
    <h1 class="jhead">${esc(j.title)}</h1>
    <p class="jmeta">${metaLine}</p>
    <div class="jdesc">${descBody(j.description)}</div>
    <a class="japply" href="${esc(j.url)}" target="_blank" rel="noopener noreferrer" data-company="${esc(j.company)}" data-title="${esc(j.title)}" data-dept="${esc(deptLabel)}">Apply on ${esc(j.company)} →</a>
    <p class="jfoot">Listing synced from ${esc(j.company)}'s official careers API · refreshed ${TODAY} · <a href="${companyPath(j.company)}">all ${esc(j.company)} jobs</a> · ${profileLink} · <a href="/jobs/">more neobank jobs</a>. neobankbeat is independent — we earn nothing from applications.</p>
  </article>
</main>
${jobDetailBackScript}
${foot}`;
}

/* ── index page ── */
const topCompanies = Object.entries(byCompany).sort((a, b) => b[1] - a[1]);
const indexHtml = head(
  `Neobank jobs — ${all.length.toLocaleString('en-US')} live roles at ${nCompanies} digital banks`,
  `Live job board for the neobank industry: ${all.length.toLocaleString('en-US')} open roles at ${nCompanies} tracked neobanks — engineering, compliance, onboarding, sales, support and more. Pulled directly from official career APIs, refreshed ${TODAY}.`,
  'https://www.neobankbeat.com/jobs/',
  [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Neobank jobs', url: 'https://www.neobankbeat.com/jobs/', description: `${all.length} live roles at ${nCompanies} neobanks, aggregated from official career APIs.`, isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: 'https://www.neobankbeat.com' } }, { '@context': 'https://schema.org', ...crumbs(['jobs', 'https://www.neobankbeat.com/jobs/']) }, jobsLd(all)],
  ogIf('jobs.png')
) + `
<main class="wrap" id="main">
  <div class="eyebrow">the job board</div>
  <article class="jhero">
  <h1>neobank <em>jobs</em></h1>
  <p class="meta">Every role below is pulled <b>directly from the official career APIs</b> of neobanks in the directory — no stale scrapes, no middlemen. Each role has its own page with the description; apply on the company's site. Refreshed <b>${TODAY}</b>.</p>
  </article>

  <div class="jstats">
    <div class="jstat"><div class="n">${all.length.toLocaleString('en-US')}</div><div class="l">live roles</div></div>
    <div class="jstat"><div class="n">${nCompanies}</div><div class="l">neobanks hiring</div></div>
    <div class="jstat"><div class="n">${salN}</div><div class="l">with disclosed salary</div></div>
  </div>

  <div class="jlayout">
    ${sidebar(null)}
    <div class="jmain">
      <div class="jbar"><span><b id="jcount">${all.length.toLocaleString('en-US')}</b> roles</span><span>newest first · refreshed ${TODAY} · <a href="/jobs/match/" style="color:var(--acc);text-decoration:none">match your CV</a> · <a href="/partner/" style="color:var(--acc);text-decoration:none">hiring? feature your roles</a> · <a href="/jobs/feed.xml" style="color:var(--acc);text-decoration:none">rss</a></span></div>
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
  return `    <a class="cocard" href="${companyPath(co)}">${logoImg(co)}<div><div class="n">${esc(co)}</div><div class="c">${n} open role${n === 1 ? '' : 's'}</div></div></a>`;
}).join('\n')}
  </div>

  <h2>browse by department</h2>
  <div class="cogrid">
${DEPTS.filter(([id]) => byDept[id]).map(([id, label]) =>
  `    <a class="cocard" href="/jobs/${id}/"><div class="n">${label}</div><div class="c">${byDept[id]} open role${byDept[id] === 1 ? '' : 's'}</div></a>`).join('\n')}
  </div>

  <h2>how this board works</h2>
  <p>neobankbeat tracks ${E.length} verified-active neobanks. For every one that exposes a public careers API (Greenhouse, Lever or Ashby), this board pulls the live postings, classifies them by department and region, and gives each role its own page — then links you to the official application. A company missing? <a href="https://github.com/andreolf/neobankbeat/issues/new?labels=jobs-source&amp;template=add-jobs-source.yml">submit it here</a> — drop the careers-page link and we'll wire it in. Hiring and want your roles seen first? <a href="/partner/">Feature them</a>.</p>
  <p style="font-size:12.5px;color:var(--dim)">Listings belong to the respective companies and change constantly; this board refreshes on regeneration (last: ${TODAY}). Subscribe to the newest roles via <a href="/jobs/feed.xml">RSS</a> or pull the raw list from <a href="/jobs/data.json">jobs/data.json</a>. neobankbeat is independent and earns nothing from applications.</p>
  </article>
</main>
${filterScript(null)}
${foot}`;
fs.writeFileSync(path.join(ROOT, 'jobs', 'index.html'), indexHtml);

/* ── per-job detail pages (SEO: one URL per role) ── */
{
  const jRoot = path.join(ROOT, 'jobs', 'j');
  fs.rmSync(jRoot, { recursive: true, force: true });
  for (const j of all) {
    const dir = path.join(jRoot, j.id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), jobDetailHtml(j));
  }
}

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
  other: 'Everything that doesn\u2019t fit a standard bucket — internships, executive roles, country launches and one-off specialist positions.',
};
for (const [id, label] of [...DEPTS.map(d => [d[0], d[1]]), ['other', 'Other']]) {
  const rows = all.filter(j => j.dept === id);
  if (!rows.length) continue;
  const dir = path.join(ROOT, 'jobs', id);
  fs.mkdirSync(dir, { recursive: true });
  const html = head(
    `${label} jobs at neobanks — ${rows.length} live roles`,
    `${rows.length} live ${label.toLowerCase()} roles at ${new Set(rows.map(r => r.company)).size} neobanks, pulled from official career APIs. ${DEPT_COPY[id] || ''} Refreshed ${TODAY}.`,
    `https://www.neobankbeat.com/jobs/${id}/`,
    [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${label} jobs at neobanks`, url: `https://www.neobankbeat.com/jobs/${id}/`, isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: 'https://www.neobankbeat.com' } }, { '@context': 'https://schema.org', ...crumbs(['jobs', 'https://www.neobankbeat.com/jobs/'], [label.toLowerCase(), `https://www.neobankbeat.com/jobs/${id}/`]) }, jobsLd(rows)],
    ogIf('jobs', `${id}.png`),
    { feed: [`/jobs/${id}/feed.xml`, `${label} jobs · newest roles`] }
  ) + `
<main class="wrap" id="main">
  <div class="eyebrow"><a href="/jobs/" style="color:inherit;text-decoration:none">the job board</a> · ${label.toLowerCase()}</div>
  <article class="jhero">
  <h1>${label.toLowerCase()} <em>jobs</em> at neobanks</h1>
  <p class="meta"><b><span id="jcount">${rows.length}</span> live roles</b> at ${new Set(rows.map(r => r.company)).size} digital banks · ${DEPT_COPY[id] || ''} Refreshed ${TODAY}.</p>
  ${alertBox(`dept:${id}`, 'en', `Email me new ${esc(label.toLowerCase())} roles`)}
  ${followLine(`/jobs/${id}/feed.xml`, `${label.toLowerCase()} roles`)}
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

  <article><p style="margin-top:24px"><a href="/jobs/">← all neobank jobs</a> · listings pulled from official Greenhouse/Lever/Ashby APIs · each role has a detail page, apply on the company site.</p></article>
</main>
${filterScript(id)}
${foot}`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

/* ── company pages ── */
/* A listing that has closed answers 404, and 16 of the 25 most-visited missing
   pages on the site were exactly that: someone following a search result or a
   shared link to a role that was filled. 404.html forwards those to the
   company's page with #closed, and this line is what tells them why they are
   looking at a list instead of the role they clicked. */
const closedNotice = (text) => `<p class="meta" id="jclosed" hidden style="border:1px solid var(--line);border-radius:10px;padding:10px 14px">${text}</p>
  <script>if(location.hash==='#closed'){var n=document.getElementById('jclosed');if(n)n.hidden=false;try{window.nbevt&&nbevt('job_closed_redirect',{})}catch(_){}}</script>`;
{
  const atRoot = path.join(ROOT, 'jobs', 'at');
  fs.mkdirSync(atRoot, { recursive: true });
  const MONTH = new Date(TODAY + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const deptLabel = id => DEPTS.find(d => d[0] === id)?.[1] || 'Other';
  const CATLONG = { traditional: 'a traditional (fiat) neobank', hybrid: 'a hybrid fiat-and-crypto neobank', 'web3-native': 'a web3-native money app' };
  const tally = (rows, key) => Object.entries(rows.reduce((a, r) => { const k = key(r); if (k) a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const byPosted = (a, b) => (Date.parse(b.posted) || 0) - (Date.parse(a.posted) || 0);
  const companies = Object.keys(byCompany).sort((a, b) => byCompany[b] - byCompany[a]);

  for (const co of companies) {
    const rows = all.filter(j => j.company === co).sort(byPosted);
    const n = rows.length, ent = companyEntity(co), url = `${BASE}${companyPath(co)}`;
    /* Brazilian employers are searched for in Portuguese, and "vagas" is the
       word in every one of those queries; say it where the query looks. */
    const br = /,\s*BR$/.test(ent?.hq || '');
    const depts = tally(rows, r => r.dept), locs = tally(rows, r => (r.wp === 'remote' ? 'Remote' : r.location && r.location !== 'Not specified' ? r.location : ''));
    const top = depts.filter(([d]) => d !== 'other').slice(0, 3).map(([d, c]) => `${c} ${deptLabel(d).toLowerCase()}`).join(', ');
    const roles = `${n} open role${n === 1 ? '' : 's'}`;
    const title = br ? `Vagas ${co} — ${n} open job${n === 1 ? '' : 's'} (${MONTH})` : `${co} jobs — ${roles} (${MONTH})`;
    const desc = `${br ? `Vagas ${co}: ` : ''}${roles} at ${co}${top ? ` — ${top}` : ''}. From ${co}'s official careers page, refreshed ${TODAY}. Apply on the company site.`;
    const about = ent
      ? `${esc(co)} is ${CATLONG[ent.category] || 'a neobank'}${ent.hq ? ` headquartered in ${esc(ent.hq)}` : ''}${ent.founded ? `, founded in ${ent.founded}` : ''}${ent.regulation_type ? `, operating as a ${esc(ent.regulation_type.toLowerCase())}` : ''}. <a href="/n/${slugify(ent.name)}/">Read the ${esc(co)} profile</a> for custody, license and card details before you apply.`
      : '';
    const ld = [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${co} jobs`, url, dateModified: TODAY,
        description: `${roles} at ${co}, from the company's official careers page.`,
        about: { '@type': 'Organization', name: co, ...(ent?.website ? { url: ent.website } : {}), ...(ent ? { sameAs: `${BASE}/n/${slugify(ent.name)}/` } : {}) },
        mainEntity: { '@type': 'ItemList', numberOfItems: n, itemListElement: rows.slice(0, 100).map((j, i) => ({ '@type': 'ListItem', position: i + 1, name: j.title, url: `${BASE}${j.path}` })) },
        isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: BASE } },
      { '@context': 'https://schema.org', ...crumbs(['jobs', `${BASE}/jobs/`], ['companies', `${BASE}/jobs/at/`], [co.toLowerCase(), url]) },
    ];
    const ptUrl = `${BASE}/pt${companyPath(co)}`;
    const html = head(title, desc, url, ld, ogIf('jobs.png'), {
      feed: [`${companyPath(co)}feed.xml`, `${co} jobs · newest roles`],
      alts: br ? [['en', url], ['pt-BR', ptUrl], ['x-default', url]] : [],
    }) + `
<main class="wrap" id="main">
  <div class="eyebrow"><a href="/jobs/" style="color:inherit;text-decoration:none">the job board</a> · <a href="/jobs/at/" style="color:inherit;text-decoration:none">companies</a></div>
  <article class="jhero">
  <h1>${esc(co)} <em>jobs</em>${br ? ' · vagas' : ''}</h1>
  ${closedNotice(`The role you opened has closed. These are the roles open at ${esc(co)} right now.`)}
  <p class="meta"><b>${roles}</b> at ${esc(co)} across ${depts.length} team${depts.length === 1 ? '' : 's'}${locs.length ? ` and ${locs.length} location${locs.length === 1 ? '' : 's'}` : ''} · pulled from ${esc(co)}'s official careers page · refreshed ${TODAY}.</p>
  ${br ? `<p class="meta">Vagas abertas em ${esc(co)}, direto da página oficial de carreiras. A candidatura é feita no site da empresa.</p>` : ''}
  ${about ? `<p>${about}</p>` : ''}
  </article>

  <article>
  <h2>teams hiring at ${esc(co)}</h2>
  <div class="cogrid">
${depts.map(([d, c]) => `    <a class="cocard" href="#${d}"><div><div class="n">${esc(deptLabel(d))}</div><div class="c">${c} open role${c === 1 ? '' : 's'}</div></div></a>`).join('\n')}
  </div>
  ${locs.length ? `<p class="meta"><b>Where:</b> ${locs.slice(0, 8).map(([l, c]) => `${esc(l)} (${c})`).join(' · ')}${locs.length > 8 ? ` · and ${locs.length - 8} more` : ''}</p>` : ''}
  ${alertBox(`co:${companySlug(co)}`, 'en', `Email me new roles at ${esc(co)}`)}
  ${followLine(`${companyPath(co)}feed.xml`, `${esc(co)}`)}
  ${br ? `<p class="meta"><a href="/pt${companyPath(co)}" hreflang="pt-BR" lang="pt-BR">Ver esta página em português →</a></p>` : ''}
  </article>

${depts.map(([d, c]) => `  <h2 id="${d}" style="max-width:760px;margin-top:28px">${esc(deptLabel(d))} <span style="color:var(--dim);font-weight:400">· ${c}</span></h2>
  <div class="joblist">
${rows.filter(r => r.dept === d).map(jobCard).join('\n')}
  </div>`).join('\n')}

  <article><p class="jfoot">Listings belong to ${esc(co)} and change constantly; every role links to its own page and applications happen on ${esc(co)}'s site. neobankbeat is independent and earns nothing from applications. <a href="/jobs/at/">Other neobanks hiring</a> · <a href="/jobs/">all neobank jobs</a>.</p></article>
</main>
${foot}`;
    const dir = path.join(atRoot, companySlug(co));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }

  /* A company with no roles today keeps its URL. A source that fails to answer
     for one night would otherwise delete a ranking page and bring it back the
     next morning; this says so plainly and stays out of the index until then. */
  const live = new Set(companies.map(companySlug));
  const known = new Set(SOURCES.map(x => companySlug(x[0])));
  for (const d of fs.readdirSync(atRoot, { withFileTypes: true })) {
    if (d.isDirectory() && !known.has(d.name)) fs.rmSync(path.join(atRoot, d.name), { recursive: true, force: true });
  }
  /* every tracked source gets the page, with or without a previous one: a
     closed listing at a company with nothing open still needs somewhere to go */
  for (const src of SOURCES) {
    if (live.has(companySlug(src[0]))) continue;
    const d = { name: companySlug(src[0]) };
    fs.mkdirSync(path.join(atRoot, d.name), { recursive: true });
    const co = src[0], ent = companyEntity(co), url = `${BASE}${companyPath(co)}`;
    fs.writeFileSync(path.join(atRoot, d.name, 'index.html'),
      head(`${co} jobs — no open roles listed right now`, `No open roles are listed at ${co} right now. This page fills again when ${co}'s official careers page lists new ones.`, url,
        [{ '@context': 'https://schema.org', ...crumbs(['jobs', `${BASE}/jobs/`], ['companies', `${BASE}/jobs/at/`], [co.toLowerCase(), url]) }], ogIf('jobs.png'))
        .replace('<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex">') + `
<main class="wrap" id="main">
  <div class="eyebrow"><a href="/jobs/" style="color:inherit;text-decoration:none">the job board</a> · <a href="/jobs/at/" style="color:inherit;text-decoration:none">companies</a></div>
  <article class="jhero">
  <h1>${esc(co)} <em>jobs</em></h1>
  ${closedNotice('The role you opened has closed.')}
  <p class="meta">No open roles are listed at ${esc(co)} right now (checked ${TODAY}). This page fills again as soon as its official careers page lists new ones.</p>
  <p>${ent ? `<a href="/n/${slugify(ent.name)}/">The ${esc(co)} profile</a> · ` : ''}<a href="/jobs/at/">other neobanks hiring</a> · <a href="/jobs/">all neobank jobs</a></p>
  </article>
</main>
${foot}`);
  }

  /* the index of hiring companies: the crawl path to every page above */
  const idxUrl = `${BASE}/jobs/at/`;
  fs.writeFileSync(path.join(atRoot, 'index.html'), head(
    `Neobanks hiring now — ${companies.length} companies, ${all.length.toLocaleString('en-US')} open roles`,
    `${companies.length} neobanks with open roles right now, from ${companies.slice(0, 3).join(', ')} to ${companies[companies.length - 1]}. Every company's live jobs on one page, refreshed ${TODAY}.`,
    idxUrl,
    [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Neobanks hiring now', url: idxUrl, dateModified: TODAY, isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: BASE },
      mainEntity: { '@type': 'ItemList', numberOfItems: companies.length, itemListElement: companies.map((co, i) => ({ '@type': 'ListItem', position: i + 1, name: `${co} jobs`, url: `${BASE}${companyPath(co)}` })) } },
    { '@context': 'https://schema.org', ...crumbs(['jobs', `${BASE}/jobs/`], ['companies', idxUrl]) }],
    ogIf('jobs.png')) + `
<main class="wrap" id="main">
  <div class="eyebrow"><a href="/jobs/" style="color:inherit;text-decoration:none">the job board</a> · companies</div>
  <article class="jhero">
  <h1>neobanks <em>hiring</em> now</h1>
  ${closedNotice('The role you opened has closed. These are the neobanks hiring right now.')}
  <p class="meta"><b>${companies.length} companies</b> with ${all.length.toLocaleString('en-US')} open roles between them, each pulled from the company's own careers page · refreshed ${TODAY}.</p>
  </article>
  <article>
  <div class="cogrid">
${companies.map(co => `    <a class="cocard" href="${companyPath(co)}">${logoImg(co)}<div><div class="n">${esc(co)}</div><div class="c">${byCompany[co]} open role${byCompany[co] === 1 ? '' : 's'}</div></div></a>`).join('\n')}
  </div>
  <p class="jfoot">Only neobanks tracked in the directory with a public careers feed appear here. <a href="/jobs/">Browse every role</a> or filter by department from the job board.</p>
  </article>
</main>
${foot}`);
  console.log(`company pages: ${companies.length} (+ index)`);
}

/* ── Brazil, in Portuguese: /pt/jobs/ and /pt/jobs/at/<company>/ ──
   Brazil sends more search clicks than any other country (382 of 1,663 since
   launch), on queries written in Portuguese: "vagas c6 bank", "banco inter
   vagas", "estágio banco inter". The English company page answers them with one
   borrowed word in its title. These pages answer in the language of the query:
   one per Brazilian employer, and a hub of every role based in Brazil. The role
   titles are the employers' own; the listings themselves stay on one URL. */
const ptPages = [];
{
  const PT_DEPT = { engineering: 'Engenharia', data: 'Dados e IA', product: 'Produto', design: 'Design', compliance: 'Compliance e Risco',
    onboarding: 'Onboarding e KYC', support: 'Atendimento ao Cliente', sales: 'Vendas e Parcerias', marketing: 'Marketing e Growth',
    finance: 'Finanças e Tesouraria', operations: 'Operações', people: 'Pessoas e Jurídico', other: 'Outras áreas' };
  const PT_CAT = { traditional: 'um neobanco tradicional', hybrid: 'um neobanco híbrido (moeda fiduciária e cripto)', 'web3-native': 'um app de dinheiro web3-nativo' };
  const PT_WP = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' };
  const MES = new Date(TODAY + 'T00:00:00Z').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const HOJE = new Date(TODAY + 'T00:00:00Z').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const vagas = n => `${n.toLocaleString('pt-BR')} ${n === 1 ? 'vaga aberta' : 'vagas abertas'}`;
  const ha = p => {
    const d = Math.max(0, Math.floor((Date.now() - Date.parse(p)) / 86400000));
    return d === 0 ? 'hoje' : d === 1 ? 'há 1 dia' : d < 31 ? `há ${d} dias` : new Date(p).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };
  const ptCard = j => `<a class="job" href="${esc(j.path)}">
  ${logoImg(j.company)}
  <span class="t">${esc(j.title)}</span>
  <span class="co">${esc(j.company)}</span>
  <span class="loc">${esc(j.wp === 'remote' ? 'Remoto' : j.location)}</span>
  ${j.salary ? `<span class="sal">${esc(j.salary)}</span>` : ''}
  <span class="jtag">${PT_DEPT[j.dept] || PT_DEPT.other}</span>
  ${isDated(j) ? `<span class="jdate">${ha(j.posted)}</span>` : ''}
  <span class="apply">ver vaga →</span>
</a>`;
  const tally = (rows, key) => Object.entries(rows.reduce((a, r) => { const k = key(r); if (k) a[k] = (a[k] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const fechada = closedNotice;
  const brCompanies = Object.keys(byCompany).filter(co => /,\s*BR$/.test(companyEntity(co)?.hq || '')).sort((a, b) => byCompany[b] - byCompany[a]);
  const ptRoot = path.join(ROOT, 'pt', 'jobs');
  fs.rmSync(ptRoot, { recursive: true, force: true });
  const hubUrl = `${BASE}/pt/jobs/`;

  for (const co of brCompanies) {
    const rows = all.filter(j => j.company === co).sort(newestFirst);
    const n = rows.length, ent = companyEntity(co), enUrl = `${BASE}${companyPath(co)}`, url = `${BASE}/pt${companyPath(co)}`;
    const depts = tally(rows, r => r.dept), locs = tally(rows, r => (r.wp === 'remote' ? 'Remoto' : r.location && r.location !== 'Not specified' ? r.location : ''));
    const top = depts.filter(([d]) => d !== 'other').slice(0, 3).map(([d, c]) => `${c} em ${PT_DEPT[d]}`).join(', ');
    const title = `Vagas ${co}: ${vagas(n)} (${MES})`;
    const desc = `${vagas(n)} no ${co}${top ? `: ${top}` : ''}. Direto da página oficial de carreiras do ${co}, atualizado em ${HOJE}. A candidatura é feita no site da empresa.`;
    const sobre = ent
      ? `O ${esc(co)} é ${PT_CAT[ent.category] || 'um neobanco'}${ent.hq ? ` com sede em ${esc(ent.hq.replace(/, BR$/, ', Brasil'))}` : ''}${ent.founded ? `, fundado em ${ent.founded}` : ''}. <a href="/pt/n/${slugify(ent.name)}/">Veja o perfil do ${esc(co)}</a> para detalhes de custódia, licença e cartão antes de se candidatar.`
      : '';
    const ld = [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `Vagas ${co}`, url, inLanguage: 'pt-BR', dateModified: TODAY,
        description: `${vagas(n)} no ${co}, da página oficial de carreiras da empresa.`,
        about: { '@type': 'Organization', name: co, ...(ent?.website ? { url: ent.website } : {}), ...(ent ? { sameAs: `${BASE}/n/${slugify(ent.name)}/` } : {}) },
        mainEntity: { '@type': 'ItemList', numberOfItems: n, itemListElement: rows.slice(0, 100).map((j, i) => ({ '@type': 'ListItem', position: i + 1, name: j.title, url: `${BASE}${j.path}` })) },
        isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: BASE } },
      { '@context': 'https://schema.org', ...crumbs(['vagas no Brasil', hubUrl], [co.toLowerCase(), url]) },
    ];
    const html = head(title, desc, url, ld, ogIf('jobs.png'), {
      lang: 'pt-BR', alts: [['en', enUrl], ['pt-BR', url], ['x-default', enUrl]],
      feed: [`${companyPath(co)}feed.xml`, `Vagas ${co} · mais recentes`],
    }) + `
<main class="wrap" id="main">
  <div class="eyebrow"><a href="/pt/jobs/" style="color:inherit;text-decoration:none">vagas no Brasil</a> · ${esc(co)}</div>
  <article class="jhero">
  <h1>Vagas <em>${esc(co)}</em></h1>
  ${fechada(`A vaga que você abriu foi encerrada. Estas são as vagas abertas no ${esc(co)} agora.`)}
  <p class="meta"><b>${vagas(n)}</b> no ${esc(co)} em ${depts.length} ${depts.length === 1 ? 'área' : 'áreas'}${locs.length ? ` e ${locs.length} ${locs.length === 1 ? 'localidade' : 'localidades'}` : ''} · direto da página oficial de carreiras · atualizado em ${HOJE}.</p>
  ${sobre ? `<p>${sobre}</p>` : ''}
  <p class="meta">As vagas são publicadas pela empresa e a candidatura é feita no site dela. O neobankbeat é independente e não ganha nada com candidaturas. <a href="${companyPath(co)}" hreflang="en" lang="en">This page in English →</a></p>
  </article>

  <article>
  <h2>áreas contratando no ${esc(co)}</h2>
  <div class="cogrid">
${depts.map(([d, c]) => `    <a class="cocard" href="#${d}"><div><div class="n">${esc(PT_DEPT[d] || PT_DEPT.other)}</div><div class="c">${vagas(c)}</div></div></a>`).join('\n')}
  </div>
  ${locs.length ? `<p class="meta"><b>Onde:</b> ${locs.slice(0, 8).map(([l, c]) => `${esc(l)} (${c})`).join(' · ')}${locs.length > 8 ? ` · e mais ${locs.length - 8}` : ''}</p>` : ''}
  ${alertBox(`co:${companySlug(co)}`, 'pt', `Receba por e-mail as novas vagas do ${esc(co)}`)}
  <p class="meta">Acompanhe as novas vagas do ${esc(co)}: <a href="${companyPath(co)}feed.xml">feed RSS</a>, para qualquer leitor de feeds ou serviço de feed por e-mail.</p>
  </article>

${depts.map(([d, c]) => `  <h2 id="${d}" style="max-width:760px;margin-top:28px">${esc(PT_DEPT[d] || PT_DEPT.other)} <span style="color:var(--dim);font-weight:400">· ${c}</span></h2>
  <div class="joblist">
${rows.filter(r => r.dept === d).map(ptCard).join('\n')}
  </div>`).join('\n')}

  <article><p class="jfoot">Cada vaga abre em sua própria página, com a descrição publicada pela empresa. <a href="/pt/jobs/">Todas as vagas em neobancos no Brasil</a> · <a href="/jobs/" hreflang="en" lang="en">all neobank jobs (English)</a>.</p></article>
</main>
${foot}`;
    const dir = path.join(ptRoot, 'at', companySlug(co));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    ptPages.push(`/pt${companyPath(co)}`);
  }

  /* the hub: Brazilian employers first, then every role based in Brazil */
  const brRoles = all.filter(j => inBrazil(j) || brCompanies.includes(j.company)).sort(newestFirst);
  if (brRoles.length) {
    const others = tally(brRoles.filter(j => !brCompanies.includes(j.company)), r => r.company);
    const employers = new Set(brRoles.map(j => j.company)).size;
    const hub = head(
      `Vagas em neobancos no Brasil: ${vagas(brRoles.length)} (${MES})`,
      `${vagas(brRoles.length)} em ${employers} neobancos e fintechs no Brasil${brCompanies.length ? `, incluindo ${brCompanies.slice(0, 3).join(', ')}` : ''}. Direto das páginas oficiais de carreiras, atualizado em ${HOJE}.`,
      hubUrl,
      [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Vagas em neobancos no Brasil', url: hubUrl, inLanguage: 'pt-BR', dateModified: TODAY, isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: BASE },
        mainEntity: { '@type': 'ItemList', numberOfItems: brRoles.length, itemListElement: brRoles.slice(0, 100).map((j, i) => ({ '@type': 'ListItem', position: i + 1, name: `${j.title} — ${j.company}`, url: `${BASE}${j.path}` })) } },
      { '@context': 'https://schema.org', ...crumbs(['vagas no Brasil', hubUrl]) }],
      ogIf('jobs.png'), { lang: 'pt-BR' }) + `
<main class="wrap" id="main">
  <div class="eyebrow"><a href="/jobs/" style="color:inherit;text-decoration:none" hreflang="en">the job board</a> · Brasil</div>
  <article class="jhero">
  <h1>Vagas em <em>neobancos</em> no Brasil</h1>
  <p class="meta"><b>${vagas(brRoles.length)}</b> em ${employers} empresas · direto das páginas oficiais de carreiras · atualizado em ${HOJE}.</p>
  <p>Todas as vagas abertas nos neobancos brasileiros acompanhados pelo neobankbeat, e as vagas baseadas no Brasil em neobancos de outros países. A candidatura é sempre feita no site da empresa; o neobankbeat é independente e não ganha nada com candidaturas.</p>
  ${alertBox('br', 'pt', 'Receba por e-mail as novas vagas em neobancos no Brasil')}
  </article>

  <article>
  <h2>neobancos brasileiros contratando</h2>
  <div class="cogrid">
${brCompanies.map(co => `    <a class="cocard" href="/pt${companyPath(co)}">${logoImg(co)}<div><div class="n">${esc(co)}</div><div class="c">${vagas(byCompany[co])}</div></div></a>`).join('\n')}
  </div>
  ${others.length ? `<h2>outras empresas com vagas no Brasil</h2>
  <div class="cogrid">
${others.map(([co, c]) => `    <a class="cocard" href="#${companySlug(co)}">${logoImg(co)}<div><div class="n">${esc(co)}</div><div class="c">${vagas(c)} no Brasil</div></div></a>`).join('\n')}
  </div>` : ''}
  </article>

${others.map(([co, c]) => `  <h2 id="${companySlug(co)}" style="max-width:760px;margin-top:28px">${esc(co)} <span style="color:var(--dim);font-weight:400">· ${c} no Brasil</span></h2>
  <div class="joblist">
${brRoles.filter(r => r.company === co).map(ptCard).join('\n')}
  </div>
  <p class="meta" style="max-width:760px"><a href="${companyPath(co)}" hreflang="en">Todas as vagas do ${esc(co)} (em inglês) →</a></p>`).join('\n')}

  <article><p class="jfoot">As vagas pertencem às respectivas empresas e mudam o tempo todo. <a href="/jobs/" hreflang="en" lang="en">All neobank jobs (English)</a> · <a href="/pt/">neobankbeat em português</a>.</p></article>
</main>
${foot}`;
    fs.mkdirSync(ptRoot, { recursive: true });
    fs.writeFileSync(path.join(ptRoot, 'index.html'), hub);
    ptPages.push('/pt/jobs/');
  }
  console.log(`portuguese job pages: ${ptPages.length} (${brCompanies.join(', ')})`);
}

/* ── /jobs/alerts/ — what an alert is, what is kept, and where the links land ──
   The confirm and unsubscribe links come back here with ?state=…, so this page
   is also the receipt. Until alerts are live it is noindex and says so. */
{
  const url = `${BASE}/jobs/alerts/`;
  const html = head('Job alerts by email — how they work · neobankbeat',
    'Follow one neobank or one line of work and get its new roles by email, at most once a week. What is stored, how to unsubscribe, and the feeds behind it.',
    url, [{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Job alerts', url, isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: BASE } },
      { '@context': 'https://schema.org', ...crumbs(['jobs', `${BASE}/jobs/`], ['alerts', url]) }], ogIf('jobs.png'))
    .replace('<meta name="viewport" content="width=device-width, initial-scale=1">', `<meta name="viewport" content="width=device-width, initial-scale=1">${ALERTS_LIVE ? '' : '\n<meta name="robots" content="noindex">'}`)
    /* No analytics on this one page. Its links carry a token that identifies a
       subscriber, and neither Google nor Vercel should ever be handed that URL. */
    .split('\n').filter(l => !/googletagmanager\.com|gtag\("js"|_vercel\/insights/.test(l)).join('\n') + `
<main class="wrap" id="main">
  <div class="eyebrow"><a href="/jobs/" style="color:inherit;text-decoration:none">the job board</a> · alerts</div>
  <article class="jhero">
  <h1>job <em>alerts</em></h1>
  <p class="meta" id="jstate" role="status" hidden style="border:1px solid var(--line);border-radius:10px;padding:10px 14px"></p>
  ${ALERTS_LIVE
    ? '<p>Pick one neobank or one line of work, leave your email on its page, and its new roles arrive in your inbox. At most one email a week, and none when nothing is new.</p>'
    : '<p>Email alerts are not switched on yet. Every hiring neobank and every department already has a feed of its new roles, which any feed reader can follow.</p>'}
  </article>
  <article>
  <h2>where to sign up</h2>
  <p>On the page of what you want to follow: a company in <a href="/jobs/at/">neobanks hiring now</a>, a department from <a href="/jobs/">the job board</a>, or every role based in Brazil on <a href="/pt/jobs/" hreflang="pt-BR">vagas no Brasil</a>. Each of those pages also links its own RSS feed.</p>
  <h2>what happens when you sign up</h2>
  <ol>
    <li>You get one email with a link to confirm. Nothing is stored until you click it; if you never do, there is no record of the request.</li>
    <li>From then on, a digest of new roles for what you follow, at most once a week.</li>
    <li>Every digest has an unsubscribe link. One click deletes your record; there is no account and nothing to log in to.</li>
  </ol>
  <h2>what is kept</h2>
  <p>Your email address, what you chose to follow, the language of the page you signed up on, and the dates you confirmed and were last emailed. That is all. It is stored with Upstash (the database) and sent through Resend (the mail service), and used for these alerts and nothing else: no newsletter, no sharing, no tracking pixels. Unsubscribing deletes it.</p>
  <p class="jfoot">Listings belong to the companies that post them and applications happen on their sites. neobankbeat is independent and earns nothing from applications. Questions: <a href="https://github.com/andreolf/neobankbeat/issues">open an issue</a>.</p>
  </article>
</main>
<script>(function(){
var n=document.getElementById('jstate');if(!n)return;
var M={confirmed:'Your alert is on. The first digest arrives when there are new roles.',unsubscribed:'You are unsubscribed and your record is deleted.',expired:'That link has expired or is not valid. Sign up again from the page you want to follow.',error:'Something went wrong on our side. Please try again in a moment.',off:'Email alerts are not switched on yet.'};
var m=location.hash.match(/^#(confirm|unsubscribe)=([A-Za-z0-9_.-]+)$/);if(!m)return;
var what=m[1],tok=m[2];
/* take the token out of the address bar: it identifies the subscriber */
try{history.replaceState(null,'',location.pathname)}catch(_){}
var b=document.createElement('button');b.type='button';b.textContent=what==='confirm'?'Confirm my alert':'Unsubscribe me';
b.style.cssText='margin-left:10px;background:var(--acc);border:0;border-radius:9px;color:#0A0A10;font-family:inherit;font-size:12.5px;font-weight:700;padding:8px 14px;cursor:pointer';
n.textContent=what==='confirm'?'One click to switch your alert on.':'One click to stop all alerts and delete your record.';n.appendChild(b);n.hidden=false;
b.addEventListener('click',function(){b.disabled=true;fetch('/api/alerts/'+what+'?t='+encodeURIComponent(tok),{method:'POST'}).then(function(r){return r.json()}).then(function(j){n.textContent=M[j&&j.state]||M.error}).catch(function(){n.textContent=M.error})});
})();</script>
${foot}`;
  fs.mkdirSync(path.join(ROOT, 'jobs', 'alerts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'jobs', 'alerts', 'index.html'), html);
}

/* every job URL build-pages folds into the sitemap: written last, once the
   company and Portuguese pages exist to be listed */
fs.writeFileSync(path.join(ROOT, 'jobs', 'sitemap-urls.json'), JSON.stringify({
  generated: TODAY,
  count: all.length,
  urls: [{ loc: `${BASE}/jobs/at/` }, ...(ALERTS_LIVE ? [{ loc: `${BASE}/jobs/alerts/` }] : []), ...Object.keys(byCompany).sort().map(co => ({ loc: `${BASE}${companyPath(co)}` })),
    ...ptPages.map(p => ({ loc: `${BASE}${p}` })), ...all.map(j => ({ loc: `${BASE}${j.path}` }))],
}));

/* Inline scripts are assembled inside template literals, so a stray escape
   (\x00 instead of \\x00) emits raw control bytes. Node still parses those, but
   the HTML tokenizer rewrites NUL to U+FFFD, so the browser sees different
   source and can die on the whole script. Check what the browser would get. */
function assertInlineScriptsParse(html, label) {
  for (const [, attrs, code] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=|type="application\/ld\+json"/.test(attrs) || !code.trim()) continue;
    const ctrl = code.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/);
    if (ctrl) throw new Error(`${label}: inline script contains a raw control character (U+${ctrl[0].codePointAt(0).toString(16).padStart(4, '0')}) — double the backslash in the template literal`);
    try {
      new Function(code.replace(/\0/g, '\uFFFD'));
    } catch (e) {
      throw new Error(`${label}: inline script does not parse — ${e.message}`);
    }
  }
}

/* ── CV match page (client-side only — nothing uploaded or stored) ── */
{
  const deptLabels = Object.fromEntries([...DEPTS.map(d => [d[0], d[1]]), ['other', 'Other']]);
  const matchDir = path.join(ROOT, 'jobs', 'match');
  fs.mkdirSync(matchDir, { recursive: true });
  const matchHtml = head(
    'Match your CV to neobank jobs — private, in-browser · neobankbeat',
    `Upload or paste your CV and get matched against ${all.length.toLocaleString('en-US')} live neobank roles — processed entirely in your browser, nothing uploaded or stored.`,
    `${BASE}/jobs/match/`,
    [
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'neobankbeat CV job matcher', url: `${BASE}/jobs/match/`, applicationCategory: 'BusinessApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description: 'Client-side CV matching against the neobankbeat jobs board. No upload, no storage.' },
      { '@context': 'https://schema.org', ...crumbs(['jobs', `${BASE}/jobs/`], ['match your CV', `${BASE}/jobs/match/`]) },
    ],
    ogIf('jobs', 'match.png'),
  ).replace(`<style>${CSS}</style>`, `<style>${CSS}${jobMatchCss()}</style>`) + `
<main class="wrap" id="main">
  <a class="jback" href="/jobs/">← all jobs</a>
  <article class="jhero" style="max-width:760px">
    <div class="eyebrow">the job board · cv match</div>
    <h1>find roles that <em>fit your CV</em></h1>
    <p class="meta">Upload or paste your résumé — scored against <b>${all.length.toLocaleString('en-US')}</b> live neobank roles. One panel, zero server.</p>
  </article>
${jobMatchHtml(all.length, nCompanies)}
</main>
${jobMatchScript(deptLabels)}
${foot}`;
  assertInlineScriptsParse(matchHtml, 'jobs/match/index.html');
  fs.writeFileSync(path.join(matchDir, 'index.html'), matchHtml);
}

console.log(`jobs board built · ${all.length} roles · ${nCompanies} companies · ${Object.keys(byDept).length} departments · ${all.length} detail pages · cv match · refreshed ${TODAY}`);
