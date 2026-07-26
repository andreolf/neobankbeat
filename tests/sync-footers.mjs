#!/usr/bin/env node
/* sync-footers.mjs — push the canonical footer and header nav into hand-written HTML.

   Generated pages get their footer from footer.mjs at build time. The blog is
   static HTML with no build step, so it drifts instead: that is how 19 posts
   ended up with no link to /data/ at all. This rewrites those footers from the
   same source and reports what changed.

   run: node tests/sync-footers.mjs           rewrite in place
        node tests/sync-footers.mjs --check   exit 1 on drift, touch nothing

   --check is what flowtest calls, so a hand-edited footer fails the suite
   rather than silently shipping.

   The header nav gets the same treatment. It is the reason /browse/ could be
   added to every page in one command instead of forty-seven edits.           */
import fs from 'node:fs';
import path from 'node:path';
import { FOOTER_HTML, FOOTER_RE, FOOTER_DESTINATIONS, NAV_RE, NAV_LINK_RE, NAV_DESTINATIONS, navHtml } from './footer.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const check = process.argv.includes('--check');

/* Every page with a flat footer, generated output included. Listing the
   generated directories to skip would be a second thing to keep in sync — the
   point of this script. Generated pages already match, so they are a no-op;
   when they don't, the build output is stale and saying so is the right answer. */
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (e.name.startsWith('.') || e.name === 'node_modules') return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : e.name.endsWith('.html') ? [p] : [];
});

const files = walk(ROOT).filter((f) => FOOTER_RE.test(fs.readFileSync(f, 'utf8')));

let changed = [];
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const current = src.match(FOOTER_RE)[0];
  if (current === FOOTER_HTML) continue;
  changed.push(path.relative(ROOT, f));
  if (!check) fs.writeFileSync(f, src.replace(FOOTER_RE, FOOTER_HTML));
}

/* The header nav, same idea. A page's active link is whichever one it already
   marked, so re-emitting never moves someone's "you are here". The homepage is
   excluded: its nav points at on-page anchors, which is correct for a page that
   is the directory rather than a link to it. */
const navFiles = walk(ROOT)
  .filter((f) => f !== path.join(ROOT, 'index.html'))
  .filter((f) => NAV_RE.test(fs.readFileSync(f, 'utf8')));

const navChanged = [];
for (const f of navFiles) {
  const src = fs.readFileSync(f, 'utf8');
  const [, open, body, gap, tail] = src.match(NAV_RE);
  const active = [...body.matchAll(NAV_LINK_RE)].find((m) => m[0].includes('class="on"'))?.[1] ?? null;
  const indent = (body.match(/\n([ \t]+)</) || [, '  '])[1];
  const want = `\n${navHtml(active, indent)}`;
  if (body === want) continue;
  navChanged.push(path.relative(ROOT, f));
  if (!check) fs.writeFileSync(f, src.replace(NAV_RE, `${open}${want}${gap}${tail}`));
}

/* The homepage keeps its own grouped footer, so it is held to the weaker
   contract: it may present links differently, but it may not drop one. "/" is
   exempt — it links "#directory" instead, being the page itself. */
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const footStart = home.indexOf('<footer>');
const homeFooter = home.slice(footStart, home.indexOf('</footer>', footStart));
const missing = FOOTER_DESTINATIONS.filter((h) => h !== '/' && !homeFooter.includes(`href="${h}"`));

/* Same weaker contract for the homepage's nav: it swaps three links for on-page
   anchors, but every off-page destination must still be reachable from it. */
const homeNav = (home.match(NAV_RE) || [, '', ''])[2];
const navMissing = NAV_DESTINATIONS
  .filter((h) => h !== '/' && !homeNav.includes(`href="${h}"`));

if (check) {
  for (const f of changed) console.log(`footer drift: ${f}`);
  for (const f of navChanged) console.log(`nav drift: ${f}`);
  if (missing.length) console.log(`index.html footer is missing: ${missing.join(' ')}`);
  if (navMissing.length) console.log(`index.html nav is missing: ${navMissing.join(' ')}`);
  const bad = changed.length + navChanged.length + missing.length + navMissing.length;
  console.log(bad
    ? `✗ ${bad} shell problem(s) — run: node tests/sync-footers.mjs`
    : `✓ ${files.length} flat footers and ${navFiles.length} navs match, homepage covers all ${FOOTER_DESTINATIONS.length} destinations`);
  process.exit(bad ? 1 : 0);
}

for (const f of changed) console.log(`footer: ${f}`);
for (const f of navChanged) console.log(`nav: ${f}`);
if (missing.length) console.log(`\n! index.html footer is missing ${missing.join(' ')} — add by hand, its layout is bespoke`);
if (navMissing.length) console.log(`! index.html nav is missing ${navMissing.join(' ')} — add by hand, it uses on-page anchors`);
console.log(`${changed.length} of ${files.length} flat footers and ${navChanged.length} of ${navFiles.length} navs rewritten`);
