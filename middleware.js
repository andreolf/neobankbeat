/* Edge middleware — two jobs, both for agents.

   1. Markdown for Agents. Requests to the homepage with `Accept: text/markdown`
      are rewritten to /index.md (the markdown twin of llms.txt, synced by
      tests/build-pages.mjs). Runs before Vercel's filesystem handling, which is
      why the vercel.json rewrite alone can't do this. Browsers never send this
      Accept value.

   2. Counting agents. The site is built to be read by AI agents, and nothing
      could say whether any did: GA4 only sees clients that run JavaScript, and
      crawlers and agents do not. Requests whose User-Agent names a known AI
      crawler, AI search index or user-triggered AI fetcher are reported to GA4
      as an `agent_<family>` event through the Measurement Protocol. On the data
      endpoints, scripted clients (curl, python-requests, the MCP server…) are
      counted too, as `agent_script`.

      It reports nothing until GA4_MP_SECRET is set in the Vercel project's
      environment (GA4 → Admin → Data streams → the web stream → Measurement
      Protocol API secrets → Create). Only the agent's family and the path are
      sent; no IP address, no full User-Agent, nothing about people.

   The matcher is deliberately narrow: the machine endpoints, the homepage, and
   the profile and comparison pages an answer engine cites. Every matched
   request is an edge invocation, so widening it has a cost. */
export const config = {
  matcher: [
    '/',
    '/data.json', '/jobs/data.json', '/changelog/changelog.json', '/openapi.json',
    '/llms.txt', '/llms-full.txt', '/index.md', '/sitemap.md',
    '/.well-known/:path*',
    '/n/:path*', '/vs/:path*',
  ],
};

const GA_ID = 'G-E3KE01L5DL';

/* [pattern, family, kind]. First match wins, so the user-triggered fetchers sit
   above the crawlers that share a vendor prefix. */
const AGENTS = [
  [/chatgpt-user/i, 'chatgpt_user', 'user'],
  [/claude-user/i, 'claude_user', 'user'],
  [/perplexity-user/i, 'perplexity_user', 'user'],
  [/mistralai-user/i, 'mistral_user', 'user'],
  [/meta-externalfetcher/i, 'meta_fetcher', 'user'],
  [/google-agent|googleagent-mariner/i, 'google_agent', 'user'],
  [/oai-searchbot/i, 'openai_search', 'search'],
  [/claude-searchbot/i, 'claude_search', 'search'],
  [/perplexitybot/i, 'perplexity_bot', 'search'],
  [/duckassistbot/i, 'duckassist', 'search'],
  [/youbot/i, 'you_bot', 'search'],
  [/gptbot/i, 'gptbot', 'training'],
  [/claudebot|anthropic-ai/i, 'claudebot', 'training'],
  [/ccbot/i, 'ccbot', 'training'],
  [/bytespider/i, 'bytespider', 'training'],
  [/amazonbot/i, 'amazonbot', 'training'],
  [/meta-externalagent/i, 'meta_agent', 'training'],
  [/cohere-ai|cohere-training/i, 'cohere', 'training'],
  [/diffbot/i, 'diffbot', 'training'],
];
const DATA_PATH = /^\/(data\.json|jobs\/data\.json|changelog\/changelog\.json|openapi\.json|llms(-full)?\.txt|index\.md|sitemap\.md|\.well-known\/)/;
const SCRIPT_UA = /^(curl|wget|python|node|undici|axios|go-http-client|okhttp|java|ruby|php|deno|bun|httpx|aiohttp|libwww|got|postman|insomnia)|mcp|langchain|llamaindex|openai|anthropic/i;

/* exported so it can be exercised from node: classification is the whole logic
   here, and a wrong pattern is silent in production */
export function classifyAgent(userAgent, pathname) {
  const ua = String(userAgent || '');
  for (const [re, family, kind] of AGENTS) if (re.test(ua)) return { family, kind };
  if (DATA_PATH.test(pathname) && (ua === '' || SCRIPT_UA.test(ua))) return { family: 'script', kind: 'script' };
  return null;
}

function report(agent, url) {
  const secret = process.env.GA4_MP_SECRET;
  if (!secret) return null;
  return fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA_ID}&api_secret=${encodeURIComponent(secret)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      /* one stable client per family, so GA4 "users" counts agent families
         rather than inventing a visitor per request */
      client_id: `agent.${agent.family}`,
      non_personalized_ads: true,
      events: [{
        name: `agent_${agent.family}`,
        params: {
          agent: agent.family,
          agent_kind: agent.kind,
          page_location: `${url.origin}${url.pathname}`,
          engagement_time_msec: 1,
        },
      }],
    }),
  }).catch(() => {});
}

export default function middleware(request, context) {
  const url = new URL(request.url);

  try {
    const agent = classifyAgent(request.headers.get('user-agent'), url.pathname);
    const sent = agent && report(agent, url);
    if (sent && context && typeof context.waitUntil === 'function') context.waitUntil(sent);
  } catch (_) { /* counting must never break a response */ }

  if (url.pathname === '/') {
    const accept = request.headers.get('accept') || '';
    if (accept.includes('text/markdown')) {
      return new Response(null, {
        headers: { 'x-middleware-rewrite': new URL('/index.md', request.url).toString() },
      });
    }
  }
}
