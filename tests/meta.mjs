/* ═══ Shared <head> text rules ═══
   Google truncates SERP snippets around 160 characters and rewrites what it
   cuts, so a 250-character description is a description Google writes for you.
   Every builder feeds its full editorial sentence to og:description (social
   cards have room) and a clamped version to meta description.

   Clamping prefers a sentence or middot boundary, falling back to a word
   boundary with an ellipsis, so the snippet still reads as a finished thought. */

export const DESC_MAX = 158;

export const clampDesc = (s, max = DESC_MAX) => {
  if (!s || s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' \u00b7 '));
  if (stop > max * 0.6) return cut.slice(0, stop + 1).trim();
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:\u00b7\u2014-]$/, '').trim() + '\u2026';
};
