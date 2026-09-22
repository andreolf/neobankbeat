#!/usr/bin/env node
/* traffic.mjs — what the site is actually doing, from GA4 and Search Console.
 *
 * Exists because "check the numbers" meant opening two dashboards and reading
 * them out loud. This pulls the same figures into the terminal, so traffic can
 * be looked at in the same place the site is built, and — with --save — kept,
 * so we end up with a history rather than a series of snapshots nobody wrote
 * down.
 *
 *   node tests/traffic.mjs                 last 28 days, GA4 + Search Console
 *   node tests/traffic.mjs --days 7        a different window
 *   node tests/traffic.mjs --ga            GA4 only
 *   node tests/traffic.mjs --gsc           Search Console only
 *   node tests/traffic.mjs --json          machine-readable
 *   node tests/traffic.mjs --save          also write data/traffic/<date>.json
 *
 * ── one-time setup ────────────────────────────────────────────────────────
 * Both APIs authenticate with the same Google service account, which is the
 * only headless option — an OAuth user flow cannot run in CI, and this should
 * be able to run in CI later.
 *
 *  1. console.cloud.google.com → create (or pick) a project
 *  2. enable "Google Analytics Data API" and "Google Search Console API"
 *  3. IAM & Admin → Service Accounts → create one → Keys → Add key → JSON
 *  4. grant it read access in each product, using the service account's email:
 *       GA4   analytics.google.com → Admin → Property access management
 *             → add the email as Viewer
 *       GSC   search.google.com/search-console → Settings → Users and
 *             permissions → add the email as Restricted (read) user
 *  5. point this script at the key and the property:
 *       export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
 *       export GA4_PROPERTY_ID=123456789      # numeric, NOT G-E3KE01L5DL
 *
 * The GA4 property id is the number under Admin → Property Settings. The
 * G-XXXX on the site is the measurement id and the API will not accept it —
 * which is the single most common way this comes back empty.
 *
 * Nothing here writes to Google. Read-only scopes, read-only calls.          */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.neobankbeat.com/';
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const DAYS = Math.max(1, parseInt(val('--days', '28'), 10) || 28);
const JSON_OUT = has('--json');
const SAVE = has('--save');
const ONLY_GA = has('--ga');
const ONLY_GSC = has('--gsc');

const iso = (d) => d.toISOString().slice(0, 10);
const TODAY = new Date();
/* GA4 counts "today" as partial and Search Console lags ~2 days, so both
   windows end yesterday. Comparing a partial day against full ones is the
   quiet way to convince yourself traffic is falling. */
const END = new Date(TODAY.getTime() - 86400e3);
const START = new Date(END.getTime() - (DAYS - 1) * 86400e3);

/* ── service-account auth, dependency-free ──────────────────────────────── */
const b64url = (b) => Buffer.from(b).toString('base64url');

async function token(scope) {
  const keyfile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyfile || !fs.existsSync(keyfile)) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS is unset or points at nothing — see the setup block at the top of this file');
  }
  const key = JSON.parse(fs.readFileSync(keyfile, 'utf8'));
  if (!key.client_email || !key.private_key) throw new Error(`${keyfile} is not a service-account key (no client_email / private_key)`);

  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: key.client_email, scope, aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now };
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify(claim))}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url');

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`token exchange failed: ${j.error_description || j.error || r.status}`);
  return j.access_token;
}

const api = async (url, body, tok) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${j.error?.message || JSON.stringify(j).slice(0, 200)}`);
  return j;
};

/* ── GA4 ────────────────────────────────────────────────────────────────── */
async function ga4() {
  const prop = process.env.GA4_PROPERTY_ID;
  if (!prop) throw new Error('GA4_PROPERTY_ID is unset (the numeric property id, not the G-XXXX measurement id)');
  if (/^G-/i.test(prop)) throw new Error(`GA4_PROPERTY_ID is "${prop}" — that is the measurement id. The API needs the numeric property id from Admin → Property Settings.`);

  const tok = await token('https://www.googleapis.com/auth/analytics.readonly');
  const base = `https://analyticsdata.googleapis.com/v1beta/properties/${prop}:runReport`;
  const range = [{ startDate: iso(START), endDate: iso(END) }];
  const rows = (j) => (j.rows || []).map((r) => ({
    key: r.dimensionValues.map((d) => d.value).join(' · '),
    n: +r.metricValues[0].value,
    extra: r.metricValues[1] ? +r.metricValues[1].value : null,
  }));

  const [totals, pages, sources, countries] = await Promise.all([
    api(base, { dateRanges: range, metrics: [{ name: 'sessions' }, { name: 'totalUsers' }] }, tok),
    api(base, { dateRanges: range, dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }], orderBys: [{ desc: true, metric: { metricName: 'screenPageViews' } }], limit: 15 }, tok),
    api(base, { dateRanges: range, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ desc: true, metric: { metricName: 'sessions' } }], limit: 10 }, tok),
    api(base, { dateRanges: range, dimensions: [{ name: 'country' }], metrics: [{ name: 'totalUsers' }], orderBys: [{ desc: true, metric: { metricName: 'totalUsers' } }], limit: 8 }, tok),
  ]);

  const t = totals.rows?.[0]?.metricValues || [];
  return {
    sessions: +(t[0]?.value || 0),
    users: +(t[1]?.value || 0),
    pages: rows(pages),
    sources: rows(sources),
    countries: rows(countries),
  };
}

/* ── Search Console ─────────────────────────────────────────────────────── */
async function gsc() {
  const tok = await token('https://www.googleapis.com/auth/webmasters.readonly');
  /* Search Console lags about two days; asking for yesterday usually returns
     an empty set and reads as "no traffic" rather than "not counted yet". */
  const end = new Date(END.getTime() - 2 * 86400e3);
  const start = new Date(end.getTime() - (DAYS - 1) * 86400e3);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;
  const q = (dims, n) => api(url, { startDate: iso(start), endDate: iso(end), dimensions: dims, rowLimit: n }, tok);

  const [tot, queries, pages] = await Promise.all([q([], 1), q(['query'], 15), q(['page'], 15)]);
  const shape = (j) => (j.rows || []).map((r) => ({
    key: (r.keys || []).join(' · '), clicks: r.clicks, impressions: r.impressions,
    ctr: r.ctr, position: r.position,
  }));
  const t = tot.rows?.[0] || {};
  return {
    window: `${iso(start)} → ${iso(end)}`,
    clicks: t.clicks || 0, impressions: t.impressions || 0,
    ctr: t.ctr || 0, position: t.position || 0,
    queries: shape(queries), pages: shape(pages),
  };
}

/* ── output ─────────────────────────────────────────────────────────────── */
const num = (n) => n.toLocaleString('en-US');
const bar = (n, max, w = 24) => '█'.repeat(Math.max(1, Math.round((n / (max || 1)) * w)));
const table = (title, rows, fmt) => {
  if (!rows.length) { console.log(`\n${title}\n  (no rows)`); return; }
  console.log(`\n${title}`);
  const max = Math.max(...rows.map((r) => r.n ?? r.clicks ?? 0));
  for (const r of rows) console.log('  ' + fmt(r, max));
};

const out = {};
let failed = 0;
if (!ONLY_GSC) {
  try { out.ga4 = await ga4(); } catch (e) { out.ga4 = { error: e.message }; failed++; }
}
if (!ONLY_GA) {
  try { out.search = await gsc(); } catch (e) { out.search = { error: e.message }; failed++; }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ generated: iso(TODAY), window: `${iso(START)} → ${iso(END)}`, days: DAYS, ...out }, null, 2));
} else {
  console.log(`neobankbeat traffic · ${iso(START)} → ${iso(END)} (${DAYS} days)`);
  if (out.ga4?.error) console.log(`\nGA4\n  ✗ ${out.ga4.error}`);
  else if (out.ga4) {
    console.log(`\nGA4 · ${num(out.ga4.sessions)} sessions · ${num(out.ga4.users)} users`);
    table('top pages', out.ga4.pages, (r, m) => `${String(num(r.n)).padStart(7)}  ${bar(r.n, m)} ${r.key}`);
    table('channels', out.ga4.sources, (r, m) => `${String(num(r.n)).padStart(7)}  ${bar(r.n, m, 16)} ${r.key}`);
    table('countries', out.ga4.countries, (r, m) => `${String(num(r.n)).padStart(7)}  ${bar(r.n, m, 16)} ${r.key}`);
  }
  if (out.search?.error) console.log(`\nSearch Console\n  ✗ ${out.search.error}`);
  else if (out.search) {
    const s = out.search;
    console.log(`\nSearch Console · ${s.window}`);
    console.log(`  ${num(s.clicks)} clicks · ${num(s.impressions)} impressions · ${(s.ctr * 100).toFixed(1)}% CTR · avg position ${s.position.toFixed(1)}`);
    table('top queries', s.queries, (r, m) => `${String(num(r.clicks)).padStart(6)} clicks ${String(num(r.impressions)).padStart(8)} impr  ${(r.ctr * 100).toFixed(1).padStart(5)}%  p${r.position.toFixed(1).padStart(5)}  ${r.key}`);
    table('top pages', s.pages, (r, m) => `${String(num(r.clicks)).padStart(6)} clicks ${String(num(r.impressions)).padStart(8)} impr  ${(r.ctr * 100).toFixed(1).padStart(5)}%  p${r.position.toFixed(1).padStart(5)}  ${r.key.replace('https://www.neobankbeat.com', '')}`);
  }
}

if (SAVE && !failed) {
  const dir = path.join(ROOT, 'data', 'traffic');
  fs.mkdirSync(dir, { recursive: true });
  const f = path.join(dir, `${iso(END)}.json`);
  fs.writeFileSync(f, JSON.stringify({ generated: iso(TODAY), window: `${iso(START)} → ${iso(END)}`, days: DAYS, ...out }, null, 2) + '\n');
  console.log(`\nsaved → ${path.relative(ROOT, f)}`);
}

process.exit(failed && !JSON_OUT ? 1 : 0);
