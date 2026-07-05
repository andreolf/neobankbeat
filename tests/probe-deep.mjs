/* probe-deep.mjs — exhaustive ATS discovery across ALL tracked entities.
   Generates slug candidates from each entity's name + domain and probes six
   public job-board APIs (Greenhouse, Lever, Ashby, Workable, SmartRecruiters,
   Recruitee). Prints confirmed boards with live counts, ready to paste into
   build-jobs.mjs SOURCES.
   run: node tests/probe-deep.mjs                                              */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8')).entities;

/* slug candidates: "Starling Bank" + starlingbank.com →
   starling-bank, starlingbank, starling, plus the domain label */
function candidatesFor(e) {
  const out = new Set();
  const base = e.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/['’.]/g, '').replace(/&/g, 'and');
  const dashed = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const joined = dashed.replace(/-/g, '');
  out.add(dashed); out.add(joined);
  const first = dashed.split('-')[0];
  if (first.length >= 4) out.add(first);
  const dom = (e.domain || '').toLowerCase().split('.')[0];
  if (dom && dom.length >= 3) out.add(dom);
  return [...out];
}

const PROBES = {
  gh:    s => [`https://boards-api.greenhouse.io/v1/boards/${s}/jobs`, j => (j.jobs || []).length],
  lever: s => [`https://api.lever.co/v0/postings/${s}?mode=json`, j => Array.isArray(j) ? j.length : 0],
  ashby: s => [`https://api.ashbyhq.com/posting-api/job-board/${s}`, j => (j.jobs || []).length],
  workable: s => [`https://apply.workable.com/api/v1/widget/accounts/${s}?details=false`, j => (j.jobs || []).length],
  smartr: s => [`https://api.smartrecruiters.com/v1/companies/${s}/postings?limit=1`, j => j.totalFound || 0],
  recruitee: s => [`https://${s}.recruitee.com/api/offers/`, j => (j.offers || []).length],
};

async function probe(ats, slug) {
  const [url, count] = PROBES[ats](slug);
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'neobankbeat-jobs/1.0', accept: 'application/json' } });
    if (!r.ok) return null;
    const j = await r.json();
    return count(j);
  } catch { return null; }
}

/* known boards from build-jobs.mjs — skip re-reporting them */
const KNOWN = new Set(['brex','crypto','tide','robinhood','neofinancial','coinbase','ramp','nubank','sofi','n26','monzo','moniepoint','chime','kraken.com','mercury','bitpanda','qonto','wealthsimple','relay','allica-bank','gemini','koho','lunar','ether.fi','phantom','consensys','epifi','found','current']);

const tasks = [];
for (const e of E) for (const slug of candidatesFor(e)) for (const ats of Object.keys(PROBES)) tasks.push([e.name, ats, slug]);
console.error(`${tasks.length} probes across ${E.length} entities…`);

const hits = new Map(); // entity -> best [ats, slug, n]
let done = 0;
const CONC = 24;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (tasks.length) {
    const [name, ats, slug] = tasks.pop();
    if (KNOWN.has(slug)) { done++; continue; }
    const n = await probe(ats, slug);
    done++;
    if (done % 500 === 0) console.error(`  …${done} done`);
    if (n && n > 0) {
      const cur = hits.get(name);
      if (!cur || n > cur[2]) hits.set(name, [ats, slug, n]);
      console.error(`  HIT ${name} → ${ats}:${slug} (${n})`);
    }
  }
}));

console.log('\n── confirmed new boards ──');
let total = 0;
for (const [name, [ats, slug, n]] of [...hits.entries()].sort((a, b) => b[1][2] - a[1][2])) {
  total += n;
  console.log(`['${name.replace(/'/g, "\\'")}', '${name.replace(/'/g, "\\'")}', '${ats}', '${slug}'], // ${n} jobs`);
}
console.log(`\n${hits.size} new boards · ${total} additional jobs`);
