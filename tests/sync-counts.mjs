#!/usr/bin/env node
/* sync-counts.mjs — one source of truth for every count claimed in prose.
 *
 * Hand-maintained files (llms.txt, README.md, faq/index.html, index.html,
 * AGENTS.md) each restate dataset totals in English. They drifted apart badly:
 * 373 / 368 / 358 neobanks, 20 / 22 / 23 FAQ answers, 206 vs 219 investors,
 * 52 vs 56 web3-native, 60 vs 140 comparisons — all live at the same time.
 *
 * Every claim is anchored here by the words around it, so the numbers self-heal
 * on build and drift fails the test suite. Prose stays hand-written; only the
 * digits are owned by this script.
 *
 *   node tests/sync-counts.mjs           rewrite in place
 *   node tests/sync-counts.mjs --check   report drift, exit 1 (used by flowtest)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const p = f => path.join(ROOT, f);
const D = JSON.parse(fs.readFileSync(p('data.json'), 'utf8'));
const E = D.entities;

/* ═══ canonical stats ═══ */
const dirs = d => fs.existsSync(p(d))
  ? fs.readdirSync(p(d), { withFileTypes: true }).filter(x => x.isDirectory() && fs.existsSync(p(`${d}/${x.name}/index.html`))).map(x => x.name)
  : [];
const count = fn => E.filter(fn).length;
const tally = k => E.reduce((a, e) => (a[e[k]] = (a[e[k]] || 0) + 1, a), {});
const reg = tally('regulation_type'), cat = tally('category'), aud = tally('audience');
const faqHtml = fs.readFileSync(p('faq/index.html'), 'utf8');
const regions = E.reduce((a, e) => ((e.active_regions || []).forEach(r => a[r] = (a[r] || 0) + 1), a), {});

const S = {
  entities: E.length,
  traditional: cat.traditional, hybrid: cat.hybrid, web3: cat['web3-native'],
  profiles: dirs('n').length,
  comparisons: dirs('vs').length,
  whoOwns: dirs('n').filter(s => fs.existsSync(p(`n/${s}/who-owns/index.html`))).length,
  alternatives: dirs('n').filter(s => fs.existsSync(p(`n/${s}/alternatives/index.html`))).length,
  investors: dirs('investors').length,
  infra: dirs('infra').length,
  /* /browse/ is the generated index of every hub, so it is the one place that
     knows how many there are. Listing the families here instead let two new ones
     ship without being counted — and the check passed, because the expected
     number was derived from the same stale list as the prose. */
  hubs: (fs.readFileSync(p('browse/index.html'), 'utf8')
    .match(/href="\/[a-z]+\/[a-z0-9-]+\/"(?= class="|>)/g) || [])
    .filter(h => !/\/(n|vs|blog|infra|investors|jobs|report)\//.test(h)).length,
  /* visible <h3 id> questions == FAQPage mainEntity count; keep them equal */
  faq: (faqHtml.match(/"@type":"Question"/g) || []).length,
  glossary: (fs.readFileSync(p('glossary/index.html'), 'utf8').match(/<dt id=/g) || []).length,
  newsletters: (fs.readFileSync(p('newsletters/index.html'), 'utf8').match(/<b>\d+ newsletters<\/b>/) || [])[0]?.match(/\d+/)[0] * 1,
  licensed: reg['Licensed bank'],
  partnerBank: reg['Partner-bank model'],
  smb: aud['SMB & startups'], freelancers: aud['freelancers & creators'],
  niche: count(e => e.audience && e.audience !== 'general'),
  stablecoins: count(e => e.stablecoins),
  ai: count(e => e.ai),
  noKyc: count(e => e.kyc === 'No'),
  verifiedLinks: count(e => e.terms_url && e.privacy_url),
  xHandles: count(e => e.x_handle),
  africa: regions.Africa, asia: regions.Asia,
};

/* as-of month, from the last commit that touched data.json */
const dataDate = (() => {
  try {
    const d = execSync('git log -1 --format=%cs -- data.json', { cwd: ROOT }).toString().trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  } catch { return null; }
})();
const asOfMonth = dataDate
  ? new Date(dataDate + 'T00:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  : null;

/* ═══ rules: [before, number, after] — only the middle group is rewritten ═══ */
const n = (before, want, after) => ({ re: new RegExp(`(${before})(\\d+)(${after})`, 'g'), want });
const RULES = {
  'llms.txt': [
    n('directory of ', S.entities, ' verified-active neobanks'),
    n('all ', S.entities, ' entities with category'),
    n('grid of all ', S.entities, ' entities'),
    n('faq/\\): ', S.faq, ' questions on neobank safety'),
    n('glossary/\\): ', S.glossary, ' plain-language definitions'),
    n('investors/\\): ', S.investors, ' venture and strategic investors'),
    n('the ', S.newsletters, ' neobank & fintech newsletters'),
    n('\\[All ', S.entities, ' entity profiles\\]'),
    n('\\[', S.comparisons, ' head-to-head comparisons\\]'),
    n('\\[', S.whoOwns, ' "who owns it" pages\\]'),
    n('\\[', S.hubs, ' topic hubs\\]'),
    n('\\[', S.alternatives, ' "alternatives to it" pages\\]'),
    n('infra/\\): the ', S.infra, ' providers'),
  ],
  'AGENTS.md': [n('directory of ', S.entities, ' verified-active neobanks')],
  'faq/index.html': [
    n('Neobank FAQ — ', S.faq, ' honest answers'),
    n('<em>FAQ</em> — ', S.faq, ' honest answers'),
    n('fails\\? ', S.faq, ' straight answers'),
    n('dataset of ', S.entities, ' verified-active neobanks'),
    n('dataset of ', S.entities, ' neobanks\\.'),
    n('dataset of ', S.entities, ' tracked neobanks'),
    n('">', S.entities, ' verified-active neobanks</a>'),
    n('Of the ', S.entities, ' tracked neobanks'),
    n('neobanks, ', S.licensed, ' are fully licensed banks'),
    n('<strong>', S.licensed, ' are fully licensed banks</strong>'),
    n('<strong>', S.partnerBank, ' of 368 tracked neobanks run on a partner-bank'),
    n('<strong>', S.partnerBank, ' of the 368 tracked neobanks run on a partner-bank'),
    n(' of ', S.entities, ' tracked neobanks run on a partner-bank'),
    n(' of the ', S.entities, ' tracked neobanks run on a partner-bank'),
    n('versus ', S.licensed, ' that hold their own'),
    n('directory tracks ', S.web3, ' of them'),
    n('tracks ', S.web3, ' of them as the'),
    n('dataset \\(', S.smb, ' SMB-focused'),
    n('plus ', S.freelancers, ' freelancer-focused'),
    n('dataset \\(', S.smb, ' \\+ \\d+ tracked\\)'),
    n('\\+ ', S.freelancers, ' tracked\\)'),
    n('filter all ', S.entities, ' by exactly'),
    n('filters all ', S.entities, ' by custody'),
    n('Each of the ', S.entities, ' entities'),
    n('All ', S.entities, ' entities are verified active'),
    n('often-ignored ', S.africa, ' African'),
    n('and ', S.asia, ' Asian neobanks'),
    n('including ', S.africa, ' in Africa'),
    n('and ', S.asia, ' across Asia'),
  ],
  'index.html': [
    n('faq · ', S.faq, ' honest answers'),
    n('directory of ', S.entities, ' verified-active neobanks'),
  ],
  /* report/index.html is deliberately excluded: it describes a published dated
     edition, whose figures are pinned to report/<slug>/data-snapshot.json and
     must keep matching the PDF readers already downloaded. */
  'glossary/index.html': [n('<b>', S.glossary, ' terms</b>')],
  /* the AI post's headline ratio is the one dated-post figure worth keeping live:
     the tagged count still matches the dataset, so letting its complement drift
     would make the post contradict itself rather than merely age */
  'blog/ai-neobanks/index.html': [n('entities carry it; ', S.entities - S.ai, ' don')],
};
const DATE_RULES = asOfMonth ? {
  'llms.txt': [{ re: /(last full verification: )([A-Z][a-z]+ \d{4})/g, want: asOfMonth }],
} : {};

/* ═══ README stats block — charts and table regenerated wholesale ═══ */
const buildStatsBlock = () => {
  const decade = y => y < 2010 ? "<'10" : `'${String(y).slice(2)}`;
  const buckets = new Map([["<'10", 0]]);
  for (let y = 2010; y <= new Date().getUTCFullYear(); y++) buckets.set(decade(y), 0);
  for (const e of E) {
    const y = parseInt(e.founded);
    if (y) buckets.set(decade(y), (buckets.get(decade(y)) || 0) + 1);
  }
  const years = [...buckets.entries()].filter(([k, v], i) => i === 0 || v > 0 || k !== `'${String(new Date().getUTCFullYear()).slice(2)}`);
  const ceil = (v, step) => Math.ceil(v / step) * step;
  const regionRows = Object.entries(regions).sort((a, b) => b[1] - a[1]);
  return `## the dataset at a glance

\`\`\`mermaid
pie showData title ${S.entities} neobanks by category
    "traditional (fiat, custodial)" : ${S.traditional}
    "hybrid (fiat + custodial crypto)" : ${S.hybrid}
    "web3-native (self-custodial)" : ${S.web3}
\`\`\`

the three waves are visible in the founding years — challengers after 2011, the mobile-first boom peaking in 2019, and the web3-native wave arriving after 2020:

\`\`\`mermaid
xychart-beta
    title "neobanks founded per year"
    x-axis [${years.map(([k]) => `"${k}"`).join(', ')}]
    y-axis "founded" 0 --> ${ceil(Math.max(...years.map(([, v]) => v)), 10)}
    bar [${years.map(([, v]) => v).join(', ')}]
\`\`\`

\`\`\`mermaid
xychart-beta horizontal
    title "where they operate (multi-region players counted in every region)"
    x-axis [${regionRows.map(([k]) => `"${k}"`).join(', ')}]
    y-axis "active neobanks" 0 --> ${ceil(regionRows[0][1], 20)}
    bar [${regionRows.map(([, v]) => v).join(', ')}]
\`\`\`

more numbers from the current dataset:

| | |
|---|---|
| niche-audience neobanks (women-first, gen z, immigrants, faith-based…) | **${S.niche}** |
| with stablecoin support | **${S.stablecoins}** |
| licensed banks (charters, digital-bank licences) | **${S.licensed}** |
| running on a partner bank (BaaS) | **${S.partnerBank}** |
| with AI verifiably in production | **${S.ai}** |
| verified terms & privacy links (checked, not guessed) | **${S.verifiedLinks}** |
| official X handles on file | **${S.xHandles}** |
| no-KYC self-custodial wallets | **${S.noKyc}** |`;
};

/* ═══ apply ═══ */
const drift = [];
const rewrite = (file, txt) => {
  for (const { re, want } of RULES[file] || []) {
    txt = txt.replace(re, (m, a, num, b) => {
      if (String(num) === String(want)) return m;
      drift.push(`${file}: "${a.trim()} ${num} ${b.trim()}" → ${want}`);
      return a + want + b;
    });
  }
  for (const { re, want } of DATE_RULES[file] || []) {
    txt = txt.replace(re, (m, a, cur) => {
      if (cur === want) return m;
      drift.push(`${file}: "${a}${cur}" → ${want}`);
      return a + want;
    });
  }
  return txt;
};

const files = new Set([...Object.keys(RULES), ...Object.keys(DATE_RULES)]);
let changed = 0;
for (const f of files) {
  const src = fs.readFileSync(p(f), 'utf8');
  const out = rewrite(f, src);
  if (out !== src) { changed++; if (!CHECK) fs.writeFileSync(p(f), out); }
}

/* README block, delimited by markers so the prose around it stays hand-written */
{
  const src = fs.readFileSync(p('README.md'), 'utf8');
  const MARK = /<!-- stats:start -->[\s\S]*?<!-- stats:end -->/;
  const block = `<!-- stats:start -->\n${buildStatsBlock()}\n<!-- stats:end -->`;
  if (!MARK.test(src)) {
    drift.push('README.md: missing <!-- stats:start --> / <!-- stats:end --> markers');
  } else {
    const out = src.replace(MARK, block);
    if (out !== src) {
      drift.push('README.md: stats block out of date');
      changed++;
      if (!CHECK) fs.writeFileSync(p('README.md'), out);
    }
  }
}

if (CHECK) {
  if (drift.length) { console.error(`count drift in ${changed} file(s):\n  ` + drift.join('\n  ')); process.exit(1); }
  console.log(`counts in sync across ${files.size + 1} files (${S.entities} entities, ${S.faq} FAQ answers, ${S.comparisons} comparisons)`);
} else {
  console.log(drift.length
    ? `counts synced (${changed} file(s)):\n  ` + drift.join('\n  ')
    : `counts already in sync (${S.entities} entities)`);
}
