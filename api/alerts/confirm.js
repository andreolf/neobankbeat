/* POST /api/alerts/confirm?t=<token>
   The moment an address is stored: the topic is added to the subscriber's
   record, creating it if new.

   The email's link does not come here. It opens /jobs/alerts/#confirm=<token>,
   and the button on that page POSTs the token. Mail scanners and link previews
   fetch every URL in a message; if a plain GET confirmed, a scanner would give
   consent on someone's behalf. A GET that does arrive is only forwarded to the
   page. The token rides in the URL fragment so it never reaches a server log. */
import { configured, redirect, json, verify, redis, SUBS_KEY, MAX_TOPICS } from './_lib.js';

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const t = new URL(request.url).searchParams.get('t');
  if (request.method !== 'POST') return redirect(`/jobs/alerts/#confirm=${encodeURIComponent(t || '')}`);
  if (!configured()) return json({ ok: false, state: 'off' }, 503);
  const p = await verify(t, 'c');
  if (!p) return json({ ok: false, state: 'expired' }, 400);
  try {
    const now = Date.now();
    const had = await redis('HGET', SUBS_KEY, p.e);
    const sub = had ? JSON.parse(had) : { topics: [], lang: p.l, confirmed: now, last: 0 };
    if (!sub.topics.includes(p.t)) sub.topics = [...sub.topics, p.t].slice(-MAX_TOPICS);
    sub.lang = p.l;
    await redis('HSET', SUBS_KEY, p.e, JSON.stringify(sub));
    return json({ ok: true, state: 'confirmed' });
  } catch (e) {
    console.error('alerts/confirm', e && e.message);
    return json({ ok: false, state: 'error' }, 500);
  }
}
