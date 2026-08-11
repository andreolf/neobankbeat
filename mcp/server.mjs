#!/usr/bin/env node
/* neobankbeat MCP server — exposes the open neobank dataset to AI agents as
 * Model Context Protocol tools. Dependency-free: implements the stdio
 * JSON-RPC 2.0 transport directly (newline-delimited messages).
 *
 * Data source: the live https://www.neobankbeat.com/data.json (cached 1h),
 * so it always reflects the current dataset. Falls back to a bundled copy /
 * the repo's data.json if offline.
 *
 * Run:  node mcp/server.mjs        (from an MCP client via stdio)
 * See mcp/README.md for client config.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATA_URL = 'https://www.neobankbeat.com/data.json';
const VERSION = '1.0.0';
const HERE = dirname(fileURLToPath(import.meta.url));

let _cache = null, _at = 0;
async function dataset() {
  if (_cache && Date.now() - _at < 3600_000) return _cache;
  try {
    const r = await fetch(DATA_URL, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    _cache = await r.json();
  } catch {
    // offline fallback: the repo copy one level up
    _cache = JSON.parse(readFileSync(join(HERE, '..', 'data.json'), 'utf8'));
  }
  _at = Date.now();
  return _cache;
}

const norm = s => String(s || '').toLowerCase();
const bySlugOrName = (E, q) => {
  const n = norm(q);
  return E.find(e => norm(e.name) === n || e.slug === n || norm(e.name).replace(/[^a-z0-9]/g, '') === n.replace(/[^a-z0-9]/g, ''));
};

/* tag set for facet search — mirrors the site's /search/ page */
function tagsOf(e) {
  const f = e.features || {}, t = [norm(e.category), norm(e.region)];
  if (e.stablecoins) t.push('stablecoins');
  if (f.crypto || e.category === 'hybrid' || e.category === 'web3-native') t.push('crypto');
  if (f.self_custody || /self-custod/i.test(e.custody || '')) t.push('self-custody');
  if (f.yield_bearing || e.yield) t.push('yield');
  if (f.business_accounts) t.push('business');
  if (f.iban) t.push('iban');
  if (f.lending) t.push('lending');
  if (f.investing) t.push('investing');
  if (e.kyc === 'No') t.push('no-kyc');
  if (e.audience && e.audience !== 'general') t.push(norm(e.audience));
  (e.active_regions || []).forEach(r => t.push(norm(r)));
  (e.countries || []).forEach(c => typeof c === 'string' && t.push(norm(c)));
  return new Set(t.filter(Boolean));
}
const SYN = {
  europe: ['europe', 'european', 'eu'], 'north america': ['north america', 'usa', 'us', 'canada'],
  'latin america': ['latin america', 'latam'], asia: ['asia', 'asian'], africa: ['africa', 'african'],
  mena: ['mena', 'middle east', 'gulf'], oceania: ['oceania', 'australia'],
  stablecoins: ['stablecoin', 'stablecoins', 'usdc', 'usdt', 'eurc'], crypto: ['crypto', 'web3', 'onchain', 'bitcoin'],
  'self-custody': ['self-custody', 'self-custodial', 'non-custodial', 'own keys'], yield: ['yield', 'interest', 'apy', 'savings'],
  business: ['business', 'smb', 'sme', 'startup', 'freelancer', 'freelancers'], iban: ['iban'],
  lending: ['lending', 'loan', 'credit', 'overdraft'], investing: ['investing', 'invest', 'stocks', 'brokerage'],
  'no-kyc': ['no kyc', 'no-kyc', 'anonymous'], traditional: ['traditional'], hybrid: ['hybrid'], 'web3-native': ['web3-native', 'web3 native'],
};
function searchNeobanks(E, query, limit = 20) {
  const q = ' ' + norm(query) + ' ', tags = [];
  for (const tag in SYN) for (const p of SYN[tag]) if (q.includes(' ' + p) && !tags.includes(tag)) { tags.push(tag); break; }
  const allTags = new Set(E.flatMap(e => [...tagsOf(e)]));
  for (const c of allTags) if (c.length > 3 && q.includes(' ' + c) && !tags.includes(c)) tags.push(c);
  let res = E.filter(e => { const et = tagsOf(e); return tags.every(t => et.has(t)); });
  const kw = norm(query).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !['neobank', 'neobanks', 'bank', 'banks', 'with', 'for', 'the', 'and', 'that', 'which', 'best', 'app'].includes(w) && !tags.some(t => t.includes(w)));
  if (kw.length) res = res.map(e => { const hay = norm(e.name + ' ' + (e.note || '') + ' ' + [...tagsOf(e)].join(' ')); return { e, sc: kw.filter(w => hay.includes(w)).length }; }).filter(r => r.sc > 0 || tags.length).sort((a, b) => b.sc - a.sc).map(r => r.e);
  return { matched: res.length, tags, keywords: kw, results: res.slice(0, limit).map(slim) };
}
const slim = e => ({ name: e.name, slug: e.slug, category: e.category, custody: e.custody, hq: e.hq, regulation_type: e.regulation_type, stablecoins: e.stablecoins, yield: e.yield || null, url: `https://www.neobankbeat.com/n/${e.slug}/` });

const TOOLS = [
  { name: 'search_neobanks', description: 'Search verified-active neobanks in plain language (e.g. "European neobanks with stablecoins", "self-custody banks in Brazil", "crypto banks for freelancers"). Returns matched entities with a link to each profile.', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Natural-language query' }, limit: { type: 'number', description: 'Max results (default 20)' } }, required: ['query'] } },
  { name: 'get_neobank', description: 'Get the full verified record for one neobank by name or slug (custody, license, cards, cashback, yield, stablecoins, KYC, regulation, geography, features, sources).', inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'Neobank name or slug, e.g. "Revolut" or "revolut"' } }, required: ['name'] } },
  { name: 'compare_neobanks', description: 'Compare 2–4 neobanks field by field (category, custody, regulation, card, cashback, yield, stablecoins, KYC, regions).', inputSchema: { type: 'object', properties: { names: { type: 'array', items: { type: 'string' }, description: '2–4 neobank names or slugs' } }, required: ['names'] } },
  { name: 'list_by_country', description: 'List neobanks headquartered in or verified as available in a country (e.g. "Germany", "Brazil").', inputSchema: { type: 'object', properties: { country: { type: 'string' } }, required: ['country'] } },
  { name: 'dataset_stats', description: 'Dataset totals and category breakdown (traditional / hybrid / web3-native), plus the as-of note.', inputSchema: { type: 'object', properties: {} } },
];

async function callTool(name, args) {
  const d = await dataset();
  const E = d.entities || [];
  if (name === 'search_neobanks') return searchNeobanks(E, args.query || '', args.limit || 20);
  if (name === 'get_neobank') { const e = bySlugOrName(E, args.name) || bySlugOrName(d.emerging || [], args.name); return e ? { ...e, url: `https://www.neobankbeat.com/n/${e.slug}/` } : { error: `No neobank found for "${args.name}". Try search_neobanks.` }; }
  if (name === 'compare_neobanks') {
    const got = (args.names || []).map(n => bySlugOrName(E, n)).filter(Boolean);
    if (got.length < 2) return { error: 'Need at least 2 recognised neobanks.' };
    const fields = ['category', 'audience', 'hq', 'founded', 'custody', 'regulation_type', 'card_network', 'card_type', 'cashback', 'yield', 'stablecoins', 'kyc', 'active_regions'];
    return { compared: got.map(e => e.name), table: fields.map(f => ({ field: f, values: Object.fromEntries(got.map(e => [e.name, e[f] ?? null])) })), profiles: got.map(e => `https://www.neobankbeat.com/n/${e.slug}/`) };
  }
  if (name === 'list_by_country') {
    const c = norm(args.country);
    const hq = E.filter(e => norm(e.hq).includes(c) || (e.countries || []).some(x => norm(x).includes(c)));
    return { country: args.country, count: hq.length, neobanks: hq.map(slim) };
  }
  if (name === 'dataset_stats') return { total: d.meta?.total, counts: d.meta?.counts, verification: d.meta?.field_notes?.verification, source: 'https://www.neobankbeat.com/data.json' };
  return { error: `Unknown tool: ${name}` };
}

/* ── stdio JSON-RPC 2.0 transport (newline-delimited) ── */
function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }
async function handle(req) {
  const { id, method, params } = req;
  if (method === 'initialize') return send({ jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'neobankbeat', version: VERSION } } });
  if (method === 'notifications/initialized' || method === 'initialized') return; // notification, no reply
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  if (method === 'tools/call') {
    try {
      const out = await callTool(params?.name, params?.arguments || {});
      return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] } });
    } catch (e) {
      return send({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: 'Error: ' + e.message }] } });
    }
  }
  if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } });
}

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let req; try { req = JSON.parse(line); } catch { continue; }
    handle(req);
  }
});
/* No explicit exit on stdin end: let any in-flight async tool call finish and
   the event loop drain naturally. A persistent MCP client keeps stdin open. */
