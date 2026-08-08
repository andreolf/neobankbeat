/* Canonical slug logic for neobankbeat. This is the single source of truth for
   the /n/<slug>/ URL slug. Three copies must stay in sync with this module:
   - tests/build-pages.mjs   (imports from here)
   - tests/build-changelog.mjs (inline copy — history-driven, kept identical)
   - app.js modalHistory IIFE (browser runtime copy, kept byte-identical)
   slugify + uniquification are identical across all copies so the persisted
   `slug` in data.json always equals the generated URL slug. */

export const slugify = n => String(n ?? '').normalize('NFD')
  .replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* Assign uniquified slugs over names in array order (must be data.json entity
   order so collision resolution matches every consumer). Returns Map<name, slug>. */
export function buildSlugMap(names) {
  const taken = new Set(), map = new Map();
  for (const name of names) {
    let s = slugify(name) || 'entity';
    while (taken.has(s)) s += '-2';
    taken.add(s); map.set(name, s);
  }
  return map;
}
