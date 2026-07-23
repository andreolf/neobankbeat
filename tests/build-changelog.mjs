#!/usr/bin/env node
/* Build /changelog/ from the git history of data.json — visible proof the
   dataset is maintained. Run from repo root: node tests/build-changelog.mjs */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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
  [/regulation backfill/i, 'Labelled every neobank by how it is actually regulated — its own bank licence, a partner bank working behind the scenes, e-money, and so on — so you can tell which apps are really banks. A few that had quietly shut down were removed.'],
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

const nAdd = entries.reduce((a, e) => a + e.added.length, 0);
const nDel = entries.reduce((a, e) => a + e.removed.length, 0);
const lastDate = entries[0]?.date || '';

/* machine-readable version for agents */
fs.mkdirSync(path.join(ROOT, 'changelog'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'changelog', 'changelog.json'), JSON.stringify({
  generated: lastDate, total: now.length,
  entries: entries.map(e => ({ date: e.date, summary: e.baseline ? null : plainOf(e.subject), subject: e.subject, total: e.total, added: e.added, removed: e.removed, updated: e.updated })),
}, null, 1));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Changelog — every change to the neobank dataset · neobankbeat</title>
<meta name="description" content="Every addition, removal and update to the open neobank dataset, generated from version history. ${now.length} tracked entities, ${nAdd} added and ${nDel} removed since launch. Deaths included — that's the point.">
<link rel="canonical" href="${BASE}/changelog/">
<meta name="theme-color" content="#0A0A10">
<meta property="og:type" content="website">
<meta property="og:site_name" content="neobankbeat">
<meta property="og:title" content="The neobank dataset changelog">
<meta property="og:description" content="Every addition, removal and update, generated from version history. Deaths included — that's the point.">
<meta property="og:url" content="${BASE}/changelog/">
<meta property="og:image" content="${BASE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@neobankbeat">
<meta name="twitter:image" content="${BASE}/og.png">
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
</style>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebPage","name":"neobankbeat dataset changelog","url":"${BASE}/changelog/","description":"Every addition, removal and update to the open dataset of ${now.length} tracked neobanks, generated from version history.","isPartOf":{"@type":"WebSite","name":"neobankbeat","url":"${BASE}"}}
</script>
</head>
<body>
<header>
  <div class="hwrap">
    <a href="/" class="logo">neobank<span class="dot">beat</span></a>
    <nav class="hnav" aria-label="Primary">
      <a href="/">directory</a>
      <a href="/investors/">investors</a>
      <a href="/infra/">infra</a>
      <a href="/blog/">blog</a>
      <a href="/report/">report</a>
      <a href="/jobs/">jobs</a>
      <button class="bwbtn" id="bwtoggle" aria-pressed="false">◐ black &amp; white</button>
    </nav>
  </div>
</header>

<main class="wrap">
<article>
  <div class="eyebrow">the changelog</div>
  <h1>every change to <em>the dataset</em></h1>
  <p class="meta">Generated straight from version history — nothing curated, nothing hidden. <b>${now.length} entities tracked</b> · ${nAdd} added and ${nDel} removed since launch · last change ${fmtDate(lastDate)}. Also machine-readable: <a href="/changelog/changelog.json">changelog.json</a>.</p>
  <p>A directory is only as good as its maintenance, so the maintenance is public. Additions link to their profiles; removals stay on the record — neobanks die quietly, and <a href="/blog/why-neobanks-die/">the deaths are data too</a>. Every entry below corresponds to a real change in <a href="/data.json">data.json</a>.</p>

${rows}

  <div class="callout" style="margin-top:26px"><span class="k">watch it change</span>Follow <a href="https://x.com/neobankbeat" target="_blank" rel="noopener">@neobankbeat</a>, subscribe on <a href="https://neobankbeat.substack.com" target="_blank" rel="noopener">Substack</a>, or diff <a href="/data.json">data.json</a> yourself — the <a href="https://github.com/andreolf/neobankbeat">whole repo is public</a>.</div>
</article>
</main>

<footer><div class="fwrap">
  <span>© neobankbeat · MIT</span>
  <a href="/">directory</a><a href="/blog/">blog</a><a href="/faq/">faq</a><a href="/glossary/">glossary</a><a href="/investors/">investors</a><a href="/infra/">infra</a><a href="/changelog/">changelog</a><a href="/report/">report</a><a href="/jobs/">jobs</a><a href="/partner/">partner</a><a href="/data.json">data.json</a><a href="/llms.txt">llms.txt</a><a href="https://github.com/andreolf/neobankbeat">github</a><a href="https://x.com/neobankbeat" target="_blank" rel="noopener">𝕏 @neobankbeat</a>
</div></footer>
<script>(function(){var b=document.getElementById('bwtoggle');if(!b)return;function set(on){document.body.classList.toggle('bw',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'◑ color':'◐ black & white';try{localStorage.setItem('nbbw',on?'1':'0')}catch(e){}}try{if(localStorage.getItem('nbbw')==='1')set(true)}catch(e){}b.addEventListener('click',function(){set(!document.body.classList.contains('bw'))})})();</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'changelog', 'index.html'), html);
console.log(`changelog: ${entries.length} entries · +${nAdd} −${nDel} · ${now.length} tracked now`);
