#!/usr/bin/env node
/* Build /changelog/ from the git history of data.json — visible proof the
   dataset is maintained. Run from repo root: node tests/build-changelog.mjs */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { FOOTER_HTML, navHtml } from './footer.mjs';
import { clampDesc, withCrumbs } from './meta.mjs';

const ROOT = path.resolve(new URL('.', import.meta.url).pathname, '..');
const BASE = 'https://www.neobankbeat.com';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const git = cmd => execSync(`git ${cmd}`, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString();

const slugify = n => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'entity';

/* plain-English "what changed for you" per commit — matched by a distinctive
   substring of the commit subject. Keep these in five-year-old words. New
   commits without a match fall back to humanize() below. */
const PLAIN = [
  [/money-movement services|FX-markup/i, 'Added the real cost and features to each app: the fee it charges to spend abroad (FX markup) and what it lets you do with money — buy/sell crypto, get your own account number/IBAN, use virtual cards. Now you can compare apps on price, not just looks.'],
  [/regulation backfill/i, 'Labelled every neobank by how it is actually regulated — its own bank license, a partner bank working behind the scenes, e-money, and so on — so you can tell which apps are really banks. A few that had quietly shut down were removed.'],
  [/full-directory audit — \d+ verified tags/i, 'Checked all the apps for real, in-use AI and tagged only the ones that genuinely use it — for lending decisions, as the main chat interface, or built for AI "agents". Marketing fluff did not make the cut. Also removed Will Bank, which shut down.'],
  [/apply verification results/i, 'Added the first batch of verified "uses AI" tags and dropped four weak claims.'],
  [/feat: ai tag/i, 'Introduced an "AI" label for apps, and published a write-up on which neobanks actually use AI versus just talk about it.'],
  [/infra map \d+.\d+ providers/i, 'Grew the behind-the-scenes "who powers these apps" list from 36 to 106 providers, and added two apps: Brighty and Tangem.'],
  [/add Plata and Veera/i, 'Added two fast-growing apps (Plata and Veera), refreshed the figures for a few others, and published a post on the fastest-growing neobanks.'],
  [/add Startale and Moto/i, 'Added two crypto-card apps that were missing: Startale and Moto.'],
  [/Oui Capital backs PaySika/i, 'Recorded that investor Oui Capital backed PaySika.'],
  [/add PaySika/i, 'Added PaySika, a chat-first neobank for French-speaking Africa.'],
  [/add Mine/i, 'Added Mine, a Swiss app where you hold your own money (self-custody).'],
  [/add Flex/i, 'Added Flex, a brand-new "unicorn" app, right after its big funding round.'],
  [/close the metadata gaps/i, 'Filled in missing details — terms, privacy, home countries, founders and investors — for the seven newest apps.'],
  [/fizen: retag/i, 'Re-labelled Fizen as a travel & digital-nomad app to match how it now describes itself.'],
  [/\+SurfCash/i, 'Added SurfCash, an app that turns stablecoins into local QR payments for travellers.'],
  [/the U-card index/i, 'Built a page comparing all 90 cards you can spend stablecoins with, and added two more apps.'],
  [/\+4 nomad-wave money apps/i, 'Added four travel/nomad money apps (Lava, COCA, Karta, Hyperbeat) and renamed the travel category.'],
  [/HongShan listed under two names/i, 'Fixed a duplicate: the investor HongShan was listed twice, now merged.'],
  [/add Flouci/i, 'Added Flouci, a Tunisian all-in-one app with a free account and card.'],
  [/Oui Capital.*Moniepoint/i, 'Recorded Oui Capital as an early investor in Moniepoint.'],
  [/early investors — top VCs/i, 'Added the main investors behind each neobank, with links to them.'],
  [/link-rot repair|shareable filter URLs/i, 'Fixed broken links and made filtered views shareable by copying the web address.'],
  [/SEO, AI-agent surface/i, 'General polish: better search-engine visibility, support for AI crawlers, and mobile fixes.'],
];
/* strip a "type:" prefix and capitalise, as a readable fallback */
const humanize = s => {
  const t = s.replace(/^[a-z0-9+ ]+:\s*/i, '').replace(/\s*—.*$/, '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) + '.' : '';
};
const plainOf = subj => (PLAIN.find(([re]) => re.test(subj)) || [])[1] || humanize(subj);

/* Curated product & platform releases — shipped surfaces, fields and
   capabilities that don't surface as a data.json diff (a new page, an API, a
   whole language). The dataset section below is generated; this list is
   maintained by hand. Newest first; dates are the ship (merge) date. */
const RELEASES = [
  { date: '2026-08-13', tag: 'new', title: 'The State of Neobanks № 02 — August',
    body: 'The second monthly report ships — and the first with month-over-month deltas: what changed since July, a "why they died" graveyard page tracing every delisting to its cause (Synapse fallout, partner-bank exits, a regulator liquidation), and the month\'s new arrivals. 60 pages, free, every figure reproducible from the open dataset.',
    links: [['/report/', 'read the report']] },
  { date: '2026-08-13', tag: 'new', title: 'The money map on every profile',
    body: 'Each neobank profile now carries a "money map": who legally holds your balance, who keeps the authoritative ledger, what protection applies if it fails, and how you get your money back — a protection tier derived only from the verified custody and regulation fields.',
    links: [['/blog/who-holds-your-money/', 'the thinking behind it']] },
  { date: '2026-08-12', tag: 'new', title: 'World map + header language switcher',
    body: 'A per-country world map shades every country by how many neobanks are headquartered there, each tile linking to that country\'s list. The language chooser also moved into the header, top-right, so the five localized editions are one tap from any page.',
    links: [['/map/', 'the world map']] },
  { date: '2026-08-11', tag: 'new', title: 'MCP server for AI assistants',
    body: 'Point Claude — or any Model Context Protocol client — at neobankbeat and it answers from the live, cited dataset instead of stale training memory. Five read-only tools over all ' /* count filled at render */ ,
    links: [['/mcp/', 'how to use it'], ['/blog/neobankbeat-mcp-server/', 'launch post']], countSuffix: ' neobanks.' },
  { date: '2026-08-11', tag: 'new', title: 'Funding stage + sortable database',
    body: 'Every neobank now carries a normalized funding stage — Pre-seed through Series C+, Public and Acquired — so you can filter the directory by maturity. A new /database/ view puts the whole dataset in one sortable, scannable table.',
    links: [['/database/', 'open the database'], ['/data/', 'field reference']] },
  { date: '2026-08-11', tag: 'new', title: 'Feature matrix + semantic search',
    body: '19 verified feature flags per neobank (yield, stablecoins, self-custody, IBAN, virtual cards and more) collected into one comparison grid, plus an in-browser semantic search that runs entirely client-side — no backend, works offline.',
    links: [['/matrix/', 'feature matrix'], ['/search/', 'smart search']] },
  { date: '2026-08-09', tag: 'i18n', title: 'Five languages',
    body: 'Profiles, head-to-head comparisons and country pages localized into German, Italian, French, Spanish and Portuguese — with reciprocal hreflang, localized metadata and a language switcher in the footer, so non-English searchers can find the right neobank in their own language.',
    links: [['/de/', 'Deutsch'], ['/es/', 'Español'], ['/pt/', 'Português']] },
  { date: '2026-08-08', tag: 'data', title: '11 neobanks added + "emerging" status',
    body: 'Eleven community-submitted neobanks added after hands-on verification, and a new "emerging" status introduced for pre-launch names — the directory can now track what is coming without pretending it is already live.',
    links: [['/browse/', 'browse the directory']] },
];

/* commits touching data.json, oldest → newest */
const commits = git(`log --format='%H|%ad|%s' --date=short -- data.json`)
  .trim().split('\n').map(l => {
    const [hash, date, ...s] = l.replace(/^'|'$/g, '').split('|');
    return { hash, date, subject: s.join('|') };
  }).reverse();

const entsAt = hash => {
  try {
    const raw = git(`show ${hash}:data.json`);
    const d = JSON.parse(raw);
    return d.entities || d;
  } catch { return null; }
};

const entries = [];
let prev = null;
for (const c of commits) {
  const ents = entsAt(c.hash);
  if (!ents) continue;
  const byName = new Map(ents.map(e => [e.name, e]));
  if (prev) {
    const prevBy = prev.byName;
    const added = [...byName.keys()].filter(n => !prevBy.has(n));
    const removed = [...prevBy.keys()].filter(n => !byName.has(n));
    const updated = [...byName.keys()].filter(n =>
      prevBy.has(n) && JSON.stringify(byName.get(n)) !== JSON.stringify(prevBy.get(n)));
    if (added.length || removed.length || updated.length) {
      entries.push({ ...c, total: ents.length, added, removed, updated });
    }
  } else {
    entries.push({ ...c, total: ents.length, added: [], removed: [], updated: [], baseline: true });
  }
  prev = { byName };
}
entries.reverse(); /* newest first */

/* current slugs for linking added/updated entities that still exist */
const now = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8')).entities;
const taken = new Set(), SLUG = {};
for (const e of now) {
  let s = slugify(e.name); while (taken.has(s)) s += '-2';
  taken.add(s); SLUG[e.name] = s;
}
const nameLink = n => SLUG[n] ? `<a href="/n/${SLUG[n]}/">${esc(n)}</a>` : `<span class="gone">${esc(n)}</span>`;
const nameList = (names, cap = 10) => {
  const shown = names.slice(0, cap).map(nameLink).join(', ');
  return names.length > cap ? `${shown} <span class="moremuted">+${names.length - cap} more</span>` : shown;
};

const fmtDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const rows = entries.map(e => {
  const parts = [];
  if (e.baseline) parts.push(`<div class="chg base">dataset first published · <b>${e.total} entities</b></div>`);
  if (e.added.length) parts.push(`<div class="chg add"><span class="sign">+${e.added.length}</span> added: ${nameList(e.added)}</div>`);
  if (e.removed.length) parts.push(`<div class="chg del"><span class="sign">−${e.removed.length}</span> removed: ${nameList(e.removed)}</div>`);
  if (e.updated.length) parts.push(`<div class="chg upd"><span class="sign">~${e.updated.length}</span> updated: ${nameList(e.updated, 8)}</div>`);
  const plain = e.baseline ? '' : plainOf(e.subject);
  return `  <div class="centry">
    <div class="chead"><span class="cdate">${fmtDate(e.date)}</span><span class="ctotal">${e.total} tracked</span></div>
    ${plain ? `<div class="cplain">${esc(plain)}</div>` : ''}
    <div class="csub"><span class="clbl">under the hood</span>${esc(e.subject)}</div>
${parts.join('\n')}
  </div>`;
}).join('\n');

const relRows = RELEASES.map(r => {
  const body = r.countSuffix ? `${r.body}${now.length}${r.countSuffix}` : r.body;
  const links = r.links?.length
    ? `<div class="rlinks">${r.links.map(([h, l]) => `<a href="${h}">${esc(l)} →</a>`).join('')}</div>` : '';
  return `  <div class="centry rel">
    <div class="chead"><span class="cdate">${fmtDate(r.date)}</span><span class="reltag">${esc(r.tag)}</span></div>
    <div class="ctitle">${esc(r.title)}</div>
    <div class="cplain">${esc(body)}</div>
    ${links}
  </div>`;
}).join('\n');

const nAdd = entries.reduce((a, e) => a + e.added.length, 0);
const nDel = entries.reduce((a, e) => a + e.removed.length, 0);
const lastDate = entries[0]?.date || '';

/* machine-readable version for agents */
fs.mkdirSync(path.join(ROOT, 'changelog'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'changelog', 'changelog.json'), JSON.stringify({
  generated: lastDate, total: now.length,
  releases: RELEASES.map(r => ({ date: r.date, tag: r.tag, title: r.title, body: r.countSuffix ? `${r.body}${now.length}${r.countSuffix}` : r.body, links: (r.links || []).map(([href]) => href) })),
  entries: entries.map(e => ({ date: e.date, summary: e.baseline ? null : plainOf(e.subject), subject: e.subject, total: e.total, added: e.added, removed: e.removed, updated: e.updated })),
}, null, 1));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Changelog — every change to the neobank dataset · neobankbeat</title>
<meta name="description" content="${clampDesc(`Every change to the open neobank dataset, from version history: ${now.length} tracked entities, ${nAdd} added and ${nDel} removed since launch. Deaths included \u2014 that's the point.`)}">
<link rel="canonical" href="${BASE}/changelog/">
<meta name="theme-color" content="#0A0A10">
<meta property="og:type" content="website">
<meta property="og:site_name" content="neobankbeat">
<meta property="og:title" content="The neobank dataset changelog">
<meta property="og:description" content="Every addition, removal and update, generated from version history. Deaths included — that's the point.">
<meta property="og:url" content="${BASE}/changelog/">
<meta property="og:image" content="${BASE}/og/changelog.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@neobankbeat">
<meta name="twitter:image" content="${BASE}/og/changelog.png">
<link rel="icon" href="/favicon.ico" sizes="64x64">
<link rel="icon" type="image/png" href="/favicon.png" sizes="64x64">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/noto-sans-mono.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">
<link rel="stylesheet" href="/blog/blog.css">
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};window.nbevt=function(n,d){try{va("event",{name:n,data:d||{}})}catch(_){}try{gtag("event",n,d||{})}catch(_){}}</script><script defer src="/_vercel/insights/script.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-E3KE01L5DL"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-E3KE01L5DL")</script>
<style>
.centry{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:16px 20px;margin:14px 0}
.chead{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.cdate{font-weight:700;font-size:15px}
.ctotal{font-family:var(--mono,'Noto Sans Mono',monospace);font-size:11.5px;color:var(--dim)}
.cplain{font-size:14.5px;line-height:1.62;color:var(--text);margin:9px 0 8px}
.csub{font-family:var(--mono,'Noto Sans Mono',monospace);font-size:11.5px;color:var(--dim);margin:4px 0 10px}
.clbl{text-transform:uppercase;letter-spacing:1px;font-size:10px;color:var(--dim);border:1px solid var(--line);border-radius:5px;padding:1px 6px;margin-right:8px}
.chg{font-size:13.5px;line-height:1.7;margin:4px 0;color:var(--muted)}
.chg a{color:var(--text)}
.chg .sign{font-family:var(--mono,'Noto Sans Mono',monospace);font-weight:700;margin-right:6px}
.add .sign{color:#BAF24A}.del .sign{color:#FF6B6B}.upd .sign{color:#89B0FF}
.gone{color:var(--dim);text-decoration:line-through}
.moremuted{color:var(--dim)}
.base{color:var(--muted)}
.relh{font-size:12px;text-transform:uppercase;letter-spacing:2px;color:var(--dim);margin:38px 0 6px;border-top:1px solid var(--line);padding-top:24px}
.relsub{font-size:13px;line-height:1.6;color:var(--dim);margin:0 0 12px}
.rel .ctitle{font-weight:700;font-size:15.5px;margin:8px 0 2px}
.reltag{font-family:var(--mono,'Noto Sans Mono',monospace);font-size:10px;text-transform:uppercase;letter-spacing:1px;padding:1px 7px;border-radius:5px;border:1px solid var(--line);color:var(--accent)}
.rlinks{margin-top:9px;font-size:12.5px}
.rlinks a{color:var(--text);margin-right:16px;white-space:nowrap}
</style>
<script type="application/ld+json">
${JSON.stringify(withCrumbs({"@context":"https://schema.org","@type":"WebPage",name:"neobankbeat dataset changelog",url:`${BASE}/changelog/`,description:`Every addition, removal and update to the open dataset of ${now.length} tracked neobanks, generated from version history.`,isPartOf:{"@type":"WebSite",name:"neobankbeat",url:BASE}},["changelog",`${BASE}/changelog/`]))}
</script>
</head>
<body>
<a class="skip" href="#main">skip to content</a>
<header>
  <div class="hwrap">
    <a href="/" class="logo">neobank<span class="dot">beat</span></a>
    <nav class="hnav" aria-label="Primary">
${navHtml(null)}
      <button class="bwbtn" id="bwtoggle" aria-pressed="false">◐ black &amp; white</button>
    </nav>
  </div>
</header>

<main class="wrap" id="main">
<article>
  <div class="eyebrow">the changelog</div>
  <h1>every change to <em>the dataset</em></h1>
  <p class="meta">What we shipped, plus every dataset change straight from version history — nothing hidden. <b>${now.length} entities tracked</b> · ${nAdd} added and ${nDel} removed since launch · last change ${fmtDate(lastDate)}. Removed ≠ deleted: every delisting is archived with its cause of death in <a href="/graveyard/">the graveyard</a>. Also machine-readable: <a href="/changelog/changelog.json">changelog.json</a>.</p>
  <p>A directory is only as good as its maintenance, so the maintenance is public. Below: what we shipped for you, then every change to the data itself.</p>

  <h2 class="relh">product &amp; platform</h2>
  <p class="relsub">New surfaces, fields and capabilities — things you can now do that you couldn't a week ago.</p>
${relRows}

  <h2 class="relh">dataset changes</h2>
  <p class="relsub">Generated straight from version history — additions link to their profiles, removals stay on the record. Neobanks die quietly, and <a href="/blog/why-neobanks-die/">the deaths are data too</a>. Every entry maps to a real change in <a href="/data.json">data.json</a>.</p>
${rows}

  <div class="callout" style="margin-top:26px"><span class="k">watch it change</span>Follow <a href="https://x.com/neobankbeat" target="_blank" rel="noopener">@neobankbeat</a>, subscribe on <a href="https://neobankbeat.substack.com" target="_blank" rel="noopener">Substack</a>, or diff <a href="/data.json">data.json</a> yourself — the <a href="https://github.com/andreolf/neobankbeat">whole repo is public</a>.</div>
</article>
</main>

${FOOTER_HTML}
<script>(function(){var b=document.getElementById('bwtoggle');if(!b)return;function set(on){document.body.classList.toggle('bw',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'◑ color':'◐ black & white';try{localStorage.setItem('nbbw',on?'1':'0')}catch(e){}}try{if(localStorage.getItem('nbbw')==='1')set(true)}catch(e){}b.addEventListener('click',function(){set(!document.body.classList.contains('bw'))})})();</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'changelog', 'index.html'), html);
console.log(`changelog: ${entries.length} entries · +${nAdd} −${nDel} · ${now.length} tracked now`);
