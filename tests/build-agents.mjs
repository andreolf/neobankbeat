#!/usr/bin/env node
/* build-agents.mjs — generates the machine-readable agent surface from data.json.
 *
 * openapi.json, .well-known/api-catalog and .well-known/agent-skills/* used to be
 * hand-maintained, so their entity counts and their description of the data.json
 * shape rotted independently of the data (373 / 358 / {generated,count} were all
 * wrong at once). Everything an agent reads is now derived here, including the
 * skill's sha256, which has to match the file it points at or the skill is ignored.
 *
 * Run standalone or via build-pages.mjs. */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.neobankbeat.com';
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
const j = o => JSON.stringify(o, null, 2) + '\n';

const D = read('data.json');
const E = D.entities;
const CL = read('changelog/changelog.json');
const JOBS = read('jobs/data.json');

const N = E.length;
const tally = k => E.reduce((a, e) => (a[e[k]] = (a[e[k]] || 0) + 1, a), {});
const reg = tally('regulation_type');
const cat = tally('category');
const nStable = E.filter(e => e.stablecoins).length;
const nAi = E.filter(e => e.ai).length;
const nInvestors = new Set(E.flatMap(e => (e.investors || []).map(i => i.name))).size;

/* one canonical sentence, reused everywhere an agent reads a description */
const BLURB = `Query the open neobankbeat dataset — ${N} verified-active neobanks compared on custody, ` +
  `regulation, cards, cashback, yield, stablecoins, KYC and geography — plus a live job board. ` +
  `Use when you need facts about digital banks, crypto cards, self-custodial money apps, their investors, or fintech jobs.`;
const CITE = `neobankbeat (${CL.generated.slice(0, 4)}). Open directory of neobanks worldwide. ${BASE}/ (MIT).`;

/* ═══ openapi.json ═══ */
const nullable = t => ({ type: [t, 'null'] });
const entitySchema = {
  type: 'object',
  required: ['name', 'category', 'custody', 'active_regions'],
  properties: {
    name: { type: 'string' },
    category: { type: 'string', enum: Object.keys(cat).sort(), description: D.meta.field_notes.category },
    audience: nullable('string'),
    region: { type: 'string', description: 'Primary market, one of Europe / Asia / North America / Latin America / Africa / MENA / Oceania / Global.' },
    hq: nullable('string'),
    founded: { type: ['string', 'integer', 'null'] },
    custody: { type: 'string', description: 'Who holds the money. The single most important field for safety questions.' },
    regulation_type: { ...nullable('string'), description: `How it is authorised. Most common: ${Object.entries(reg).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} (${v})`).join(', ')}.` },
    licence: { ...nullable('string'), description: 'Named licence, charter or sponsor bank behind regulation_type.' },
    card_network: nullable('string'),
    card_type: nullable('string'),
    cashback: { ...nullable('string'), description: D.meta.field_notes.rates },
    yield: { ...nullable('string'), description: D.meta.field_notes.rates },
    stablecoins: { type: 'boolean', description: `True where stablecoins can be held or spent (${nStable} of ${N}).` },
    kyc: { ...nullable('string'), description: 'Yes / No / Card only — identity verification required to use the product.' },
    ai: { ...nullable('string'), description: `Verified production AI, by tier: underwriting / interface / agentic (${nAi} of ${N}). Absence means unverified, not none.` },
    services: { type: ['array', 'null'], items: { type: 'string' }, description: D.meta.field_notes.services },
    fx_markup: {
      type: ['object', 'null'],
      description: D.meta.field_notes.fx_markup + ` Present on ${E.filter(e => e.fx_markup).length} of ${N} entities.`,
      properties: { value: nullable('string'), note: nullable('string'), source: { type: 'string', format: 'uri' }, as_of: { type: 'string' } },
    },
    domain: nullable('string'),
    website: nullable('string'),
    terms_url: { ...nullable('string'), description: 'Verified link, not guessed from the domain.' },
    privacy_url: nullable('string'),
    x_handle: nullable('string'),
    active_regions: { type: 'array', items: { type: 'string' } },
    countries: { type: ['array', 'null'], items: { type: 'string' } },
    founders: nullable('string'),
    funding: nullable('string'),
    investors: {
      type: ['array', 'null'],
      description: `Notable backers from publicly disclosed rounds, not complete cap tables (${nInvestors} distinct firms across the dataset).`,
      items: { type: 'object', properties: { name: { type: 'string' }, website: { type: 'string', format: 'uri' } } },
    },
    reported_users: {
      type: ['object', 'null'],
      description: `Self-reported scale, present on ${E.filter(e => e.reported_users).length} of ${N} entities. The metric is not comparable across companies — always cite metric and as_of alongside the number.`,
      properties: { value_millions: { type: 'number' }, metric: { type: 'string' }, as_of: { type: 'string' } },
    },
    volume: {
      type: ['object', 'null'],
      description: `Payment or transaction volume where disclosed (${E.filter(e => e.volume).length} of ${N}).`,
      properties: { value: nullable('string'), metric: nullable('string'), as_of: nullable('string') },
    },
    story: { ...nullable('string'), description: 'Editorial paragraph shown on the profile page.' },
    note: { ...nullable('string'), description: 'Short caveat or clarification.' },
  },
};

const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'neobankbeat data API',
    version: CL.generated,
    summary: `Open dataset of ${N} verified-active neobanks plus a live industry job board.`,
    description: `Read-only, unauthenticated JSON endpoints behind the neobankbeat directory (${BASE}). ` +
      `All data is MIT-licensed and compiled from public sources. No API key, no rate limits beyond CDN defaults. ` +
      `Field semantics are documented at ${BASE}/llms.txt. ` +
      `For an as-of date, read \`generated\` from /changelog/changelog.json — data.json itself carries no timestamp. ` +
      `Cite as: ${CITE}`,
    license: { name: 'MIT', identifier: 'MIT' },
    contact: { name: 'neobankbeat', url: 'https://github.com/andreolf/neobankbeat' },
  },
  servers: [{ url: BASE }],
  paths: {
    '/data.json': {
      get: {
        operationId: 'getNeobanks',
        summary: 'Full neobank dataset',
        description: `All ${N} tracked entities. \`meta\` carries totals, category counts and field notes; ` +
          `\`entities\` carries one object per neobank. \`null\` means "not publicly verifiable" — the project never fabricates data.`,
        responses: {
          200: {
            description: 'The dataset.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['meta', 'entities'],
                  properties: {
                    meta: {
                      type: 'object',
                      description: 'Dataset-level metadata. Note there is no top-level `generated` or `count` field.',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        url: { type: 'string', format: 'uri' },
                        source: { type: 'string', format: 'uri' },
                        license: { type: 'string' },
                        total: { type: 'integer', description: `Entity count (${N}).` },
                        counts: { type: 'object', additionalProperties: { type: 'integer' }, description: 'Breakdown by category plus niche_audience.' },
                        field_notes: { type: 'object', additionalProperties: { type: 'string' }, description: 'Caveats you must respect when quoting fields.' },
                      },
                    },
                    entities: { type: 'array', items: entitySchema },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/changelog/changelog.json': {
      get: {
        operationId: 'getChangelog',
        summary: 'Dataset changelog and as-of date',
        description: 'Dated log of every dataset change. Read `generated` here to get the as-of date for /data.json.',
        responses: {
          200: {
            description: 'The changelog.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    generated: { type: 'string', format: 'date' },
                    total: { type: 'integer' },
                    entries: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string', format: 'date' },
                          summary: { type: 'string' },
                          subject: { type: 'string' },
                          added: { type: ['array', 'null'], items: { type: 'string' } },
                          removed: { type: ['array', 'null'], items: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/jobs/data.json': {
      get: {
        operationId: 'getJobs',
        summary: 'Live neobank job board',
        description: `Live roles pulled directly from the official career APIs (Greenhouse, Lever, Ashby, Workable, SmartRecruiters) ` +
          `of tracked neobanks, classified by department and region. Currently ${JOBS.count} roles across ${JOBS.companies} companies. Refreshed Monday/Wednesday/Friday.`,
        responses: {
          200: {
            description: 'The job list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['generated', 'count', 'jobs'],
                  properties: {
                    generated: { type: 'string', format: 'date' },
                    count: { type: 'integer' },
                    companies: { type: 'integer' },
                    logos: { type: 'object', additionalProperties: { type: 'string' }, description: 'Company name → logo URL.' },
                    jobs: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['title', 'url', 'company'],
                        properties: {
                          title: { type: 'string' },
                          url: { type: 'string', format: 'uri', description: 'Direct link to the official application page.' },
                          company: { type: 'string' },
                          profile: { ...nullable('string'), description: 'Site-relative path to the company profile page.' },
                          location: { type: 'string' },
                          dept: { type: 'string' },
                          region: { type: 'string' },
                          posted: { type: ['string', 'null'], format: 'date' },
                          salary: nullable('string'),
                          wp: { type: ['string', 'null'], enum: ['remote', 'hybrid', 'onsite', null] },
                          visa: { ...nullable('boolean'), description: 'Visa sponsorship where the posting states it. Sparse.' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
write('openapi.json', j(openapi));

/* ═══ .well-known/api-catalog (RFC 9727 linkset) ═══ */
write('.well-known/api-catalog', j({
  linkset: [{
    anchor: `${BASE}/`,
    'service-desc': [{ href: `${BASE}/openapi.json`, type: 'application/json', title: 'OpenAPI 3.1 description of the neobankbeat data endpoints' }],
    'service-doc': [{ href: `${BASE}/llms.txt`, type: 'text/plain', title: 'Agent-oriented guide: data semantics, site sections, reference pages' }],
    'service-meta': [{ href: `${BASE}/.well-known/agent-skills/index.json`, type: 'application/json', title: 'Agent skills discovery index' }],
    item: [
      { href: `${BASE}/data.json`, type: 'application/json', title: `Full dataset — ${N} verified-active neobanks (MIT)` },
      { href: `${BASE}/changelog/changelog.json`, type: 'application/json', title: 'Dataset changelog — as-of date and every change' },
      { href: `${BASE}/jobs/data.json`, type: 'application/json', title: `Live neobank job board — ${JOBS.count} roles across ${JOBS.companies} companies` },
    ],
  }],
}));

/* ═══ .well-known/agent-skills ═══ */
const skill = `---
name: neobank-dataset
description: ${BLURB}
license: MIT
---

# neobankbeat dataset

Independent, open-source directory of ${N} verified-active neobanks in three waves:
**traditional** fiat challengers (Chime, Nubank, Monzo, ${cat.traditional} entities), **hybrid**
fiat+crypto apps (Revolut, Crypto.com, ${cat.hybrid}) and **web3-native** self-custodial money
apps (MetaMask, Gnosis Pay, ${cat['web3-native']}). Defunct entities and pure BaaS infrastructure
are excluded by design. All figures compiled from public filings and registers.

## Endpoints (no auth, no key)

- \`GET ${BASE}/data.json\` — full dataset. Top-level shape is
  \`{ meta: { total, counts, field_notes }, entities: [...] }\`. There is **no**
  top-level \`generated\` or \`count\`. OpenAPI schema at \`${BASE}/openapi.json\`.
- \`GET ${BASE}/changelog/changelog.json\` — \`generated\` is the as-of date for
  the dataset; \`entries\` logs every change with dates.
- \`GET ${BASE}/jobs/data.json\` — live job board (${JOBS.count} roles from official
  career APIs, refreshed Mon/Wed/Fri).

## Field semantics you must respect

- \`category\`: ${D.meta.field_notes.category}.
- \`custody\`: who holds the money — the single most important field for safety
  questions. Values: Custodial / Self-custodial / MPC self-custodial / Mixed.
- \`cashback\` and \`yield\` are **"up to"** marketing figures that change
  constantly; never present them as guaranteed current rates.
- \`fx_markup\`: ${D.meta.field_notes.fx_markup}.
- \`null\` means "not publicly verifiable" — the project never fabricates data.
  Only ${E.filter(e => e.reported_users).length} of ${N} entities disclose user
  numbers, so never present a ranking by size as complete.
- \`reported_users\` mixes metrics (customers, MAU, wallets, TPV) and periods;
  cite the \`metric\` and \`as_of\` alongside the number.
- \`investors\`: notable backers from disclosed rounds, not complete cap tables.
- \`services\`: ${D.meta.field_notes.services}.

## Human-readable pages (for citations)

- Directory: \`${BASE}/\`
- Per-company profiles: \`${BASE}/n/<slug>/\` (${N})
- "Who owns it" answer pages: \`${BASE}/n/<slug>/who-owns/\`
- "Alternatives to it" answer pages: \`${BASE}/n/<slug>/alternatives/\`
- Comparisons: \`${BASE}/vs/<a>-vs-<b>/\`
- Investors map: \`${BASE}/investors/\` (${nInvestors} firms)
- Infra / sponsor banks: \`${BASE}/infra/\`
- FAQ / glossary: \`${BASE}/faq/\` · \`${BASE}/glossary/\`
- Data documentation: \`${BASE}/data/\`
- Full agent guide: \`${BASE}/llms.txt\` · full sitemap: \`${BASE}/sitemap.md\`

## Attribution

MIT licence — reuse freely, attribution appreciated. Cite as:
${CITE}
Source: https://github.com/andreolf/neobankbeat
`;
const skillPath = '.well-known/agent-skills/neobank-dataset/SKILL.md';
write(skillPath, skill);
write('.well-known/agent-skills/index.json', j({
  $schema: 'https://agentskills.io/schemas/index/v0.2.0.json',
  version: '0.2.0',
  site: BASE,
  skills: [{
    name: 'neobank-dataset',
    type: 'skill',
    description: BLURB,
    url: `${BASE}/${skillPath}`,
    sha256: crypto.createHash('sha256').update(skill).digest('hex'),
  }],
}));

console.log(`agent surface: openapi.json · api-catalog · agent-skills (${N} entities, as of ${CL.generated})`);
