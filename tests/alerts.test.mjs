#!/usr/bin/env node
/* alerts.test.mjs — the job-alert functions, end to end, with the two outside
 * services replaced by fakes.
 *
 * These functions are the only code on the site that stores a person's email
 * address and sends mail, and none of it can be exercised on a developer's
 * machine against the real services. So the whole path is run here: sign up,
 * confirm, plan a digest, send it, unsubscribe — plus the ways it must refuse.
 *
 *   node tests/alerts.test.mjs        prints one line per check, exit 1 on a miss
 */
process.env.RESEND_API_KEY = 'test-resend';
process.env.ALERTS_FROM = 'neobankbeat jobs <jobs@example.test>';
process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis';
process.env.ALERTS_SECRET = 'a-long-random-secret-for-tests-only';
process.env.CRON_SECRET = 'cron-secret';

const lib = await import('../api/alerts/_lib.js');
const subscribe = (await import('../api/alerts/subscribe.js')).default;
const confirm = (await import('../api/alerts/confirm.js')).default;
const unsubscribe = (await import('../api/alerts/unsubscribe.js')).default;
const sendMod = await import('../api/alerts/send.js');

/* ── fakes ── */
const store = { hash: {}, keys: {} };
const mails = [];
const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const INDEX = {
  companies: { 'c6-bank': 'C6 Bank', wise: 'Wise' },
  jobs: [
    { id: 'c6-bank-1', title: 'Analista de Crédito', co: 'c6-bank', dept: 'finance', loc: 'São Paulo, Brazil', posted: today, path: '/jobs/j/c6-bank-1/', br: 1 },
    { id: 'c6-bank-2', title: 'Engenheiro Backend', co: 'c6-bank', dept: 'engineering', loc: 'São Paulo, Brazil', posted: daysAgo(3), path: '/jobs/j/c6-bank-2/', br: 1 },
    { id: 'c6-bank-old', title: 'Old role', co: 'c6-bank', dept: 'engineering', loc: 'São Paulo, Brazil', posted: daysAgo(40), path: '/jobs/j/c6-bank-old/', br: 1 },
    { id: 'wise-1', title: 'Compliance Analyst', co: 'wise', dept: 'compliance', loc: 'London, UK', posted: daysAgo(1), path: '/jobs/j/wise-1/' },
  ],
};
const TOPICS = { companies: { 'c6-bank': 'C6 Bank', wise: 'Wise', qonto: 'Qonto' }, depts: ['engineering', 'compliance', 'finance', 'other'], br: true };
const reply = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
globalThis.fetch = (url, init = {}) => {
  url = String(url);
  if (url.startsWith('https://redis.example.test')) {
    const [cmd, ...a] = JSON.parse(init.body);
    if (init.headers.authorization !== 'Bearer test-redis') return reply({ error: 'auth' }, 401);
    if (cmd === 'INCR') { store.keys[a[0]] = (store.keys[a[0]] || 0) + 1; return reply({ result: store.keys[a[0]] }); }
    if (cmd === 'EXPIRE') return reply({ result: 1 });
    if (cmd === 'SET') { if (a.includes('NX') && a[0] in store.keys) return reply({ result: null }); store.keys[a[0]] = a[1]; return reply({ result: 'OK' }); }
    if (cmd === 'HGET') return reply({ result: store.hash[a[1]] ?? null });
    if (cmd === 'HSET') { store.hash[a[1]] = a[2]; return reply({ result: 1 }); }
    if (cmd === 'HDEL') { delete store.hash[a[1]]; return reply({ result: 1 }); }
    if (cmd === 'HGETALL') return reply({ result: Object.entries(store.hash).flat() });
    return reply({ error: 'unknown ' + cmd }, 400);
  }
  if (url.startsWith('https://api.resend.com/emails')) {
    const body = JSON.parse(init.body);
    for (const m of Array.isArray(body) ? body : [body]) mails.push(m);
    return reply({ id: 'x' });
  }
  if (url.endsWith('/jobs/alerts-topics.json')) return reply(TOPICS);
  if (url.endsWith('/jobs/alerts.json')) return reply(INDEX);
  return reply({ error: 'unexpected fetch ' + url }, 500);
};

let failed = 0, n = 0;
const ok = (cond, what) => { n++; if (!cond) failed++; console.log(`${cond ? '✓' : '✗'} ${what}`); };
const post = (body, ip = '1.2.3.4') => subscribe(new Request('https://www.neobankbeat.com/api/alerts/subscribe', {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body) }));
const tokenOf = (mail) => mail.html.match(/href="[^"]*\/jobs\/alerts\/#confirm=([^"]+)"/)[1];
const doConfirm = (t, method = 'POST') => confirm(new Request(`https://www.neobankbeat.com/api/alerts/confirm?t=${t}`, { method }));
const doUnsub = (t, method = 'POST') => unsubscribe(new Request(`https://www.neobankbeat.com/api/alerts/unsubscribe?t=${t}`, { method }));

/* ── sign-up ── */
let r = await post({ email: ' Ana@Example.com ', topic: 'co:c6-bank', lang: 'pt' });
ok(r.status === 200 && (await r.json()).ok && mails.length === 1, 'a sign-up sends one confirmation email');
ok(mails[0].to === 'ana@example.com' && /C6 Bank/.test(mails[0].subject) && /Confirme/.test(mails[0].subject), 'it is addressed to the normalised address, in the page\'s language, naming the company');
ok(Object.keys(store.hash).length === 0, 'nothing is stored before the address is confirmed');
r = await post({ email: 'ana@example.com', topic: 'co:wise', lang: 'en' });
ok((await r.json()).ok && mails.length === 1, 'a second request for the same address within ten minutes sends no second email');
r = await post({ email: 'not-an-email', topic: 'co:c6-bank' }, '5.5.5.1');
ok(r.status === 400 && (await r.json()).error === 'email', 'a malformed address is refused');
r = await post({ email: 'b@example.com', topic: 'co:<script>' }, '5.5.5.2');
ok(r.status === 400 && (await r.json()).error === 'topic', 'a topic that is not the allowed shape is refused');
r = await post({ email: 'c@example.com', topic: 'co:no-such-company' }, '5.5.5.3');
ok(r.status === 400 && mails.length === 1, 'a well-formed topic the board does not have is refused, and no mail goes out');
r = await post({ email: 'bot@example.com', topic: 'co:wise', website: 'http://spam' }, '5.5.5.4');
ok((await r.json()).ok && mails.length === 1, 'a filled honeypot is answered ok and sends nothing');
for (let i = 0; i < 5; i++) await post({ email: `flood${i}@example.com`, topic: 'co:wise' }, '9.9.9.9');
r = await post({ email: 'flood9@example.com', topic: 'co:wise' }, '9.9.9.9');
ok(r.status === 429, 'a sixth request from one visitor in an hour is refused');
ok((await subscribe(new Request('https://www.neobankbeat.com/api/alerts/subscribe'))).status === 405, 'GET is not a sign-up');

/* ── confirm ── */
const token = tokenOf(mails[0]);
r = await doConfirm(token, 'GET');
ok(r.status === 303 && /\/jobs\/alerts\/#confirm=/.test(r.headers.get('location')) && Object.keys(store.hash).length === 0, 'opening the confirm endpoint with GET (a mail scanner) stores nothing and forwards to the page');
r = await doConfirm(token);
const rec = JSON.parse(store.hash['ana@example.com'] || 'null');
ok(r.status === 200 && (await r.json()).state === 'confirmed' && rec && rec.topics[0] === 'co:c6-bank' && rec.lang === 'pt', 'pressing confirm stores the address with its topic and language');
r = await doConfirm(token.slice(0, -3) + 'abc');
ok((await r.json()).state === 'expired' && Object.keys(store.hash).length === 1, 'a tampered link stores nothing');
const forged = await lib.sign({ k: 'u', e: 'ana@example.com' });
ok((await (await doConfirm(forged)).json()).state === 'expired', 'an unsubscribe token cannot be used to confirm');
const stale = await lib.sign({ k: 'c', e: 'late@example.com', t: 'co:wise', l: 'en', x: Date.now() - 1000 });
ok((await (await doConfirm(stale)).json()).state === 'expired' && !store.hash['late@example.com'], 'an expired confirmation link stores nothing');
const second = await lib.sign({ k: 'c', e: 'ana@example.com', t: 'dept:compliance', l: 'pt', x: Date.now() + 1000 });
await doConfirm(second);
ok(JSON.parse(store.hash['ana@example.com']).topics.join() === 'co:c6-bank,dept:compliance', 'a second confirmed topic is added to the same record');

/* ── digest ── */
const cron = (q = '', auth = 'Bearer cron-secret') => sendMod.default(new Request(`https://www.neobankbeat.com/api/alerts/send${q}`, { headers: auth ? { authorization: auth } : {} }));
ok((await cron('', '')).status === 401 && (await cron('', 'Bearer wrong')).status === 401, 'the send endpoint refuses without the cron secret');
const before = mails.length;
r = await (await cron('?dry=1')).json();
ok(r.dry && r.would_send === 1 && mails.length === before && !JSON.parse(store.hash['ana@example.com']).last, 'a dry run reports what it would send and changes nothing');
r = await (await cron()).json();
const digest = mails[mails.length - 1];
ok(r.sent === 1 && digest.to === 'ana@example.com', 'the cron sends the digest');
ok(/Analista de Crédito/.test(digest.html) && /Engenheiro Backend/.test(digest.html) && /Compliance Analyst/.test(digest.html) && !/Old role/.test(digest.html), 'it lists the week\'s roles for both topics and leaves out the 40-day-old one');
ok(/List-Unsubscribe/.test(Object.keys(digest.headers).join()) && /\/jobs\/alerts\/#unsubscribe=/.test(digest.html) && /utm_source=job_alert/.test(digest.html), 'it carries an unsubscribe link, the one-click header, and tagged links');
ok(JSON.parse(store.hash['ana@example.com']).last > 0, 'the send is recorded on the subscriber');
r = await (await cron()).json();
ok(r.sent === 0 && mails.length === before + 1, 'running again the same day sends nothing: one digest a week at most');
const quiet = sendMod.plan({ 'q@example.com': { topics: ['co:qonto'], lang: 'en', confirmed: Date.now() - 86400000, last: 0 } }, INDEX);
ok(quiet.length === 0, 'a subscriber whose topic has no new roles gets no email');
const many = Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`s${i}@example.com`, { topics: ['co:c6-bank'], lang: 'en', confirmed: 1, last: 0 }]));
ok(sendMod.plan(many, INDEX).length === lib.DAILY_DIGESTS, 'a day never plans more digests than the daily cap');

/* ── unsubscribe ── */
const unsubToken = new URL(digest.headers['List-Unsubscribe'].slice(1, -1)).searchParams.get('t');
r = await doUnsub(unsubToken, 'GET');
ok(r.status === 303 && /#unsubscribe=/.test(r.headers.get('location')) && !!store.hash['ana@example.com'], 'opening the unsubscribe endpoint with GET (a mail scanner) removes nobody');
r = await doUnsub(unsubToken);
ok(r.status === 200 && !store.hash['ana@example.com'], 'one-click unsubscribe (POST) deletes the record');
ok((await (await doUnsub(unsubToken)).json()).state === 'unsubscribed', 'the same link used again still answers unsubscribed');
ok((await (await doUnsub(token)).json()).state === 'expired', 'a confirmation token cannot be used to unsubscribe someone');

/* ── off ── */
delete process.env.RESEND_API_KEY;
ok((await post({ email: 'd@example.com', topic: 'co:wise' })).status === 503 && (await cron()).status === 503, 'with a secret missing every endpoint answers "not configured" and does nothing');

console.log(`\n${n - failed}/${n} alert checks passed`);
process.exit(failed ? 1 : 0);
