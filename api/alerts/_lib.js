/* Job alerts — shared pieces for the four functions in this folder.

   The site is static; these are the only server code it has. They run on
   Vercel's edge runtime and use nothing but fetch and Web Crypto, so the repo
   still has no package.json and no build step.

   What is kept, and where:
     - a subscriber's email address, the topics they asked for, the language of
       the page they signed up on, and two timestamps (confirmed, last sent),
       in one Redis hash at Upstash (`alerts:subs`);
     - nothing before the address is confirmed: the confirmation link carries
       the request itself, signed, so an unconfirmed sign-up leaves no record.
   Unsubscribing deletes the record.

   Everything is off until these are set in the Vercel project:
     RESEND_API_KEY              sends the mail (resend.com)
     ALERTS_FROM                 e.g.  neobankbeat jobs <jobs@neobankbeat.com>
                                 (the domain has to be verified in Resend)
     UPSTASH_REDIS_REST_URL      the subscriber store (upstash.com)
     UPSTASH_REDIS_REST_TOKEN
     ALERTS_SECRET               any long random string; signs the links
     CRON_SECRET                 any long random string; Vercel sends it with
                                 the daily cron call, and /send refuses without it

   The free tiers set the shape: Resend's is 100 emails a day, so a day's budget
   is split between confirmations and digests, and each subscriber gets at most
   one digest a week. */

export const SITE = 'https://www.neobankbeat.com';
export const SUBS_KEY = 'alerts:subs';
export const DAILY_CONFIRMATIONS = 30;   // of Resend's 100/day
export const DAILY_DIGESTS = 65;
export const DIGEST_EVERY_DAYS = 7;
export const LOOKBACK_DAYS = 14;         // how far back a first or late digest reaches
export const MAX_TOPICS = 12;
export const MAX_ROLES_PER_EMAIL = 20;

const env = (k) => (typeof process !== 'undefined' && process.env ? process.env[k] : undefined);
export const configured = () => ['RESEND_API_KEY', 'ALERTS_FROM', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'ALERTS_SECRET']
  .every((k) => !!env(k));

export const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
export const redirect = (path) => new Response(null, { status: 303, headers: { location: `${SITE}${path}`, 'cache-control': 'no-store' } });

/* ── topics ──
   co:<company-slug> · dept:<department-id> · br (every role based in Brazil).
   The pattern is the whole validation: a topic never reaches Redis or an email
   unless it has this shape. */
const TOPIC_RE = /^(?:co:[a-z0-9]+(?:-[a-z0-9]+)*|dept:[a-z]+|br)$/;
export const validTopic = (t) => typeof t === 'string' && t.length <= 60 && TOPIC_RE.test(t);
export const normEmail = (e) => {
  const s = String(e || '').trim().toLowerCase();
  return s.length <= 254 && /^[^\s@<>"',;:\\]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(s) ? s : null;
};
export const normLang = (l) => (l === 'pt' ? 'pt' : 'en');
export const matches = (topic, job) => topic === 'br' ? !!job.br
  : topic.startsWith('co:') ? job.co === topic.slice(3)
    : topic.startsWith('dept:') ? job.dept === topic.slice(5) : false;

/* ── signed links ──
   payload.signature, both base64url. The payload is the request (email, topic,
   language, purpose, expiry), so nothing has to be stored to honour the link. */
const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const hmacKey = () => crypto.subtle.importKey('raw', new TextEncoder().encode(env('ALERTS_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
export async function sign(payload) {
  const body = b64u(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(body));
  return `${body}.${b64u(sig)}`;
}
/* returns the payload, or null for a forged, damaged or expired token */
export async function verify(token, purpose, now = Date.now()) {
  try {
    const [body, sig] = String(token || '').split('.');
    if (!body || !sig) return null;
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(), unb64u(sig), new TextEncoder().encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)));
    if (p.k !== purpose) return null;
    if (p.x && p.x < now) return null;
    return p;
  } catch { return null; }
}

/* ── Upstash Redis over REST: one command per call ── */
export async function redis(...cmd) {
  const r = await fetch(env('UPSTASH_REDIS_REST_URL'), {
    method: 'POST',
    headers: { authorization: `Bearer ${env('UPSTASH_REDIS_REST_TOKEN')}`, 'content-type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`redis ${cmd[0]}: ${j.error || r.status}`);
  return j.result;
}
/* a counter that expires: true while the caller is under `limit` */
export async function underLimit(key, limit, seconds) {
  const n = await redis('INCR', key);
  if (n === 1) await redis('EXPIRE', key, seconds);
  return n <= limit;
}

/* ── Resend ── */
export async function sendMail(messages) {
  const list = (Array.isArray(messages) ? messages : [messages]).map((m) => ({ from: env('ALERTS_FROM'), ...m }));
  const one = list.length === 1;
  const r = await fetch(`https://api.resend.com/emails${one ? '' : '/batch'}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env('RESEND_API_KEY')}`, 'content-type': 'application/json' },
    body: JSON.stringify(one ? list[0] : list),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
  return true;
}

/* ── words ── */
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DEPT_EN = { engineering: 'engineering', data: 'data & AI', product: 'product', design: 'design', compliance: 'compliance & risk', onboarding: 'onboarding & KYC', support: 'customer support', sales: 'sales & partnerships', marketing: 'marketing & growth', finance: 'finance & treasury', operations: 'operations', people: 'people & legal', other: 'other' };
const DEPT_PT = { engineering: 'engenharia', data: 'dados e IA', product: 'produto', design: 'design', compliance: 'compliance e risco', onboarding: 'onboarding e KYC', support: 'atendimento ao cliente', sales: 'vendas e parcerias', marketing: 'marketing e growth', finance: 'finanças e tesouraria', operations: 'operações', people: 'pessoas e jurídico', other: 'outras áreas' };
/* what a topic is called in a sentence; `names` maps company slug → display name */
export function topicLabel(topic, lang, names = {}) {
  const pt = lang === 'pt';
  if (topic === 'br') return pt ? 'vagas em neobancos no Brasil' : 'neobank roles in Brazil';
  if (topic.startsWith('co:')) { const n = names[topic.slice(3)] || topic.slice(3); return pt ? `vagas no ${n}` : `roles at ${n}`; }
  const d = topic.slice(5); return pt ? `vagas de ${DEPT_PT[d] || d} em neobancos` : `${DEPT_EN[d] || d} roles at neobanks`;
}
export const topicPath = (topic, lang) => topic === 'br' ? '/pt/jobs/'
  : topic.startsWith('co:') ? `/jobs/at/${topic.slice(3)}/` : `/jobs/${topic.slice(5)}/`;

const shell = (lang, inner, footer) => `<!doctype html><html lang="${lang === 'pt' ? 'pt-BR' : 'en'}"><body style="margin:0;padding:24px;background:#f6f6f8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#15151c;line-height:1.5">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e3e3ea;border-radius:12px;padding:28px">
<div style="font-weight:700;font-size:15px;margin-bottom:18px">neobank<span style="color:#ff5c16">beat</span> · jobs</div>
${inner}
</div>
<div style="max-width:560px;margin:14px auto 0;font-size:12px;color:#6b6b78">${footer}</div>
</body></html>`;

export function confirmEmail({ lang, topic, link, names }) {
  const pt = lang === 'pt', what = topicLabel(topic, lang, names);
  const subject = pt ? `Confirme seu alerta: ${what}` : `Confirm your alert: ${what}`;
  const lead = pt
    ? `Alguém (esperamos que você) pediu para receber por e-mail as novas ${esc(what)}. Confirme para começar.`
    : `Someone (hopefully you) asked to be emailed new ${esc(what)}. Confirm to start.`;
  const btn = pt ? 'Confirmar alerta' : 'Confirm alert';
  const after = pt
    ? 'No máximo um e-mail por semana, e só quando houver vagas novas. Se não foi você, ignore esta mensagem: nada é guardado sem a confirmação.'
    : 'At most one email a week, and only when there are new roles. If this was not you, ignore this message: nothing is stored without the confirmation.';
  const html = shell(lang, `<p style="margin:0 0 18px">${lead}</p>
<p style="margin:0 0 18px"><a href="${esc(link)}" style="display:inline-block;background:#ff5c16;color:#0a0a10;font-weight:700;text-decoration:none;padding:11px 18px;border-radius:9px">${btn}</a></p>
<p style="margin:0;font-size:13px;color:#55555f">${after}</p>`,
  pt ? 'neobankbeat.com · diretório independente de neobancos' : 'neobankbeat.com · the independent directory of neobanks');
  return { subject, html, text: `${lead.replace(/&amp;/g, '&')}\n\n${link}\n\n${after}` };
}

export function digestEmail({ lang, groups, unsubscribe, manage }) {
  const pt = lang === 'pt';
  const total = groups.reduce((n, g) => n + g.roles.length, 0);
  const subject = groups.length === 1
    ? (pt ? `${total} ${total === 1 ? 'vaga nova' : 'vagas novas'}: ${groups[0].label}` : `${total} new ${total === 1 ? 'role' : 'roles'}: ${groups[0].label}`)
    : (pt ? `${total} vagas novas nos seus alertas` : `${total} new roles from your alerts`);
  const link = (path) => `${SITE}${path}?utm_source=job_alert&utm_medium=email`;
  const blocks = groups.map((g) => `<h2 style="font-size:15px;margin:22px 0 8px">${esc(g.label)}</h2>
${g.roles.map((r) => `<p style="margin:0 0 10px"><a href="${esc(link(r.path))}" style="color:#15151c;font-weight:600;text-decoration:none">${esc(r.title)}</a><br><span style="font-size:13px;color:#55555f">${esc([r.company, r.loc].filter(Boolean).join(' · '))}</span></p>`).join('\n')}
${g.more ? `<p style="margin:0 0 10px;font-size:13px"><a href="${esc(link(g.path))}" style="color:#c2410c">${pt ? `e mais ${g.more} →` : `and ${g.more} more →`}</a></p>` : ''}`).join('\n');
  const intro = pt ? 'Vagas novas desde o seu último alerta. A candidatura é feita no site de cada empresa.' : 'New roles since your last alert. You apply on each company’s own site.';
  const foot = pt
    ? `Você recebe isto porque confirmou um alerta em neobankbeat.com. <a href="${esc(unsubscribe)}" style="color:#6b6b78">Cancelar todos os alertas</a> · <a href="${esc(manage)}" style="color:#6b6b78">como funciona</a>`
    : `You get this because you confirmed an alert on neobankbeat.com. <a href="${esc(unsubscribe)}" style="color:#6b6b78">Unsubscribe from all alerts</a> · <a href="${esc(manage)}" style="color:#6b6b78">how this works</a>`;
  const html = shell(lang, `<p style="margin:0">${intro}</p>${blocks}`, foot);
  const text = `${intro}\n\n${groups.map((g) => `${g.label}\n${g.roles.map((r) => `- ${r.title} (${[r.company, r.loc].filter(Boolean).join(', ')})\n  ${link(r.path)}`).join('\n')}${g.more ? `\n  + ${g.more}: ${link(g.path)}` : ''}`).join('\n\n')}\n\n${pt ? 'Cancelar' : 'Unsubscribe'}: ${unsubscribe}`;
  return { subject, html, text };
}
