/* discover-neobanks.mjs — weekly scout for neobanks we're not tracking yet.
   Sources (no API keys needed):
     1. Wikipedia category members (Category:Neobanks, Category:Digital banks)
     2. Google News RSS headlines for launch/funding keywords
   Candidates are diffed against data.json entities and a persistent
   "already reported" list (tests/discovery-seen.json), then filed as a
   GitHub issue (label: new-neobank) when GITHUB_TOKEN is set — otherwise
   printed to stdout as a dry run.
   run: node tests/discover-neobanks.mjs                                     */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SEEN_FILE = path.join(import.meta.dirname, 'discovery-seen.json');
const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8')).entities;

const norm = s => String(s).toLowerCase().replace(/\s*\(.*?\)\s*/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
/* "Varo Bank" should match tracked "Varo": index and compare both the raw norm
   and a variant with a trailing bank/banking/financial word stripped */
const variants = n => {
  const s = n.replace(/\s+(bank|banking|financial)$/, '').trim();
  return s && s !== n ? [n, s] : [n];
};
const tracked = new Set(E.flatMap(e => [...variants(norm(e.name)), (e.domain || '').toLowerCase()]).filter(Boolean));
/* parent brands whose neobank product is already tracked under the product name */
for (const alias of ['chase', 'wema', 'jpmorgan chase']) tracked.add(alias); // Chase UK, ALAT by Wema
/* famously defunct neobanks — excluded from the dataset by design, but still
   sitting in Wikipedia's Neobanks/Online_banks categories */
const DEFUNCT = new Set(['simple', 'xinja', '86 400', 'volt', 'azlo', 'moven', 'finn by chase', 'finn', 'denizen', 'loot', 'bnext', 'orange bank', 'orange', 'dozens', 'lanistar', 'yolt']);
/* incumbent megabanks — headlines about their app launches aren't new neobanks
   (their standalone digital brands get tracked under the brand name instead) */
const INCUMBENT = new Set(['u s', 'us bank', 'jpmorgan', 'jpmorgan chase', 'bank of america', 'wells fargo', 'citi', 'citibank', 'citigroup', 'hsbc', 'barclays', 'santander', 'bbva', 'bnp paribas', 'societe generale', 'deutsche bank', 'ing', 'natwest', 'lloyds', 'goldman sachs', 'morgan stanley', 'standard chartered', 'abn amro', 'intesa sanpaolo', 'unicredit', 'credit agricole', 'commerzbank', 'nordea', 'rabobank', 'scotiabank', 'td bank', 'rbc', 'capital one', 'pnc', 'truist', 'green dot', 'h r block', 'paypal', 'visa', 'mastercard']);
const seen = fs.existsSync(SEEN_FILE) ? JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')) : {};

const get = async (url, accept = 'application/json') => {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'neobankbeat-discovery/1.0', accept } });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return accept === 'application/json' ? r.json() : r.text();
};

const STOP = new Set(['the', 'a', 'an', 'why', 'how', 'what', 'this', 'new', 'top', 'best', 'first', 'us', 'uk', 'eu', 'india', 'us based', 'uk based', 'here', 'meet', 'inside', 'digital', 'digital bank', 'neobank', 'neobanks', 'banking', 'fintech', 'crypto', 'startup', 'app', 'launch', 'exclusive', 'report', 'breaking', 'watch', 'video', 'opinion', 'analysis']);
const candidates = new Map(); // norm name -> {name, sources:[]}
const add = (name, source) => {
  const n = norm(name);
  if (!n || n.length < 3 || seen[n] || STOP.has(n)) return;
  if (variants(n).some(v => tracked.has(v) || DEFUNCT.has(v) || INCUMBENT.has(v))) return;
  if (/mascot|banking in|bank run|fintech/i.test(name)) return;
  /* country/region words extracted as "names" from headlines ("UAE launches…") */
  if (/^(uae|usa|europe|africa|asia|latam|australia|canada|germany|france|spain|italy|brazil|mexico|nigeria|kenya|egypt|saudi arabia|qatar|kuwait|japan|korea|china|singapore|indonesia|philippines|vietnam|thailand|pakistan|bangladesh)$/.test(n)) return;
  if (!candidates.has(n)) candidates.set(n, { name: name.trim(), sources: [] });
  if (!candidates.get(n).sources.includes(source)) candidates.get(n).sources.push(source);
};

/* ── 1. wikipedia categories ── */
for (const cat of ['Category:Neobanks', 'Category:Digital_banks', 'Category:Online_banks']) {
  try {
    let cont = '';
    do {
      const j = await get(`https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${cat}&cmlimit=500&cmtype=page&format=json${cont}`);
      for (const m of j.query?.categorymembers || []) {
        if (/^(List of|Comparison of|History of)/.test(m.title)) continue;
        add(m.title, `wikipedia:${cat.replace('Category:', '')}`);
      }
      cont = j.continue ? `&cmcontinue=${encodeURIComponent(j.continue.cmcontinue)}` : '';
    } while (cont);
  } catch (e) { console.error(`  !! ${cat}: ${e.message}`); }
}

/* ── 2. google news headlines ── */
const NEWS_QUERIES = [
  '"neobank" launch',
  'new "digital bank" launches',
  'neobank raises seed OR series',
  '"challenger bank" launches',
];
const NAME_PATTERNS = [
  /([A-Z][\w.&'-]+(?: [A-Z][\w.&'-]+)?)(?:,| has| officially| formally)? (?:launches|unveils|debuts|introduces|goes live|rolls out)/g,
  /(?:neobank|digital bank|challenger bank) ([A-Z][\w.&'-]+(?: [A-Z][\w.&'-]+)?)/g,
  /([A-Z][\w.&'-]+(?: [A-Z][\w.&'-]+)?),? (?:a|the) (?:new )?(?:neobank|digital bank|challenger bank)/g,
];
const headlines = [];
for (const q of NEWS_QUERIES) {
  try {
    const xml = await get(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, 'application/rss+xml');
    for (const m of xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g)) {
      const title = m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      if (title.includes('Google News')) continue;
      headlines.push(title);
      for (const re of NAME_PATTERNS) {
        for (const hit of title.matchAll(re)) {
          const cand = hit[1].replace(/['’]s$/, '');
          if (!STOP.has(norm(cand))) add(cand, `news: ${title.slice(0, 110)}`);
        }
      }
    }
  } catch (e) { console.error(`  !! news "${q}": ${e.message}`); }
}

/* ── report ── */
const found = [...candidates.values()].sort((a, b) => b.sources.length - a.sources.length);
console.log(`${found.length} new candidates (tracked: ${E.length}, previously reported: ${Object.keys(seen).length}, headlines scanned: ${headlines.length})`);
if (!found.length) process.exit(0);

const today = new Date().toISOString().slice(0, 10);
const body = [
  `Weekly discovery run (${today}) found **${found.length}** possible neobanks not in the dataset.`,
  `Candidates are auto-extracted from Wikipedia categories and news headlines — expect noise; verify before adding.`,
  '',
  ...found.slice(0, 40).map(c => `- [ ] **${c.name}**\n${c.sources.slice(0, 3).map(s => `  - ${s}`).join('\n')}`),
  found.length > 40 ? `\n…and ${found.length - 40} more (see workflow logs).` : '',
  '',
  `To add one: update \`data.json\` and run \`node tests/build-pages.mjs\`.`,
].join('\n');

if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
  const r = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'neobankbeat-discovery/1.0' },
    body: JSON.stringify({ title: `neobank discovery: ${found.length} candidates (${today})`, body, labels: ['new-neobank', 'discovery'] }),
  });
  if (!r.ok) { console.error(`issue creation failed: HTTP ${r.status} ${await r.text()}`); process.exit(1); }
  console.log(`filed issue: ${(await r.json()).html_url}`);
  // only mark as seen once actually reported, so a failed run retries next week
  for (const [n] of candidates) seen[n] = today;
  fs.writeFileSync(SEEN_FILE, JSON.stringify(seen, null, 1) + '\n');
} else {
  console.log('\n(dry run — set GITHUB_TOKEN + GITHUB_REPOSITORY to file an issue)\n');
  console.log(body);
}
