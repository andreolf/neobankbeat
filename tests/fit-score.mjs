/* fit-score.mjs — rank neobanks against a short self-assessment.
   Used by build-pages.mjs (static landers) and fit/score.js (client wizard). */

export const FIT_COUNTRIES = [
  { slug: 'united-states', bare: 'United States', label: 'the United States', region: 'North America', regionSlug: 'north-america',
    match: ['United States', 'US', 'Global'] },
  { slug: 'united-kingdom', bare: 'United Kingdom', label: 'the United Kingdom', region: 'Europe', regionSlug: 'europe',
    match: ['United Kingdom', 'UK', 'Global', 'European Union'] },
  { slug: 'germany', bare: 'Germany', label: 'Germany', region: 'Europe', regionSlug: 'europe',
    match: ['Germany', 'Global', 'European Union'] },
  { slug: 'france', bare: 'France', label: 'France', region: 'Europe', regionSlug: 'europe',
    match: ['France', 'Global', 'European Union'] },
  { slug: 'brazil', bare: 'Brazil', label: 'Brazil', region: 'Latin America', regionSlug: 'latin-america',
    match: ['Brazil', 'Global'] },
  { slug: 'argentina', bare: 'Argentina', label: 'Argentina', region: 'Latin America', regionSlug: 'latin-america',
    match: ['Argentina', 'Global'] },
  { slug: 'mexico', bare: 'Mexico', label: 'Mexico', region: 'Latin America', regionSlug: 'latin-america',
    match: ['Mexico', 'Global'] },
  { slug: 'colombia', bare: 'Colombia', label: 'Colombia', region: 'Latin America', regionSlug: 'latin-america',
    match: ['Colombia', 'Global'] },
  { slug: 'india', bare: 'India', label: 'India', region: 'Asia', regionSlug: 'asia',
    match: ['India', 'Global'] },
  { slug: 'singapore', bare: 'Singapore', label: 'Singapore', region: 'Asia', regionSlug: 'asia',
    match: ['Singapore', 'Global'] },
  { slug: 'philippines', bare: 'the Philippines', label: 'the Philippines', region: 'Asia', regionSlug: 'asia',
    match: ['Philippines', 'Global'] },
  { slug: 'indonesia', bare: 'Indonesia', label: 'Indonesia', region: 'Asia', regionSlug: 'asia',
    match: ['Indonesia', 'Global'] },
  { slug: 'vietnam', bare: 'Vietnam', label: 'Vietnam', region: 'Asia', regionSlug: 'asia',
    match: ['Vietnam', 'Global'] },
  { slug: 'australia', bare: 'Australia', label: 'Australia', region: 'Oceania', regionSlug: 'oceania',
    match: ['Australia', 'Global'] },
  { slug: 'nigeria', bare: 'Nigeria', label: 'Nigeria', region: 'Africa', regionSlug: 'africa',
    match: ['Nigeria', 'Global'] },
  { slug: 'uae', bare: 'UAE', label: 'the UAE', region: 'MENA', regionSlug: 'mena',
    match: ['UAE', 'Global'] },
  { slug: 'switzerland', bare: 'Switzerland', label: 'Switzerland', region: 'Europe', regionSlug: 'europe',
    match: ['Switzerland', 'Global', 'European Union'] },
];

export const NEEDS_OPTIONS = [
  { id: 'travel', label: 'Travel & multi-currency', audience: 'travel & digital nomads', services: ['multi-currency'] },
  { id: 'savings', label: 'Savings / yield', yield: true },
  { id: 'crypto', label: 'Crypto spending', crypto: 'some' },
  { id: 'business', label: 'Business banking', audience: 'SMB & startups' },
  { id: 'kids', label: 'Kids & family', audience: 'gen alpha · kids & family' },
  { id: 'immigrants', label: 'Immigrants & remittance', audience: 'immigrants & migrants' },
  { id: 'faith', label: 'Islamic / faith-based', audience: 'faith-based' },
  { id: 'underbanked', label: 'No credit history', audience: 'underbanked' },
  { id: 'freelancers', label: 'Freelancers', audience: 'freelancers & creators' },
  { id: 'licensed', label: 'Full banking license', regulation: 'Licensed bank' },
];

const known = v => v && v !== '—' ? v : null;
const hasCard = e => known(e.card_network);
const jaccard = (a = [], b = []) => {
  const B = new Set(b), hit = a.filter(x => B.has(x)).length;
  return hit ? hit / new Set([...a, ...b]).size : 0;
};

export function countryBySlug(slug) {
  return FIT_COUNTRIES.find(c => c.slug === slug) || null;
}

/** 2 = explicit country list, 1 = region only, 0 = no match */
export function countryMatchTier(e, country) {
  if (!country) return 2;
  const cs = e.countries || [];
  if (cs.some(c => country.match.includes(c))) return 2;
  if ((e.active_regions || []).includes(country.region)) return 1;
  return 0;
}

export function matchesCountry(e, country) {
  return countryMatchTier(e, country) > 0;
}

export function defaultAnswers(countrySlug = '') {
  return {
    country: countrySlug,
    use: 'personal',
    needs: [],
    custody: 'any',
    card: 'any',
    crypto: 'no',
  };
}

function hasCryptoSurface(e) {
  return e.category !== 'traditional' || e.stablecoins
    || (e.services || []).some(s => ['on-ramp', 'off-ramp', 'crypto-cards'].includes(s));
}

function needScore(e, need) {
  let s = 0;
  if (need.audience && e.audience === need.audience) s += 25;
  if (need.regulation && e.regulation_type === need.regulation) s += 15;
  if (need.yield && known(e.yield)) s += 12;
  if (need.services) {
    const sv = new Set(e.services || []);
    if (need.services.some(t => sv.has(t))) s += 18;
  }
  if (need.crypto === 'some' && hasCryptoSurface(e)) s += 20;
  if (need.id === 'travel' && e.fx_markup) s += 8;
  return s;
}

export function fitScore(e, answers, country) {
  const tier = country ? countryMatchTier(e, country) : 2;
  if (country && tier === 0) return 0;

  if (answers.card === 'yes' && !hasCard(e)) return 0;
  if (answers.crypto === 'core' && !hasCryptoSurface(e)) return 0;

  let s = 10;
  if (tier === 2) s += 50;
  else if (tier === 1) s += 22;

  if (country && e.countries && e.countries.length > 1) s += 8 * jaccard(country.match, e.countries);

  if (answers.use === 'business') {
    if (e.audience === 'SMB & startups') s += 25;
    else if (e.audience === 'general') s += 6;
    else s -= 4;
  } else if (e.audience === 'general') s += 10;
  else if ((answers.needs || []).some(n => {
    const opt = NEEDS_OPTIONS.find(o => o.id === n);
    return opt?.audience === e.audience;
  })) s += 25;

  let needPts = 0;
  for (const id of answers.needs || []) {
    const opt = NEEDS_OPTIONS.find(o => o.id === id);
    if (opt) needPts += needScore(e, opt);
  }
  s += Math.min(needPts, 45);

  if (answers.custody === 'custodial' && /custodial/i.test(e.custody) && !/self/i.test(e.custody)) s += 20;
  else if (answers.custody === 'self' && /self-custod|mpc/i.test(e.custody)) s += 20;
  else if (answers.custody === 'custodial' && /self-custod/i.test(e.custody)) s -= 8;
  else if (answers.custody === 'self' && /custodial/i.test(e.custody) && !/mixed/i.test(e.custody)) s -= 8;

  if (answers.crypto === 'no') {
    if (e.category === 'traditional') s += 15;
    else if (e.category === 'web3-native') s -= 10;
  } else if (answers.crypto === 'some') {
    if (e.category === 'hybrid') s += 15;
    if (e.stablecoins) s += 10;
  } else if (answers.crypto === 'core') {
    if (e.category === 'web3-native') s += 25;
    else if (e.category === 'hybrid') s += 15;
  }

  if (answers.card === 'yes' && hasCard(e)) s += 8;

  s += (e.reported_users?.value_millions || 0) * 0.001;
  return s;
}

export function rankFit(entities, answers, countrySlug, n = 5) {
  const country = countrySlug ? countryBySlug(countrySlug) : null;
  return entities
    .map(e => ({ e, s: fitScore(e, answers, country) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name))
    .slice(0, n);
}

export function fitReasons(e, answers, country) {
  const out = [];
  const tier = country ? countryMatchTier(e, country) : 0;
  if (country && tier === 2) out.push(`Listed for ${country.bare} in our verified availability field`);
  else if (country && tier === 1) out.push(`Serves ${country.region} — confirm ${country.bare} availability with the issuer`);
  if (e.audience && e.audience !== 'general') out.push(`Built for ${e.audience}`);
  else if (answers.use === 'business') out.push('General-purpose — also used by small businesses');
  else out.push('General-purpose retail app');

  if (/self-custod/i.test(e.custody)) out.push('You hold the keys — self-custodial');
  else if (/mixed/i.test(e.custody)) out.push('Mixed custody — fiat custodial, crypto in your wallet');
  else out.push(`${e.regulation_type || 'Custodial'} · ${e.custody}`);

  if (hasCard(e)) out.push(`${String(e.card_network).replace(/\bMC\b/, 'Mastercard')} ${known(e.card_type) || 'card'}`.trim());
  else out.push('No card of its own');

  return out.slice(0, 3);
}

export function countForCountry(entities, country) {
  const strict = country.match.filter(m => m !== 'Global' && m !== 'European Union');
  return entities.filter(e => (e.countries || []).some(c => strict.includes(c))).length;
}
