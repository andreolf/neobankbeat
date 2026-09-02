#!/usr/bin/env node
/* sync-blog-index.mjs — the blog index and RSS feed follow BLOG_POSTS.
 *
 * Posts can be dated ahead: build-pages already holds a future-dated post out
 * of the sitemap until its day arrives. But the index cards and the feed items
 * were hand-written, so a scheduled post either appeared early (wrong date on
 * the card) or never appeared at all unless someone remembered to add it. That
 * is why a queue never worked: nothing published it.
 *
 * This makes the queue real. A post whose date is in the future is held out of
 * both surfaces; on its day the daily rebuild runs this and the card and feed
 * item appear with no human action.
 *
 * Hand-written copy is preserved: an existing card keeps its exact title,
 * blurb and tag. Only new (or newly published) posts are generated, from the
 * post's own <h1>, meta description and eyebrow.
 *
 *   node tests/sync-blog-index.mjs           rewrite in place
 *   node tests/sync-blog-index.mjs --check   exit 1 on drift, touch nothing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const TODAY = new Date().toISOString().slice(0, 10);
const BASE = 'https://www.neobankbeat.com';

const posts = [...fs.readFileSync(path.join(ROOT, 'tests', 'build-pages.mjs'), 'utf8')
  .match(/const BLOG_POSTS = \[([\s\S]*?)\];/)[1]
  .matchAll(/\['([^']+)', '(\d{4}-\d{2}-\d{2})'\]/g)]
  .map((m) => ({ slug: m[1], date: m[2] }))
  .filter((p) => p.date <= TODAY);

const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const meta = (slug) => {
  const h = fs.readFileSync(path.join(ROOT, 'blog', slug, 'index.html'), 'utf8');
  const pick = (re) => (h.match(re) || [])[1] || '';
  return {
    title: pick(/<h1>([\s\S]*?)<\/h1>/).replace(/<[^>]+>/g, '').trim(),
    desc: pick(/<meta name="description" content="([^"]*)"/),
    tag: pick(/<div class="eyebrow">([^<]*)<\/div>/).replace(/<[^>]+>/g, '').trim(),
    ogdesc: pick(/<meta property="og:description" content="([^"]*)"/),
  };
};
const longDate = (d) => new Date(d + 'T00:00:00Z')
  .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
const rfc822 = (d) => new Date(d + 'T10:00:00Z').toUTCString().replace('GMT', 'GMT');

/* ── blog/index.html postcards ── */
const idxPath = path.join(ROOT, 'blog', 'index.html');
let idx = fs.readFileSync(idxPath, 'utf8');
const listRe = /<div class="postlist">([\s\S]*?)\n  <\/div>/;
const current = idx.match(listRe);
if (!current) { console.error('blog/index.html: no .postlist block'); process.exit(1); }

/* Keep every hand-written card exactly as-is, keyed by slug. Split on the card
   boundary rather than matching to the first </a>: several blurbs contain inline
   links, which a non-greedy match truncates mid-sentence. */
const existing = new Map(current[1]
  .split(/\n\s*(?=<a class="postcard")/)
  .map((chunk) => chunk.trim())
  .filter((chunk) => chunk.startsWith('<a class="postcard"'))
  .map((chunk) => [chunk.match(/href="\/blog\/([^/]+)\//)[1], chunk]));

/* newest first; same-day posts keep the order they already appear in, so the
   sync never reshuffles hand-placed cards */
const order = [...existing.keys()];
posts.sort((a, b) => b.date.localeCompare(a.date)
  || ((order.indexOf(a.slug) + 1 || 99) - (order.indexOf(b.slug) + 1 || 99)));

const cards = posts.map(({ slug, date }) => {
  if (existing.has(slug)) return '    ' + existing.get(slug);
  const m = meta(slug);
  return `    <a class="postcard" href="/blog/${slug}/">
      <span class="pdate">${longDate(date)}</span>
      <h2>${esc(m.title)}</h2>
      <p>${esc(m.desc)}</p>
      <span class="ptag">${esc(m.tag)}</span>
    </a>`;
});
/* replacer FUNCTION, not a string: card copy contains figures like "$1.4B",
   and in a replacement string "$1" expands to capture group 1 — which spliced
   the entire old list back in and truncated the blurb at the dollar sign. */
const nextIdx = idx.replace(listRe, () => `<div class="postlist">\n${cards.join('\n')}\n  </div>`);

/* ── blog/feed.xml items ── */
const feedPath = path.join(ROOT, 'blog', 'feed.xml');
let feed = fs.readFileSync(feedPath, 'utf8');
const feedHas = (slug) => feed.includes(`${BASE}/blog/${slug}/</guid>`);
const missing = posts.filter((p) => !feedHas(p.slug));
let nextFeed = feed;
if (missing.length) {
  const items = missing.map(({ slug, date }) => {
    const m = meta(slug);
    return `  <item>
    <title>${esc(m.title)}</title>
    <link>${BASE}/blog/${slug}/</link>
    <guid>${BASE}/blog/${slug}/</guid>
    <pubDate>${rfc822(date)}</pubDate>
    <description>${esc(m.ogdesc || m.desc)}</description>
  </item>`;
  }).join('\n');
  nextFeed = feed.replace(/(<atom:link[^>]*\/>\n)/, (m0) => `${m0}${items}\n`);
}

const drift = [];
if (nextIdx !== idx) drift.push('blog/index.html');
if (nextFeed !== feed) drift.push('blog/feed.xml');

if (CHECK) {
  console.log(drift.length
    ? `✗ blog index/feed drift: ${drift.join(', ')} — run: node tests/sync-blog-index.mjs`
    : `✓ blog index and feed list all ${posts.length} published posts`);
  process.exit(drift.length ? 1 : 0);
}
if (nextIdx !== idx) fs.writeFileSync(idxPath, nextIdx);
if (nextFeed !== feed) fs.writeFileSync(feedPath, nextFeed);
console.log(drift.length
  ? `blog surfaces updated (${drift.join(', ')}) — ${posts.length} published posts`
  : `blog index and feed already list all ${posts.length} published posts`);
