/* build-pages.mjs — generates static SEO pages from data.json:
   /n/<slug>/          357 entity profile pages
   /vs/<a>-vs-<b>/     curated comparison pages
   sitemap.xml         regenerated with every URL
   run: node build-pages.mjs                                     */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));
const E = data.entities;
const BASE = 'https://www.neobankbeat.com';
const TODAY = new Date().toISOString().slice(0, 10);

const slugify = n => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugs = new Map();          // name -> slug (uniquified)
const taken = new Set();
for (const e of E) {
  let s = slugify(e.name) || 'entity';
  while (taken.has(s)) s += '-2';
  taken.add(s); slugs.set(e.name, s);
}

const CATCHIP = { 'traditional': ['t', 'traditional'], 'hybrid': ['h', 'hybrid'], 'web3-native': ['w', 'web3-native'] };
const catChip = e => { const [cls, label] = CATCHIP[e.category]; return `<span class="chip ${cls}">${label}</span>`; };
const users = e => e.reported_users ? `${esc(e.reported_users.value_millions)}M ${esc(e.reported_users.metric)}${e.reported_users.as_of ? ' (' + esc(e.reported_users.as_of) + ')' : ''}` : null;

const head = (title, desc, canonical, ldjson) => `<!DOCTYPE html>
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
<meta property="og:image" content="${BASE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${BASE}/og.png">
<link rel="icon" href="/favicon.ico" sizes="64x64">
<link rel="icon" type="image/png" href="/favicon.png" sizes="64x64">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Noto+Sans+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog/blog.css">
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">
${JSON.stringify(ldjson)}
</script>
</head>
<body>
<header>
  <div class="hwrap">
    <a href="/" class="logo">neobank<span class="dot">beat</span></a>
    <nav class="hnav" aria-label="Primary">
      <a href="/" class="on">directory</a>
      <a href="/#datasec">data</a>
      <a href="/#newssec">news</a>
      <a href="/blog/">blog</a>
      <a href="/report/">report</a>
      <a href="/jobs/">jobs</a>
    </nav>
  </div>
</header>
`;

const foot = `
<footer><div class="fwrap">
  <span>© neobankbeat · MIT</span>
  <a href="/">directory</a><a href="/blog/">blog</a><a href="/report/">report</a><a href="/jobs/">jobs</a><a href="/data.json">data.json</a><a href="/llms.txt">llms.txt</a><a href="https://github.com/andreolf/neobankbeat">github</a>
</div></footer>
</body>
</html>
`;

const subscribeBox = `<div class="subscribe"><span class="k">stay on the beat</span><iframe src="https://neobankbeat.substack.com/embed" width="100%" height="150" loading="lazy" title="Subscribe to the neobankbeat newsletter" style="border:0;border-radius:8px;background:transparent;margin:6px 0 10px"></iframe><p>New deep dives in your inbox. Also: <a href="/blog/feed.xml">RSS</a> · <a href="https://github.com/andreolf/neobankbeat">github</a> · <a href="/data.json">raw data</a></p></div>`;

const disclaimer = `<p style="font-size:12.5px;color:var(--dim);margin-top:28px">Figures compiled from public sources, for comparison only — not financial advice. "Up to" rates change constantly; always confirm with the issuer. Spotted an error? <a href="https://github.com/andreolf/neobankbeat/issues/new?labels=data-fix&template=data-fix.yml">Suggest a fix</a>.</p>`;

/* ── peers: same category, overlapping region, prefer known users ── */
function peers(e, n = 6) {
  return E.filter(x => x !== e && x.category === e.category &&
      x.active_regions.some(r => e.active_regions.includes(r)))
    .sort((a, b) => (b.reported_users ? 1 : 0) - (a.reported_users ? 1 : 0))
    .slice(0, n);
}

function factRows(e) {
  const rows = [
    ['Category', `${e.category}${e.audience !== 'general' ? ' · ' + e.audience : ''}`],
    ['HQ', e.hq], ['Founded', e.founded],
    ['Custody', e.custody],
    ['Regulation type', e.regulation_type],
    ['Licence detail', e.licence],
    ['Card', e.card_network && e.card_network !== '—' ? `${e.card_network} · ${e.card_type}` : 'No card'],
    ['Cashback', e.cashback], ['Yield', e.yield],
    ['Stablecoins', e.stablecoins ? 'Yes' : 'No'], ['KYC', e.kyc],
    ['Active regions', e.active_regions.join(', ')],
    ['Countries', e.countries ? e.countries.join(', ') : null],
    ['Reported users', users(e)],
    ['Founders', e.founders], ['Funding', e.funding],
  ];
  return rows.filter(([, v]) => v).map(([k, v]) => `<tr><td>${k}</td><td>${esc(v)}</td></tr>`).join('\n    ');
}

function links(e) {
  const l = [];
  if (e.website) l.push(`<a href="${esc(e.website)}" target="_blank" rel="noopener nofollow">official site ↗</a>`);
  if (e.terms_url) l.push(`<a href="${esc(e.terms_url)}" target="_blank" rel="noopener nofollow">terms ↗</a>`);
  if (e.privacy_url) l.push(`<a href="${esc(e.privacy_url)}" target="_blank" rel="noopener nofollow">privacy ↗</a>`);
  if (e.x_handle) l.push(`<a href="https://x.com/${esc(e.x_handle.replace(/^@/, ''))}" target="_blank" rel="noopener nofollow">@${esc(e.x_handle.replace(/^@/, ''))} ↗</a>`);
  return l.join(' · ');
}

/* ═══ entity profile pages ═══ */
let nPages = 0;
for (const e of E) {
  const slug = slugs.get(e.name);
  const url = `${BASE}/n/${slug}/`;
  const title = `${e.name} — custody, licence, cards & facts · neobankbeat`;
  const desc = `${e.name} (${e.category} neobank, ${e.hq}, est. ${e.founded}): ${e.custody} custody, ${e.regulation_type}, ` +
    (e.card_network && e.card_network !== '—' ? `${e.card_network} card, ` : 'no card, ') +
    `stablecoins ${e.stablecoins ? 'yes' : 'no'}. Verified facts from the open neobankbeat dataset.`;
  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', name: e.name, url: e.website || url, foundingDate: String(e.founded), description: e.note || undefined },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'neobankbeat', item: BASE + '/' },
        { '@type': 'ListItem', position: 2, name: 'neobanks', item: BASE + '/n/' },
        { '@type': 'ListItem', position: 3, name: e.name, item: url }] }
    ]
  };
  const pr = peers(e);
  const html = head(title, desc, url, ld) + `
<main class="wrap">
<article>
  <div class="eyebrow"><a href="/n/" style="color:var(--accent)">neobank profiles</a></div>
  <h1>${esc(e.name)}</h1>
  <p class="meta">${catChip(e)} · <b>${esc(e.hq)}</b> · est. ${e.founded} · <a href="/?q=${encodeURIComponent(e.name)}">open in the directory →</a></p>
  ${e.story ? `<p><em>${esc(e.story)}</em></p>` : ''}
  ${e.note ? `<p>${esc(e.note)}</p>` : ''}
  <h2>The facts</h2>
  <table>
    ${factRows(e)}
  </table>
  ${links(e) ? `<p><strong>Verified links:</strong> ${links(e)}</p>` : ''}
  <div class="callout"><span class="k">compare</span>Put ${esc(e.name)} side by side with any of the other ${E.length - 1} tracked neobanks in the <a href="/?q=${encodeURIComponent(e.name)}">directory</a> — custody, licence, cashback, yield, stablecoins and geography in one view.</div>
  ${pr.length ? `<h2>Peers</h2>\n  <p>${pr.map(p => `<a href="/n/${slugs.get(p.name)}/">${esc(p.name)}</a>`).join(' · ')}</p>` : ''}
  ${disclaimer}
  ${subscribeBox}
</article>
</main>` + foot;
  const dir = path.join(ROOT, 'n', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  nPages++;
}

/* ═══ /n/ index: A–Z of all entities ═══ */
{
  const url = `${BASE}/n/`;
  const byLetter = {};
  for (const e of [...E].sort((a, b) => a.name.localeCompare(b.name))) {
    const L = (slugify(e.name)[0] || '#').toUpperCase();
    (byLetter[L] = byLetter[L] || []).push(e);
  }
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'All tracked neobanks', url };
  const html = head(`All ${E.length} tracked neobanks, A–Z · neobankbeat`,
    `Index of every verified-active neobank in the open dataset — ${E.length} profiles with custody, licence, cards, stablecoins and geography.`, url, ld) + `
<main class="wrap">
<article>
  <div class="eyebrow">profiles</div>
  <h1>All <em>${E.length}</em> tracked neobanks</h1>
  <p class="meta">Every profile links its verified facts. Prefer filters? Use the <a href="/">interactive directory</a>.</p>
  ${Object.entries(byLetter).map(([L, es]) => `<h2>${L}</h2>\n  <p>${es.map(e => `<a href="/n/${slugs.get(e.name)}/">${esc(e.name)}</a>`).join(' · ')}</p>`).join('\n  ')}
  ${subscribeBox}
</article>
</main>` + foot;
  fs.writeFileSync(path.join(ROOT, 'n', 'index.html'), html);
}

/* ═══ comparison pages ═══ */
const PAIRS = [
  ['Chime', 'Current'], ['Chime', 'Varo'], ['Chime', 'Dave'], ['Chime', 'One'], ['Cash App', 'Venmo'],
  ['Cash App', 'Chime'], ['Current', 'Step'], ['Dave', 'MoneyLion'], ['SoFi', 'Chime'], ['Varo', 'Current'],
  ['Revolut', 'N26'], ['Revolut', 'Wise'], ['Revolut', 'Monzo'], ['Monzo', 'Starling Bank'], ['N26', 'bunq'],
  ['Wise', 'N26'], ['Vivid Money', 'N26'], ['Qonto', 'Finom'], ['Tide', 'ANNA Money'], ['Revolut', 'bunq'],
  ['Nubank', 'Banco Inter'], ['Nubank', 'C6 Bank'], ['Nubank', 'Ualá'], ['Klar', 'Stori'], ['Nubank', 'Neon'],
  ['PicPay', 'PagBank'], ['Kuda', 'OPay'], ['OPay', 'PalmPay'], ['TymeBank', 'Kuda'], ['GCash', 'Maya'],
  ['bKash', 'Nagad'], ['Airtel Payments Bank', 'Jio Payments Bank'], ['Djamo', 'Wave'], ['KakaoBank', 'Toss Bank'],
  ['Mercury', 'Brex'], ['Brex', 'Ramp'], ['Mercury', 'Novo'], ['Qonto', 'Tide'], ['Relay', 'Novo'], ['Mercury', 'Qonto'],
  ['Crypto.com', 'Coinbase Card'], ['Bybit Card', 'OKX Card'], ['Wirex', 'Plutus'], ['Nexo', 'Crypto.com'],
  ['Bitpanda', 'eToro Money'], ['Strike', 'Cash App'], ['Xapo Bank', 'Revolut'], ['Juno', 'Wirex'],
  ['MetaMask', 'Phantom'], ['Trust Wallet', 'Exodus'], ['Gnosis Pay', 'EtherFi Cash'], ['Gnosis Pay', 'Payy'],
  ['1inch Card', 'Gnosis Pay'], ['Zengo', 'Trust Wallet'], ['MiniPay', 'Daimo'], ['Rainbow', 'MetaMask'],
  ['Greenlight', 'GoHenry'], ['Step', 'Greenlight'], ['Found', 'Lili'], ['Hnry', 'Found'],
];
const byName = new Map(E.map(e => [e.name, e]));
const VS_FIELDS = [
  ['Category', e => e.category], ['Audience', e => e.audience],
  ['HQ', e => e.hq], ['Founded', e => e.founded], ['Custody', e => e.custody],
  ['Regulation', e => e.regulation_type], ['Licence detail', e => e.licence || '—'],
  ['Card', e => e.card_network && e.card_network !== '—' ? `${e.card_network} · ${e.card_type}` : 'No card'],
  ['Cashback', e => e.cashback || '—'], ['Yield', e => e.yield || '—'],
  ['Stablecoins', e => e.stablecoins ? 'Yes' : 'No'], ['KYC', e => e.kyc],
  ['Regions', e => e.active_regions.join(', ')], ['Reported users', e => users(e) || '—'],
];
let vsPages = 0, vsIndex = [];
for (const [an, bn] of PAIRS) {
  const a = byName.get(an), b = byName.get(bn);
  if (!a || !b) { console.warn(`vs: skipping ${an} vs ${bn} (not in dataset)`); continue; }
  const slug = `${slugs.get(an)}-vs-${slugs.get(bn)}`;
  const url = `${BASE}/vs/${slug}/`;
  const title = `${an} vs ${bn} (2026): custody, fees, cards & licence compared · neobankbeat`;
  const desc = `${an} vs ${bn} side by side — custody, regulation, card network, cashback, yield, stablecoin support and geography. Neutral comparison from the open neobankbeat dataset. No affiliate links.`;
  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Article', headline: `${an} vs ${bn}: the facts compared`, datePublished: TODAY, dateModified: TODAY,
        author: { '@type': 'Person', name: 'Francesco Andreoli' },
        publisher: { '@type': 'Organization', name: 'neobankbeat', url: BASE }, mainEntityOfPage: url },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'neobankbeat', item: BASE + '/' },
        { '@type': 'ListItem', position: 2, name: 'comparisons', item: BASE + '/vs/' },
        { '@type': 'ListItem', position: 3, name: `${an} vs ${bn}`, item: url }] }
    ]
  };
  const rows = VS_FIELDS.map(([k, fn]) => {
    const va = String(fn(a)), vb = String(fn(b));
    const diff = va !== vb;
    return `<tr><td>${k}</td><td${diff ? ' style="color:var(--text)"' : ''}>${esc(va)}</td><td${diff ? ' style="color:var(--text)"' : ''}>${esc(vb)}</td></tr>`;
  }).join('\n    ');
  const html = head(title, desc, url, ld) + `
<main class="wrap">
<article>
  <div class="eyebrow"><a href="/vs/" style="color:var(--accent)">comparisons</a></div>
  <h1>${esc(an)} <em>vs</em> ${esc(bn)}</h1>
  <p class="meta">${catChip(a)} vs ${catChip(b)} · from the open dataset of ${E.length} tracked neobanks · no affiliate links, ever</p>
  <p>${esc(a.name)}: ${esc(a.note || '')}</p>
  <p>${esc(b.name)}: ${esc(b.note || '')}</p>
  <h2>Side by side</h2>
  <table>
    <tr><th></th><th><a href="/n/${slugs.get(an)}/">${esc(an)}</a></th><th><a href="/n/${slugs.get(bn)}/">${esc(bn)}</a></th></tr>
    ${rows}
  </table>
  <div class="callout"><span class="k">go deeper</span>Full profiles: <a href="/n/${slugs.get(an)}/">${esc(an)}</a> · <a href="/n/${slugs.get(bn)}/">${esc(bn)}</a> — or run your own comparison of up to four in the <a href="/">directory</a>.</div>
  ${disclaimer}
  ${subscribeBox}
</article>
</main>` + foot;
  const dir = path.join(ROOT, 'vs', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  vsIndex.push({ an, bn, slug });
  vsPages++;
}

/* ═══ /vs/ index ═══ */
{
  const url = `${BASE}/vs/`;
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Neobank comparisons', url };
  const html = head(`Neobank comparisons: ${vsPages} head-to-heads · neobankbeat`,
    `Side-by-side neobank comparisons — custody, licence, cards, cashback, yield and stablecoins. Neutral, from the open dataset, no affiliate links.`, url, ld) + `
<main class="wrap">
<article>
  <div class="eyebrow">comparisons</div>
  <h1>Neobank <em>head-to-heads</em></h1>
  <p class="meta">${vsPages} comparisons, generated from the verified dataset. Want a pair we don't have? <a href="https://github.com/andreolf/neobankbeat/issues">Ask</a>.</p>
  <p>${vsIndex.map(v => `<a href="/vs/${v.slug}/">${esc(v.an)} vs ${esc(v.bn)}</a>`).join(' · ')}</p>
  ${subscribeBox}
</article>
</main>` + foot;
  fs.writeFileSync(path.join(ROOT, 'vs', 'index.html'), html);
}

/* ═══ sitemap ═══ */
const BLOG_POSTS = [
  ['what-is-a-neobank', '2025-09-16'], ['neobank-vs-traditional-bank', '2025-10-07'],
  ['are-neobanks-safe', '2025-10-28'], ['stablecoin-cards-explained', '2025-11-18'],
  ['self-custodial-neobanks', '2025-12-09'], ['no-kyc-crypto-wallets-cards', '2026-01-13'],
  ['niche-neobanks', '2026-02-10'], ['neobanks-africa-latam-underbanked', '2026-03-17'],
  ['mica-crypto-neobanks-europe', '2026-04-21'], ['best-neobanks-freelancers-smb-2026', '2026-06-02'],
  ['state-of-neobanks-2026', '2026-07-05'],
];
const urls = [
  { loc: `${BASE}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${BASE}/data.json`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${BASE}/llms.txt`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${BASE}/report/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${BASE}/report/2026-07/`, lastmod: '2026-07-05', priority: '0.9' },
  { loc: `${BASE}/jobs/`, changefreq: 'daily', priority: '0.9' },
  ...['engineering', 'data', 'product', 'design', 'compliance', 'onboarding', 'support', 'sales', 'marketing', 'finance', 'operations', 'people']
    .map(d => ({ loc: `${BASE}/jobs/${d}/`, changefreq: 'daily', priority: '0.7' })),
  { loc: `${BASE}/blog/`, changefreq: 'weekly', priority: '0.9' },
  ...BLOG_POSTS.map(([slug, d]) => ({ loc: `${BASE}/blog/${slug}/`, lastmod: d, priority: '0.8' })),
  { loc: `${BASE}/n/`, changefreq: 'weekly', priority: '0.9' },
  ...E.map(e => ({ loc: `${BASE}/n/${slugs.get(e.name)}/`, lastmod: TODAY, priority: '0.7' })),
  { loc: `${BASE}/vs/`, changefreq: 'weekly', priority: '0.8' },
  ...vsIndex.map(v => ({ loc: `${BASE}/vs/${v.slug}/`, lastmod: TODAY, priority: '0.7' })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n` +
    (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
    (u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : '') +
    (u.priority ? `    <priority>${u.priority}</priority>\n` : '') + `  </url>`).join('\n') + `\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

console.log(`built ${nPages} profile pages, ${vsPages} comparison pages, sitemap with ${urls.length} URLs`);
