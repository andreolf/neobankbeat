/* build-app-js.mjs — keep the homepage's application code in app.js, not in the HTML.
 *
 * The directory grew as fourteen stacked inline <script> layers, which left index.html
 * at ~346KB where only ~60KB was markup. Everything that fetches the page — browsers on
 * a cold cache, Googlebot, and the LLM crawlers that never execute JS — paid for 283KB
 * of code on every single request, and none of it could be cached separately from the
 * content it renders.
 *
 * This moves those blocks verbatim into /app.js, in the same order, referenced by a
 * plain <script src> at the exact position the first block occupied. No defer, no
 * module, no reordering: execution semantics are identical, the file just becomes
 * cacheable and the HTML becomes small. The ?v= hash lets it be cached immutably.
 *
 * First run extracts. After that app.js is the source of truth and this only refreshes
 * the hash, so editing app.js directly is the intended workflow.
 *
 *   node tests/build-app-js.mjs          extract / refresh
 *   node tests/build-app-js.mjs --check  verify the page and app.js agree, exit 1
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'index.html');
const APP = path.join(ROOT, 'app.js');
const CHECK = process.argv.includes('--check');

const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const tag = h => `<script src="/app.js?v=${h}"></script>`;
const TAG_RE = /<script src="\/app\.js\?v=([0-9a-f]+)"><\/script>/;
const PRELOAD_RE = /<link rel="preload" as="script" href="\/app\.js\?v=([0-9a-f]+)">\n/;

let html = fs.readFileSync(HTML, 'utf8');
const kb = n => (n / 1024).toFixed(0) + 'KB';
const before = html.length;

/* the application layers: every inline script that isn't analytics config or JSON-LD.
   Analytics stubs sit in <head> and must stay inline (they queue calls before load). */
const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(m => !/ld\+json/.test(m[1]) && m.index > html.indexOf('</header>'));

/* hash and write exactly the same bytes, so ?v= is verifiable from app.js alone */
const norm = s => s.replace(/\n*$/, '\n');

let app;
if (blocks.length) {
  app = norm(blocks.map(m => m[2]).join('\n'));
  const start = blocks[0].index;
  const end = blocks[blocks.length - 1].index + blocks[blocks.length - 1][0].length;
  const between = html.slice(start, end)
    .replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g, '').trim();
  if (between) {
    console.error(`refusing to extract: ${between.length} chars of markup sit between the script blocks`);
    process.exit(1);
  }
  html = html.slice(0, start) + tag(hash(app)) + html.slice(end);
} else {
  if (!fs.existsSync(APP)) { console.error('no inline blocks and no app.js — nothing to do'); process.exit(1); }
  app = norm(fs.readFileSync(APP, 'utf8'));
  const h = hash(app);
  if (!TAG_RE.test(html)) { console.error('app.js exists but index.html does not reference it'); process.exit(1); }
  html = html.replace(TAG_RE, tag(h));
}

/* the tag sits at the end of <body>, so the browser only discovers it after parsing
   the whole document — a preload hint starts the fetch with the first byte instead */
html = html.replace(PRELOAD_RE, '');
html = html.replace(/(<link rel="canonical"[^>]*>\n)/,
  `$1<link rel="preload" as="script" href="/app.js?v=${hash(app)}">\n`);

const stale = !fs.existsSync(APP) || fs.readFileSync(APP, 'utf8') !== app
  || fs.readFileSync(HTML, 'utf8') !== html;

if (CHECK) {
  if (stale) {
    console.error('app.js / index.html out of sync — run node tests/build-app-js.mjs');
    process.exit(1);
  }
  console.log(`app.js in sync (${kb(app.length)}, hash ${hash(app)})`);
} else {
  fs.writeFileSync(APP, app);
  fs.writeFileSync(HTML, html);
  console.log(blocks.length
    ? `app.js: extracted ${blocks.length} inline blocks (${kb(app.length)}); index.html ${kb(before)} → ${kb(html.length)}`
    : `app.js: hash refreshed (${kb(app.length)}, ${hash(app)})`);
}
