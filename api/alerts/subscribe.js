/* POST /api/alerts/subscribe   { email, topic, lang, website }
   Sends a confirmation link. Stores nothing: the link carries the request. */
import { configured, json, normEmail, normLang, validTopic, sign, redis, underLimit, sendMail, confirmEmail, SITE, DAILY_CONFIRMATIONS } from './_lib.js';

export const config = { runtime: 'edge' };

export default async function handler(request) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  if (!configured()) return json({ ok: false, error: 'not_configured' }, 503);

  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'bad_request' }, 400); }

  /* `website` is a field no person sees; a filled one is a bot. Answer as if it
     worked so the bot learns nothing. */
  if (body.website) return json({ ok: true });

  const email = normEmail(body.email), topic = body.topic, lang = normLang(body.lang);
  if (!email) return json({ ok: false, error: 'email' }, 400);
  if (!validTopic(topic)) return json({ ok: false, error: 'topic' }, 400);

  try {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    /* three brakes, because this endpoint makes the site send mail to an
       address a stranger typed: per visitor, per address, and for the day */
    if (!(await underLimit(`alerts:rl:ip:${ip}`, 5, 3600))) return json({ ok: false, error: 'slow_down' }, 429);
    /* The topic has to be one the board actually has, and the company's name in
       the email comes from the site's own list, never from the request: this
       endpoint must not let a stranger choose words that get mailed to someone. */
    const known = await fetch(`${SITE}/jobs/alerts-topics.json`).then((r) => r.json()).catch(() => null);
    if (!known) return json({ ok: false, error: 'server' }, 500);
    const exists = topic === 'br' ? !!known.br
      : topic.startsWith('co:') ? !!known.companies[topic.slice(3)] : known.depts.includes(topic.slice(5));
    if (!exists) return json({ ok: false, error: 'topic' }, 400);
    const names = known.companies;

    const fresh = await redis('SET', `alerts:pending:${email}`, '1', 'NX', 'EX', 600);
    /* already mailed this address in the last ten minutes: say yes, send nothing */
    if (fresh !== 'OK') return json({ ok: true });
    if (!(await underLimit(`alerts:confirmations:${day}`, DAILY_CONFIRMATIONS, 90000))) return json({ ok: false, error: 'busy' }, 503);

    const token = await sign({ k: 'c', e: email, t: topic, l: lang, x: Date.now() + 3 * 86400000 });
    const mail = confirmEmail({ lang, topic, names, link: `${SITE}/jobs/alerts/#confirm=${token}` });
    await sendMail({ to: email, ...mail });
    return json({ ok: true });
  } catch (e) {
    console.error('alerts/subscribe', e && e.message);
    return json({ ok: false, error: 'server' }, 500);
  }
}
