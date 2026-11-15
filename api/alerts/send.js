/* GET /api/alerts/send      — called once a day by Vercel Cron (vercel.json)
   Sends each subscriber at most one digest a week, and only when a topic they
   follow has roles posted since their last one.

   Refuses without `Authorization: Bearer $CRON_SECRET`, which Vercel attaches
   to cron calls when that variable is set. Add ?dry=1 to see what would be
   sent without sending or recording anything. */
import { configured, json, redis, sendMail, sign, matches, topicLabel, topicPath, digestEmail, validTopic,
  SITE, SUBS_KEY, DAILY_DIGESTS, DIGEST_EVERY_DAYS, LOOKBACK_DAYS, MAX_ROLES_PER_EMAIL } from './_lib.js';

export const config = { runtime: 'edge' };

const DAY = 86400000;

/* pure, so it can be tested without a network: which emails go out today */
export function plan(subs, index, now = Date.now(), cap = DAILY_DIGESTS) {
  const names = index.companies || {};
  const out = [];
  /* longest-waiting first, so a full day's cap never starves the same people */
  const due = Object.entries(subs)
    .filter(([, s]) => s && Array.isArray(s.topics) && s.topics.length && now - (s.last || 0) >= (DIGEST_EVERY_DAYS - 0.5) * DAY)
    .sort((a, b) => (a[1].last || a[1].confirmed || 0) - (b[1].last || b[1].confirmed || 0));
  for (const [email, s] of due) {
    if (out.length >= cap) break;
    /* a first digest reaches back a week, so a new subscriber hears something
       soon; after that, back to the last one, but never further than the cap */
    const since = s.last ? Math.max(s.last, now - LOOKBACK_DAYS * DAY) : now - DIGEST_EVERY_DAYS * DAY;
    const sinceDay = new Date(since).toISOString().slice(0, 10);
    const seen = new Set();
    const groups = [];
    for (const topic of s.topics.filter(validTopic)) {
      const roles = index.jobs.filter((j) => j.posted && j.posted >= sinceDay && matches(topic, j) && !seen.has(j.id));
      if (!roles.length) continue;
      roles.sort((a, b) => (a.posted < b.posted ? 1 : -1));
      const shown = roles.slice(0, Math.max(3, Math.floor(MAX_ROLES_PER_EMAIL / s.topics.length)));
      shown.forEach((r) => seen.add(r.id));
      groups.push({
        label: topicLabel(topic, s.lang, names), path: topicPath(topic, s.lang), more: roles.length - shown.length,
        roles: shown.map((r) => ({ title: r.title, company: names[r.co] || r.co, loc: r.loc, path: r.path })),
      });
    }
    if (groups.length) out.push({ email, sub: s, groups });
  }
  return out;
}

export default async function handler(request) {
  if (!configured()) return json({ ok: false, error: 'not_configured' }, 503);
  const secret = typeof process !== 'undefined' && process.env ? process.env.CRON_SECRET : '';
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return json({ ok: false, error: 'unauthorized' }, 401);
  const dry = new URL(request.url).searchParams.get('dry') === '1';

  try {
    const [flat, idx] = await Promise.all([
      redis('HGETALL', SUBS_KEY),
      fetch(`${SITE}/jobs/alerts.json`, { headers: { 'cache-control': 'no-cache' } }).then((r) => r.json()),
    ]);
    const subs = {};
    for (let i = 0; i + 1 < (flat || []).length; i += 2) { try { subs[flat[i]] = JSON.parse(flat[i + 1]); } catch { /* skip a damaged record */ } }

    const now = Date.now();
    const todo = plan(subs, idx, now);
    if (dry) return json({ ok: true, dry: true, subscribers: Object.keys(subs).length, would_send: todo.length, sample: todo.slice(0, 3).map((t) => ({ topics: t.sub.topics, roles: t.groups.reduce((n, g) => n + g.roles.length, 0) })) });
    if (!todo.length) return json({ ok: true, subscribers: Object.keys(subs).length, sent: 0 });

    const messages = [];
    for (const t of todo) {
      const token = await sign({ k: 'u', e: t.email });
      /* the link a person clicks opens a page with a button; the header is what
         a mail app POSTs to for one-click unsubscribe */
      const mail = digestEmail({ lang: t.sub.lang, groups: t.groups, unsubscribe: `${SITE}/jobs/alerts/#unsubscribe=${token}`, manage: `${SITE}/jobs/alerts/` });
      messages.push({ to: t.email, ...mail, headers: { 'List-Unsubscribe': `<${SITE}/api/alerts/unsubscribe?t=${token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } });
    }
    await sendMail(messages);
    /* recorded only after the send succeeded, so a failed run retries tomorrow */
    for (const t of todo) await redis('HSET', SUBS_KEY, t.email, JSON.stringify({ ...t.sub, last: now }));
    return json({ ok: true, subscribers: Object.keys(subs).length, sent: todo.length });
  } catch (e) {
    console.error('alerts/send', e && e.message);
    return json({ ok: false, error: 'server' }, 500);
  }
}
