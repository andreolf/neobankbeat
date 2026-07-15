/* build-pages.mjs — generates static SEO pages from data.json:
   /n/<slug>/          358 entity profile pages
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
<link rel="preload" href="/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/noto-sans-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/blog/blog.css">
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};window.nbevt=function(n,d){try{va('event',{name:n,data:d||{}})}catch(_){}try{gtag('event',n,d||{})}catch(_){}}</script>
<script defer src="/_vercel/insights/script.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-E3KE01L5DL"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-E3KE01L5DL")</script>
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
      <a href="/investors/">investors</a>
      <a href="/blog/">blog</a>
      <a href="/report/">report</a>
      <a href="/jobs/">jobs</a>
      <button class="bwbtn" id="bwtoggle" aria-pressed="false">◐ black &amp; white</button>
    </nav>
  </div>
</header>
`;

const bwScript = `<script>(function(){var b=document.getElementById('bwtoggle');if(!b)return;function set(on){document.body.classList.toggle('bw',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'◑ color':'◐ black & white';try{localStorage.setItem('nbbw',on?'1':'0')}catch(e){}}try{if(localStorage.getItem('nbbw')==='1')set(true)}catch(e){}b.addEventListener('click',function(){set(!document.body.classList.contains('bw'))})})();
document.addEventListener('submit',function(e){if(e.target.classList&&e.target.classList.contains('nbform'))nbevt('subscribe',{page:location.pathname})},true);
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a');if(a&&a.pathname==='/data.json')nbevt('data_download',{page:location.pathname})});</script>`;

const foot = `
<footer><div class="fwrap">
  <span>© neobankbeat · MIT</span>
  <a href="/">directory</a><a href="/blog/">blog</a><a href="/faq/">faq</a><a href="/glossary/">glossary</a><a href="/investors/">investors</a><a href="/newsletters/">newsletters</a><a href="/report/">report</a><a href="/jobs/">jobs</a><a href="/data.json">data.json</a><a href="/llms.txt">llms.txt</a><a href="https://github.com/andreolf/neobankbeat">github</a>
</div></footer>
${bwScript}
</body>
</html>
`;

const subscribeBox = `<div class="subscribe"><span class="k">stay on the beat</span><form class="nbform" action="https://neobankbeat.substack.com/subscribe" method="get" target="_blank" rel="noopener"><input type="email" name="email" required placeholder="you@example.com" aria-label="Email address"><button type="submit">subscribe →</button></form><p class="nbnote" style="margin:0 0 10px">free · via substack · unsubscribe anytime</p><p>New deep dives in your inbox. Also: <a href="/blog/feed.xml">RSS</a> · <a href="https://github.com/andreolf/neobankbeat">github</a> · <a href="/data.json">raw data</a></p></div>`;

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

function investorsBlock(e) {
  if (!e.investors || !e.investors.length) return '';
  const chips = e.investors.map(iv => {
    const d = iv.website.replace(/^https?:\/\//, '');
    return `<a class="invchip" href="${esc(iv.website)}" target="_blank" rel="noopener"><img loading="lazy" alt="" src="https://www.google.com/s2/favicons?domain=${esc(d)}&amp;sz=32" onerror="this.remove()">${esc(iv.name)} ↗</a>`;
  }).join('\n    ');
  return `
  <h2>Early investors</h2>
  <p class="meta">Notable venture and strategic investors from ${esc(e.name)}'s publicly disclosed funding rounds${e.funding ? ` (${esc(e.funding)})` : ''}.</p>
  <div class="invrow">
    ${chips}
  </div>`;
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
      { '@type': 'Organization', name: e.name, url: e.website || url, foundingDate: String(e.founded), description: e.note || undefined,
        funder: e.investors ? e.investors.map(iv => ({ '@type': 'Organization', name: iv.name, url: iv.website })) : undefined },
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
  <a class="backbtn" href="/" onclick="if(document.referrer.indexOf(location.origin)===0&&history.length>1){history.back();return false}">← back</a>
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
  ${investorsBlock(e)}
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

/* ── auto pairs on top of the curated list: same category + audience +
   overlapping region, both with reported users, biggest names first.
   Per-entity cap keeps giants from pairing with everything. ── */
{
  const seen = new Set(PAIRS.map(p => [...p].sort().join('|')));
  const perEntity = {};
  for (const [a, b] of PAIRS) { perEntity[a] = (perEntity[a] || 0) + 1; perEntity[b] = (perEntity[b] || 0) + 1; }
  const CAP = 5, AUTO_MAX = 120;
  const ranked = E.filter(e => e.reported_users)
    .sort((x, y) => y.reported_users.value_millions - x.reported_users.value_millions);
  let added = 0;
  const tryPair = (a, b) => {
    if (added >= AUTO_MAX) return;
    if (a.category !== b.category || a.audience !== b.audience) return;
    if (!a.active_regions.some(r => b.active_regions.includes(r))) return;
    /* two single-market apps from different countries never compete —
       nobody searches "bKash vs GCash". International players (2+ regions
       or a multi-country footprint) can pair across borders. */
    const intl = e => e.active_regions.length >= 2 || (e.countries?.length || 0) >= 3;
    const home = e => (e.hq.match(/,\s*([A-Z]{2})$/) || [])[1] || e.hq;
    if (!intl(a) && !intl(b) && home(a) !== home(b) &&
        !(a.countries || []).some(c => (b.countries || []).includes(c))) return;
    if ((perEntity[a.name] || 0) >= CAP || (perEntity[b.name] || 0) >= CAP) return;
    const key = [a.name, b.name].sort().join('|');
    if (seen.has(key)) return;
    seen.add(key);
    perEntity[a.name] = (perEntity[a.name] || 0) + 1;
    perEntity[b.name] = (perEntity[b.name] || 0) + 1;
    PAIRS.push([a.name, b.name]);
    added++;
  };
  /* pass 1: the biggest names by reported users */
  for (let i = 0; i < ranked.length; i++)
    for (let j = i + 1; j < ranked.length; j++) tryPair(ranked[i], ranked[j]);
  /* pass 2: niche-audience head-to-heads (SMB vs SMB, teens vs teens…) —
     the long-tail queries, no user figures required */
  const niche = E.filter(e => e.audience !== 'general');
  for (let i = 0; i < niche.length; i++)
    for (let j = i + 1; j < niche.length; j++) tryPair(niche[i], niche[j]);
  console.log(`vs: ${added} auto-generated pairs on top of ${PAIRS.length - added} curated`);
}
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
  <a class="backbtn" href="/" onclick="if(document.referrer.indexOf(location.origin)===0&&history.length>1){history.back();return false}">← back</a>
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

/* prune vs/ dirs from earlier runs whose pair is no longer generated */
{
  const keep = new Set(vsIndex.map(v => v.slug));
  for (const d of fs.readdirSync(path.join(ROOT, 'vs'), { withFileTypes: true })) {
    if (d.isDirectory() && !keep.has(d.name)) {
      fs.rmSync(path.join(ROOT, 'vs', d.name), { recursive: true });
      console.log(`vs: pruned stale ${d.name}`);
    }
  }
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

/* ═══ /investors/ — who funds the neobanks: investor → portfolio index ═══ */
let invSlugList = [];
{
  const inv = new Map(); // name -> { site, banks:[entity] }
  for (const e of E) for (const iv of e.investors || []) {
    if (!inv.has(iv.name)) inv.set(iv.name, { site: iv.website, banks: [] });
    inv.get(iv.name).banks.push(e);
  }
  const rows = [...inv.entries()].sort((a, b) => b[1].banks.length - a[1].banks.length || a[0].localeCompare(b[0]));
  const nBanks = new Set(rows.flatMap(([, v]) => v.banks.map(b => b.name))).size;
  const invDom = site => String(site || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const ivSlug = n => slugify(n) || 'investor';

  const url = `${BASE}/investors/`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Investors in neobanks', url,
    description: `${rows.length} venture and strategic investors behind ${nBanks} neobanks, from publicly disclosed funding rounds.`,
    isPartOf: { '@type': 'WebSite', name: 'neobankbeat', url: BASE },
    mainEntity: { '@type': 'ItemList', itemListElement: rows.slice(0, 50).map(([name, v], i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Organization', name, url: v.site } })) },
  };
  const style = `<style>
.ivstats{display:flex;gap:12px;flex-wrap:wrap;margin:22px 0}
.ivstat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 18px}
.ivstat .n{font-family:var(--mono);font-size:20px;font-weight:700}
.ivstat .l{font-family:var(--mono);font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);margin-top:2px}
#ivsearch{width:100%;box-sizing:border-box;background:var(--panel);border:1px solid rgba(255,255,255,.38);border-radius:10px;color:var(--text);font-family:var(--mono);font-size:12.5px;padding:10px 12px;margin:4px 0 18px;transition:border-color .15s}
#ivsearch:hover{border-color:rgba(255,255,255,.6)}
#ivsearch:focus{outline:none;border-color:var(--accent)}
.ivrow{position:relative;border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:14px 16px;margin-bottom:10px;scroll-margin-top:80px;transition:border-color .15s}
.ivrow:has(.nm:hover){border-color:var(--accent)}
.ivhead{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ivhead img{width:20px;height:20px;border-radius:5px;object-fit:contain;background:#fff;padding:2px;box-sizing:border-box}
.ivhead .nm{font-weight:700;font-size:15.5px;color:var(--text);text-decoration:none}
.ivhead .nm:hover{color:var(--accent)}
/* stretched link: the name link covers the whole card, so clicking anywhere opens the investor page */
.ivhead .nm::after{content:"";position:absolute;inset:0;border-radius:12px}
.ivhead .ct{font-family:var(--mono);font-size:10.5px;color:var(--dim)}
.ivhead .st{font-family:var(--mono);font-size:11px;color:var(--muted);margin-left:auto;text-decoration:none;position:relative;z-index:1}
.ivhead .st:hover{color:var(--accent)}
.ivbanks{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.ivbanks a{font-family:var(--mono);font-size:11.5px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:3px 11px;text-decoration:none;white-space:nowrap;position:relative;z-index:1}
.ivbanks a:hover{border-color:var(--accent);color:var(--text)}
</style>`;
  const rowHtml = ([name, v]) => `<div class="ivrow" id="${ivSlug(name)}" data-q="${esc((name + ' ' + v.banks.map(b => b.name).join(' ')).toLowerCase())}">
  <div class="ivhead">
    <img loading="lazy" alt="" src="https://www.google.com/s2/favicons?domain=${esc(invDom(v.site))}&amp;sz=64" onerror="this.style.visibility='hidden'">
    <a class="nm" href="/investors/${ivSlug(name)}/">${esc(name)}</a>
    <span class="ct">${v.banks.length} neobank${v.banks.length === 1 ? '' : 's'}</span>
    <a class="st" href="${esc(v.site)}" target="_blank" rel="noopener nofollow">${esc(invDom(v.site))} ↗</a>
  </div>
  <div class="ivbanks">${v.banks.map(b => `<a href="/n/${slugs.get(b.name)}/">${esc(b.name)}</a>`).join('')}</div>
</div>`;

  const html = (head(`Investors in neobanks — ${rows.length} VCs & strategics behind ${nBanks} digital banks · neobankbeat`,
    `Who funds the neobanks: ${rows.length} venture and strategic investors — Ribbit, Tiger Global, SoftBank, Tencent, Y Combinator and more — mapped to the ${nBanks} neobanks they backed, from publicly disclosed rounds.`,
    url, ld) + `
<main class="wrap">
<article>
  <div class="eyebrow">follow the money</div>
  <h1>Investors <em>in neobanks</em></h1>
  <p class="meta"><b>${rows.length} investors · ${nBanks} funded neobanks</b> · compiled from publicly disclosed funding rounds in the <a href="/">directory</a> dataset · updated ${TODAY}</p>

  <div class="ivstats">
    <div class="ivstat"><div class="n">${rows.length}</div><div class="l">investors tracked</div></div>
    <div class="ivstat"><div class="n">${nBanks}</div><div class="l">neobanks funded</div></div>
    <div class="ivstat"><div class="n">${rows.filter(([, v]) => v.banks.length >= 3).length}</div><div class="l">with 3+ portfolio neobanks</div></div>
  </div>

  <p>Every investor below appears in the publicly disclosed early rounds of at least one tracked neobank. Ordered by portfolio size — the top of this list is a fair map of who has shaped digital banking. Click a neobank for its full profile, or the firm for its site. Something missing? <a href="https://github.com/andreolf/neobankbeat/issues/new?labels=data-fix&template=data-fix.yml">Suggest a fix</a>.</p>

  <input id="ivsearch" type="search" placeholder="filter by investor or neobank — e.g. sequoia, nubank…" aria-label="Filter investors">

${rows.map(rowHtml).join('\n')}

  <p style="font-size:12.5px;color:var(--dim);margin-top:28px">Investor lists are notable backers from disclosed rounds, not complete cap tables. Sources are linked on each neobank's profile. Not investment advice.</p>
  ${subscribeBox}
</article>
</main>
<script>(function(){var q=document.getElementById('ivsearch'),rows=[].slice.call(document.querySelectorAll('.ivrow'));q.addEventListener('input',function(){var v=q.value.toLowerCase().trim();rows.forEach(function(r){r.style.display=!v||r.dataset.q.indexOf(v)>-1?'':'none'})})})();</script>` + foot).replace('<a href="/" class="on">', '<a href="/">').replace('<a href="/investors/">investors</a>', '<a href="/investors/" class="on">investors</a>');
  fs.mkdirSync(path.join(ROOT, 'investors'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'investors', 'index.html'), html.replace('</head>', style + '\n</head>'));
  console.log(`investors page: ${rows.length} investors, ${nBanks} neobanks`);

  /* ── per-investor pages: /investors/<slug>/ ── */
  const PEOPLE = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'investor-people.json'), 'utf8'));
  delete PEOPLE._comment;
  for (const k of Object.keys(PEOPLE)) if (!inv.has(k)) console.warn(`investor-people: "${k}" not in dataset — check spelling`);
  const CATLABEL = { traditional: 'traditional', hybrid: 'hybrid crypto', 'web3-native': 'web3-native' };
  for (const [name, v] of rows) {
    const slug = ivSlug(name);
    const url = `${BASE}/investors/${slug}/`;
    const n = v.banks.length;
    const regions = [...new Set(v.banks.flatMap(b => b.active_regions))];
    const cats = [...new Set(v.banks.map(b => b.category))];
    const bankNames = v.banks.map(b => b.name);
    /* co-investors: firms sharing at least one portfolio neobank */
    const co = rows.filter(([n2, v2]) => n2 !== name && v2.banks.some(b => bankNames.includes(b.name)))
      .map(([n2, v2]) => [n2, v2.banks.filter(b => bankNames.includes(b.name)).length])
      .sort((a, b) => b[1] - a[1]).slice(0, 10);
    const title = `${name} — neobank portfolio: ${n} digital bank${n === 1 ? '' : 's'} backed · neobankbeat`;
    const desc = (PEOPLE[name]?.about ? PEOPLE[name].about + ' ' : '') +
      `Backer of ${n} tracked neobank${n === 1 ? '' : 's'}: ${bankNames.slice(0, 6).join(', ')}${n > 6 ? ' and more' : ''}.`;
    const ld = {
      '@context': 'https://schema.org', '@graph': [
        { '@type': 'Organization', name, url: v.site,
          owns: v.banks.map(b => ({ '@type': 'Organization', name: b.name, url: `${BASE}/n/${slugs.get(b.name)}/` })) },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'neobankbeat', item: BASE + '/' },
          { '@type': 'ListItem', position: 2, name: 'investors', item: BASE + '/investors/' },
          { '@type': 'ListItem', position: 3, name, item: url }] }
      ]
    };
    const bankCard = b => `<a class="ivrow" style="display:block;text-decoration:none" href="/n/${slugs.get(b.name)}/">
  <div class="ivhead">
    <img loading="lazy" alt="" src="https://www.google.com/s2/favicons?domain=${esc(b.domain || invDom(b.website))}&amp;sz=64" onerror="this.style.visibility='hidden'">
    <span class="nm">${esc(b.name)}</span>
    <span class="ct">${esc(b.hq)} · est. ${b.founded}</span>
    <span class="st">${CATLABEL[b.category] || b.category}${b.reported_users ? ` · ${b.reported_users.value_millions}M ${esc(b.reported_users.metric)}` : ''}</span>
  </div>
</a>`;
    const pageHtml = (head(title, desc, url, ld) + `
<main class="wrap">
<article>
  <a class="backbtn" href="/investors/" onclick="if(document.referrer.indexOf(location.origin)===0&&history.length>1){history.back();return false}">← back</a>
  <div class="eyebrow"><a href="/investors/" style="color:var(--accent)">investors in neobanks</a></div>
  <h1>${esc(name)}</h1>
  <p class="meta"><b>${n} tracked neobank${n === 1 ? '' : 's'} backed</b> · ${regions.join(', ')} · <a href="${esc(v.site)}" target="_blank" rel="noopener nofollow">${esc(invDom(v.site))} ↗</a></p>
  ${PEOPLE[name]?.about ? `<p>${esc(PEOPLE[name].about)}</p>` : ''}
  <p>${esc(name)} appears in the publicly disclosed early funding rounds of <b>${n}</b> of the ${E.length} neobanks tracked in the <a href="/">open dataset</a>${cats.length > 1 ? ` — a portfolio spanning ${cats.map(c => CATLABEL[c] || c).join(' and ')} players` : ''}. Sources are linked on each profile; this is notable-backer data from disclosed rounds, not a complete cap table.</p>
  ${PEOPLE[name]?.people?.length ? `<h2>Key people</h2>
  <div class="ivbanks" style="margin-top:10px">${PEOPLE[name].people.map(([p, r]) => `<a href="https://www.google.com/search?q=${encodeURIComponent(p + ' ' + name)}" target="_blank" rel="noopener nofollow">${esc(p)} — ${esc(r)} ↗</a>`).join('')}</div>` : ''}
  <h2>Portfolio</h2>
${v.banks.map(bankCard).join('\n')}
  ${co.length ? `<h2>Frequent co-investors</h2>
  <p class="meta">Firms appearing alongside ${esc(name)} in the same neobanks' disclosed rounds.</p>
  <div class="ivbanks" style="margin-top:10px">${co.map(([n2, k]) => `<a href="/investors/${ivSlug(n2)}/">${esc(n2)} · ${k} shared</a>`).join('')}</div>` : ''}
  <div class="callout" style="margin-top:26px"><span class="k">explore</span>Browse all <a href="/investors/">${rows.length} investors</a>, or compare ${esc(name)}'s portfolio companies side by side in the <a href="/">directory</a>.</div>
  ${disclaimer}
  ${subscribeBox}
</article>
</main>` + foot).replace('<a href="/" class="on">', '<a href="/">').replace('<a href="/investors/">investors</a>', '<a href="/investors/" class="on">investors</a>').replace('</head>', style + '\n</head>');
    const dir = path.join(ROOT, 'investors', slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), pageHtml);
    invSlugList.push(slug);
  }
  /* prune investor dirs whose firm dropped out of the dataset */
  const keep = new Set(invSlugList);
  for (const d of fs.readdirSync(path.join(ROOT, 'investors'), { withFileTypes: true })) {
    if (d.isDirectory() && !keep.has(d.name)) {
      fs.rmSync(path.join(ROOT, 'investors', d.name), { recursive: true });
      console.log(`investors: pruned stale ${d.name}`);
    }
  }
  console.log(`investor pages: ${invSlugList.length}`);
}

/* ═══ /newsletters/ — the neobank & fintech reading list ═══ */
const NEWSLETTERS = [
  ['neobankbeat', 'Francesco Andreoli', 'https://neobankbeat.substack.com', 'monthly',
    'The newsletter behind this site: what changed in the dataset, new entrants, and the monthly State of Neobanks report.'],
  ['Fintech Brainfood', 'Simon Taylor', 'https://www.fintechbrainfood.com', 'weekly · sundays',
    'The industry\u2019s Sunday read — one big rant, four fintech companies that matter, and the things to know this week.'],
  ['Fintech Takes', 'Alex Johnson', 'https://fintechtakes.com', 'weekly',
    'Sharp long-form analysis of US fintech: bank\u2013fintech partnerships, credit, regulation, and why things actually happen.'],
  ['This Week in Fintech', 'Nik Milanović', 'https://www.thisweekinfintech.com', 'weekly',
    'The global funding and news roundup, with dedicated regional editions for LatAm, Africa, Asia and Europe.'],
  ['Fintech Business Weekly', 'Jason Mikula', 'https://fintechbusinessweekly.substack.com', 'weekly · sundays',
    'The investigative one: banking-as-a-service, sponsor banks, consent orders and enforcement — often breaking the story.'],
  ['Net Interest', 'Marc Rubinstein', 'https://www.netinterest.co', 'weekly · fridays',
    'A former hedge-fund manager on the economics of financial firms — the deepest \u201chow banks actually make money\u201d essays anywhere.'],
  ['Fintech Blueprint', 'Lex Sokolin', 'https://www.fintechblueprint.com', 'weekly',
    'Where fintech meets digital assets and AI — strategy essays and founder interviews from a former ConsenSys CFO.'],
  ['Popular Fintech', 'Jevgenijs Kazanins', 'https://www.popularfintech.com', 'weekly',
    'Data-heavy breakdowns of public fintech and neobank earnings — the numbers behind Nubank, SoFi, Revolut and friends.'],
  ['Fintech Wrap Up', 'Sam Boboev', 'https://www.fintechwrapup.com', 'weekly',
    'Fintech explained in diagrams — infographic-first summaries of business models, products and partnerships.'],
  ['WhiteSight', 'research team', 'https://whitesight.net', 'weekly',
    'Visual fintech research: embedded finance, BaaS and digital-bank strategy mapped into frameworks and charts.'],
];
{
  const url = `${BASE}/newsletters/`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Neobank & fintech newsletters', url,
    mainEntity: { '@type': 'ItemList', itemListElement: NEWSLETTERS.map(([n, a, u], i) => ({
      '@type': 'ListItem', position: i + 1, name: `${n} — ${a}`, url: u })) }
  };
  const style = `<style>
.nlrow{position:relative;border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:10px 0;background:var(--panel);transition:border-color .15s}
.nlrow:has(.nm:hover){border-color:var(--accent)}
.nlhead{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.nlhead img{width:20px;height:20px;border-radius:5px;object-fit:contain;background:#fff;padding:2px;box-sizing:border-box}
.nlhead .nm{font-weight:700;font-size:15.5px;color:var(--text);text-decoration:none}
.nlhead .nm:hover{color:var(--accent)}
.nlhead .nm::after{content:"";position:absolute;inset:0;border-radius:12px}
.nlhead .au{font-family:var(--mono);font-size:11px;color:var(--muted)}
.nlhead .cad{font-family:var(--mono);font-size:10.5px;color:var(--dim);margin-left:auto}
.nlrow .nd{font-size:13px;color:var(--dim);line-height:1.55;margin-top:7px}
.nlrow .nu{font-family:var(--mono);font-size:11px;margin-top:6px}
.nlrow .nu a{color:var(--muted);text-decoration:none;position:relative;z-index:1}
.nlrow .nu a:hover{color:var(--accent)}
</style>`;
  const rowHtml = ([n, a, u, cad, d]) => `<div class="nlrow">
  <div class="nlhead">
    <img loading="lazy" alt="" src="https://www.google.com/s2/favicons?domain=${esc(u.replace(/^https?:\/\//, '').replace(/\/.*/, ''))}&amp;sz=64" onerror="this.style.visibility='hidden'">
    <a class="nm" href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>
    <span class="au">by ${esc(a)}</span>
    <span class="cad">${esc(cad)}</span>
  </div>
  <div class="nd">${esc(d)}</div>
  <div class="nu"><a href="${esc(u)}" target="_blank" rel="noopener">${esc(u)} ↗</a></div>
</div>`;
  const html = (head(`Neobank & fintech newsletters — the ${NEWSLETTERS.length} worth your inbox · neobankbeat`,
    `The hand-picked reading list behind neobankbeat: ${NEWSLETTERS.length} fintech and neobank newsletters with authors and what each is best at — Fintech Brainfood, Fintech Takes, This Week in Fintech, Net Interest and more.`,
    url, ld) + `
<main class="wrap">
<article>
  <div class="eyebrow">reading list</div>
  <h1>Neobank &amp; fintech <em>newsletters</em></h1>
  <p class="meta"><b>${NEWSLETTERS.length} newsletters</b> · hand-picked, no affiliations · updated ${TODAY}</p>
  <p>The inbox stack we actually read to keep this site accurate. Every pick is independent — nobody paid to be here, and there are no affiliate links. Ours is first because it\u2019s ours; the rest are ordered roughly by how often they explain something before anyone else does. Missing a great one? <a href="https://github.com/andreolf/neobankbeat/issues/new">Suggest it</a>.</p>
${NEWSLETTERS.map(rowHtml).join('\n')}
  <div class="callout" style="margin-top:26px"><span class="k">go deeper</span>Reports, dashboards and regulatory registers live in the <a href="/#library">library</a> on the homepage. For the data itself: <a href="/data.json">data.json</a>.</div>
  ${subscribeBox}
</article>
</main>` + foot).replace('<a href="/" class="on">', '<a href="/">').replace('</head>', style + '\n</head>');
  fs.mkdirSync(path.join(ROOT, 'newsletters'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'newsletters', 'index.html'), html);
  console.log(`newsletters page: ${NEWSLETTERS.length} entries`);
}

/* ═══ /stablecoin-cards/ — the U-card index: every stablecoin-spendable card, one table ═══ */
{
  const url = `${BASE}/stablecoin-cards/`;
  const cards = E.filter(e => e.stablecoins && e.card_network && e.card_network !== '—' &&
    !/wallet \(no card\)/i.test(e.card_type || ''))
    .sort((a, b) => (a.category === b.category ? a.name.localeCompare(b.name) :
      ['web3-native', 'hybrid', 'traditional'].indexOf(a.category) - ['web3-native', 'hybrid', 'traditional'].indexOf(b.category)));
  const CATLBL = { 'web3-native': 'web3-native', hybrid: 'hybrid', traditional: 'traditional' };
  const ld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Stablecoin cards (U-cards) compared', url,
    description: `${cards.length} crypto and stablecoin payment cards compared on custody, network, cashback, yield and KYC.`,
    mainEntity: { '@type': 'ItemList', itemListElement: cards.slice(0, 60).map((e, i) => ({
      '@type': 'ListItem', position: i + 1, name: e.name, url: `${BASE}/n/${slugs.get(e.name)}/` })) }
  };
  const style = `<style>
.uctable{width:100%;border-collapse:collapse;font-size:12.5px;margin:18px 0}
.uctable th{font-family:var(--mono);font-size:9.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dim);text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg,#0A0A10)}
.uctable td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
.uctable td a{color:var(--text);font-weight:600;text-decoration:none}
.uctable td a:hover{color:var(--accent)}
.uctable .cat{font-family:var(--mono);font-size:10px;color:var(--muted);white-space:nowrap}
.uctable .dim{color:var(--dim)}
.ucwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
@media(max-width:700px){.uctable{font-size:11.5px}.uctable td,.uctable th{padding:7px 6px}}
</style>`;
  const row = e => `<tr>
    <td><a href="/n/${slugs.get(e.name)}/">${esc(e.name)}</a></td>
    <td class="cat">${CATLBL[e.category]}</td>
    <td>${esc(e.custody)}</td>
    <td class="dim">${esc(e.card_network)} · ${esc(e.card_type)}</td>
    <td>${esc(e.cashback && e.cashback !== '—' ? e.cashback : '—')}</td>
    <td class="dim">${esc(e.yield && e.yield !== '—' ? e.yield : '—')}</td>
    <td class="cat">${esc(e.kyc)}</td>
  </tr>`;
  const html = (head(`Stablecoin cards (U-cards) — ${cards.length} crypto cards compared · neobankbeat`,
    `The U-card index: ${cards.length} stablecoin-spendable cards compared on custody, card network, cashback, yield and KYC — EtherFi Cash, KAST, RedotPay, Gnosis Pay, MetaMask Card, Bitget Wallet and more, from the open dataset.`,
    url, ld) + `
<main class="wrap">
<article>
  <div class="eyebrow">the u-card index</div>
  <h1>Stablecoin cards, <em>compared</em></h1>
  <p class="meta"><b>${cards.length} cards</b> · custody, network, cashback, yield and KYC in one table · updated ${TODAY}</p>
  <p>"U-cards" — cards that spend USDT/USDC directly — are the fastest-moving corner of digital banking, and the information about them is scattered across referral threads. This table consolidates every stablecoin-spendable card in the <a href="/">open dataset</a>. Click any name for the full profile with licence detail, founders and sources. Cashback and yield figures are headline claims that change constantly — verify with the issuer before applying. For live onchain volume and user counts per card, see <a href="https://paymentscan.xyz" target="_blank" rel="noopener">Paymentscan ↗</a>.</p>
  <div class="ucwrap"><table class="uctable">
    <thead><tr><th>card</th><th>wave</th><th>custody</th><th>network · type</th><th>cashback</th><th>yield</th><th>kyc</th></tr></thead>
    <tbody>
${cards.map(row).join('\n')}
    </tbody>
  </table></div>
  <p style="font-size:12.5px;color:var(--dim)">KYC "CO" = card only (wallet works without identity checks, the card itself requires them). Custody is the app's primary model — several custodial apps hold spending balances only.</p>
  <div class="callout"><span class="k">go deeper</span>Compare any two side by side in the <a href="/">directory</a>, read <a href="/blog/stablecoin-cards-explained/">stablecoin cards explained</a>, or pull the raw fields from <a href="/data.json">data.json</a>.</div>
  ${disclaimer}
  ${subscribeBox}
</article>
</main>` + foot).replace('<a href="/" class="on">', '<a href="/">');
  fs.mkdirSync(path.join(ROOT, 'stablecoin-cards'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'stablecoin-cards', 'index.html'), html.replace('</head>', style + '\n</head>'));
  console.log(`stablecoin-cards page: ${cards.length} cards`);
}

/* ═══ 404.html — Vercel serves this (with a 404 status) for any missing path ═══ */
{
  const html = (head('Page not found · neobankbeat',
    `That page doesn\u2019t exist — but ${E.length} neobank profiles, live jobs, investor maps and the blog do.`,
    `${BASE}/404`, { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Page not found' }) + `
<main class="wrap">
<article>
  <div class="eyebrow">404</div>
  <h1>This page <em>doesn\u2019t exist</em></h1>
  <p class="meta">Maybe it moved, maybe the neobank behind it pivoted to B2B SaaS. Either way, nothing is here.</p>
  <p>Try searching the directory instead:</p>
  <form action="/" method="get" style="display:flex;gap:8px;margin:14px 0 26px;max-width:460px">
    <input type="search" name="q" placeholder="search ${E.length} neobanks\u2026" aria-label="Search neobanks" style="flex:1;background:var(--panel);border:1px solid rgba(255,255,255,.38);border-radius:10px;color:var(--text);font-family:var(--mono);font-size:12.5px;padding:10px 12px">
    <button type="submit" style="background:var(--accent);border:0;border-radius:10px;color:#0A0A10;font-family:var(--mono);font-size:12.5px;font-weight:700;padding:10px 16px;cursor:pointer">search</button>
  </form>
  <h2>Or start from a good page</h2>
  <p><a href="/">the directory</a> · <a href="/n/">all neobank profiles A\u2013Z</a> · <a href="/vs/">comparisons</a> · <a href="/investors/">investors</a> · <a href="/jobs/">jobs board</a> · <a href="/blog/">blog</a> · <a href="/newsletters/">newsletters</a> · <a href="/faq/">faq</a> · <a href="/glossary/">glossary</a></p>
  <p style="font-size:12.5px;color:var(--dim);margin-top:24px">Followed a link here from somewhere on this site? That\u2019s a bug — <a href="https://github.com/andreolf/neobankbeat/issues/new">report it</a> and it gets fixed.</p>
</article>
</main>` + foot)
    .replace(`<link rel="canonical" href="${BASE}/404">`, '<meta name="robots" content="noindex">')
    .replace('<a href="/" class="on">', '<a href="/">');
  fs.writeFileSync(path.join(ROOT, '404.html'), html);
}

/* ═══ sitemap ═══ */
const BLOG_POSTS = [
  ['what-is-a-neobank', '2025-09-16'], ['neobank-vs-traditional-bank', '2025-10-07'],
  ['are-neobanks-safe', '2025-10-28'], ['stablecoin-cards-explained', '2025-11-18'],
  ['self-custodial-neobanks', '2025-12-09'], ['no-kyc-crypto-wallets-cards', '2026-01-13'],
  ['niche-neobanks', '2026-02-10'], ['neobanks-africa-latam-underbanked', '2026-03-17'],
  ['mica-crypto-neobanks-europe', '2026-04-21'], ['best-neobanks-freelancers-smb-2026', '2026-06-02'],
  ['state-of-neobanks-2026', '2026-07-05'], ['who-funds-the-neobanks', '2026-07-06'],
  ['neobanks-for-digital-nomads', '2026-07-07'], ['why-neobanks-die', '2026-07-07'],
  ['who-actually-uses-neobanks', '2026-07-12'],
];
const urls = [
  { loc: `${BASE}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${BASE}/data.json`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${BASE}/llms.txt`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${BASE}/faq/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${BASE}/glossary/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${BASE}/investors/`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${BASE}/newsletters/`, changefreq: 'monthly', priority: '0.7' },
  { loc: `${BASE}/stablecoin-cards/`, changefreq: 'weekly', priority: '0.8' },
  ...invSlugList.map(s => ({ loc: `${BASE}/investors/${s}/`, lastmod: TODAY, priority: '0.6' })),
  { loc: `${BASE}/report/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${BASE}/report/2026-07/`, lastmod: '2026-07-05', priority: '0.9' },
  { loc: `${BASE}/jobs/`, changefreq: 'daily', priority: '0.9' },
  ...['engineering', 'data', 'product', 'design', 'compliance', 'onboarding', 'support', 'sales', 'marketing', 'finance', 'operations', 'people', 'other']
    .map(d => ({ loc: `${BASE}/jobs/${d}/`, changefreq: 'daily', priority: '0.7' })),
  { loc: `${BASE}/blog/`, changefreq: 'weekly', priority: '0.9' },
  ...BLOG_POSTS.map(([slug, d]) => ({ loc: `${BASE}/blog/${slug}/`, lastmod: d, priority: '0.8' })),
  { loc: `${BASE}/n/`, changefreq: 'weekly', priority: '0.9' },
  ...E.map(e => ({ loc: `${BASE}/n/${slugs.get(e.name)}/`, lastmod: TODAY, priority: '0.7' })),
  { loc: `${BASE}/vs/`, changefreq: 'weekly', priority: '0.8' },
  ...vsIndex.map(v => ({ loc: `${BASE}/vs/${v.slug}/`, lastmod: TODAY, priority: '0.7' })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod || TODAY}</lastmod>\n` +
    (u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : '') +
    (u.priority ? `    <priority>${u.priority}</priority>\n` : '') + `  </url>`).join('\n') + `\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

/* ═══ sitemap.md — markdown sitemap for agents ═══ */
const sitemapMd = `# neobankbeat — sitemap

> Every page on [neobankbeat.com](https://www.neobankbeat.com/), grouped by section. Machine-readable data lives at [/data.json](${BASE}/data.json); the agent guide at [/llms.txt](${BASE}/llms.txt). Updated ${TODAY}.

## Main

- [Directory](${BASE}/) — searchable grid of all ${E.length} neobanks
- [FAQ](${BASE}/faq/) — 20 honest answers
- [Glossary](${BASE}/glossary/) — 50 terms defined
- [Investors in neobanks](${BASE}/investors/) — VC → portfolio map, with a profile page per investor (${invSlugList.length} firms)
- [Newsletters](${BASE}/newsletters/) — the ${NEWSLETTERS.length} neobank & fintech newsletters worth reading, with authors
- [Stablecoin cards (U-cards)](${BASE}/stablecoin-cards/) — every stablecoin-spendable card compared on custody, cashback, yield and KYC
- [Jobs board](${BASE}/jobs/) — live roles from official career APIs
- [Blog](${BASE}/blog/) — deep dives grounded in the dataset
- [Monthly report](${BASE}/report/) — the State of Neobanks PDF · [web edition](${BASE}/report/2026-07/)

## Data & agent endpoints

- [data.json](${BASE}/data.json) — full dataset
- [jobs/data.json](${BASE}/jobs/data.json) — job board feed
- [jobs/feed.xml](${BASE}/jobs/feed.xml) — RSS of the newest roles
- [openapi.json](${BASE}/openapi.json) — OpenAPI 3.1 description
- [llms.txt](${BASE}/llms.txt) · [llms-full.txt](${BASE}/llms-full.txt) · [AGENTS.md](${BASE}/AGENTS.md)
- [API catalog](${BASE}/.well-known/api-catalog) · [agent skills](${BASE}/.well-known/agent-skills/index.json)

## Jobs by department

${['engineering', 'data', 'product', 'design', 'compliance', 'onboarding', 'support', 'sales', 'marketing', 'finance', 'operations', 'people', 'other'].map(d => `- [${d}](${BASE}/jobs/${d}/)`).join('\n')}

## Blog posts

${BLOG_POSTS.map(([slug, d]) => `- [${slug.replace(/-/g, ' ')}](${BASE}/blog/${slug}/) (${d})`).join('\n')}

## Neobank profiles (${E.length})

${E.map(e => `- [${e.name}](${BASE}/n/${slugs.get(e.name)}/)`).join('\n')}

## Comparisons (${vsIndex.length})

${vsIndex.map(v => `- [${v.an} vs ${v.bn}](${BASE}/vs/${v.slug}/)`).join('\n')}
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.md'), sitemapMd);

/* ═══ llms-full.txt — llms.txt + one-line summary of every entity ═══ */
const llmsTxt = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
const entLine = e => {
  const bits = [e.category, e.custody, e.regulation_type, e.hq, e.founded && `founded ${e.founded}`,
    e.reported_users && `${e.reported_users.value_millions}M ${e.reported_users.metric}`].filter(Boolean).join(' · ');
  return `- [${e.name}](${BASE}/n/${slugs.get(e.name)}/): ${bits}`;
};
fs.writeFileSync(path.join(ROOT, 'llms-full.txt'), llmsTxt +
  `\n## Full directory (${E.length} entities, one line each)\n\n` +
  E.map(entLine).join('\n') + '\n');

/* /index.md — markdown twin of the homepage for Accept: text/markdown
   content negotiation (middleware.js); llms.txt body + YAML frontmatter */
fs.writeFileSync(path.join(ROOT, 'index.md'), `---
title: "neobankbeat · who watches the neobanks?"
description: "Independent, open-source directory of ${E.length} verified-active neobanks — compared on custody, regulation, cards, cashback, yield, stablecoins, KYC and geography."
canonical: https://www.neobankbeat.com/
date: ${TODAY}
---

` + llmsTxt);

console.log(`built ${nPages} profile pages, ${vsPages} comparison pages, sitemap with ${urls.length} URLs`);
