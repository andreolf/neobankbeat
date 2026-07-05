/* build-jobs.mjs — the neobank jobs aggregator.
   Pulls live postings from public ATS APIs (Greenhouse / Lever / Ashby) of
   tracked neobanks, classifies them into departments + regions, and emits:
     jobs/data.json        full normalized job list
     jobs/index.html       the board (filters client-side, top jobs baked for SEO)
     jobs/<dept>/index.html per-department SEO pages
   run: node build-jobs.mjs   (re-run any time to refresh listings)          */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8')).entities;
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
  ['Relay', 'Relay', 'ashby', 'relay'],
  ['Allica Bank', 'Allica Bank', 'ashby', 'allica-bank'],
  ['Gemini', 'Gemini Credit Card', 'gh', 'gemini'],
  ['KOHO', 'KOHO', 'ashby', 'koho'],
  ['Lunar', 'Lunar', 'ashby', 'lunar'],
  ['Ether.fi', 'EtherFi Cash', 'ashby', 'ether.fi'],
  ['Phantom', 'Phantom', 'ashby', 'phantom'],
  ['ConsenSys (MetaMask)', 'MetaMask', 'gh', 'consensys'],
  ['Fi Money', 'Fi Money', 'lever', 'epifi'],
  ['Found', 'Found', 'ashby', 'found'],
  ['Current', 'Current', 'gh', 'current'],
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

/* ── fetch + normalize ── */
async function fetchSource([display, entityName, ats, slug]) {
  const ent = E.find(e => e.name === entityName);
  const profile = ent ? `/n/${slugify(ent.name)}/` : null;
  const url = ats === 'gh'
    ? `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
    : ats === 'lever'
      ? `https://api.lever.co/v0/postings/${slug}?mode=json`
      : `https://api.ashbyhq.com/posting-api/job-board/${slug}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'neobankbeat-jobs/1.0' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    let rows = [];
    if (ats === 'gh') rows = (j.jobs || []).map(x => ({
      t: x.title, u: x.absolute_url, l: x.location?.name || '', d: null, p: (x.updated_at || '').slice(0, 10),
    }));
    else if (ats === 'lever') rows = (Array.isArray(j) ? j : []).map(x => ({
      t: x.text, u: x.hostedUrl, l: x.categories?.location || '', d: x.categories?.team || x.categories?.department || null,
      p: x.createdAt ? new Date(x.createdAt).toISOString().slice(0, 10) : '',
    }));
    else rows = (j.jobs || []).map(x => ({
      t: x.title, u: x.jobUrl || x.applyUrl, l: [x.location, ...(x.secondaryLocations || []).map(s => s.location)].filter(Boolean).join(' · '),
      d: x.department || x.team || null, p: (x.publishedDate || '').slice(0, 10), r: !!x.isRemote,
    }));
    return rows.filter(x => x.t && x.u).map(x => ({
      title: x.t.trim(), url: x.u, company: display, profile,
      location: (x.l || '').trim() || 'Not specified',
      dept: classify(x.t, x.d), region: region(`${x.l} ${x.t}`, x.r), posted: x.p || null,
    }));
  } catch (err) {
    console.error(`  !! ${display}: ${err.message}`);
    return [];
  }
}

console.log('fetching live postings from', SOURCES.length, 'ATS boards…');
const all = (await Promise.all(SOURCES.map(fetchSource))).flat();
all.sort((a, b) => (b.posted || '').localeCompare(a.posted || '') || a.company.localeCompare(b.company));
const TODAY = new Date().toISOString().slice(0, 10);

const byDept = {};
for (const j of all) byDept[j.dept] = (byDept[j.dept] || 0) + 1;
const byCompany = {};
for (const j of all) byCompany[j.company] = (byCompany[j.company] || 0) + 1;
const nCompanies = Object.keys(byCompany).length;

fs.mkdirSync(path.join(ROOT, 'jobs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'jobs', 'data.json'), JSON.stringify({ generated: TODAY, count: all.length, companies: nCompanies, jobs: all }));

/* ── shared page chrome ── */
const CSS = `
:root{--acc:var(--accent,#FF5C16)}
.jhero{margin-top:8px}
.jstats{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}
.jstat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 18px}
.jstat .n{font-family:'Noto Sans Mono',monospace;font-size:20px;font-weight:700}
.jstat .l{font-family:'Noto Sans Mono',monospace;font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-top:2px}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
.chip{font-family:'Noto Sans Mono',monospace;font-size:12px;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:6px 13px;cursor:pointer;text-decoration:none;display:inline-block}
.chip:hover{color:var(--text);border-color:var(--muted)}
.chip.on{background:var(--acc);border-color:var(--acc);color:#0A0A10;font-weight:700}
.chip .c{opacity:.65;margin-left:4px}
#jsearch{width:100%;max-width:420px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--text);font-family:'Noto Sans Mono',monospace;font-size:13px;padding:11px 14px;margin:6px 0 4px}
#jsearch:focus{outline:none;border-color:var(--acc)}
.joblist{margin:18px 0;display:flex;flex-direction:column;gap:10px}
.job{display:grid;grid-template-columns:1fr auto;gap:4px 16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 18px;text-decoration:none;transition:border-color .15s}
.job:hover{border-color:var(--acc)}
.job .t{font-weight:700;font-size:15.5px;color:var(--text)}
.job .m{font-family:'Noto Sans Mono',monospace;font-size:11.5px;color:var(--muted)}
.job .m b{color:var(--acc);font-weight:500}
.job .tags{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}
.jtag{font-family:'Noto Sans Mono',monospace;font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);border:1px solid var(--line);border-radius:99px;padding:2px 9px}
.job .apply{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--acc);align-self:start;white-space:nowrap}
.jmore{text-align:center;margin:18px 0}
.jmore button{font-family:'Noto Sans Mono',monospace;font-size:13px;background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:11px 22px;cursor:pointer}
.jmore button:hover{border-color:var(--acc)}
.cogrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin:16px 0}
.cocard{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;text-decoration:none}
.cocard:hover{border-color:var(--acc)}
.cocard .n{font-weight:700;color:var(--text);font-size:14px}
.cocard .c{font-family:'Noto Sans Mono',monospace;font-size:11px;color:var(--muted);margin-top:2px}
@media(max-width:640px){.job{grid-template-columns:1fr}.job .apply{display:none}}
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Noto+Sans+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog/blog.css">
<style>${CSS}</style>
<script defer src="/_vercel/insights/script.js"></script>
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
      <a href="/blog/">blog</a>
      <a href="/report/">report</a>
      <a href="/jobs/" class="on">jobs</a>
    </nav>
  </div>
</header>
`;

const foot = `
<footer><div class="fwrap">
  <span>© neobankbeat · MIT</span>
  <a href="/">directory</a><a href="/blog/">blog</a><a href="/report/">report</a><a href="/jobs/">jobs</a><a href="/data.json">data.json</a><a href="https://github.com/andreolf/neobankbeat">github</a>
</div></footer>
</body>
</html>
`;

const jobCard = j => `<a class="job" href="${esc(j.url)}" target="_blank" rel="noopener">
  <span class="t">${esc(j.title)}</span>
  <span class="apply">apply →</span>
  <span class="m"><b>${esc(j.company)}</b> · ${esc(j.location)}${j.posted ? ` · ${j.posted}` : ''}</span>
  <span class="tags"><span class="jtag">${DEPTS.find(d => d[0] === j.dept)?.[1] || 'Other'}</span><span class="jtag">${REGION_LABELS[j.region]}</span></span>
</a>`;

const filterScript = (preset) => `<script>
let JOBS=[],shown=0,f={dept:${preset ? `'${preset}'` : 'null'},region:null,q:''};
const STEP=60,list=document.getElementById('jlist'),more=document.getElementById('jmore');
const deptName=${JSON.stringify(Object.fromEntries(DEPTS.map(d => [d[0], d[1]])))};deptName.other='Other';
const regName=${JSON.stringify(REGION_LABELS)};
fetch('/jobs/data.json').then(r=>r.json()).then(d=>{JOBS=d.jobs;render(true)});
function match(j){return (!f.dept||j.dept===f.dept)&&(!f.region||j.region===f.region)&&(!f.q||(j.title+' '+j.company+' '+j.location).toLowerCase().includes(f.q))}
function card(j){const a=document.createElement('a');a.className='job';a.href=j.url;a.target='_blank';a.rel='noopener';
a.innerHTML='<span class="t"></span><span class="apply">apply →</span><span class="m"><b></b> · '+esc(j.location)+(j.posted?' · '+j.posted:'')+'</span><span class="tags"><span class="jtag">'+deptName[j.dept]+'</span><span class="jtag">'+regName[j.region]+'</span></span>';
a.querySelector('.t').textContent=j.title;a.querySelector('.m b').textContent=j.company;return a}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function render(reset){if(!JOBS.length)return;if(reset){list.innerHTML='';shown=0}
const hits=JOBS.filter(match);document.getElementById('jcount').textContent=hits.length;
const batch=hits.slice(shown,shown+STEP);batch.forEach(j=>list.appendChild(card(j)));shown+=batch.length;
more.style.display=shown<hits.length?'':'none'}
more.querySelector('button').addEventListener('click',()=>render(false));
document.getElementById('jsearch').addEventListener('input',e=>{f.q=e.target.value.toLowerCase().trim();render(true)});
document.querySelectorAll('[data-dept]').forEach(c=>c.addEventListener('click',e=>{e.preventDefault();
const v=c.dataset.dept||null;f.dept=f.dept===v?null:v;document.querySelectorAll('[data-dept]').forEach(x=>x.classList.toggle('on',x.dataset.dept===f.dept&&f.dept));render(true)}));
document.querySelectorAll('[data-region]').forEach(c=>c.addEventListener('click',()=>{const v=c.dataset.region||null;
f.region=f.region===v?null:v;document.querySelectorAll('[data-region]').forEach(x=>x.classList.toggle('on',x.dataset.region===f.region&&f.region));render(true)}));
</script>`;

const deptChips = (activeId, asLinks) => `<div class="chips">
${DEPTS.map(([id, label]) => byDept[id] ? (asLinks
  ? `<a class="chip${id === activeId ? ' on' : ''}" href="/jobs/${id}/">${label}<span class="c">${byDept[id]}</span></a>`
  : `<span class="chip" data-dept="${id}">${label}<span class="c">${byDept[id]}</span></span>`) : '').join('\n')}
${byDept.other && !asLinks ? `<span class="chip" data-dept="other">Other<span class="c">${byDept.other}</span></span>` : ''}
</div>`;

const regionChips = `<div class="chips">
${Object.entries(REGION_LABELS).map(([id, label]) => {
  const n = all.filter(j => j.region === id).length;
  return n ? `<span class="chip" data-region="${id}">${label}<span class="c">${n}</span></span>` : '';
}).join('\n')}
</div>`;

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
    <div class="jstat"><div class="n" id="jcount">${all.length.toLocaleString('en-US')}</div><div class="l">live roles</div></div>
    <div class="jstat"><div class="n">${nCompanies}</div><div class="l">neobanks hiring</div></div>
    <div class="jstat"><div class="n">${Object.keys(byDept).length}</div><div class="l">departments</div></div>
  </div>

  <input id="jsearch" type="search" placeholder="search title, company, city… " aria-label="Search jobs">
  ${deptChips(null, false)}
  ${regionChips}

  <div class="joblist" id="jlist">
${all.slice(0, 60).map(jobCard).join('\n')}
  </div>
  <div class="jmore" id="jmore"><button>show more roles</button></div>

  <article>
  <h2>who's hiring</h2>
  <div class="cogrid">
${topCompanies.map(([co, n]) => {
  const src = SOURCES.find(s => s[0] === co);
  const ent = src && E.find(e => e.name === src[1]);
  const href = ent ? `/n/${slugify(ent.name)}/` : '#';
  return `    <a class="cocard" href="${href}"><div class="n">${esc(co)}</div><div class="c">${n} open role${n === 1 ? '' : 's'}</div></a>`;
}).join('\n')}
  </div>

  <h2>browse by department</h2>
  ${deptChips(null, true)}

  <h2>how this board works</h2>
  <p>neobankbeat tracks ${E.length} verified-active neobanks. For every one that exposes a public careers API (Greenhouse, Lever or Ashby), this board pulls the live postings, classifies them by department and region, and links you straight to the official application page — the same aggregator model as web3.career, but for digital banking. No accounts, no reposts, no fees. A company missing? Their ATS has no public API yet — <a href="https://github.com/andreolf/neobankbeat/issues">tell us</a> and we'll wire it in.</p>
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

  <input id="jsearch" type="search" placeholder="search title, company, city…" aria-label="Search jobs">
  ${deptChips(id, true)}
  ${regionChips}

  <div class="joblist" id="jlist">
${rows.slice(0, 60).map(jobCard).join('\n')}
  </div>
  <div class="jmore" id="jmore"><button>show more roles</button></div>

  <article><p style="margin-top:24px"><a href="/jobs/">← all neobank jobs</a> · listings pulled from official Greenhouse/Lever/Ashby APIs · apply links go straight to the company.</p></article>
</main>
${filterScript(id)}
${foot}`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

console.log(`jobs board built · ${all.length} roles · ${nCompanies} companies · ${Object.keys(byDept).length} departments · refreshed ${TODAY}`);
