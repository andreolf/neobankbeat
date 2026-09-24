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
 *   node tests/traffic.mjs --login         one-time browser consent
 *
 * ── one-time setup ────────────────────────────────────────────────────────
 * OAuth, not a service-account key. Google's Secure-by-Default org policy
 * (iam.managed.disableServiceAccountKeyCreation) blocks key creation on
 * Workspace organisations — and that policy is worth keeping rather than
 * turning off for this. A refresh token reaches the same APIs, is read-only,
 * and can be revoked from the Google account without an admin.
 *
 *  1. console.cloud.google.com → create (or pick) a project. No billing
 *     account needed: both APIs below are free within quota.
 *  2. enable "Google Analytics Data API" and "Google Search Console API"
 *  3. APIs & Services → Credentials → Create credentials → OAuth client ID
 *     → Application type: Desktop app. Copy the id and secret.
 *  4. export GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com
 *     export GOOGLE_OAUTH_CLIENT_SECRET=...
 *     export GA4_PROPERTY_ID=123456789      # numeric, NOT G-E3KE01L5DL
 *  5. node tests/traffic.mjs --login        # once; opens a consent URL
 *
 * The refresh token lands in ~/.config/neobankbeat/google-oauth.json, mode
 * 600, outside the repo. Every later run is headless. Consent as the Google
 * account that can already see the GA4 property and Search Console — the
 * script inherits exactly that access and nothing more.
 *
 * The GA4 property id is the number under Admin → Property Settings. The
 * G-XXXX on the site is the measurement id and the API will not accept it —
 * which is the single most common way this comes back empty.
 *
 * A service-account key still works if GOOGLE_APPLICATION_CREDENTIALS is set,
 * for a project where the policy does not apply.
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

/* ── auth ────────────────────────────────────────────────────────────────
   Two ways in, tried in that order.

   1. OAuth refresh token (default). Google's "Secure by Default" org policy
      — iam.managed.disableServiceAccountKeyCreation — blocks service-account
      key creation on Workspace organisations, and that policy is worth
      keeping: a downloaded key is a long-lived secret that cannot be rotated
      by the person who leaks it. A refresh token does the same job, is scoped
      read-only, and is revocable from myaccount.google.com. One browser
      consent, then headless forever.
   2. Service-account key, if GOOGLE_APPLICATION_CREDENTIALS is set. Kept for
      the case where the policy does not apply, or for CI on a project that
      allows it.                                                             */
const b64url = (b) => Buffer.from(b).toString('base64url');
const TOK_FILE = process.env.NB_GOOGLE_TOKEN
  || path.join(process.env.HOME || '.', '.config', 'neobankbeat', 'google-oauth.json');
const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
].join(' ');

const readTok = () => {
  try { return JSON.parse(fs.readFileSync(TOK_FILE, 'utf8')); } catch { return null; }
};

async function oauthToken() {
  const t = readTok();
  if (!t?.refresh_token) return null;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: t.refresh_token,
      client_id: t.client_id, client_secret: t.client_secret,
    }),
  });
  const j = await r.json();
  if (!r.ok) {
    throw new Error(`refresh failed: ${j.error_description || j.error}. Re-run: node tests/traffic.mjs --login`);
  }
  return j.access_token;
}

async function serviceAccountToken(scope) {
  const keyfile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyfile || !fs.existsSync(keyfile)) return null;
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

let _tok = null;
async function token(scope) {
  if (_tok) return _tok;                       // one token covers both APIs
  _tok = await oauthToken() || await serviceAccountToken(scope);
  if (!_tok) {
    throw new Error('not authenticated — run: node tests/traffic.mjs --login  (one browser consent, then headless)');
  }
  return _tok;
}

/* ── one-time consent, loopback redirect ─────────────────────────────────
   Google retired the copy-paste "oob" flow in 2022, so a desktop client has
   to catch the code on 127.0.0.1. Port is ephemeral and the server lives for
   exactly one request. */
async function login() {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID, secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!id || !secret) {
    console.error(`Create the OAuth client first: APIs & Services -> Credentials
-> Create credentials -> OAuth client ID -> Application type: Desktop app.
A Desktop-app client is not a service-account key, so the org policy that
blocked key creation does not apply to it.

  export GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com
  export GOOGLE_OAUTH_CLIENT_SECRET=...
  node tests/traffic.mjs --login`);
    process.exit(1);
  }

  const http = await import('node:http');
  const state = crypto.randomBytes(16).toString('hex');
  let redirect;

  const code = await new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1');
      if (u.pathname !== '/') return res.writeHead(404).end();
      const err = u.searchParams.get('error');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(`<body style="font:15px system-ui;padding:40px;background:#0A0A10;color:#EDEDF2">`
        + `<h2>${err ? 'Denied' : 'Done'}</h2><p>${err || 'Close this tab and go back to the terminal.'}</p></body>`);
      srv.close();
      if (err) return reject(new Error(err));
      if (u.searchParams.get('state') !== state) return reject(new Error('state mismatch — start again'));
      resolve(u.searchParams.get('code'));
    });
    srv.on('error', reject);
    const timer = setTimeout(() => { srv.close(); reject(new Error('timed out after 5 minutes')); }, 300e3);
    timer.unref();
    srv.listen(0, '127.0.0.1', () => {
      redirect = `http://127.0.0.1:${srv.address().port}`;
      const auth = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: id, redirect_uri: redirect, response_type: 'code', scope: SCOPES,
        access_type: 'offline', prompt: 'consent', state,
      });
      console.log(`\nOpen this in a browser signed in to the Google account that can see both\nthe GA4 property and Search Console:\n\n${auth}\n\nWaiting \u2026`);
    });
  });

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: 'authorization_code' }),
  });
  const j = await r.json();
  /* access_type=offline + prompt=consent is what makes Google return a refresh
     token; without prompt=consent a repeat authorisation returns only an access
     token and the saved file is useless an hour later. */
  if (!r.ok || !j.refresh_token) {
    throw new Error(`could not get a refresh token: ${j.error_description || j.error || 'no refresh_token in the response'}`);
  }
  fs.mkdirSync(path.dirname(TOK_FILE), { recursive: true });
  fs.writeFileSync(TOK_FILE, JSON.stringify({ client_id: id, client_secret: secret, refresh_token: j.refresh_token }, null, 2) + '\n', { mode: 0o600 });
  console.log(`\n\u2713 saved to ${TOK_FILE} (chmod 600)`);
  console.log('  Revoke any time: myaccount.google.com \u2192 Security \u2192 Third-party access');
  console.log('  Now run:  node tests/traffic.mjs');
}
if (has('--login')) {
  /* A stack trace is the wrong thing to show someone halfway through an
     authorisation they cannot see the inside of. */
  try { await login(); } catch (e) { console.error(`\n✗ ${e.message}`); process.exit(1); }
  process.exit(0);
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
