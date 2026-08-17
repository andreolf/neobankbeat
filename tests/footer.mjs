/* ═══ The flat site footer — one definition, four consumers ═══
   Generated surfaces import FOOTER_HTML directly (build-pages, build-changelog,
   build-jobs). The blog is hand-written HTML with no build step, so
   sync-footers.mjs rewrites it in place and flowtest fails on any drift.

   The homepage deliberately keeps its own footer: grouped columns, on-page hash
   anchors and a disclaimer, none of which make sense on an inner page. It is
   held to a weaker contract — it must not *omit* a destination listed here, so a
   new section can't be added to the site and missed on the front page. That is
   the check FOOTER_DESTINATIONS exists for.

   Order is deliberate: browse surfaces, then publications, then machine-readable
   data, then off-site. Add a link once, here. */

import { LOCALES } from './i18n.mjs';

const anchor = ([href, label, external]) =>
  `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;

/* language switcher — links to each locale landing so the translations are
   discoverable from every page (per-page locale links live on profiles). */
const langbar = `<span class="langbar">🌐 <a href="/" onclick="window.nbevt&&nbevt('lang_switch',{to:'en'})">EN</a>${LOCALES.map((l) => ` · <a href="/${l.code}/" onclick="window.nbevt&&nbevt('lang_switch',{to:'${l.code}'})">${l.code.toUpperCase()}</a>`).join("")}</span>`;

/* The footer is grouped by audience intent — the flat 24-link row stopped
   scanning around link fifteen. Four labeled columns: the consumer journey,
   the publications, the machine-readable data, and everything else. */
export const FOOTER_GROUPS = [
  ["choose a bank", [
    ["/", "directory"],
    ["/browse/", "browse"],
    ["/fit/", "find your fit"],
    ["/ask/", "ask AI"],
    ["/vs/", "compare"],
    ["/map/", "world map"],
  ]],
  ["research", [
    ["/blog/", "blog"],
    ["/report/", "report"],
    ["/graveyard/", "graveyard"],
    ["/changelog/", "changelog"],
    ["/investors/", "investors"],
    ["/infra/", "infra"],
    ["/ai/", "ai"],
    ["/newsletters/", "newsletters"],
  ]],
  ["open data", [
    ["/data/", "dataset"],
    ["/data.json", "data.json"],
    ["/llms.txt", "llms.txt"],
    ["/mcp/", "mcp server"],
  ]],
  ["more", [
    ["/faq/", "faq"],
    ["/glossary/", "glossary"],
    ["/jobs/", "jobs"],
    ["/partner/", "partner"],
    ["https://github.com/andreolf/neobankbeat", "github", true],
    ["https://x.com/neobankbeat", "𝕏 @neobankbeat", true],
  ]],
];

/* Flat view of the same links — the contract lists below derive from it. */
export const FOOTER_LINKS = FOOTER_GROUPS.flatMap(([, links]) => links);

/* Internal destinations every footer on the site must reach, homepage included. */
export const FOOTER_DESTINATIONS = FOOTER_LINKS.map(([href]) => href).filter((h) => h.startsWith("/"));

export const FOOTER_HTML = `<footer><div class="fwrap fgrid">
${FOOTER_GROUPS.map(([title, links]) => `  <div class="fgrp"><span class="fh">${title}</span>${links.map(anchor).join("")}</div>`).join("\n")}
  <div class="fmeta"><span>© neobankbeat · MIT</span>${langbar}</div>
</div></footer>`;

/* Matches a rendered footer in any file — flat (legacy) or grouped — so the
   sync and the drift check agree on what counts as one. Non-greedy: a page
   has exactly one, and the first "</div></footer>" it reaches is its own. */
export const FOOTER_RE = /<footer><div class="fwrap[^"]*">[\s\S]*?<\/div><\/footer>/;

/* ═══ The header nav — same contract, different element ═══
   Three direct links and three intent groups (rendered as native <details>
   dropdowns, same mechanism as the language menu — real <a> links, crawlable,
   no JS). NAV_LINKS stays the flat canonical order: flowtest reads this
   literal from source and holds every nav on the site to it, groups included.

   navHtml(active) marks one link current (and its group's summary, when the
   active link sits inside one). sync-footers.mjs reads which link a page
   already had marked and re-emits it that way, so a page's sense of "you are
   here" survives a nav change it wasn't edited for. */
export const NAV_LINKS = [
  ["/", "directory"],
  ["/browse/", "browse"],
  ["/fit/", "find your fit"],
  ["/ask/", "ask AI"],
  ["/vs/", "compare"],
  ["/map/", "world map"],
  ["/database/", "database"],
  ["/matrix/", "matrix"],
  ["/blog/", "blog"],
  ["/investors/", "investors"],
  ["/infra/", "infra"],
  ["/ai/", "ai"],
  ["/graveyard/", "graveyard"],
  ["/changelog/", "changelog"],
  ["/newsletters/", "newsletters"],
  ["/data/", "dataset"],
  ["/data.json", "data.json"],
  ["/llms.txt", "llms.txt"],
  ["/mcp/", "mcp server"],
  ["/report/", "report"],
  ["/jobs/", "jobs"],
];

export const NAV_DESTINATIONS = NAV_LINKS.map(([href]) => href);

/* How the flat list renders: a string is a direct link (label from NAV_LINKS),
   an object is a dropdown group over a slice of it. Order must match. */
const NAV_LABEL = new Map(NAV_LINKS.map(([href, label]) => [href, label]));
export const NAV_GROUPS = [
  "/",
  { label: "find a bank", items: ["/browse/", "/fit/", "/ask/", "/vs/", "/map/", "/database/", "/matrix/"] },
  { label: "research", items: ["/blog/", "/investors/", "/infra/", "/ai/", "/graveyard/", "/changelog/", "/newsletters/"] },
  { label: "data", items: ["/data/", "/data.json", "/llms.txt", "/mcp/"] },
  "/report/",
  "/jobs/",
];

/* Language chooser for the header, top-right. A native <details> disclosure so
   it is crawlable (real <a> links) and needs no JS. English is "/"; each locale
   its landing page, mirroring the footer langbar. Deliberately language-agnostic
   (a plain globe, no current-locale marker) so every page — English and
   localized alike — emits byte-identical markup and sync-footers stays a no-op. */
const LANGS = [["/", "en", "English"], ...LOCALES.map((l) => [`/${l.code}/`, l.code, l.label])];
export const langMenu = (indent = "      ") =>
  `${indent}<details class="langmenu">
${indent}  <summary aria-label="Choose language">🌐<span class="lcar">▾</span></summary>
${indent}  <div class="langpop">
${LANGS.map(([href, code, name]) =>
    `${indent}    <a href="${href}" onclick="window.nbevt&&nbevt('lang_switch',{to:'${code}'})">${name}</a>`).join("\n")}
${indent}  </div>
${indent}</details>`;

export const navHtml = (active = null, indent = "      ") =>
  NAV_GROUPS.map((entry) => {
    if (typeof entry === "string")
      return `${indent}<a href="${entry}"${entry === active ? ' class="on"' : ""}>${NAV_LABEL.get(entry)}</a>`;
    /* the group summary carries no active class — several templates mark the
       active link by string-replacing the plain <a> after the fact, and the
       shell sync must agree with them byte-for-byte. The "you are here"
       highlight on the summary is done in CSS via :has(a.on) instead. */
    return `${indent}<details class="navgrp">
${indent}  <summary>${entry.label}<span class="ncar">▾</span></summary>
${indent}  <div class="navpop">
${entry.items.map((href) =>
      `${indent}    <a href="${href}"${href === active ? ' class="on"' : ""}>${NAV_LABEL.get(href)}</a>`).join("\n")}
${indent}  </div>
${indent}</details>`;
  }).join("\n") +
  "\n" + langMenu(indent);

/* The nav's links only; the surrounding <nav> and any extra controls (the black
   &amp; white toggle) are left to each template, since the report edition ships
   its own standalone CSS and cannot reuse the site's classes. */
export const NAV_RE = /(<nav class="hnav"[^>]*>)([\s\S]*?)(\n[ \t]*)(<button|<\/nav>)/;
export const NAV_LINK_RE = /<a href="(\/[^"]*)"(?: class="on")?>[^<]*<\/a>/g;
