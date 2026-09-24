#!/usr/bin/env node
/* publish-window.mjs — is this diff just today's scheduled post going live?
 *
 * A post dated ahead sits in BLOG_POSTS and reaches the sitemap, the blog index
 * and the feed only when a build runs on its day. The daily rebuild does that
 * at ~05:41 UTC nominally, in practice hours later. Any push before it lands on
 * a publish day therefore regenerates output that legitimately differs from
 * what is committed, and CI's reproducibility step calls it drift.
 *
 * flowtest's own assertions already have grace for this window. The
 * reproducibility check did not, so publish days stayed red — the exact failure
 * that grace was added to remove, surviving in the one place it was not applied.
 *
 *   node tests/publish-window.mjs --explains-diff
 *     exit 0  the working-tree diff is entirely today's post going live
 *     exit 1  anything else — real drift, or nothing to explain
 *
 * Deliberately narrow. Additions only, in the three surfaces a publish touches,
 * and every content-bearing line has to name a post dated today. A real drift
 * modifies or deletes something, or touches a fourth file, and fails here.   */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TODAY = new Date().toISOString().slice(0, 10);
const SURFACES = new Set(['sitemap.xml', 'blog/index.html', 'blog/feed.xml']);

const say = (ok, msg) => { console.log(msg); process.exit(ok ? 0 : 1); };

const due = [...fs.readFileSync(path.join(ROOT, 'tests', 'build-pages.mjs'), 'utf8')
  .match(/const BLOG_POSTS = \[([\s\S]*?)\];/)[1]
  .matchAll(/\['([^']+)', '(\d{4}-\d{2}-\d{2})'\]/g)]
  .filter((m) => m[2] === TODAY).map((m) => m[1]);

if (!due.length) say(false, `no post is dated ${TODAY} — nothing for the publish window to explain`);

const g = (c) => execSync(c, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
const files = g('git diff --name-only').split('\n').filter(Boolean);
if (!files.length) say(false, 'no diff to explain');

const stray = files.filter((f) => !SURFACES.has(f));
if (stray.length) say(false, `not the publish window: also changed ${stray.slice(0, 4).join(', ')}`);

/* Additions only. A publish adds an entry; it never rewrites or removes one. */
const diff = g('git diff -U0 -- ' + [...SURFACES].join(' ')).split('\n');
const removed = diff.filter((l) => l.startsWith('-') && !l.startsWith('---'));
if (removed.length) say(false, `not the publish window: ${removed.length} line(s) removed, a publish only adds`);

const added = diff.filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
/* Structural lines carry no slug — <url>, </item>, a bare <priority>. Judge
   only the lines that name something, and require every one of them to name a
   post going live today. */
const bearing = added.filter((l) => /href=|<loc>|<link>|<guid>|<h2>|<title>/.test(l));
if (!bearing.length) say(false, 'not the publish window: no line names a post');

/* A publish adds the slug (sitemap loc, card href, feed guid) and also the
   post's own title, which carries no slug at all — the <title> in the feed
   item and the <h2> on the index card. Read each due post's title from its
   own HTML so those lines are explained by the same post rather than waved
   through. */
const titles = due.map((slug) => {
  try {
    const h = fs.readFileSync(path.join(ROOT, 'blog', slug, 'index.html'), 'utf8');
    return (h.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '').trim() || null;
  } catch { return null; }
}).filter(Boolean);

const names = (l) => due.some((slug) => l.includes(slug)) || titles.some((t) => l.includes(t));
const unexplained = bearing.filter((l) => !names(l));
if (unexplained.length) {
  say(false, `not the publish window: ${unexplained.length} added line(s) name something other than ${due.join(', ')}`
    + `\n  first: ${unexplained[0].trim().slice(0, 120)}`);
}

say(true, `publish window: ${due.join(', ')} going live on ${TODAY} — ${added.length} added line(s) across ${files.join(', ')}, nothing removed`);
