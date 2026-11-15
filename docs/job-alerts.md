# Job alerts by email

People follow one neobank, one department, or every role based in Brazil, and
get its new roles by email at most once a week. The code is in `api/alerts/`;
the sign-up boxes and the `/jobs/alerts/` page are written by
`tests/build-jobs.mjs`.

It is **off** until the steps below are done. While it is off, no page shows a
sign-up box and every endpoint answers "not configured".

## Switching it on

Two free accounts, six values in Vercel, one line in the repo.

### 1. Resend (sends the mail)

1. Create an account at resend.com.
2. Domains → Add domain → `neobankbeat.com`. Resend shows a few DNS records
   (SPF, DKIM); add them where the domain's DNS is managed and wait for
   "Verified". Without a verified domain Resend only delivers to your own
   address.
3. API Keys → Create → "Sending access". Copy it.

Free tier at the time of writing: 100 emails a day, 3,000 a month. The code
budgets a day as 30 confirmation emails and 65 digests
(`DAILY_CONFIRMATIONS`, `DAILY_DIGESTS` in `api/alerts/_lib.js`).

### 2. Upstash (stores the subscribers)

1. Create an account at upstash.com → Create database → Redis, any region.
2. On the database page, under "REST API", copy the URL and the token.

### 3. Vercel environment variables

Project → Settings → Environment Variables, for Production:

| Name | Value |
|---|---|
| `RESEND_API_KEY` | the Resend key |
| `ALERTS_FROM` | `neobankbeat jobs <jobs@neobankbeat.com>` (any address on the verified domain) |
| `UPSTASH_REDIS_REST_URL` | from Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | from Upstash |
| `ALERTS_SECRET` | a long random string, e.g. the output of `openssl rand -hex 32` |
| `CRON_SECRET` | another long random string; Vercel sends it with the daily cron call |

Redeploy so the functions pick them up.

### 4. Check before showing the box to anyone

With the variables set and the box still hidden:

```bash
curl -s -X POST https://www.neobankbeat.com/api/alerts/subscribe \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","topic":"co:wise","lang":"en"}'
```

You should get `{"ok":true}` and a confirmation email. Open its link, press
"Confirm my alert", then ask the sender what it would do:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.neobankbeat.com/api/alerts/send?dry=1"
```

`would_send` should be 1 if Wise posted anything in the last week.

### 5. Show the boxes

Set `"live": true` in `tests/alerts-config.json` and merge it. The next jobs
refresh puts the box on every company page, department page and the Brazil
page, and `/jobs/alerts/` becomes indexable. Add a changelog entry in the same
change: this is the moment visitors can see it.

## How it works

- **Sign-up** (`subscribe.js`): checks the address and the topic, then emails a
  link. Nothing is stored; the link carries the signed request.
- **Confirm** (`confirm.js`): the link opens `/jobs/alerts/` with the token in
  the URL fragment, and a button there POSTs it. This is when the address is
  stored. A plain GET never confirms, so a mail scanner opening the link cannot
  give consent for someone.
- **Send** (`send.js`): Vercel Cron calls it daily at 16:00 UTC. A subscriber is
  due once a week, and gets an email only if something they follow has new
  roles. It reads `/jobs/alerts.json`, which the jobs build writes.
- **Unsubscribe** (`unsubscribe.js`): one click from any digest, or the mail
  app's own unsubscribe button. It deletes the record.

## What is stored

One Redis hash, `alerts:subs`: email address → topics, language, date
confirmed, date last emailed. Short-lived counters for rate limits. Nothing
else, and `/jobs/alerts/` carries no analytics scripts because its links
identify a subscriber.

To see or remove a subscriber by hand, use the Upstash console:
`HGET alerts:subs someone@example.com`, `HDEL alerts:subs someone@example.com`.

## Limits and abuse

- 5 sign-up attempts per visitor per hour; one confirmation email per address
  per ten minutes; 30 confirmation emails a day in total.
- A topic must exist in `/jobs/alerts-topics.json`, and the company name in the
  email comes from that file, never from the request.
- A hidden form field catches simple bots.

## Tests

`node tests/alerts.test.mjs` runs the whole path against fake mail and storage
services (30 checks). `tests/flowtest.js` runs it as flow 41.

## Worth knowing

- Commercial email law in several countries (the US CAN-SPAM Act, for one)
  expects a postal address in the footer of bulk mail. The digest does not carry
  one. Decide whether to add one before the list grows.
- If the list outgrows 65 digests a day, people are served longest-waiting
  first, so nobody is skipped, only delayed. Past roughly 450 subscribers the
  free tier no longer keeps a weekly cadence.
