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

const anchor = ([href, label, external]) =>
  `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;

export const FOOTER_LINKS = [
  ["/", "directory"],
  ["/vs/", "compare"],
  ["/blog/", "blog"],
  ["/faq/", "faq"],
  ["/glossary/", "glossary"],
  ["/investors/", "investors"],
  ["/infra/", "infra"],
  ["/ai/", "ai"],
  ["/newsletters/", "newsletters"],
  ["/changelog/", "changelog"],
  ["/report/", "report"],
  ["/jobs/", "jobs"],
  ["/partner/", "partner"],
  ["/data/", "dataset"],
  ["/data.json", "data.json"],
  ["/llms.txt", "llms.txt"],
  ["https://github.com/andreolf/neobankbeat", "github", true],
  ["https://x.com/neobankbeat", "𝕏 @neobankbeat", true],
];

/* Internal destinations every footer on the site must reach, homepage included. */
export const FOOTER_DESTINATIONS = FOOTER_LINKS.map(([href]) => href).filter((h) => h.startsWith("/"));

export const FOOTER_HTML = `<footer><div class="fwrap">
  <span>© neobankbeat · MIT</span>
  ${FOOTER_LINKS.map(anchor).join("")}
</div></footer>`;

/* Matches a rendered flat footer in any file, so the sync and the drift check
   agree on what counts as one. Non-greedy: a page has exactly one. */
export const FOOTER_RE = /<footer><div class="fwrap">[\s\S]*?<\/div><\/footer>/;
