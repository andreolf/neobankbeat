/* ═══ Shared <head> text rules ═══
   Google truncates SERP snippets around 160 characters and rewrites what it
   cuts, so a 250-character description is a description Google writes for you.
   Every builder feeds its full editorial sentence to og:description (social
   cards have room) and a clamped version to meta description.

   Clamping prefers a sentence or middot boundary, falling back to a word
   boundary with an ellipsis, so the snippet still reads as a finished thought. */

export const DESC_MAX = 158;

export const BASE = 'https://www.neobankbeat.com';

/* trailing function words that make a truncated snippet read as cut off
   ("\u2026the", "\u2026are", "\u2026in") rather than as a finished thought */
const DANGLING = /\s+(?:a|an|and|are|as|at|be|but|by|for|from|has|have|in|into|is|it|its|of|on|or|our|per|plus|so|than|that|the|their|then|these|this|those|to|via|was|were|when|which|with|you|your)$/i;

export const clampDesc = (s, max = DESC_MAX) => {
  if (!s || s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' \u00b7 '));
  if (stop > max * 0.6) return cut.slice(0, stop + 1).trim();
  let w = cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\u00b7\u2014-]+$/, '').trim();
  /* peel trailing function words + punctuation so the ellipsis reads cleanly,
     but never cut back past ~55% of the budget (keep it substantive) */
  let prev;
  do {
    prev = w;
    w = w.replace(DANGLING, '').replace(/[,;:\u00b7\u2014-]+$/, '').trim();
  } while (w !== prev && w.length > max * 0.55);
  return w + '\u2026';
};

/* ═══ Breadcrumbs ═══
   Google renders a BreadcrumbList as the path shown above the title in results,
   replacing the raw URL. It also tells a crawler how the section nests, which
   the flat URL structure here does not. Every page except the homepage gets one;
   `crumbs` builds the node, `withCrumbs` folds it into an existing single-node
   block by promoting that block to an @graph. */

export const crumbs = (...trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [{ '@type': 'ListItem', position: 1, name: 'neobankbeat', item: BASE + '/' },
    ...trail.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 2, name, item }))],
});

export const withCrumbs = (ld, ...trail) => {
  const { '@context': ctx, ...node } = ld;
  return { '@context': ctx, '@graph': [node, crumbs(...trail)] };
};
