/* build-news.mjs — "top news" refresh for the main page.
   Pulls Google News RSS for neobank-related queries, ranks headlines by
   (tracked-entity match + signal keywords + source quality + recency),
   dedupes, keeps at most ONE story per 2-day window over the past 2 months
   (only the biggest story of each window survives), and rewrites the
   NEWS-AUTO block inside index.html.
   Safety: if fewer than MIN_ITEMS good headlines are found, index.html is
   left untouched (the site keeps last week's list instead of going empty).
   run: node tests/build-news.mjs                                          */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8')).entities;

const MAX_ITEMS = 40;      // covers Jan → today at one story per multi-day slot
const MIN_ITEMS = 8;
/* capture everything since Jan 1 of the current year — the feed is a timeline of 2026 */
const MAX_AGE_DAYS = Math.ceil((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 1)) / 864e5);
const SLOT_DAYS = 2;       // at most ONE headline per 2-day window — only the biggest story survives

/* entity names that are common English words — headline matches would be noise */
const AMBIG = new Set(['One', 'Current', 'Dave', 'Step', 'Found', 'Open', 'Slice', 'Wave', 'Strike', 'Branch', 'Juno', 'Albert', 'Karat', 'Majority', 'Purple', 'Copper', 'Fold', 'Point', 'Level', 'Wallet', 'Cash', 'Cogni', 'Aspire', 'Jupiter', 'Maya', 'Rainbow', 'Phantom', 'Lunar', 'Neon', 'Amber', 'Carbon', 'Indy', 'blu', 'Up', 'Boost', 'DANA', 'KAST']);
const NAMES = E.map(e => e.name).filter(n => n.length >= 3 && !AMBIG.has(n))
  .sort((a, b) => b.length - a.length);

const SIGNAL = [
  [/raises|funding round|series [a-e]\b|seed round|\$\d+(\.\d+)?\s?(m|b|million|billion)/i, 3],
  [/banking licen[cs]e|charter|authori[sz]ed|regulator|fined?\b|lawsuit|settle/i, 3],
  [/\bipo\b|goes public|files to list|acquisition|acquires?|merger|shuts? down|winds? down|collapse/i, 3],
  [/launches?|unveils|rolls out|debuts|expands? (to|into)|enters/i, 2],
  [/stablecoin|crypto card|self.custod/i, 2],
  [/unicorn|valuation|million (users|customers)|profit/i, 2],
  [/neobank|challenger bank|digital bank/i, 1],
];
const GOOD_SOURCES = /techcrunch|bloomberg|reuters|financial times|ft\.com|cnbc|finextra|sifted|american banker|fintech futures|techcabal|the paypers|business insider|forbes|wsj|wall street journal|coindesk|the block/i;
/* retail-investor / stock-tip mills — never front-page material */
const BAD_SOURCES = /motley fool|zacks|seeking alpha|simply wall|insider monkey|benzinga|stocktwits/i;
/* listicle / evergreen / opinion / sponsored junk */
const JUNK = /best neobanks?|top \d+|how to|what is|review:|vs\.?\s|promo|bonus|deals?\b|coupon|\breferral\b|stocks? to (buy|watch)|price prediction|horoscope|^why |^opinion|^analysis|full list|explained$|\?$|pre-?seed|skyrocket|retail investors|^forget|millionaires?\b|motley fool/i;

const QUERIES = [
  'neobank when:7d',
  '"challenger bank" OR "digital bank" funding OR licence OR launch when:7d',
  'neobank raises OR acquires OR IPO OR stablecoin when:7d',
  'Revolut OR Nubank OR Monzo OR Chime OR N26 OR "Starling Bank" OR bunq OR Wise when:7d',
  'Mercury OR Brex OR Ramp OR Klarna OR "Cash App" OR Moniepoint OR OPay OR GCash when:7d',
  /* wider nets for the big stories of the year so far */
  'neobank OR "digital bank" raises OR valuation OR IPO OR acquisition when:1y',
  'Revolut OR Nubank OR Chime OR Klarna OR Monzo valuation OR profit OR licence OR IPO when:1y',
  'Mercury OR Brex OR Ramp OR Wise OR Starling OR bunq funding OR IPO OR launch when:1y',
  '"stablecoin" bank OR card OR payments launch when:1y',
  'fintech "billion" valuation OR round when:1y',
  'Chime OR Klarna OR "Circle" IPO 2026 when:1y',
  'neobank "banking licence" OR charter OR acquisition 2026 when:1y',
];

const get = async url => {
  const r = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { 'user-agent': 'neobankbeat-news/1.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.text();
};
const unesc = s => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();

/* ── fetch & parse ── */
const items = new Map(); // dedupe key -> item
for (const q of QUERIES) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  let xml;
  try { xml = await get(url); } catch (e) { console.error(`  !! ${q}: ${e.message}`); continue; }
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const block = m[1];
    const pick = tag => (block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || '';
    let title = unesc(pick('title'));
    const link = unesc(pick('link'));
    const pub = new Date(unesc(pick('pubDate')));
    const source = unesc(pick('source'));
    if (!title || !link || isNaN(pub)) continue;
    /* google appends " - Publisher" to titles (publisher may itself contain hyphens) */
    const cut = title.lastIndexOf(' - ');
    if (cut > 20) {
      const tail = title.slice(cut + 3).trim().toLowerCase();
      const src = source.toLowerCase();
      if (tail.length <= 45 && (tail.includes(src.slice(0, 8)) || src.includes(tail.slice(0, 8)) || /\.[a-z]{2,3}$/.test(tail))) title = title.slice(0, cut).trim();
    }
    if (title.length < 25 || JUNK.test(title) || BAD_SOURCES.test(source)) continue;
    const ageDays = (Date.now() - pub.getTime()) / 864e5;
    if (ageDays > MAX_AGE_DAYS) continue;
    /* every headline must be visibly about money/banking — kills same-name noise
       (Phoenix Mercury games, highway ramps, CHIME medical studies, …) */
    if (!/bank|fintech|payment|card|funding|raises?|valuation|licen[cs]|stablecoin|crypto|account|deposit|\bipo\b|profit|lend|loan|wallet|money|remittance|\$\s?\d|€\s?\d|£\s?\d/i.test(title)) continue;

    let score = 0;
    const matched = [];
    for (const n of NAMES) {
      /* case-sensitive: "ramp" on a highway must not match Ramp */
      if (new RegExp(`(?<![\\w])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`).test(title)) {
        matched.push(n); score += 4;
        if (matched.length === 2) break;
      }
    }
    /* an entity name alone isn't news — require a real event keyword too */
    if (!SIGNAL.some(([re]) => re.test(title))) continue;
    for (const [re, pts] of SIGNAL) if (re.test(title)) score += pts;
    if (GOOD_SOURCES.test(source)) score += 2;
    score += Math.max(0, 2 - ageDays / 7); // freshness bonus, fades over 2 weeks

    if (score < 5) continue;
    /* no tracked entity in the headline → must at least be explicitly about the space */
    if (!matched.length && !/neobank|digital bank|challenger bank|banking licen[cs]e/i.test(title)) continue;
    const key = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').slice(0, 7).join(' ');
    const item = { title, link, pub, source, matched, score };
    if (!items.has(key) || items.get(key).score < score) items.set(key, item);
  }
}

/* ── rank: strongest stories first, then ONE winner per 2-day slot ──
   walking the ranked list guarantees each slot keeps its single biggest story;
   one headline per entity keeps variety across the two months */
const ranked = [...items.values()].sort((a, b) => b.score - a.score || b.pub - a.pub);
const chosen = [];
const usedEntity = new Set();
const usedSlot = new Set();
/* same-story-different-source dedupe: ≥4 shared significant words incl. one distinctive one */
const GENERIC = new Set(['digital', 'bank', 'neobank', 'fintech', 'ipo', 'valuation', 'billion', 'million', 'raises', 'funding', 'launches', 'launch', 'stablecoin', 'with', 'after', 'first', 'says', 'said']);
const toks = t => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(x => x.length > 3));
const sameStory = (a, b) => {
  const tb = toks(b);
  const shared = [...toks(a)].filter(x => tb.has(x));
  return shared.length >= 3 && shared.some(x => !GENERIC.has(x));
};
for (const it of ranked) {
  if (it.score < 6) continue; // "most important only" — raise the floor
  const slot = Math.floor((Date.now() - it.pub.getTime()) / (SLOT_DAYS * 864e5));
  if (usedSlot.has(slot)) continue;
  const dupEntity = it.matched.length && it.matched.every(n => usedEntity.has(n));
  if (dupEntity) continue;
  if (chosen.some(c => sameStory(c.title, it.title))) continue;
  usedSlot.add(slot);
  it.matched.forEach(n => usedEntity.add(n));
  chosen.push(it);
  if (chosen.length === MAX_ITEMS) break;
}
chosen.sort((a, b) => b.pub - a.pub); // display newest → oldest

console.log(`fetched ${items.size} candidates → keeping ${chosen.length}`);
chosen.forEach(it => console.log(`  [${it.score.toFixed(1)}] ${it.pub.toISOString().slice(0, 10)} ${it.title} (${it.source})`));

if (chosen.length < MIN_ITEMS) {
  console.error(`only ${chosen.length} good headlines (< ${MIN_ITEMS}) — leaving index.html untouched`);
  process.exit(0);
}

/* ── rewrite the NEWS-AUTO block in index.html ── */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const jstr = s => JSON.stringify(String(s));
const rows = chosen.map(it => {
  const d = `${MON[it.pub.getUTCMonth()]} ${it.pub.getUTCDate()}`;
  const sub = `via ${it.source}${it.matched.length ? ' · ' + it.matched.join(', ') : ''}`;
  return `[${jstr(d)},${jstr(it.title)},${jstr(sub)},${jstr(it.link)}]`;
}).join(',\n');

let html = fs.readFileSync(INDEX, 'utf8');
if (!/\/\*NEWS-AUTO-START\*\/[\s\S]*?\/\*NEWS-AUTO-END\*\//.test(html) || !/const NEWS_UPDATED="[^"]*";/.test(html)) {
  console.error('!! NEWS-AUTO markers not found in index.html'); process.exit(1);
}
const before = html;
html = html.replace(/\/\*NEWS-AUTO-START\*\/[\s\S]*?\/\*NEWS-AUTO-END\*\//,
  `/*NEWS-AUTO-START*/\n${rows}\n/*NEWS-AUTO-END*/`);
const today = new Date().toISOString().slice(0, 10);
html = html.replace(/const NEWS_UPDATED="[^"]*";/, `const NEWS_UPDATED="${today}";`);

if (html === before) { console.log('headlines unchanged — index.html already fresh'); process.exit(0); }
fs.writeFileSync(INDEX, html);
console.log(`wrote ${chosen.length} headlines into index.html (updated ${today})`);
