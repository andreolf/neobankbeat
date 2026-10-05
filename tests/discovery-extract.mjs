/* discovery-extract.mjs — pull candidate company names out of a news headline.
 *
 * Pure and network-free, so it can be tested. It used to live inline in
 * discover-neobanks.mjs, where the only test was "read next week's issue",
 * and it regressed twice that way: first it filed "SMBs" (the word next to the
 * verb), then — after a fix that taught it title case — it filed the verb after
 * the name ("Revolut Boosts", "Plasma Debuts", "Goes Live").
 *
 * The behaviour is now pinned by tests/fixtures/discovery-headlines.json: 52
 * real headlines from the runs that produced junk, each labelled with the names
 * a reviewer would actually want. flowtest fails on any junk and on recall
 * dropping below the floor recorded there.
 *
 * Precision is deliberately favoured over recall. A weekly list of five real
 * names gets read; a list of eleven with six verbs in it trains you to skip it,
 * and a company missed this week usually reappears in next week's headlines.  */

const NEO = '(?:[Nn]eobank|[Dd]igital [Bb]ank|[Cc]hallenger [Bb]ank)';
/* A capitalised name token. Unicode-aware, so "Bó" survives and "B" does not
   get filed on its own; dots, ampersands and hyphens allowed for "Ether.fi",
   "M&T", "Co-op". */
const TOK = "\\p{Lu}[\\p{L}\\p{N}.&'’-]*";
const NAME = `(${TOK}(?: ${TOK})?)`;                       // one or two tokens

/* Opening words that precede the subject without being part of it. */
const LEAD = '(?:Why|How|What|Meet|Inside|Exclusive|Opinion|Watch|Report|Breaking|Analysis)';
const LAUNCH_VERB = '(?:(?:to )?launch(?:es|ed)?|unveils|debuts|introduces|goes live|rolls out|raises|secures|enters)';
const ADVERB = '(?: quietly| officially| formally| has| have)?';

const PATTERNS = [
  /* 1. Subject at the start of the headline, then a launch-or-funding verb.
        "Mela Launches Neobank …", "Plasma to Launch …", "Plasma One Neobank
        Goes Live …". Anchored: unanchored, any capitalised word before any
        verb anywhere in the line qualified. */
  new RegExp(`^(?:${LEAD}:? )?${NAME}(?:,)?(?: ${NEO})?${ADVERB} ${LAUNCH_VERB}\\b`, 'iu'),
  /* 2. "Neobank X" — the name right after the noun. The noisy one in title case,
        where the word after "Neobank" is as often a verb or preposition as a
        name; cleanName() does the filtering. */
  new RegExp(`${NEO} ${NAME}`, 'gu'),
  /* 3. Appositive: "Tonik, a Filipino Neobank …", "Plasma One A Stablecoin
        Neobank". Up to three qualifying words between article and noun. */
  new RegExp(`${NAME},? (?:[Aa]n?|[Tt]he) (?:[\\p{L}\\p{N}'’.-]+ ){0,3}?${NEO}`, 'gu'),
  /* 4. Comma without an article: "Nerve, World's First Neobank …". The comma
        is required here, so this does not fire on running prose. */
  new RegExp(`${NAME}, (?:[\\p{L}\\p{N}'’.-]+ ){1,3}?${NEO}`, 'gu'),
  /* 5. Name-colon headline: "KAST: $80 Million …", "Snappi: Greece's First …". */
  new RegExp(`^${NAME}: `, 'u'),
];

/* Words that, in title case, sit where a name should and are not one. Used
   both as "the second word is really a verb" (trim it) and "the first word is
   really a verb, preposition or generic noun" (reject, or skip past it). */
const VERBISH = new Set(['raises', 'raised', 'launches', 'launched', 'launching', 'launch', 'debuts', 'unveils',
  'introduces', 'boosts', 'extends', 'secures', 'onboards', 'has', 'have', 'used', 'wants', 'shuts',
  'enters', 'expands', 'exclusively', 'entirely', 'with', 'actively', 'officially', 'quietly', 'turned',
  'adds', 'gets', 'goes', 'taps', 'picks', 'names', 'hires', 'plans', 'eyes', 'seeks', 'sets', 'set',
  'opens', 'brings', 'rolls', 'partners', 'teams', 'to', 'after', 'amid', 'announces', 'reports',
  'confirms', 'says', 'joins', 'buys', 'acquires', 'closes', 'hits', 'tops', 'files', 'wins', 'backs',
  'bets', 'moves', 'pivots', 'cuts', 'drops', 'faces', 'sues', 'denies', 'created', 'built', 'founded',
  'connecting', 'powering', 'promising', 'starting', 'live', 'by', 'for', 'from', 'in', 'on', 'at']);
const HEAD_STOP = new Set([...VERBISH, 'build', 'start', 'platform', 'market', 'upgrade', 'app', 'how',
  'the', 'this', 'that', 'new', 'global', 'its', 'a', 'an', 'and', 'why', 'what', 'when', 'where',
  'more', 'most', 'top', 'best', 'first', 'next', 'now', 'just', 'still', 'plus', 'over', 'under',
  'into', 'about', 'behind', 'inside', 'meet', 'watch', 'report', 'breaking', 'analysis', 'opinion',
  'exclusive', 'key', 'steps', 'guide', 'crypto', 'stablecoin', 'digital', 'neobank', 'bank',
  /* funding-headline nouns: "$80 Million Series A Raised By …" reads, to the
     appositive pattern, exactly like "Plasma One A Stablecoin Neobank" */
  'million', 'billion', 'series', 'round', 'funding', 'seed']);
/* Only these justify skipping past a first word to the name behind it. A
   preposition in that slot ("To Expand", "Amid WLFI", "Connecting Ethiopian")
   means the match was never a name — stepping past it just files the next
   word instead, which is how "Expand" and "Ethiopian" became candidates. */
const STEP_PAST = new Set(['launches', 'launched', 'launch', 'unveils', 'debuts', 'introduces']);

export const decodeTitle = (raw) => String(raw)
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  /* "Bó" arrives escaped in some feeds and, once the backslash is lost on
     the way to a markdown issue, files as "Bu00f3" — NatWest's Bó. */
  .replace(/\\u([0-9a-f]{4})/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  /* …and sometimes arrives with the backslash already gone. "u00" followed by
     a Latin-1 byte, glued to a letter, does not occur in English headlines. */
  .replace(/(?<=\p{L})u00([89a-f][0-9a-f])/giu, (_, h) => String.fromCodePoint(parseInt(h, 16)));

export const cleanName = (s) => {
  let n = String(s)
    .replace(new RegExp(`^${LEAD}:? `), '')
    .replace(new RegExp(`^${NEO}\\s+`), '')            // "Neobank Douugh" → "Douugh"
    .replace(/['’]s$/, '')
    .trim();
  let w = n.split(/\s+/);
  /* "Launches EthenaPay" — the appositive pattern starts its match one word
     early when a verb precedes the name. Step past it rather than lose the name. */
  if (w.length === 2 && STEP_PAST.has(w[0].toLowerCase())) w = [w[1]];
  /* "Plasma Debuts", "Revolut Boosts" — name with the verb welded on. */
  if (w.length === 2 && VERBISH.has(w[1].toLowerCase())) w = [w[0]];
  n = w.join(' ');
  if (!n || HEAD_STOP.has(w[0].toLowerCase())) return '';
  return n;
};

/* Every name the patterns find in one headline, de-duplicated, cleaned. */
export function namesFromHeadline(raw) {
  /* drop the " - Publisher" suffix Google News appends; it is never the subject */
  const title = decodeTitle(raw).replace(/\s+[-–—]\s+[^-–—]+$/, '').trim();
  const mentionsNeo = new RegExp(NEO).test(title);
  /* "Peter Thiel-Backed Plasma Quietly Debuts …", "Singapore-based Global …":
     a backer or a place in front of the subject, never the subject itself. */
  const body = title.replace(/^(?:[\p{L}.]+ )*[\p{L}.]+-(?:[Bb]acked|[Bb]ased|[Ff]ounded|[Ll]ed) /u, '');
  const out = new Set();
  PATTERNS.forEach((re, i) => {
    /* the launch-verb pattern needs the headline to be about a neobank at all:
       "BRAC Bank launches Google Pay for Visa credit cardholders" is not */
    if (i === 0 && !mentionsNeo) return;
    if (i === 4 && !mentionsNeo) return;
    const hits = re.global ? [...body.matchAll(re)] : [body.match(re)].filter(Boolean);
    for (const m of hits) {
      const n = cleanName(m[1]);
      if (n && n.length >= 2) out.add(n);
    }
  });
  return [...out];
}

/* node tests/discovery-extract.mjs --check   (flowtest runs this)
   Zero junk, and recall at or above the fixture's floor. */
import { fileURLToPath as _f } from 'node:url';
if (process.argv[1] && _f(import.meta.url) === process.argv[1] && process.argv.includes('--check')) {
  const fs = await import('node:fs');
  const fx = JSON.parse(fs.readFileSync(new URL('./fixtures/discovery-headlines.json', import.meta.url), 'utf8'));
  let junk = [], named = 0, found = 0;
  for (const c of fx.cases) {
    const got = namesFromHeadline(c.headline);
    for (const g of got) if (!c.want.includes(g)) junk.push(`"${g}" from: ${c.headline.slice(0, 80)}`);
    if (c.want.length) { named++; if (got.some((g) => c.want.includes(g))) found++; }
  }
  const recall = named ? found / named : 1;
  const ok = !junk.length && recall >= fx.recall_floor;
  console.log(ok
    ? `✓ discovery extraction: 0 junk across ${fx.cases.length} headlines, recall ${found}/${named}`
    : `✗ discovery extraction: ${junk.length} junk, recall ${found}/${named} (floor ${fx.recall_floor})\n  `
      + junk.slice(0, 5).join('\n  '));
  process.exit(ok ? 0 : 1);
}
