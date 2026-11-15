/* POST /api/alerts/unsubscribe?t=<token>
   Deletes the subscriber's record. Two things POST here: the button on
   /jobs/alerts/#unsubscribe=<token> (the link in every digest), and mail apps
   acting on the List-Unsubscribe header (one-click unsubscribe).

   A GET is only forwarded to that page, for the same reason as confirm: a mail
   scanner opening every link must not be able to unsubscribe anyone. The token
   does not expire: an unsubscribe link has to work for as long as mail carrying
   it exists. */
import { configured, redirect, json, verify, redis, SUBS_KEY } from './_lib.js';

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const t = new URL(request.url).searchParams.get('t');
  if (request.method !== 'POST') return redirect(`/jobs/alerts/#unsubscribe=${encodeURIComponent(t || '')}`);
  if (!configured()) return json({ ok: false, state: 'off' }, 503);
  const p = await verify(t, 'u');
  if (!p) return json({ ok: false, state: 'expired' }, 400);
  try {
    await redis('HDEL', SUBS_KEY, p.e);
    return json({ ok: true, state: 'unsubscribed' });
  } catch (e) {
    console.error('alerts/unsubscribe', e && e.message);
    return json({ ok: false, state: 'error' }, 500);
  }
}
