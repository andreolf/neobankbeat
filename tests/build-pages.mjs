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
<link rel="preload" href="/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/noto-sans-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/blog/blog.css">
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
      <a href="/#newssec">news</a>
      <a href="/#datasec">data</a>
      <a href="/#methodology">methodology</a>
      <a href="/blog/">blog</a>
      <a href="/report/">report</a>
      <a href="/jobs/">jobs</a>
      <button class="bwbtn" id="bwtoggle" aria-pressed="false">◐ black &amp; white</button>
    </nav>
  </div>
</header>
`;

const bwScript = `<script>(function(){var b=document.getElementById('bwtoggle');if(!b)return;function set(on){document.body.classList.toggle('bw',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'◑ color':'◐ black & white';try{localStorage.setItem('nbbw',on?'1':'0')}catch(e){}}try{if(localStorage.getItem('nbbw')==='1')set(true)}catch(e){}b.addEventListener('click',function(){set(!document.body.classList.contains('bw'))})})();</script>`;

const foot = `
<footer><div class="fwrap">
  <span>© neobankbeat · MIT</span>
  <a href="/">directory</a><a href="/blog/">blog</a><a href="/faq/">faq</a><a href="/glossary/">glossary</a><a href="/investors/">investors</a><a href="/report/">report</a><a href="/jobs/">jobs</a><a href="/data.json">data.json</a><a href="/llms.txt">llms.txt</a><a href="https://github.com/andreolf/neobankbeat">github</a>
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
#ivsearch{width:100%;box-sizing:border-box;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--text);font-family:var(--mono);font-size:12.5px;padding:10px 12px;margin:4px 0 18px}
#ivsearch:focus{outline:none;border-color:var(--accent)}
.ivrow{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:14px 16px;margin-bottom:10px;scroll-margin-top:80px}
.ivhead{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ivhead img{width:20px;height:20px;border-radius:5px;object-fit:contain}
.ivhead .nm{font-weight:700;font-size:15.5px;color:var(--text);text-decoration:none}
.ivhead .nm:hover{color:var(--accent)}
.ivhead .ct{font-family:var(--mono);font-size:10.5px;color:var(--dim)}
.ivhead .st{font-family:var(--mono);font-size:11px;color:var(--muted);margin-left:auto;text-decoration:none}
.ivhead .st:hover{color:var(--accent)}
.ivbanks{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.ivbanks a{font-family:var(--mono);font-size:11.5px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:3px 11px;text-decoration:none;white-space:nowrap}
.ivbanks a:hover{border-color:var(--accent);color:var(--text)}
</style>`;
  const rowHtml = ([name, v]) => `<div class="ivrow" id="${ivSlug(name)}" data-q="${esc((name + ' ' + v.banks.map(b => b.name).join(' ')).toLowerCase())}">
  <div class="ivhead">
    <img loading="lazy" alt="" src="https://www.google.com/s2/favicons?domain=${esc(invDom(v.site))}&amp;sz=64" onerror="this.style.visibility='hidden'">
    <a class="nm" href="${esc(v.site)}" target="_blank" rel="noopener nofollow">${esc(name)}</a>
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
<script>(function(){var q=document.getElementById('ivsearch'),rows=[].slice.call(document.querySelectorAll('.ivrow'));q.addEventListener('input',function(){var v=q.value.toLowerCase().trim();rows.forEach(function(r){r.style.display=!v||r.dataset.q.indexOf(v)>-1?'':'none'})})})();</script>` + foot).replace('<a href="/" class="on">', '<a href="/">');
  fs.mkdirSync(path.join(ROOT, 'investors'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'investors', 'index.html'), html.replace('</head>', style + '\n</head>'));
  console.log(`investors page: ${rows.length} investors, ${nBanks} neobanks`);
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
  { loc: `${BASE}/faq/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${BASE}/glossary/`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${BASE}/investors/`, changefreq: 'weekly', priority: '0.8' },
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
