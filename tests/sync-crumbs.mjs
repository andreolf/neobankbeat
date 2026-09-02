#!/usr/bin/env node
/* sync-crumbs.mjs — give hand-written pages the BreadcrumbList the builders emit.

   Google replaces the URL line in a result with the breadcrumb trail when it
   finds one, and uses it to understand how a section nests — which a flat URL
   scheme does not communicate on its own. Every builder emits one; the blog,
   partner page and anything else written by hand had none, so 23 pages showed
   a bare URL where the rest of the site shows a path.

   run: node tests/sync-crumbs.mjs           inject or refresh in place
        node tests/sync-crumbs.mjs --check   exit 1 on any page missing one

   The injected block is its own <script>, fenced by a marker comment, rather
   than a rewrite of the page's existing node. Multiple JSON-LD blocks are legal
   and keeping them separate means this never has to parse or reserialise
   hand-written schema it did not author.

   --check covers generated pages too. It cannot fix them — the next build would
   overwrite the fix — so it names the builder at fault instead.                */
import fs from 'node:fs';
import path from 'node:path';
import { BASE, crumbs } from './meta.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const check = process.argv.includes('--check');

const MARK = '<!-- crumbs -->';
/* Consumes every newline ahead of the marker so re-inserting one leading newline
   lands on the same bytes — otherwise the file gains a blank line per run. */
const BLOCK_RE = /\n*<!-- crumbs -->\n<script type="application\/ld\+json">\n[\s\S]*?\n<\/script>/;

/* Paths written by a builder. A missing trail in one of these is a bug in that
   builder, not something to paper over here — the next build would drop the fix.
   /report/ is split deliberately: each edition page is generated, the landing
   page above them is written by hand. */
const GENERATED = [
  /^(n|vs|regulation|kyc|cards|regions|countries|for|browse|infra|investors|jobs|changelog|faq|glossary|data|ai|stablecoin-cards|newsletters|sitemap)\//,
  /^report\/[^/]+\//,
];
const isGenerated = (rel) => GENERATED.some((r) => r.test(rel));

const SKIP_DIR = /^(node_modules|\.git|tests|reports|substack-html|og|fonts|dataset|\.well-known)$/;
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (e.name.startsWith('.') || SKIP_DIR.test(e.name)) return [];
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : e.name.endsWith('.html') ? [p] : [];
});

/* Section labels stay lowercase and the leaf keeps its natural case, matching
   the trails build-pages.mjs already emits. */
const SECTION = {
  blog: 'blog', partner: 'partner', report: 'report', jobs: 'jobs',
  changelog: 'changelog', n: 'neobanks', vs: 'comparisons',
};

const titleOf = (html) => {
  /* tolerate whitespace after the colon: a hand-written page with
     pretty-printed JSON-LD used to fall through to the crumb trail's own
     "name":"neobankbeat" and label itself that. */
  const ld = (html.match(/"(?:headline|name)":\s*"((?:[^"\\]|\\.)*)"/) || [])[1];
  if (ld) return JSON.parse(`"${ld}"`);
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  if (h1) return h1.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return null;
};

const pretty = (slug) => slug.replace(/-/g, ' ');

let injected = [], missing = [], scanned = 0;

for (const f of walk(ROOT)) {
  const src = fs.readFileSync(f, 'utf8');
  if (/<meta name="robots" content="noindex/.test(src)) continue;
  const rel = path.relative(ROOT, f);
  if (rel === 'index.html') continue;           // the homepage is the root crumb
  scanned++;

  /* A trail outside our fenced block belongs to the page or its builder; leave
     it alone. Only the absence of any trail is a finding. */
  const stripped = src.replace(BLOCK_RE, '');
  if (/BreadcrumbList/.test(stripped)) continue;

  if (isGenerated(rel)) { missing.push(rel); continue; }

  const segs = rel.replace(/\/?index\.html$/, '').split('/').filter(Boolean);
  const trail = segs.map((seg, i) => {
    const url = `${BASE}/${segs.slice(0, i + 1).join('/')}/`;
    const last = i === segs.length - 1;
    const label = last && segs.length > 1 ? (titleOf(src) || pretty(seg)) : (SECTION[seg] || pretty(seg));
    return [label, url];
  });

  const block = `\n${MARK}\n<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', ...crumbs(...trail) })}\n</script>`;
  const want = stripped.replace('</head>', `${block}\n</head>`);
  if (src === want) continue;                    // already carries this exact trail
  injected.push(`${rel}  ${trail.map((t) => t[0]).join(' > ')}`);
  if (!check) fs.writeFileSync(f, want);
}

if (check) {
  for (const m of injected) console.log(`no breadcrumbs: ${m.split('  ')[0]}`);
  for (const m of missing) console.log(`no breadcrumbs (generated — fix the builder): ${m}`);
  const bad = injected.length + missing.length;
  console.log(bad
    ? `✗ ${bad} page(s) without a breadcrumb trail — run: node tests/sync-crumbs.mjs`
    : `✓ all ${scanned} indexable pages below / carry a BreadcrumbList`);
  process.exit(bad ? 1 : 0);
}

for (const m of injected) console.log(`crumbs: ${m}`);
for (const m of missing) console.log(`! generated page with no crumbs, fix its builder: ${m}`);
console.log(`${injected.length} of ${scanned} pages given a breadcrumb trail`);
