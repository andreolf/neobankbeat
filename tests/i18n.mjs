/* i18n.mjs — localization primitives for build-pages.mjs.
 *
 * Pilot scope: German (de), "metadata tier" — titles/meta/OG/JSON-LD, enum
 * labels and page chrome are translated; editorial prose (note, story, FAQ
 * answers) stays English under an honesty banner. Numbers/dates are canonical.
 *
 * English ('en') is the base locale and is served un-prefixed at the root;
 * localized locales live under /<lang>/. Adding a language is a data change:
 * drop an i18n/<lang>.json and add it to LOCALES.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* enabled localized locales (English is implicit base, not listed here) */
export const LOCALES = [
  { code: 'de', htmlLang: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'it', htmlLang: 'it', label: 'Italiano', dir: 'ltr' },
  { code: 'fr', htmlLang: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'es', htmlLang: 'es', label: 'Español', dir: 'ltr' },
  { code: 'pt', htmlLang: 'pt-BR', label: 'Português', dir: 'ltr' },
];

const DICT = Object.fromEntries(
  LOCALES.map(l => [l.code, JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', `${l.code}.json`), 'utf8'))])
);

/* localized enum label; canonical value is preserved when no translation
 * exists (English fallback), and null/undefined renders the locale's
 * "not verified" string — never the localized word for "no". */
export function enumLabel(lang, field, value) {
  if (value == null) return DICT[lang]?.labels?.not_verified ?? 'not verified';
  return DICT[lang]?.enums?.[field]?.[value] ?? value;
}

/* localized chrome / fact-row label, English key as fallback */
export function t(lang, key) {
  const d = DICT[lang];
  if (!d) return key;
  return d.labels?.[key] ?? d.factLabels?.[key] ?? key;
}

export function factLabel(lang, enLabel) {
  return DICT[lang]?.factLabels?.[enLabel] ?? enLabel;
}

export function tmpl(lang, key, vars) {
  const s = DICT[lang]?.templates?.[key];
  if (!s) return '';
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

/* /de + path (identity for en). path is the English canonical path. */
export function localePath(lang, enPath) {
  return lang === 'en' ? enPath : `/${lang}${enPath}`;
}

/* the reciprocal hreflang set for a logical page, given its English path.
 * Returns [{hreflang, href}], including x-default → English. `base` is the
 * absolute origin (no trailing slash). */
export function hreflangCluster(base, enPath) {
  const out = [{ hreflang: 'en', href: base + enPath }];
  for (const l of LOCALES) out.push({ hreflang: l.htmlLang, href: base + `/${l.code}${enPath}` });
  out.push({ hreflang: 'x-default', href: base + enPath });
  return out;
}

export function dictOf(lang) {
  return DICT[lang];
}

/* Comparison-page (/vs/) strings. Kept here rather than in the per-language
 * dictionaries because they are a small, page-type-specific set; the shared
 * enum/fact labels still come from the dictionaries. */
const VS = {
  de: { compared: 'im Vergleich', audience: 'Zielgruppe', side_by_side: 'Gegenüberstellung', eyebrow: 'Vergleiche', full_profiles: 'Vollständige Profile:', who_owns: 'Wer steckt dahinter?', desc: '{a} vs {b} im direkten Vergleich — Verwahrung, Regulierung, Kartennetz, Cashback, Rendite, Stablecoins und Geografie. Neutraler Vergleich aus dem offenen neobankbeat-Datensatz.' },
  it: { compared: 'a confronto', audience: 'Pubblico', side_by_side: 'Confronto diretto', eyebrow: 'Confronti', full_profiles: 'Profili completi:', who_owns: 'Chi c’è dietro?', desc: '{a} vs {b} a confronto diretto — custodia, regolamentazione, rete di carte, cashback, rendimento, stablecoin e geografia. Confronto neutro dal dataset aperto neobankbeat.' },
  fr: { compared: 'comparés', audience: 'Public', side_by_side: 'Côte à côte', eyebrow: 'Comparaisons', full_profiles: 'Profils complets :', who_owns: 'Qui est derrière ?', desc: '{a} vs {b} en comparaison directe — conservation, régulation, réseau de carte, cashback, rendement, stablecoins et géographie. Comparaison neutre issue du jeu de données ouvert neobankbeat.' },
  es: { compared: 'comparados', audience: 'Público', side_by_side: 'Comparación directa', eyebrow: 'Comparaciones', full_profiles: 'Perfiles completos:', who_owns: '¿Quién está detrás?', desc: '{a} vs {b} en comparación directa — custodia, regulación, red de tarjetas, cashback, rendimiento, stablecoins y geografía. Comparación neutral del conjunto de datos abierto neobankbeat.' },
  pt: { compared: 'comparativo', audience: 'Público', side_by_side: 'Lado a lado', eyebrow: 'Comparações', full_profiles: 'Perfis completos:', who_owns: 'Quem está por trás?', desc: '{a} vs {b} em comparação direta — custódia, regulação, rede de cartões, cashback, rendimento, stablecoins e geografia. Comparação neutra do conjunto de dados aberto neobankbeat.' },
};
export function vsStr(lang, key, vars) {
  let s = (VS[lang] && VS[lang][key]) || key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
  return s;
}
