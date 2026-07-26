/* sync-blog-asof.mjs — stamp dated posts with the dataset size they were written against.
 *
 * Blog posts cite dataset totals ("92 of the 365 neobanks we track hold a licence").
 * Those numbers were true on the publish date and the analysis around them was written
 * against them, so rewriting them to today's total would be a lie about what was
 * observed, and recomputing every derived figure would rewrite the argument.
 *
 * Instead each post declares its own vintage: this script reads the dominant total the
 * post cites, compares it to live data.json, and maintains a dated note between
 * markers. Readers stop wondering which number is right; models get an explicit
 * as-of date to attach to the claim instead of guessing it is current.
 *
 *   node tests/sync-blog-asof.mjs          rewrite
 *   node tests/sync-blog-asof.mjs --check  report drift, exit 1 (flowtest)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => path.join(ROOT, ...a);
const CHECK = process.argv.includes('--check');
const LIVE = JSON.parse(fs.readFileSync(p('data.json'), 'utf8')).entities.length;

const START = '<!-- asof:start -->';
const END = '<!-- asof:end -->';

/* the total a post is built on: the most-cited 3-digit figure that appears in
   dataset-total phrasing. Ties break high, since posts tend to state the total
   up front and derive smaller subsets from it later. */
const citedTotal = (body) => {
  const tally = new Map();
  const near = /(?:of|all|across|track|tracked|directory|entities|entity|total|among)[^.]{0,40}?\b(3\d\d|4[0-4]\d)\b|\b(3\d\d|4[0-4]\d)\b[^.]{0,40}?(?:neobanks?|entit(?:y|ies)|tracked|directory)/gi;
  for (const m of body.matchAll(near)) {
    const n = +(m[1] || m[2]);
    tally.set(n, (tally.get(n) || 0) + 1);
  }
  if (!tally.size) return null;
  return [...tally].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
};

const note = (total) => `${START}
  <p class="asof">Figures in this post describe a snapshot of <b>${total}</b> tracked neobanks. The dataset now tracks <b>${LIVE}</b>, so counts here will not match the live site — the analysis stands, but for current numbers use the <a href="/browse/">browsable cuts</a>, the <a href="/">live directory</a> or <a href="/data.json">data.json</a>.</p>
  ${END}`;

const CSS = `<style>.asof{font-family:var(--mono);font-size:11.5px;line-height:1.7;color:var(--dim);border-left:2px solid var(--line);padding:2px 0 2px 12px;margin:18px 0}.asof b{color:var(--muted);font-weight:600}.asof a{color:var(--accent)}</style>`;

const drift = [];
let changed = 0;
const dirs = fs.readdirSync(p('blog'), { withFileTypes: true })
  .filter(x => x.isDirectory()).map(x => x.name).sort();

for (const d of dirs) {
  const f = p('blog', d, 'index.html');
  if (!fs.existsSync(f)) continue;
  let h = fs.readFileSync(f, 'utf8');

  const art = (h.match(/<article[\s\S]*?<\/article>/) || [''])[0];
  const body = art.replace(new RegExp(START + '[\\s\\S]*?' + END), '').replace(/<[^>]+>/g, ' ');
  const total = citedTotal(body);
  const has = h.includes(START);

  /* posts that cite no total, or whose total is still current, need no note */
  if (!total || total === LIVE) {
    if (has) {
      h = h.replace(new RegExp('\\s*' + START + '[\\s\\S]*?' + END), '');
      if (CHECK) drift.push(`blog/${d}: stale as-of note should be removed`);
      else { fs.writeFileSync(f, h); changed++; }
    }
    continue;
  }

  const want = note(total);
  const next = has
    ? h.replace(new RegExp(START + '[\\s\\S]*?' + END), want)
    : h.replace(/(<p class="meta">.*?<\/p>\n)/, `$1  ${want}\n`);
  const withCss = next.includes('.asof{') ? next : next.replace('</head>', CSS + '\n</head>');

  if (withCss === h) continue;
  if (CHECK) drift.push(`blog/${d}: as-of note missing or stale (cites ${total}, live ${LIVE})`);
  else { fs.writeFileSync(f, withCss); changed++; }
}

if (CHECK) {
  if (drift.length) {
    console.error(`as-of drift in ${drift.length} post(s):`);
    for (const d of drift) console.error('  ' + d);
    process.exit(1);
  }
  console.log(`as-of notes in sync across ${dirs.length} posts (live total ${LIVE})`);
} else {
  console.log(`as-of notes: ${changed} post(s) stamped (live total ${LIVE})`);
}
