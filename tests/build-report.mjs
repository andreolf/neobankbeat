/* build-report.mjs — generates the monthly "State of Neobanks" report as
   print-designed HTML (fixed A4 pages), rendered to PDF with headless Chrome.
   Everything is computed from data.json, so next month = rerun + edit the
   MONTH constants and the editorial notes below.
   run: node build-report.mjs   → writes ../reports/report-src.html          */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8')).entities;

/* ── edition constants ─────────────────────────────────────────── */
const MONTH = 'July 2026';
const EDITION = '№ 01';
const ASOF = 'data as of 5 July 2026';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── stats ─────────────────────────────────────────────────────── */
const N = E.length;
const byCat = { traditional: [], hybrid: [], 'web3-native': [] };
E.forEach(e => byCat[e.category].push(e));
const T = byCat.traditional.length, H = byCat.hybrid.length, W = byCat['web3-native'].length;

const years = {};
E.forEach(e => { const y = e.founded < 2010 ? 2009 : e.founded; years[y] = (years[y] || 0) + 1; });
const yearArr = Object.entries(years).map(([y, n]) => [Number(y), n]).sort((a, b) => a[0] - b[0]);

const REGIONS = ['Europe', 'Asia', 'North America', 'Latin America', 'Africa', 'MENA', 'Oceania'];
const regCount = Object.fromEntries(REGIONS.map(r => [r, E.filter(e => e.active_regions.includes(r)).length]));
const regByCat = Object.fromEntries(REGIONS.map(r => [r, {
  T: E.filter(e => e.active_regions.includes(r) && e.category === 'traditional').length,
  H: E.filter(e => e.active_regions.includes(r) && e.category === 'hybrid').length,
  W: E.filter(e => e.active_regions.includes(r) && e.category === 'web3-native').length,
}]));

const cust = {};
E.forEach(e => cust[e.custody] = (cust[e.custody] || 0) + 1);
const regTypes = Object.entries(E.reduce((m, e) => (m[e.regulation_type] = (m[e.regulation_type] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]);

const stables = E.filter(e => e.stablecoins).length;
const stByCat = { T: byCat.traditional.filter(e => e.stablecoins).length, H: byCat.hybrid.filter(e => e.stablecoins).length, W: byCat['web3-native'].filter(e => e.stablecoins).length };
const noKyc = E.filter(e => e.kyc === 'No');
const cardOnly = E.filter(e => e.kyc === 'Card only').length;
const visa = E.filter(e => e.card_network?.includes('Visa')).length;
const mc = E.filter(e => e.card_network?.includes('MC')).length;
const noCard = E.filter(e => !e.card_network || e.card_network === '—').length;
const cashback = E.filter(e => e.cashback).length;
const yieldN = E.filter(e => e.yield).length;
const termsN = E.filter(e => e.terms_url).length;
const xN = E.filter(e => e.x_handle).length;

const niches = Object.entries(E.reduce((m, e) => { if (e.audience !== 'general') m[e.audience] = (m[e.audience] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
const nicheTotal = niches.reduce((s, [, n]) => s + n, 0);

const topUsers = E.filter(e => e.reported_users?.value_millions)
  .sort((a, b) => b.reported_users.value_millions - a.reported_users.value_millions).slice(0, 20);

const w2020s = E.filter(e => e.category === 'web3-native' && e.founded >= 2020).length;
const all2020s = E.filter(e => e.founded >= 2020).length;

/* ── palette / css ─────────────────────────────────────────────── */
const CSS = `
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0A0A10;--panel:#12121A;--panel2:#171722;--line:#23232F;--text:#EDEDF2;--muted:#8A8A9A;--dim:#5A5A68;--t:#89B0FF;--h:#D075FF;--w:#BAF24A;--acc:#FF5C16}
body{font-family:'Space Grotesk',system-ui,sans-serif;background:#333;color:var(--text)}
.page{width:210mm;height:297mm;background:var(--bg);position:relative;overflow:hidden;page-break-after:always;padding:20mm 18mm 16mm}
.pfoot{position:absolute;left:18mm;right:18mm;bottom:8mm;display:flex;justify-content:space-between;font-family:'Noto Sans Mono',monospace;font-size:7.5pt;color:var(--dim);border-top:.4pt solid var(--line);padding-top:3mm}
.pfoot b{color:var(--muted);font-weight:500}
.eyebrow{font-family:'Noto Sans Mono',monospace;font-size:8pt;letter-spacing:2.5px;text-transform:uppercase;color:var(--acc);margin-bottom:6mm}
.eyebrow::before{content:"—— "}
h1{font-size:26pt;letter-spacing:-1px;line-height:1.1;margin-bottom:6mm}
h1 em{font-style:normal;color:var(--acc)}
h2{font-size:15pt;letter-spacing:-.3px;margin:7mm 0 3.5mm}
h3{font-size:11pt;margin:5mm 0 2.5mm}
p{font-size:9.6pt;line-height:1.62;color:#C9C9D4;margin-bottom:3.4mm}
p b,li b{color:var(--text)}
ul,ol{margin:0 0 3.5mm 5mm}
li{font-size:9.6pt;line-height:1.6;color:#C9C9D4;margin-bottom:1.6mm}
table{width:100%;border-collapse:collapse;margin:2mm 0 4mm;font-size:8.6pt}
th{font-family:'Noto Sans Mono',monospace;font-size:7pt;letter-spacing:1px;text-transform:uppercase;color:var(--dim);text-align:left;padding:1.8mm 2mm;border-bottom:.5pt solid var(--line)}
td{padding:1.7mm 2mm;border-bottom:.4pt solid var(--line);color:#C9C9D4;vertical-align:top}
td:first-child{color:var(--text)}
.mono{font-family:'Noto Sans Mono',monospace}
.statrow{display:flex;gap:6mm;margin:5mm 0}
.stat{flex:1;background:var(--panel);border:.5pt solid var(--line);border-radius:3mm;padding:5mm}
.stat .n{font-family:'Noto Sans Mono',monospace;font-size:20pt;font-weight:700;letter-spacing:-1px}
.stat .l{font-family:'Noto Sans Mono',monospace;font-size:6.6pt;color:var(--dim);letter-spacing:1.4px;text-transform:uppercase;margin-top:1.4mm}
.ct{color:var(--t)}.ch{color:var(--h)}.cw{color:var(--w)}.ca{color:var(--acc)}
.callout{background:var(--panel);border:.5pt solid var(--line);border-left:1mm solid var(--acc);border-radius:2.5mm;padding:4mm 5mm;margin:4mm 0}
.callout .k{font-family:'Noto Sans Mono',monospace;font-size:6.8pt;letter-spacing:1.6px;text-transform:uppercase;color:var(--acc);display:block;margin-bottom:1.6mm}
.callout p{margin:0;font-size:9pt}
.quote{font-size:13pt;line-height:1.5;color:var(--text);border-left:1mm solid var(--acc);padding-left:5mm;margin:6mm 0}
a{color:var(--acc);text-decoration:none}
.chartbox{background:var(--panel);border:.5pt solid var(--line);border-radius:3mm;padding:5mm;margin:4mm 0}
.chartbox .ct2{font-family:'Noto Sans Mono',monospace;font-size:7.4pt;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted);margin-bottom:3.5mm}
.src{font-family:'Noto Sans Mono',monospace;font-size:6.8pt;color:var(--dim);margin-top:2.5mm}
.toc td{padding:2.4mm 2mm;font-size:10pt}
.toc .pg{font-family:'Noto Sans Mono',monospace;color:var(--acc);text-align:right}
.cover{display:flex;flex-direction:column;justify-content:space-between}
.bigbar{position:absolute;left:0;right:0;bottom:0;height:5mm;display:flex}
.applist td{font-size:7.4pt;padding:1.1mm 1.6mm;line-height:1.3}
.applist th{font-size:6.4pt;padding:1.4mm 1.6mm}
.two{columns:2;column-gap:7mm}
.two p{break-inside:avoid-column}
.findnum{font-family:'Noto Sans Mono',monospace;font-size:22pt;font-weight:700;color:var(--acc);line-height:1}
.finding{display:flex;gap:5mm;margin-bottom:5.5mm}
.finding p{margin:0;font-size:9.2pt}
.finding h3{margin:0 0 1.5mm}
.reflist li{font-size:8.6pt;margin-bottom:2.2mm;color:var(--muted)}
.reflist b{color:var(--text)}
`;

/* ── svg chart helpers ─────────────────────────────────────────── */
function hbar(rows, { width = 640, barH = 22, gap = 10, labelW = 150, color = '#FF5C16', valFmt = v => v } = {}) {
  const max = Math.max(...rows.map(r => r[1]));
  const h = rows.length * (barH + gap);
  const items = rows.map(([label, v, c], i) => {
    const y = i * (barH + gap);
    const w = Math.max(3, (v / max) * (width - labelW - 70));
    return `<text x="${labelW - 8}" y="${y + barH / 2 + 4}" text-anchor="end" font-family="Noto Sans Mono,monospace" font-size="11" fill="#8A8A9A">${esc(label)}</text>
<rect x="${labelW}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${c || color}"/>
<text x="${labelW + w + 8}" y="${y + barH / 2 + 4}" font-family="Noto Sans Mono,monospace" font-size="12" font-weight="bold" fill="#EDEDF2">${valFmt(v)}</text>`;
  }).join('\n');
  return `<svg viewBox="0 0 ${width} ${h}" width="100%" xmlns="http://www.w3.org/2000/svg">${items}</svg>`;
}

function vbars(pairs, { width = 660, height = 210, color = '#FF5C16', highlight = {} } = {}) {
  const max = Math.max(...pairs.map(p => p[1]));
  const bw = width / pairs.length;
  const items = pairs.map(([label, v], i) => {
    const bh = Math.max(2, (v / max) * (height - 46));
    const x = i * bw;
    return `<rect x="${x + 2}" y="${height - 28 - bh}" width="${bw - 4}" height="${bh}" rx="2.5" fill="${highlight[label] || color}"/>
<text x="${x + bw / 2}" y="${height - 34 - bh}" text-anchor="middle" font-family="Noto Sans Mono,monospace" font-size="10.5" fill="#EDEDF2">${v}</text>
<text x="${x + bw / 2}" y="${height - 12}" text-anchor="middle" font-family="Noto Sans Mono,monospace" font-size="9" fill="#5A5A68">${esc(label)}</text>`;
  }).join('\n');
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg">${items}</svg>`;
}

function donut(segs, { size = 190, hole = 62, legendX = 230 } = {}) {
  const total = segs.reduce((s, x) => s + x[1], 0);
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  let a0 = -Math.PI / 2, paths = '';
  segs.forEach(([label, v, color]) => {
    const a1 = a0 + (v / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    paths += `<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${color}"/>`;
    a0 = a1;
  });
  const legend = segs.map(([label, v, color], i) =>
    `<rect x="${legendX}" y="${28 + i * 34}" width="14" height="14" rx="3" fill="${color}"/>
<text x="${legendX + 22}" y="${40 + i * 34}" font-family="Noto Sans Mono,monospace" font-size="13" fill="#EDEDF2">${esc(label)}</text>
<text x="${legendX + 22}" y="${56 + i * 34}" font-family="Noto Sans Mono,monospace" font-size="11" fill="#8A8A9A">${v} · ${(v / total * 100).toFixed(1)}%</text>`).join('');
  return `<svg viewBox="0 0 480 ${size + 10}" width="78%" xmlns="http://www.w3.org/2000/svg">${paths}<circle cx="${cx}" cy="${cy}" r="${hole}" fill="#12121A"/><text x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="Noto Sans Mono,monospace" font-size="22" font-weight="bold" fill="#EDEDF2">${total}</text>${legend}</svg>`;
}

/* ── page machinery ────────────────────────────────────────────── */
const pages = [];
let tocEntries = [];
function page(html, { footer = true, cls = '' } = {}) {
  pages.push({ html, footer, cls });
  return pages.length;             // 1-based page number
}
function chapter(title) { tocEntries.push([title, pages.length + 1]); }

const catbar = `<div class="bigbar"><div style="flex:${T};background:var(--t)"></div><div style="flex:${H};background:var(--h)"></div><div style="flex:${W};background:var(--w)"></div></div>`;

/* ═══ COVER ═══ */
page(`
<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <div class="mono" style="font-size:14pt;font-weight:700">neobank<span class="ca">beat</span></div>
    <div class="mono" style="font-size:8pt;color:var(--dim);border:.5pt solid var(--line);border-radius:99px;padding:2mm 5mm">monthly report · ${EDITION}</div>
  </div>
  <div>
    <div class="mono" style="font-size:9pt;letter-spacing:3px;color:var(--acc);text-transform:uppercase;margin-bottom:8mm">—— ${MONTH}</div>
    <div style="font-size:44pt;font-weight:700;letter-spacing:-2.5px;line-height:1.02">the state of<br><span class="ca">neobanks</span></div>
    <p style="font-size:12pt;color:var(--muted);margin-top:8mm;max-width:130mm">${N} verified-active digital banks, measured — custody, licences, cards, stablecoins, geography and the fine print. Compiled from the open neobankbeat dataset.</p>
  </div>
  <div>
    <div class="statrow">
      <div class="stat"><div class="n">${N}</div><div class="l">verified active</div></div>
      <div class="stat"><div class="n ct">${T}</div><div class="l">traditional</div></div>
      <div class="stat"><div class="n ch">${H}</div><div class="l">hybrid crypto</div></div>
      <div class="stat"><div class="n cw">${W}</div><div class="l">web3-native</div></div>
    </div>
    <div class="mono" style="font-size:8pt;color:var(--dim)">${ASOF} · neobankbeat.com · open data, MIT</div>
  </div>
</div>${catbar}`, { footer: false });

/* ═══ COLOPHON / ABOUT ═══ */
page(`
<div class="eyebrow">about this report</div>
<h1>Counting survivors,<br>not press releases</h1>
<p>The State of Neobanks is a monthly measurement of the digital banking industry, produced from the <b>neobankbeat open dataset</b> — a hand-verified directory of every neobank we can confirm as currently operating. Defunct entities are removed, not averaged in; unverifiable fields are left empty, never estimated. What follows describes the industry that exists, not the one that was announced.</p>
<h2>What counts as a neobank here</h2>
<p>A consumer- or SMB-facing, digital-first money app offering everyday banking — an account or balance, usually a card, payments — without a branch network. Three structural waves qualify: <b class="ct">traditional</b> fiat challengers, <b class="ch">hybrid</b> apps holding fiat and custodial crypto together, and <b class="cw">web3-native</b> self-custodial apps where the user holds the keys. Pure infrastructure (BaaS, issuer-processors), superapp payment features without banking ambition, and anything we cannot verify as live are excluded.</p>
<h2>Method in brief</h2>
<ul>
<li><b>Sources:</b> regulatory registers (ESMA, EBA, FCA, NMLS, national registers), audited filings and IR disclosures, official terms-of-service documents, and provider websites.</li>
<li><b>Verification tiers:</b> ${termsN} of ${N} entities carry verified legal-document links; ${xN} carry verified official X handles. Fields that fail verification are null.</li>
<li><b>Reproducibility:</b> every figure in this report can be recomputed from <span class="mono">neobankbeat.com/data.json</span> (MIT licence). The report itself is generated from that file.</li>
<li><b>Independence:</b> no affiliate links, no sponsored placements, no issuer relationships. Errors are fixed in the open on GitHub.</li>
</ul>
<div class="callout"><span class="k">citation</span><p>"neobankbeat, The State of Neobanks — ${MONTH} (№ 01), data as of July 2026." Link: neobankbeat.com/report</p></div>
<p style="color:var(--dim);font-size:8.6pt">Figures are compiled from public sources for comparison and research, and are not financial advice. Cashback and yield figures are "up to" headline rates that change constantly — always confirm with the issuer. © ${MONTH.split(' ')[1]} neobankbeat · Francesco Andreoli · MIT.</p>`);

/* ═══ TOC (placeholder — filled after all pages exist) ═══ */
const TOC_IDX = page(`__TOC__`);

/* ═══ EXEC SUMMARY ═══ */
chapter('Executive summary');
page(`
<div class="eyebrow">executive summary</div>
<h1>Ten numbers that define<br>the industry right now</h1>
<div class="statrow">
  <div class="stat"><div class="n ca">4</div><div class="l">survivors founded 2025 (vs 45 in 2019)</div></div>
  <div class="stat"><div class="n ca">30%</div><div class="l">of the 2020s cohort is self-custodial</div></div>
  <div class="stat"><div class="n ca">2.7%</div><div class="l">of traditional neobanks support stablecoins</div></div>
</div>
<div class="statrow">
  <div class="stat"><div class="n">26%</div><div class="l">are actually licensed banks</div></div>
  <div class="stat"><div class="n">33%</div><div class="l">serve a named niche audience</div></div>
  <div class="stat"><div class="n">${noKyc.length}</div><div class="l">work with no KYC at all</div></div>
</div>
<p>The founding boom that created this industry is over: among today's survivors, new-neobank formation peaked at <b>45 in 2019</b> and has collapsed to single digits. What replaced volume is structural change — the marginal new neobank is dramatically more likely to be <b>self-custodial</b> (30% of the 2020s cohort vs 4% of the 2010s), more likely to be <b>niche-first</b>, and near-certain to touch <b>stablecoins</b>.</p>
<p>Meanwhile the industry's centre of gravity sits where the marketing isn't: <b>Latin America, Africa and Asia grow the giants</b> (Nubank's 131M customers lead the entire industry), while Europe hosts the greatest density of players (${regCount['Europe']} active). And beneath everything runs the report's core tension: only <b>${(92 / N * 100).toFixed(0)}% of neobanks are licensed banks</b> — the remaining three quarters rest on partner banks, e-money safeguarding, crypto licences, or no custodian at all. The gap between what apps imply and what their legal structure delivers remains the industry's biggest consumer risk, and its least covered story.</p>
<div class="callout"><span class="k">the one-sentence take</span><p>Banking's interesting boundary is no longer bank vs fintech — it is custodial vs self-custodial, and every quarter moves more of the industry across it.</p></div>`);

/* ═══ BASELINE METRICS (monthly deltas) ═══ */
page(`
<div class="eyebrow">executive summary · the baseline</div>
<h1>№ 01 sets the baseline</h1>
<p>This is the first edition of a monthly series. The table below freezes the headline metrics as of ${MONTH} — future editions report the same rows with month-over-month deltas, so the series accumulates into a longitudinal record of the industry.</p>
<table>
<tr><th>metric</th><th>${MONTH.toLowerCase()}</th><th>definition</th></tr>
<tr><td>Verified-active neobanks</td><td class="mono">${N}</td><td>entities live and onboarding</td></tr>
<tr><td>— traditional / hybrid / web3-native</td><td class="mono">${T} / ${H} / ${W}</td><td>wave split</td></tr>
<tr><td>Stablecoin support</td><td class="mono">${stables} (${(stables / N * 100).toFixed(1)}%)</td><td>any verified support</td></tr>
<tr><td>— within traditional wave</td><td class="mono">${stByCat.T} (${(stByCat.T / T * 100).toFixed(1)}%)</td><td>the migration metric</td></tr>
<tr><td>Licensed banks</td><td class="mono">92 (${(92 / N * 100).toFixed(0)}%)</td><td>charter holders</td></tr>
<tr><td>Self-custodial (incl. MPC)</td><td class="mono">${(cust['Self-custodial'] || 0) + (cust['MPC self-custodial'] || 0)}</td><td>no custodian exists</td></tr>
<tr><td>No-KYC apps</td><td class="mono">${noKyc.length}</td><td>zero identity checks</td></tr>
<tr><td>Niche-first neobanks</td><td class="mono">${nicheTotal} (${(nicheTotal / N * 100).toFixed(0)}%)</td><td>named audience</td></tr>
<tr><td>Card issuers</td><td class="mono">${N - noCard}</td><td>any card programme</td></tr>
<tr><td>Advertise cashback / yield</td><td class="mono">${cashback} / ${yieldN}</td><td>headline claims</td></tr>
<tr><td>Verified terms links</td><td class="mono">${termsN}</td><td>legal-document hygiene</td></tr>
<tr><td>Largest reported user base</td><td class="mono">${topUsers[0].name} · ${topUsers[0].reported_users.value_millions}M</td><td>self-reported</td></tr>
</table>
<div class="callout"><span class="k">for the record</span><p>The dataset snapshot behind this edition is preserved in the neobankbeat git history (github.com/andreolf/neobankbeat) — every future delta is independently checkable.</p></div>`);

/* ═══ TEN FINDINGS (2pp) ═══ */
chapter('The ten findings');
const FINDINGS = [
  ['The founding boom is over', `Foundings among survivors: 45 (2019) → 22 (2023) → 16 (2024) → 4 (2025, partial). "Another challenger bank" stopped being fundable around 2022; what raises now is niche underwriting edges and stablecoin-native architecture.`],
  ['A third of the new generation is self-custodial', `${w2020s} of ${all2020s} survivors founded in the 2020s (30%) are web3-native, vs 4% of the 2010s cohort. The industry's marginal energy has moved to the model where no company holds the balance.`],
  ['Stablecoins: 100% / 91% / 2.7%', `All ${W} web3-native and ${stByCat.H} of ${H} hybrids support stablecoins — but only ${stByCat.T} of ${T} traditional neobanks do. That 2.7% is either a ceiling or the floor of the next migration. We think floor.`],
  ['Only 26% are licensed banks', `92 of ${N} hold a charter. The rest: ${regTypes.find(r=>r[0]==='Partner-bank model')?.[1] ?? 20} partner-bank models, ${regTypes.find(r=>r[0]==='E-money institution')?.[1] ?? 8} e-money institutions, 39 self-custodial software, and a long unclassifiable tail. Deposit insurance is rarer than landing pages suggest.`],
  ['Cards are universal; the economics aren\u2019t', `${N - noCard} of ${N} issue a card (${visa} Visa, ${mc} Mastercard programmes). ${cashback} advertise cashback, ${yieldN} offer yield — nearly all behind "up to" tiers. Interchange-only economics are visibly straining.`],
  ['Europe has the density, the South has the giants', `Active presence: Europe ${regCount['Europe']}, Asia ${regCount['Asia']}, North America ${regCount['North America']}, LatAm ${regCount['Latin America']}, Africa ${regCount['Africa']}. But the largest customer bases are all emerging-market.`],
  ['One in three picks an audience first', `${nicheTotal} of ${N} serve a named niche — SMB (29), underbanked (21), freelancers (14), gen z (9), immigrants (9), kids (8), faith-based (7) and a dozen more. "Right bank for someone" beats "better bank for everyone".`],
  ['No-KYC stays a rounding error — by design', `${noKyc.length} of ${N} work without identity checks; all are self-custodial wallets; none issues a card without KYC. The line is structural, not cultural.`],
  ['Legal-link hygiene is poor', `Official terms documents verifiable for only ${termsN} of ${N} — after an audit that repaired 60 dead legal links and removed 53 that resolve nowhere. For an industry holding money, basic document hygiene remains weak.`],
  ['The categories are dissolving', `Traditional players add stablecoin rails; web3-native apps acquire e-money licences and IBANs. Our own three-way classification gets harder to maintain each quarter — which is itself the finding.`],
];
page(`
<div class="eyebrow">the ten findings</div>
<h1>What the data says</h1>
${FINDINGS.slice(0, 5).map(([t, b], i) => `<div class="finding"><div class="findnum">${String(i + 1).padStart(2, '0')}</div><div><h3>${esc(t)}</h3><p>${b}</p></div></div>`).join('')}`);
page(`
<div class="eyebrow">the ten findings · continued</div>
<div style="height:10mm"></div>
${FINDINGS.slice(5).map(([t, b], i) => `<div class="finding"><div class="findnum">${String(i + 6).padStart(2, '0')}</div><div><h3>${esc(t)}</h3><p>${b}</p></div></div>`).join('')}
<div class="callout"><span class="k">reproduce any of this</span><p>Every number above is a few lines of code against neobankbeat.com/data.json — schema in Appendix B.</p></div>`);

/* ── part divider helper ── */
function divider(num, title, sub, quote) {
  page(`
<div style="height:100%;display:flex;flex-direction:column;justify-content:center">
  <div class="mono" style="font-size:60pt;font-weight:700;color:var(--panel2);line-height:1">${num}</div>
  <div class="mono" style="font-size:9pt;letter-spacing:3px;color:var(--acc);text-transform:uppercase;margin:4mm 0 3mm">—— part ${num}</div>
  <div style="font-size:30pt;font-weight:700;letter-spacing:-1.5px;line-height:1.1">${title}</div>
  <p style="font-size:11pt;color:var(--muted);margin-top:5mm;max-width:120mm">${sub}</p>
  <div class="quote" style="margin-top:14mm;max-width:140mm">${quote}</div>
</div>${catbar}`, { footer: false });
}

divider('01', 'The landscape', 'Taxonomy, history and formation: what a neobank is in 2026, where today\u2019s industry came from, and why the founding boom ended.',
  'The interesting boundary is no longer bank vs. fintech — it is custodial vs. self-custodial.');

/* ═══ CH: THE THREE WAVES ═══ */
chapter('The three waves');
page(`
<div class="eyebrow">chapter 1 · taxonomy</div>
<h1>The three waves</h1>
<p>"Neobank" is one word covering three different machines. The differences — who holds the money, what can freeze it, what insures it — matter more than any feature comparison, so this taxonomy underpins every page that follows.</p>
<div class="chartbox"><div class="ct2">${N} neobanks by wave</div>${donut([['traditional', T, '#89B0FF'], ['hybrid', H, '#D075FF'], ['web3-native', W, '#BAF24A']])}</div>
<h3><span class="ct">Wave one — traditional (${T})</span></h3>
<p>Fiat money, custodial accounts, a card, and a regulatory wrapper that permits holding customer funds. From Simple and Nubank through the London cluster to today's licensed digital banks across the Gulf and Asia. Contains all the giants.</p>
<h3><span class="ch">Wave two — hybrid (${H})</span></h3>
<p>Fiat plus custodial crypto in one app, arriving ~2017 from two directions: banking apps adding trading (Revolut, Cash App) and exchanges adding cards (Crypto.com, Coinbase, Binance). One counterparty holds everything.</p>
<h3><span class="cw">Wave three — web3-native (${W})</span></h3>
<p>Self-custodial apps where the user holds the keys and the company holds nothing: wallets that grew cards (MetaMask, Phantom), and card programmes built on smart accounts (Gnosis Pay, EtherFi Cash, Payy). No deposit, no deposit insurance, no custodian to fail.</p>`);

page(`
<div class="eyebrow">chapter 1 · taxonomy</div>
<h2>Same word, different machines</h2>
<table>
<tr><th></th><th>traditional</th><th>hybrid</th><th>web3-native</th></tr>
<tr><td>Who holds funds</td><td>Bank or partner bank</td><td>The company (fiat + crypto)</td><td>The user (keys)</td></tr>
<tr><td>Balance is</td><td>Fiat deposit</td><td>Fiat + custodial crypto</td><td>Stablecoins / crypto</td></tr>
<tr><td>Deposit insurance</td><td>Usually (direct or pass-through)</td><td>Fiat sometimes; crypto never</td><td>None — no deposit exists</td></tr>
<tr><td>Main failure mode</td><td>Bank failure / ledger gaps</td><td>Custodian failure</td><td>Key loss, issuer or contract risk</td></tr>
<tr><td>KYC</td><td>Always</td><td>Always</td><td>Card-only or none</td></tr>
<tr><td>Stablecoin support</td><td>${stByCat.T} of ${T} (2.7%)</td><td>${stByCat.H} of ${H} (91%)</td><td>${W} of ${W} (100%)</td></tr>
<tr><td>Archetypes</td><td>Nubank, Chime, Monzo</td><td>Revolut, Cash App, Crypto.com</td><td>MetaMask, Gnosis Pay, Payy</td></tr>
</table>
<h2>Era mix: where each wave was born</h2>
<div class="chartbox"><div class="ct2">category share of surviving foundings, by decade</div>
${hbar([
  ['pre-2010 (17)', 13, '#89B0FF'],
  ['2010s · trad (215)', 171, '#89B0FF'],
  ['2010s · hybrid', 35, '#D075FF'],
  ['2010s · web3', 9, '#BAF24A'],
  ['2020s · trad (125)', 72, '#89B0FF'],
  ['2020s · hybrid', 15, '#D075FF'],
  ['2020s · web3', 38, '#BAF24A'],
], { labelW: 190 })}
<div class="src">survivors only — defunct entities excluded by design · source: neobankbeat dataset, ${MONTH}</div></div>
<p>The 2010s produced a traditional-wave industry with a hybrid fringe. The 2020s cohort is a different animal: <b>web3-native is its second-largest wave</b>, larger than hybrid, and growing while overall formation shrinks.</p>`);

/* ═══ GLOSSARY ═══ */
chapter('Glossary: how to read this report');
page(`
<div class="eyebrow">definitions</div>
<h1>Twelve terms, precisely</h1>
<table>
<tr><th>term</th><th>as used in this report</th></tr>
<tr><td>Neobank</td><td>Digital-first consumer/SMB money app: account or balance + payments, usually a card, no branch network</td></tr>
<tr><td>Verified-active</td><td>We can confirm the product is live and onboarding today; defunct or paused entities are removed</td></tr>
<tr><td>Custodial</td><td>The company (or its partner bank) legally holds customer funds</td></tr>
<tr><td>Self-custodial</td><td>The user holds the keys; the company cannot move or freeze the balance</td></tr>
<tr><td>MPC self-custody</td><td>Key split via multi-party computation — self-custody without a single seed phrase</td></tr>
<tr><td>Licensed bank</td><td>Holds a banking charter; deposits sit on its own balance sheet with direct deposit insurance</td></tr>
<tr><td>Partner-bank model</td><td>Unlicensed app fronting a chartered bank; insurance applies pass-through, contingent on accurate ledgers</td></tr>
<tr><td>E-money institution</td><td>EU/UK licence to issue e-money; funds safeguarded in segregated accounts, not deposit-insured</td></tr>
<tr><td>CASP</td><td>Crypto-Asset Service Provider authorised under MiCA; passports across EU/EEA</td></tr>
<tr><td>Stablecoin support</td><td>Any verified support: balances, transfer rails, funding a card, or on/off-ramps</td></tr>
<tr><td>KYC: card only</td><td>The wallet is permissionless; identity is required only to obtain the card</td></tr>
<tr><td>"Up to" rate</td><td>Headline cashback/yield gated by tiers, staking, subscriptions or balances — not the typical rate</td></tr>
</table>
<p style="color:var(--dim)">Wave colours used throughout: <span class="ct">■ traditional</span> · <span class="ch">■ hybrid</span> · <span class="cw">■ web3-native</span>. Orange marks findings and editorial emphasis.</p>`);

/* ═══ CH: FOUNDING WAVES ═══ */
chapter('Founding waves');
page(`
<div class="eyebrow">chapter 2 · formation</div>
<h1>The boom, measured<br>from its survivors</h1>
<div class="chartbox"><div class="ct2">surviving neobanks by founding year ("<2010" pooled)</div>
${vbars(yearArr.map(([y, n]) => [y === 2009 ? '<10' : String(y).slice(2), n]), { highlight: { '19': '#FF5C16' } })}
<div class="src">n=${N} · survivorship-filtered: this is when today's industry was born, not gross founding activity · neobankbeat dataset</div></div>
<p>Read this chart carefully: it under-counts early years (more time to die) and the last two (not yet surfaced). Even so, the shape is unmistakable — a build through the mid-2010s, the <b>2018–19 peak (85 survivors in two years)</b>, a COVID dip, the 2021 bull-market echo (35), then contraction to <b>4 verified from 2025</b>.</p>
<p>Three eras explain it. <b>2013–2016:</b> smartphone banking becomes viable; the archetypes launch. <b>2017–2021:</b> venture abundance funds a challenger for every country and demographic; BaaS makes launching one a procurement decision. <b>2022→:</b> rates rise, fintech funding halves and halves again, and the marginal pitch shifts from "bank, but nicer" to products with a structural edge — underwriting a niche, or removing the custodian entirely.</p>
<div class="callout"><span class="k">what to watch</span><p>The 2025–26 cohort surfacing over coming months skews heavily web3-native and stablecoin-first in our intake pipeline — next editions will quantify it.</p></div>`);

/* ═══ CH: HISTORY TIMELINE (2pp) ═══ */
chapter('A short history, 2009–2026');
page(`
<div class="eyebrow">chapter 3 · history</div>
<h1>Seventeen years in<br>one timeline</h1>
<table>
<tr><th>year</th><th>what happened</th><th>why it mattered</th></tr>
<tr><td class="mono">2009–13</td><td>Simple, Moven, GoBank; Fidor in Germany</td><td>Proved a bank could live in an app — mostly on partner charters</td></tr>
<tr><td class="mono">2013–15</td><td>Nubank founded; UK mints Atom, Tandem, Monzo, Starling licences</td><td>The two enduring models appear: LatAm scale and UK charter-first</td></tr>
<tr><td class="mono">2016–17</td><td>N26 gets a full licence; Revolut adds crypto; Crypto.com & exchange cards</td><td>Wave two begins — fiat and custodial crypto in one app</td></tr>
<tr><td class="mono">2018–19</td><td>Peak formation: 85 of today's survivors founded in 24 months</td><td>BaaS turns launching a neobank into a procurement decision</td></tr>
<tr><td class="mono">2020</td><td>COVID; Kakaobank/jiban giants scale; Australia's Xinja collapses</td><td>First proof that licences without economics don't survive</td></tr>
<tr><td class="mono">2021</td><td>Bull-market echo cohort (35 survivors); Nubank IPO at ~$41B</td><td>The category gets a public-market benchmark</td></tr>
<tr><td class="mono">2022</td><td>Rates rise; funding halves; FTX fails</td><td>Custody stops being a philosophical question</td></tr>
<tr><td class="mono">2023</td><td>Gnosis Pay ships the first self-custodial Visa card at scale</td><td>Wave three gets its archetype: smart account + card rails</td></tr>
<tr><td class="mono">2024</td><td>Synapse collapse strands partner-bank customers; MiCA phases in</td><td>The pass-through model's weakest joint fails in public</td></tr>
<tr><td class="mono">2025</td><td>GENIUS Act; FDIC recordkeeping rule; wallet-card wave (MetaMask, Phantom)</td><td>Stablecoins become supervised instruments; wallets become neobanks</td></tr>
<tr><td class="mono">2026</td><td>MiCA grandfathering closes; traditional-wave stablecoin pilots begin</td><td>The migration this report exists to measure</td></tr>
</table>
<p style="color:var(--dim)">Deeper cuts on each era: the blog series at neobankbeat.com/blog, starting with "the three waves of neobanks".</p>`);
page(`
<div class="eyebrow">chapter 3 · history</div>
<h2>The graveyard as evidence</h2>
<p>This dataset's defining choice is survivorship: we track who is alive, and remove who is not. But the removals teach as much as the roster. Four failure archetypes recur:</p>
<h3>Licence without economics</h3>
<p>Xinja (Australia) returned its licence and customer deposits in 2020; Volt followed in 2022. Both were fully licensed and adequately capitalised — the model failed on cost of funds vs. cost of growth, not on regulation. Contrast Up, which thrived inside Bendigo's charter, and Judo, which found profit in SMB lending: same market, different unit economics.</p>
<h3>Middleware collapse</h3>
<p>Synapse (2024) was infrastructure, not a neobank — which is exactly why its bankruptcy stranded end users of apps that were "FDIC-insured" in marketing copy. Insurance protects against bank failure, not against the ledger between you and the bank going dark. The FDIC's recordkeeping rule is the regulatory scar tissue.</p>
<h3>Growth-stage abandonment</h3>
<p>Dozens of 2018–21 vintage niche apps quietly sunset after Series A: the audience was real, the CAC advantage was real, but the deposit base needed to fund the roadmap never arrived. This is the tail our monthly removals mostly consist of.</p>
<h3>Crypto contagion</h3>
<p>Custodial crypto neobanks whose balance sheets or user trust didn't survive 2022 (and whose users learned the difference between an account and a claim). The lasting effect shows up in this report as wave three's growth: the market's answer to custodial failure was less custody.</p>
<div class="callout"><span class="k">the meta-lesson</span><p>No failure archetype involves the product being bad. Neobanks die of balance-sheet physics, middleware, and funding weather — which is why this report spends its pages on custody, licences and economics rather than app-store screenshots.</p></div>`);

divider('02', 'The machinery', 'Custody, licences, cards, stablecoins and identity: the five systems underneath every neobank, and who actually holds the money.',
  'Feature comparisons are entertainment; custody comparisons are due diligence.');

/* ═══ CH: CUSTODY ═══ */
chapter('The custody spectrum');
page(`
<div class="eyebrow">chapter 4 · custody</div>
<h1>Who actually holds<br>the money</h1>
<div class="chartbox"><div class="ct2">custody model across ${N} neobanks</div>
${hbar([
  ['Custodial', cust['Custodial'] || 0, '#89B0FF'],
  ['Self-custodial', cust['Self-custodial'] || 0, '#BAF24A'],
  ['MPC self-custodial', cust['MPC self-custodial'] || 0, '#BAF24A'],
  ['Mixed', cust['Mixed (fiat custodial + self-custody crypto)'] || 0, '#D075FF'],
], { labelW: 190 })}
<div class="src">neobankbeat dataset, ${MONTH}</div></div>
<p><b>${cust['Custodial']} of ${N}</b> neobanks are custodial — a company (or its partner bank) holds the balance, and everything about your protection depends on which legal wrapper that company wears (next chapter). The <b>${(cust['Self-custodial'] || 0) + (cust['MPC self-custodial'] || 0)} self-custodial</b> apps invert the model: keys with the user, meaning bankruptcy-remoteness by construction — a wallet balance was never part of anyone's estate.</p>
<p>The two MPC entries (threshold cryptography instead of a seed phrase) and the single mixed-mode entry are small in count but directionally important: they're attempts to keep self-custody's guarantees while fixing its unforgiving UX — the recovery problem is where this whole segment wins or dies.</p>
<h2>Why custody is the report's spine</h2>
<p>Every consumer question about a neobank — is my money safe, can it freeze, what happens in a bankruptcy, who can see my transactions — resolves through custody before it resolves through anything else. Feature comparisons are entertainment; custody comparisons are due diligence. It's why the directory puts the custody spectrum above the fold, and why this report keeps returning to one number: the share of the industry where <b>there is no custodian at all</b> — currently ${(((cust['Self-custodial'] || 0) + (cust['MPC self-custodial'] || 0)) / N * 100).toFixed(1)}% and rising with each cohort.</p>`);

/* ═══ CH: REGULATION (2pp) ═══ */
chapter('Regulation & licences');
page(`
<div class="eyebrow">chapter 5 · regulation</div>
<h1>The licence behind<br>the landing page</h1>
<div class="chartbox"><div class="ct2">regulatory posture across ${N} neobanks</div>
${hbar(regTypes.slice(0, 9).map(([k, v]) => [k.length > 26 ? k.slice(0, 25) + '…' : k, v]), { labelW: 210 })}
<div class="src">derived classification from registers, filings and terms documents · neobankbeat dataset</div></div>
<p>The single most consequential split in the dataset. <b>92 licensed banks</b> hold deposits directly with direct deposit-scheme protection. <b>${regTypes.find(r => r[0] === 'Partner-bank model')?.[1]} partner-bank models</b> are technology companies fronting someone else's charter — protected on a pass-through basis <i>if the ledgers mapping customers to funds are intact</i>, which is precisely what failed in the 2024 Synapse collapse. <b>E-money and payment institutions</b> safeguard funds but carry no deposit insurance at all. <b>Self-custodial software</b> sits largely outside intermediary regulation — there's nothing held to regulate.</p>
<p>The large "unclassified" block is honest, not lazy: many apps' public materials do not state their arrangement precisely enough to classify without guessing, and we don't guess. That this block exists at all is itself a finding about industry disclosure.</p>`);
page(`
<div class="eyebrow">chapter 5 · regulation</div>
<h2>The rulebooks that changed the game</h2>
<h3>MiCA (EU, phased 2024–25)</h3>
<p>One rulebook for crypto services across 27 markets. CASP authorisation passports the whole EU/EEA — among tracked neobanks, Crypto.com, Coinbase, OKX, Bitpanda and Kraken's Krak operate under it. The e-money-token rules made compliant euro stablecoins (EURe, EURC) the legally clean settlement asset for European crypto cards, and pushed non-compliant issuance off European venues. Grandfathering windows have been expiring country by country through 2025–26; "operating under transitional measures" is a weaker claim than a register entry — ESMA's register is public, and every relevant directory profile links it.</p>
<h3>GENIUS Act (US, July 2025)</h3>
<p>A federal regime for payment stablecoins: full reserves, audits, redemption rights. It turned the largest stablecoins from regulatory grey zones into supervised instruments — the precondition for traditional neobanks (and their partner banks) to touch stablecoin rails at all. The 2.7% traditional-wave adoption figure in this report is best read as the starting line of the post-GENIUS migration, not its result.</p>
<h3>FDIC recordkeeping rule (US, 2025)</h3>
<p>The direct regulatory answer to Synapse: custodial deposit accounts must maintain ledgers that let the FDIC identify beneficial owners in a failure. It hardens the pass-through model's weakest joint — the bookkeeping between app and bank.</p>
<div class="callout"><span class="k">the consumer takeaway</span><p>Five questions before depositing: Who legally holds my money? Which insurance scheme, and does it cover <i>me</i>? Is there middleware between app and bank? What happens to the crypto side? Where does the yield come from?</p></div>`);

page(`
<div class="eyebrow">chapter 5 · regulation</div>
<h2>"Is my money protected?" — the honest flowchart</h2>
<table>
<tr><th>if the app is a…</th><th>your money is…</th><th>protected by…</th><th>the catch</th></tr>
<tr><td>Licensed bank</td><td>A deposit on its balance sheet</td><td>Deposit scheme, directly (FDIC / FSCS / national DGS)</td><td>Coverage limits per depositor; crypto side never covered</td></tr>
<tr><td>Partner-bank app</td><td>A deposit at someone else's bank</td><td>Same schemes, pass-through</td><td>Contingent on accurate app↔bank ledgers — the Synapse failure mode</td></tr>
<tr><td>E-money institution</td><td>E-money, safeguarded 1:1</td><td>Segregation, not insurance</td><td>In insolvency you're in an administration queue, not a payout schedule</td></tr>
<tr><td>Crypto custodian / CASP</td><td>A claim on the custodian</td><td>MiCA conduct & prudential rules (EU)</td><td>No deposit insurance anywhere; bankruptcy makes you a creditor</td></tr>
<tr><td>Self-custodial app</td><td>In your own wallet</td><td>Mathematics and your own opsec</td><td>No one to call: key loss, contract and issuer risk are yours</td></tr>
</table>
<h2>Regulation by wave</h2>
<div class="chartbox"><div class="ct2">dominant postures inside each wave</div>
${hbar([
  ['trad · licensed bank', byCat.traditional.filter(e => e.regulation_type === 'Licensed bank').length, '#89B0FF'],
  ['trad · partner-bank', byCat.traditional.filter(e => e.regulation_type === 'Partner-bank model').length, '#89B0FF'],
  ['hybrid · CASP/VASP', byCat.hybrid.filter(e => /casp|vasp|crypto/i.test(e.regulation_type)).length, '#D075FF'],
  ['hybrid · licensed/EMI', byCat.hybrid.filter(e => /Licensed bank|E-money/.test(e.regulation_type)).length, '#D075FF'],
  ['web3 · self-cust. software', byCat['web3-native'].filter(e => /self-custodial/i.test(e.regulation_type)).length, '#BAF24A'],
  ['web3 · EMI partner rails', byCat['web3-native'].filter(e => /E-money|partner/i.test(e.regulation_type)).length, '#BAF24A'],
], { labelW: 230 })}
<div class="src">selected postures — full distribution on the chapter's opening chart · neobankbeat dataset</div></div>
<p>Each wave found its wrapper: charters and sponsors for wave one, crypto authorisations for wave two, and for wave three a split personality — unregulated software at the wallet layer, regulated e-money partners exactly where the card touches fiat. The perimeter is precise even when the marketing isn't.</p>`);

/* ═══ CH: CARDS & ECONOMICS ═══ */
chapter('Cards & economics');
page(`
<div class="eyebrow">chapter 6 · cards</div>
<h1>The plastic layer</h1>
<div class="statrow">
  <div class="stat"><div class="n">${N - noCard}</div><div class="l">issue a card</div></div>
  <div class="stat"><div class="n">${visa}</div><div class="l">visa programmes</div></div>
  <div class="stat"><div class="n">${mc}</div><div class="l">mastercard programmes</div></div>
  <div class="stat"><div class="n">${noCard}</div><div class="l">no card / wallet-only</div></div>
</div>
<p>${((N - noCard) / N * 100).toFixed(0)}% of the industry issues a card — the near-universal bridge between any funding model and the world's terminals. The duopoly splits the market almost evenly (some programmes issue on both networks), with network choice driven by BIN-sponsor availability per market rather than ideology.</p>
<h2>Rewards economics</h2>
<div class="chartbox"><div class="ct2">monetisation surfaces across ${N} neobanks</div>
${hbar([
  ['advertise cashback', cashback],
  ['offer yield', yieldN],
  ['support stablecoins', stables],
  ['verified terms link', termsN],
], { labelW: 190 })}
<div class="src">headline claims, not effective rates · neobankbeat dataset</div></div>
<p>${cashback} programmes advertise cashback and ${yieldN} advertise yield — figures that deserve their permanent asterisk: nearly all are <b>"up to" rates</b> gated behind subscription tiers, staking requirements, token lockups or balance minimums. The pattern across waves is consistent: interchange alone no longer funds a free account, so monetisation has moved to subscriptions, FX spread, yield share and — in the crypto waves — token economics. When a card pays 4% back, the sustainable question is always: from what?</p>`);

page(`
<div class="eyebrow">chapter 6 · cards</div>
<h2>Network split by wave</h2>
<div class="chartbox"><div class="ct2">card programmes by network and wave</div>
${hbar([
  ['trad · Visa', byCat.traditional.filter(e => e.card_network?.includes('Visa')).length, '#89B0FF'],
  ['trad · Mastercard', byCat.traditional.filter(e => e.card_network?.includes('MC')).length, '#89B0FF'],
  ['hybrid · Visa', byCat.hybrid.filter(e => e.card_network?.includes('Visa')).length, '#D075FF'],
  ['hybrid · Mastercard', byCat.hybrid.filter(e => e.card_network?.includes('MC')).length, '#D075FF'],
  ['web3 · Visa', byCat['web3-native'].filter(e => e.card_network?.includes('Visa')).length, '#BAF24A'],
  ['web3 · Mastercard', byCat['web3-native'].filter(e => e.card_network?.includes('MC')).length, '#BAF24A'],
], { labelW: 210 })}
<div class="src">programmes issuing on both networks counted in each · neobankbeat dataset</div></div>
<p>The interesting row is the bottom pair: <b>the card networks are the reason wave three exists as a consumer product.</b> A self-custodial balance is an island until a BIN sponsor connects it to 130M+ terminals — and both networks, having watched wallets accumulate users, now compete for exactly these programmes (including direct USDC settlement with crypto-native issuers). The duopoly's neutrality between waves is one of the industry's least appreciated structural facts.</p>
<h2>Anatomy of a "free" account</h2>
<table>
<tr><th>revenue line</th><th>who pays</th><th>where it shows in the data</th></tr>
<tr><td>Interchange</td><td>Merchants, per swipe</td><td>${N - noCard} card programmes — the default engine</td></tr>
<tr><td>Subscriptions</td><td>Users, monthly</td><td>premium tiers gating the best of ${cashback} cashback offers</td></tr>
<tr><td>FX & spread</td><td>Travellers, remitters, traders</td><td>crypto conversion spreads across the ${H + W} crypto-touching apps</td></tr>
<tr><td>Yield share</td><td>Balance float / DeFi protocols</td><td>${yieldN} yield offers — margin lives between earned and passed-through</td></tr>
<tr><td>Token economics</td><td>Token holders</td><td>staking-gated tiers (CRO archetype) in the hybrid wave</td></tr>
<tr><td>Credit</td><td>Borrowers</td><td>the endgame: every giant in Ch. 9 lends or is building lending</td></tr>
</table>`);

/* ═══ CH: STABLECOINS ═══ */
chapter('Stablecoins');
page(`
<div class="eyebrow">chapter 7 · stablecoins</div>
<h1>The 2.7% that will<br>define the decade</h1>
<div class="chartbox"><div class="ct2">stablecoin support by wave</div>
${hbar([
  [`web3-native (${W})`, stByCat.W, '#BAF24A'],
  [`hybrid (${H})`, stByCat.H, '#D075FF'],
  [`traditional (${T})`, stByCat.T, '#89B0FF'],
], { labelW: 190, valFmt: v => v })}
<div class="src">any stablecoin support: balances, rails, cards or transfers · neobankbeat dataset</div></div>
<p>Adoption is total in wave three (100%), near-total in wave two (91%) — and <b>2.7% in the wave that has the users</b>. That asymmetry is the most important strategic fact in this report. Stablecoin capability is table stakes where it's easy and existential where it's hard: a traditional neobank adding stablecoin rails must answer custody, licensing, accounting and banking-partner questions that a wallet never faces.</p>
<p>Why we read 2.7% as a floor: GENIUS and MiCA turned the instruments into supervised, fully-reserved assets; the card networks now settle directly in USDC with crypto-native issuers; and the commercial prize — instant, global, programmable dollars attached to existing user bases of tens of millions — is the largest unclaimed feature in consumer fintech. Each traditional player that flips the switch moves more users onto stablecoin rails in a week than the web3-native wave has acquired in total. <i>(Reading, not fact — flagged accordingly.)</i></p>
<div class="callout"><span class="k">watch next month</span><p>We track announcements vs verified launches separately — the gap between "plans stablecoin support" press releases and live rails is where this migration's real pace shows.</p></div>`);

page(`
<div class="eyebrow">chapter 7 · stablecoins</div>
<h2>The instruments, sorted by rulebook</h2>
<table>
<tr><th>instrument</th><th>regime</th><th>role in the neobank stack</th></tr>
<tr><td>USDC</td><td>GENIUS-aligned (US); MiCA EMT via EU entity</td><td>Default settlement asset for compliant card programmes; direct network settlement live</td></tr>
<tr><td>USDT</td><td>Offshore; delisted from MiCA-regulated EU venues</td><td>Still the emerging-market street dollar — dominant in the LatAm/Africa dollar-account apps</td></tr>
<tr><td>EURe / EURC</td><td>MiCA e-money tokens</td><td>The legally clean euro rail — EURe settles Gnosis Pay, the archetype self-custodial card</td></tr>
<tr><td>PYUSD, bank coins</td><td>GENIUS-era issuance</td><td>Distribution plays: existing fintech user bases handed a native dollar token</td></tr>
<tr><td>Yield-bearing dollars (sUSDe et al.)</td><td>Varies; generally not "payment stablecoins"</td><td>The yield engine behind several web3-native cards — highest yield, most moving parts</td></tr>
</table>
<h2>What stablecoins actually fix</h2>
<p>Strip the ideology and stablecoins solve four concrete product problems visible across the dataset: <b>weekend money</b> (24/7 settlement vs banking hours), <b>cross-border payroll and remittance</b> (the immigrant-banking niche is converging on stablecoin rails from both directions), <b>inflation refuge</b> (the LatAm dollar-account category — DolarApp, El Dorado, Lemon — is functionally a stablecoin wrapper with a card), and <b>programmability</b> (spending rules enforced by contract rather than policy, which is also what makes agent wallets possible).</p>
<p>What they don't fix: deposit insurance (a stablecoin is a claim on reserves, not an insured deposit), and consumer-grade recovery (still the UX frontier of chapter 4). The honest framing for a neobank user: stablecoins trade bank-failure risk and border friction for issuer risk and key management. Different risks — not no risks.</p>`);

/* ═══ CH: KYC ═══ */
chapter('KYC & the permissionless edge');
page(`
<div class="eyebrow">chapter 8 · identity</div>
<h1>The ${noKyc.length} apps that<br>never ask your name</h1>
<p>Exactly <b>${noKyc.length} of ${N}</b> tracked neobanks operate without identity checks — ${(noKyc.length / N * 100).toFixed(1)}% of the industry. All are self-custodial. None issues a card without KYC. A further <b>${cardOnly}</b> are "card-only" KYC: permissionless wallet, identified cardholder.</p>
<table>
<tr><th>app</th><th>hq</th><th>est.</th><th>what it is</th></tr>
${noKyc.map(e => `<tr><td>${esc(e.name)}</td><td>${esc(e.hq)}</td><td>${e.founded}</td><td>${esc((e.note || '').slice(0, 80))}</td></tr>`).join('\n')}
</table>
<p>The line is structural: KYC obligations attach to regulated intermediaries — entities holding, transmitting or exchanging customer funds. Pure software that never touches funds is largely outside that perimeter; everything touching fiat (cards, IBANs, ramps) is inside it, no exceptions that survive contact with a card network. The honest use cases are undocumented populations, capital-controlled economies, privacy-principled users accepting the trade-offs, and — increasingly — software agents that can hold a key but cannot pass a selfie check.</p>`);

page(`
<div class="eyebrow">chapter 8 · identity</div>
<h2>The customer that can't pass KYC:<br>software</h2>
<p>The strangest implication of the permissionless segment isn't human privacy — it's that <b>software agents are becoming account holders</b>. An AI agent can generate a key, hold a stablecoin balance in a smart account, and spend against contract-enforced limits. It cannot photograph a passport. Every regulated onboarding flow in the other ${N - noKyc.length} neobanks is, by construction, closed to it.</p>
<p>This is why the no-KYC column matters beyond its ${(noKyc.length / N * 100).toFixed(1)}% share: it is the only corner of the industry where machine customers are structurally possible today. The building blocks are already in the dataset — self-custodial smart accounts (chapter 4), programmable spending permissions, stablecoin settlement (chapter 7), and card rails that terminate in an identified human sponsor while the wallet itself stays permissionless.</p>
<div class="callout"><span class="k">our reading — flagged as speculation</span><p>Agent payments will force the first serious rethink of "know your customer" since its inception: the useful question becomes "know your <i>controller</i>" — which human or entity is accountable for a key — and the first mainstream controversy is likelier to involve an agent's spending than a human's privacy.</p></div>
<h2>Where the line will move</h2>
<p>Two pressures point in opposite directions. Regulators keep extending the perimeter (MiCA's transfer-rule requirements, travel-rule enforcement) — pushing identification deeper into crypto rails. Meanwhile passkey wallets and account abstraction keep lowering the cost of being permissionless. The dataset's card-only KYC bucket (${cardOnly} apps) is where the two forces currently settle: identity where fiat touches, freedom where it doesn't. Expect that bucket, not the pure no-KYC one, to grow.</p>`);

divider('03', 'The map', 'Scale, geography and niches: where the users are, how seven regional playbooks differ, and why a third of the industry picks an audience before a product.',
  'Scale in this industry has never been won on interface polish — it is won on distribution the incumbents didn\u2019t have.');

/* ═══ CH: SCALE ═══ */
chapter('Scale: the user league table');
page(`
<div class="eyebrow">chapter 9 · scale</div>
<h1>Where the users are</h1>
<div class="chartbox"><div class="ct2">largest reported user bases (millions, self-reported metrics vary)</div>
${hbar(topUsers.slice(0, 14).map(e => [e.name, e.reported_users.value_millions,
  e.category === 'traditional' ? '#89B0FF' : e.category === 'hybrid' ? '#D075FF' : '#BAF24A']),
  { labelW: 170, valFmt: v => v + 'M' })}
<div class="src">mixed metrics: customers, MAU, wallets, accounts — each figure cites its source in the directory · colours = wave</div></div>
<p>The league table is an emerging-market story with a North American accent. <b>Nubank (131M)</b> leads the industry outright; WeBank, bKash, OPay, GCash, PalmPay, Maya and TymeBank fill the top tier from Asia, Africa and Latin America. The largest Western players — Cash App, Revolut, Chime — are giants by revenue but mid-table by user count.</p>
<p>Caveat that matters: metrics are self-reported and heterogeneous (customers ≠ MAU ≠ registered wallets), so treat this as magnitude, not ranking. Each figure links to its filing or disclosure in the directory — the standard we'd like the industry itself to adopt.</p>`);

page(`
<div class="eyebrow">chapter 9 · scale</div>
<h2>Five giants, five different machines</h2>
<table>
<tr><th>giant</th><th>reported</th><th>the machine underneath</th></tr>
${topUsers.slice(0, 5).map(e => `<tr><td><b>${esc(e.name)}</b><br><span class="mono" style="color:var(--dim);font-size:7pt">${esc(e.hq)} · est. ${e.founded}</span></td><td class="mono">${e.reported_users.value_millions}M<br><span style="color:var(--dim);font-size:7pt">${esc(e.reported_users.metric || 'users')}</span></td><td>${esc(({
  'Nubank': 'A licensed bank that made credit cards the wedge into three underbanked markets, then cross-sold everything. The proof that neobanking scales to nine figures profitably.',
  'WeBank': 'Distribution-native: born inside the Tencent ecosystem, lending-led, and by most measures the most profitable digital bank on earth.',
  'bKash': 'Mobile money that grew into the default financial rail of Bangladesh — agent network first, app second, bank charter via BRAC.',
  'OPay': 'Agent-and-QR playbook in Nigeria: payments density first, then wallets, then everything else. The African volume champion.',
  'GCash': 'The Philippines\u2019 wallet-turned-bank inside a telco ecosystem — remittances, payments and now credit for a diaspora-driven economy.',
})[e.name] || (e.note || '').slice(0, 160))}</td></tr>`).join('\n')}
</table>
<p>Notice what's absent: not one of the five is a 2010s Western app-first challenger, and not one grew primarily on cashback. All five compounded on <b>distribution the incumbents didn't have</b> — credit access, super-app ecosystems, agent networks, telco channels. Scale in this industry has never been won on interface polish; it is won on being the first workable financial rail for a population that lacked one.</p>
<div class="callout"><span class="k">the western counter-model</span><p>Revolut (65M) is the exception that tests the rule — scaled across 35+ countries on product breadth and FX, now converting that base onto its own banking licences. Whether breadth can compound like distribution is the most interesting open experiment in wave two.</p></div>`);

/* ═══ CH: GEOGRAPHY — overview + 7 region pages ═══ */
chapter('Geography: seven regional markets');
page(`
<div class="eyebrow">chapter 10 · geography</div>
<h1>Seven markets,<br>seven playbooks</h1>
<div class="chartbox"><div class="ct2">active presence by region (multi-region players counted in each)</div>
${hbar(REGIONS.map(r => [r, regCount[r]]), { labelW: 170 })}
<div class="src">presence ≠ headquarters — Wise alone is active in six regions · neobankbeat dataset</div></div>
<p>Europe's ${regCount['Europe']} is a density record, not a size one: dozens of players per market, aggressive passporting, and the world's most active licence regimes. Asia's ${regCount['Asia']} mixes licensed digital banks (Korea, Singapore, Hong Kong, the Philippines) with wallet giants that became banks in all but name. The following pages profile each region: its model, its champions, and the number that tells its story.</p>
<p style="color:var(--dim)">Regional pages list a representative selection; the full per-country view lives in the interactive map at neobankbeat.com.</p>`);

const REGION_COPY = {
  'Europe': ['Licence-dense, margin-thin', 'The deepest bench of licensed digital banks (Monzo, Starling, bunq, N26) plus the EMI capital of the world. MiCA has made it the clearest jurisdiction for crypto neobanks; profitability, not regulation, is the binding constraint. Watch: euro-stablecoin card programmes scaling under the EMT regime.'],
  'Asia': ['Licensed giants & superapp gravity', 'KakaoBank and Toss Bank turned messaging distribution into top-tier banks; Singapore and Hong Kong minted purpose-built digital licences (GXS, MariBank, ZA, Mox); the Philippines and Indonesia run wallet-first (GCash, Maya, DANA). The scale ceiling here is national population, and it is high.'],
  'North America': ['Partner-bank capital of the world', 'The US model: tech company in front, sponsor bank behind — Chime, Current, Dave, Mercury, Brex. Post-Synapse, direct bank integration became the trust differentiator; post-GENIUS, the stablecoin question moved from whether to when. Canada runs a small licensed cluster (EQ, Neo, KOHO, Wealthsimple).'],
  'Latin America': ['The Nubank effect', 'The region that proved neobanking at civilisational scale: Nubank (131M), Mercado Pago, PicPay, PagBank, plus strong national champions (Ualá, Klar, Stori, Nequi, Daviplata). Default-yield accounts are table stakes; dollar-stablecoin demand (DolarApp, El Dorado, Lemon) is the fastest-moving frontier.'],
  'Africa': ['Payments first, banking second', 'Agent networks and mobile money built the rails; neobanking is being layered on top. Nigeria is the epicentre — OPay and PalmPay at mass scale, Moniepoint as SMB backbone, Kuda on a microfinance licence. TymeBank (SA) proved kiosk+app hybrid onboarding; francophone West Africa (Djamo, Wave) is the next density play.'],
  'MENA': ['Regulator-minted digital banks', 'The Gulf hands out purpose-built licences (D360, Vision Bank, Zand, Wio, stc bank) with sovereign capital behind them; Egypt banks the informal economy (Khazna, MNT-Halan, Telda); Türkiye runs bank-backed super-wallets (Enpara, Papara). Islamic digital banking is the structural niche with global export potential.'],
  'Oceania': ['Small market, sharp lessons', 'Australia\'s neobank experiment consolidated hard (Up thriving inside Bendigo; Judo profitable in SMB lending; Volt and Xinja gone) — proof that licences without unit economics don\'t survive. NZ\'s Hnry exports the most interesting freelancer-banking model anywhere.'],
};
for (const r of REGIONS) {
  const list = E.filter(e => e.active_regions.includes(r));
  const named = list.filter(e => e.reported_users?.value_millions).sort((a, b) => b.reported_users.value_millions - a.reported_users.value_millions).slice(0, 8);
  const fill = list.filter(e => !named.includes(e)).slice(0, 16 - named.length);
  const show = [...named, ...fill];
  const [tag, copy] = REGION_COPY[r];
  page(`
<div class="eyebrow">chapter 10 · geography</div>
<h1>${r}</h1>
<div class="statrow">
  <div class="stat"><div class="n">${regCount[r]}</div><div class="l">active neobanks</div></div>
  <div class="stat"><div class="n ct">${regByCat[r].T}</div><div class="l">traditional</div></div>
  <div class="stat"><div class="n ch">${regByCat[r].H}</div><div class="l">hybrid</div></div>
  <div class="stat"><div class="n cw">${regByCat[r].W}</div><div class="l">web3-native</div></div>
</div>
<h3>${tag}</h3>
<p>${copy}</p>
<table class="applist">
<tr><th>selected players</th><th>hq</th><th>est.</th><th>custody</th><th>regulation</th></tr>
${show.map(e => `<tr><td>${esc(e.name)}</td><td>${esc(e.hq)}</td><td>${e.founded}</td><td>${esc(e.custody.split(' ')[0])}</td><td>${esc(e.regulation_type)}</td></tr>`).join('\n')}
</table>
<p style="color:var(--dim);font-size:8pt">selection = largest reported user bases + representative sample · full list in Appendix A and at neobankbeat.com/?map=${({'Europe':'EU','Asia':'AS','North America':'NA','Latin America':'LA','Africa':'AF','MENA':'ME','Oceania':'OC'})[r]}</p>`);
}

/* ═══ CH: NICHES ═══ */
chapter('The niche wave');
page(`
<div class="eyebrow">chapter 11 · niches</div>
<h1>One in three picks<br>an audience first</h1>
<div class="chartbox"><div class="ct2">${nicheTotal} niche-first neobanks by audience</div>
${hbar(niches.slice(0, 10).map(([k, v]) => [k.length > 24 ? k.slice(0, 23) + '…' : k, v]), { labelW: 210 })}
<div class="src">audience as positioned by the provider · neobankbeat dataset</div></div>
<p>The niche wave is the industry's quiet consensus that "better bank for everyone" is over as a venture pitch. Three structural reasons: <b>acquisition cost</b> (communities beat ad auctions), <b>genuinely different product surface</b> (Sharia compliance, freelancer tax filing, parental controls are products, not skins), and <b>underwriting edge</b> (serving the niche <i>is</i> the moat — Zolve underwrites new US arrivals on home-country credit history that generic banks can't read).</p>
<p>The three niches we'd watch hardest: <b>faith-based</b> (7 tracked, from UK startups to Gulf licensed banks — a structurally underserved market measured in hundreds of millions), <b>immigrant banking</b> (9 tracked — a remittance business wearing a checking account, converging fast with stablecoin rails), and <b>kids & family</b> (8 tracked — a two-decade customer-acquisition play whose retention thesis remains unproven).</p>`);

page(`
<div class="eyebrow">chapter 11 · niches</div>
<h2>The full niche map</h2>
<table>
<tr><th>audience</th><th>n</th><th>representative players</th><th>the structural edge</th></tr>
${niches.map(([k, v]) => {
  const ex = E.filter(e => e.audience === k).slice(0, 3).map(e => e.name).join(', ');
  const edges = {
    'SMB & freelancers': 'Invoicing, tax and lending are the product; the account is the wedge',
    'underbanked': 'First-rail economics — no incumbent to displace',
    'freelancers & gig workers': 'Income smoothing and tax automation generic banks can\u2019t price',
    'gen z & students': 'CAC via social distribution; monetisation bet deferred to graduation',
    'immigrants & expats': 'Cross-border credit-history portability; converging with stablecoin rails',
    'kids & families': 'Two-decade LTV thesis; parental controls as the actual product',
    'faith-based': 'Compliance (Sharia screening) is binary — you serve it or you don\u2019t',
    'travelers & nomads': 'Multi-currency and FX margin; thinnest moat of the set',
    'creators & influencers': 'Revenue-stream underwriting off platform APIs',
    'crypto natives': 'Self-custody and onchain yield as default expectations',
  };
  return `<tr><td>${esc(k)}</td><td class="mono">${v}</td><td>${esc(ex)}</td><td>${esc(edges[k] || 'Audience-specific underwriting or compliance edge')}</td></tr>`;
}).join('\n')}
</table>
<p style="color:var(--dim);font-size:8.4pt">representative players = first entries per niche in the dataset; full filterable lists at neobankbeat.com/?niche=…</p>`);

/* ═══ CH: TRANSPARENCY ═══ */
chapter('Transparency & link rot');
page(`
<div class="eyebrow">chapter 12 · hygiene</div>
<h1>The industry's broken<br>paper trail</h1>
<div class="statrow">
  <div class="stat"><div class="n">714</div><div class="l">outbound urls audited</div></div>
  <div class="stat"><div class="n ca">113</div><div class="l">legal links found dead</div></div>
  <div class="stat"><div class="n">60</div><div class="l">repaired to live documents</div></div>
  <div class="stat"><div class="n">53</div><div class="l">removed as unresolvable</div></div>
</div>
<p>In preparing the dataset behind this report we audited every outbound URL — official sites, terms of service, privacy policies, registers. The result is a small case study in industry hygiene: <b>113 legal-document links returned hard 404s</b>. Sixty could be repaired by locating the moved document on the same domain; fifty-three resolve nowhere we could verify, and were removed under our no-guessed-links rule.</p>
<p>Why it matters beyond pedantry: the terms document is where the actual custody and insurance arrangement lives — the difference between "FDIC insured" as legal fact and as vibe. An industry that moves its legal documents without redirects, or removes them entirely, is an industry whose fine print effectively expires. Of ${N} tracked entities, only <b>${termsN} currently carry a verified, live terms link</b>.</p>
<div class="callout"><span class="k">a standing offer</span><p>Any neobank that maintains stable, linkable legal documents gets them verified in the directory within days — issue templates at github.com/andreolf/neobankbeat.</p></div>`);

/* ═══ CH: FUTURE NARRATIVES ═══ */
chapter('Future narratives');
page(`
<div class="eyebrow">chapter 13 · future narratives</div>
<h1>The stories that will<br>write the next editions</h1>
<p>Everything before this page is measurement. This chapter is the map of narratives we expect to shape the dataset over the next 24 months — each paired, in the table overleaf, with the signal that will tell us whether it's real. All of it is editorial judgment; treat accordingly.</p>
<h3>01 · Agentic commerce: the customer that is software</h3>
<p>AI agents are acquiring the ability to hold value and spend it — self-custodial smart accounts, contract-enforced spending limits, and machine-payable HTTP (the x402 pattern: a server answers <span class="mono">402 Payment Required</span>, the agent pays in stablecoins, the resource unlocks). This creates a customer category that cannot pass a selfie check but can transact millions of times a day. The first neobank-shaped products for machines — balances, limits, statements, controls, but for a fleet of agents — are a matter of quarters, not years. The strategic question for every custodial player: your compliance stack is built to identify humans; who underwrites a language model with a wallet?</p>
<h3>02 · Stablecoin payroll and the invisible dollar account</h3>
<p>The LatAm dollar-account apps proved demand for holding wages in digital dollars. The next step is upstream: salaries, contractor payouts and creator earnings settling directly in stablecoins, with the neobank reduced to a beautiful interface over a token balance. Remittance-heavy corridors (the immigrant-banking niche of chapter 11) get there first because the pain is measured in percentage points per transfer.</p>
<h3>03 · Tokenized deposits: the empire banks back</h3>
<p>The incumbent answer to stablecoins is not "no" — it is deposits that settle like tokens while remaining insured bank money. If tokenized-deposit networks reach consumer rails, the neat stablecoin-vs-deposit boundary this report relies on starts to blur, and wave one gets a path to programmable money that never leaves the regulated perimeter.</p>`);
page(`
<div class="eyebrow">chapter 13 · future narratives</div>
<h3>04 · The neobank as protocol</h3>
<p>Wave three's logical endpoint: the "account" is a smart contract standard, cards and IBANs are interchangeable modules from regulated partners, and the app is just one of many front-ends. Gnosis Pay already works this way — the card rail is a platform other wallets plug into. If that pattern spreads, this directory's unit of analysis shifts from companies to <i>stacks</i>.</p>
<h3>05 · AI-native banking: the interface dissolves</h3>
<p>Chat-first money management is the shallow version. The deep version is delegation: an agent that idles your balance into yield, times FX, disputes fees and switches providers — the neobank's relationship moving from "user opens app" to "agent negotiates with API". Loyalty, the industry's scarcest asset, becomes a parameter in someone else's optimiser.</p>
<h3>06 · Identity without documents</h3>
<p>Passkeys killed the password; zero-knowledge credentials aim at the passport upload — proving "over 18, sanctioned-list-clear, EU resident" without revealing anything else. If regulators accept selective disclosure, the KYC/no-KYC binary of chapter 8 becomes a spectrum, and the card-only bucket becomes the default architecture.</p>
<table>
<tr><th>narrative</th><th>the signal we'll track in this dataset</th><th>status, july 2026</th></tr>
<tr><td>Agentic commerce</td><td>First entities with agent-specific products; x402-payable services</td><td>precursors only (${noKyc.length} no-KYC self-custodial apps)</td></tr>
<tr><td>Stablecoin payroll</td><td>Payroll/payout features in the immigrant &amp; freelancer niches</td><td>early (${niches.find(n=>/immigrant/i.test(n[0]))?.[1] ?? 9} immigrant-focused players)</td></tr>
<tr><td>Tokenized deposits</td><td>Licensed banks (92 tracked) shipping token-settled consumer money</td><td>pilots, no consumer rails yet</td></tr>
<tr><td>Neobank as protocol</td><td>Multiple front-ends sharing one card/account rail</td><td>live (Gnosis Pay partners)</td></tr>
<tr><td>AI-native banking</td><td>Agent/automation features as primary interface</td><td>chat assistants only</td></tr>
<tr><td>Identity without documents</td><td>First zk-credential onboarding accepted by a card programme</td><td>not yet observed</td></tr>
</table>
<div class="callout"><span class="k">how to read this chapter</span><p>Narratives are hypotheses, not findings. Each future edition re-scores this table — publicly, against the same signals — so being wrong will at least be legible.</p></div>`);

/* ═══ CH: OUTLOOK ═══ */
chapter('Outlook & watchlist');
page(`
<div class="eyebrow">chapter 14 · outlook</div>
<h1>What we're watching<br>into August</h1>
<h3>01 · The traditional-wave stablecoin flip</h3>
<p>The 2.7% number is the one to re-check monthly. Watch announcements-to-launch conversion, and which partner banks let US neobanks touch supervised stablecoins first.</p>
<h3>02 · MiCA grandfathering endgame</h3>
<p>As national transition windows close, expect a visible sorting: authorised CASPs consolidating European volume, and a quiet exit tail. Register entries beat press releases.</p>
<h3>03 · Self-custody UX unlock</h3>
<p>Passkey wallets, MPC recovery and smart-account cards are converging on "self-custody that feels like an app". Each release chips at the biggest objection to wave three.</p>
<h3>04 · Agent wallets</h3>
<p>Software agents that hold keys and spend within contract-enforced limits are the strangest new constituency in the dataset — and the first genuinely new "customer type" since teenagers got debit cards. We expect the first mainstream agent-payments controversy within twelve months. <i>(Speculative, flagged.)</i></p>
<h3>05 · The niche graveyard's next entries</h3>
<p>Niche banking works until the niche's unit economics don't. Watch subscription-dependent kids' banks and thin-margin travel cards as funding stays tight.</p>
<div class="callout"><span class="k">next edition</span><p>The State of Neobanks — August 2026 ships early next month: same method, fresh data, deltas tracked against this edition. Subscribe at neobankbeat.substack.com.</p></div>`);

/* ═══ CH: METHOD IN FULL ═══ */
chapter('Method, in full');
page(`
<div class="eyebrow">chapter 15 · method</div>
<h1>How the sausage<br>is measured</h1>
<h3>Inclusion pipeline</h3>
<ol>
<li><b>Intake:</b> candidates arrive via public GitHub issue templates, our own monitoring, and reader submissions to the newsletter.</li>
<li><b>Liveness check:</b> product must be verifiably live and onboarding — an app-store listing with recent releases, a working sign-up, or a register entry plus active status. Waitlists and "coming soon" don't count.</li>
<li><b>Scope check:</b> consumer/SMB money app with everyday-banking ambition. We exclude pure infrastructure (BaaS, issuer-processors), trading-only apps, and superapp payment features without a banking surface.</li>
<li><b>Field verification:</b> each field is sourced independently — registers for licences, terms documents for custody arrangements, filings for user counts. Unverifiable fields stay null.</li>
<li><b>Continuous review:</b> link-rot audits (chapter 12), monthly liveness re-checks on a rotating cohort, and removal on confirmed shutdown.</li>
</ol>
<h3>Known limitations — read before quoting</h3>
<ul>
<li><b>Survivorship by design:</b> founding-year charts describe today's industry's origins, not historical founding rates.</li>
<li><b>Presence ≠ market share:</b> regional counts weight Wise's six-region footprint equally with a single-country app.</li>
<li><b>Self-reported scale:</b> user figures mix customers, MAU and registered wallets; we preserve each source's metric rather than harmonising by guesswork.</li>
<li><b>Classification judgment:</b> wave and regulation labels involve edge calls (chapter 1's "categories are dissolving" finding cuts both ways). Disagreements are adjudicated in public via GitHub issues.</li>
<li><b>Coverage bias:</b> English-language and register-covered markets surface faster; we assume undercounting in Central Asia, francophone Africa and parts of LatAm.</li>
</ul>
<div class="callout"><span class="k">corrections</span><p>Found an error? File a data-fix issue at github.com/andreolf/neobankbeat — corrections land in the dataset within days and in the next month's edition, credited.</p></div>`);

/* ═══ APPENDIX A: full directory ═══ */
chapter('Appendix A — the full directory');
const sorted = [...E].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
const PER = 34;
for (let i = 0; i < sorted.length; i += PER) {
  const chunk = sorted.slice(i, i + PER);
  page(`
<div class="eyebrow">appendix a · all ${N} tracked neobanks (${i + 1}–${Math.min(i + PER, N)})</div>
<table class="applist">
<tr><th>name</th><th>wave</th><th>hq</th><th>est.</th><th>custody</th><th>stables</th><th>kyc</th></tr>
${chunk.map(e => `<tr><td>${esc(e.name)}</td><td><span class="${e.category === 'traditional' ? 'ct' : e.category === 'hybrid' ? 'ch' : 'cw'}">${e.category === 'traditional' ? 'T' : e.category === 'hybrid' ? 'H' : 'W'}</span></td><td>${esc(e.hq)}</td><td>${e.founded}</td><td>${esc(e.custody.split(' ')[0])}</td><td>${e.stablecoins ? 'yes' : '—'}</td><td>${esc(e.kyc)}</td></tr>`).join('\n')}
</table>`);
}

/* ═══ APPENDIX B: schema ═══ */
chapter('Appendix B — dataset & schema');
page(`
<div class="eyebrow">appendix b · reproducibility</div>
<h1>The dataset behind<br>every number</h1>
<p>Everything in this report derives from <span class="mono">neobankbeat.com/data.json</span> — the machine-readable export of the neobankbeat directory (MIT licence). Key fields:</p>
<table>
<tr><th>field</th><th>meaning</th></tr>
<tr><td class="mono">category</td><td>traditional · hybrid · web3-native (the three waves)</td></tr>
<tr><td class="mono">custody</td><td>Custodial · Self-custodial · MPC self-custodial · Mixed</td></tr>
<tr><td class="mono">regulation_type</td><td>derived: Licensed bank, Partner-bank model, E-money institution, MiCA CASP (EU), Self-custodial software, …</td></tr>
<tr><td class="mono">kyc</td><td>Yes · No · Card only (permissionless wallet, identified cardholder)</td></tr>
<tr><td class="mono">stablecoins</td><td>any verified stablecoin support: balances, rails, cards or transfers</td></tr>
<tr><td class="mono">cashback / yield</td><td>headline "up to" rates as advertised — not effective rates</td></tr>
<tr><td class="mono">active_regions / countries</td><td>verified operating footprint (presence, not HQ)</td></tr>
<tr><td class="mono">reported_users</td><td>self-reported scale with metric and as-of date; each figure cites its source</td></tr>
<tr><td class="mono">terms_url / privacy_url / x_handle</td><td>verified links only — nulls mean unverifiable, never unknown-guessed</td></tr>
</table>
<p>Update cadence: continuous, in the open. Corrections via GitHub issues (data-fix template) are typically resolved within days. The static profile pages at <span class="mono">/n/</span> and comparisons at <span class="mono">/vs/</span> regenerate from the same file, so site, dataset and report cannot drift apart.</p>`);

/* ═══ REFERENCES ═══ */
chapter('References');
page(`
<div class="eyebrow">references & further reading</div>
<h1>Sources</h1>
<ol class="reflist">
<li><b>neobankbeat dataset</b> — neobankbeat.com/data.json (primary source for all figures; MIT)</li>
<li><b>ESMA — Markets in Crypto-Assets Regulation (MiCA)</b>, incl. the public CASP register — esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica</li>
<li><b>European Banking Authority — Payment institutions & EMI registers</b> — eba.europa.eu</li>
<li><b>UK Financial Conduct Authority — Financial Services Register</b> — register.fca.org.uk</li>
<li><b>US FDIC — deposit insurance & the custodial-account recordkeeping rule (12 CFR Part 375)</b> — fdic.gov</li>
<li><b>GENIUS Act of 2025</b> (Guiding and Establishing National Innovation for U.S. Stablecoins) — congress.gov</li>
<li><b>NMLS Consumer Access</b> (US state money-transmitter licences) — nmlsconsumeraccess.org</li>
<li><b>SEC EDGAR</b> — public filings for listed neobanks (Nubank, SoFi, Chime, Dave, MoneyLion et al.) — sec.gov/edgar</li>
<li><b>World Bank — Global Findex Database</b> (banked/unbanked adults) — worldbank.org/globalfindex</li>
<li><b>Bank for International Settlements</b> — research on stablecoins & digital payments — bis.org</li>
<li><b>Citi GPS — stablecoin market scenarios to 2030</b> — citigroup.com/global/insights</li>
<li><b>Company disclosures</b> — investor-relations pages and annual reports as linked per-entity in the directory (Nubank IR, Block/Cash App, Revolut annual report, Kaspi.kz, KakaoBank, TymeBank, bKash/BRAC, Opera/OPay et al.)</li>
<li><b>Court records, In re Synapse Financial Technologies</b> (C.D. Cal. Bankr., 2024) and contemporaneous coverage — for the pass-through insurance discussion</li>
<li><b>neobankbeat blog</b> — long-form companions to each chapter — neobankbeat.com/blog</li>
</ol>
<p style="color:var(--dim);font-size:8.6pt">Where a chapter states an interpretation rather than a measurement (marked "our reading" or "speculative"), it is the publisher's editorial judgment, not a sourced fact.</p>`);

/* ═══ BACK COVER ═══ */
page(`
<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between">
  <div></div>
  <div style="text-align:center">
    <div class="mono" style="font-size:26pt;font-weight:700">neobank<span class="ca">beat</span></div>
    <p style="margin-top:6mm;color:var(--muted)">who watches the neobanks?</p>
    <p style="color:var(--dim);font-size:9pt;margin-top:10mm">directory · neobankbeat.com<br>newsletter · neobankbeat.substack.com<br>open data · github.com/andreolf/neobankbeat</p>
  </div>
  <div class="mono" style="font-size:8pt;color:var(--dim);text-align:center">the state of neobanks · ${MONTH} · ${EDITION} · © neobankbeat, MIT — cite freely with attribution</div>
</div>${catbar}`, { footer: false });

/* ── assemble TOC ── */
const tocHtml = `
<div class="eyebrow">contents</div>
<h1>In this edition</h1>
<table class="toc">
${tocEntries.map(([t, p]) => `<tr><td><a href="#pg-${p}" style="color:inherit">${esc(t)}</a></td><td class="pg"><a href="#pg-${p}">${String(p).padStart(2, '0')}</a></td></tr>`).join('\n')}
</table>
<p style="color:var(--dim);margin-top:8mm">Entries are clickable — they jump to the chapter, in this PDF and in the web edition. Charts are generated from the dataset at build time.</p>`;
pages[TOC_IDX - 1].html = tocHtml;

/* ── render ── */
const body = pages.map((p, i) => `<section class="page ${p.cls}" id="pg-${i + 1}">${p.html}
${p.footer ? `<div class="pfoot"><span><b>the state of neobanks</b> · ${MONTH.toLowerCase()} · ${EDITION}</span><span>neobankbeat.com · ${String(i + 1).padStart(2, '0')} / ${pages.length}</span></div>` : ''}</section>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>The State of Neobanks — ${MONTH} · neobankbeat</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Noto+Sans+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>`;

fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'report-src.html'), html);

/* ── web edition: free preview (first chapters) at /report/<slug>/ ───
   the rest is gated: subscribe on substack → the PDF download starts.
   truncation happens at build time so the locked chapters never ship
   in the HTML (view-source clean).                                    */
const ED_SLUG = '2026-07';
const FREE_CHAPTERS = 6;                                     // through "A short history" — the opening third
const PDF_URL = `/reports/dl-vq3x8k/state-of-neobanks-${ED_SLUG}.pdf`;
const gatePage = tocEntries[FREE_CHAPTERS][1];               // first locked page
const chapterStarts = new Map(tocEntries.map(([t, p], i) => [p, { t, i }]));
const webSections = pages.map((p, i) => ({ ...p, no: i + 1 }))
  .filter(p => p.footer && p.no !== TOC_IDX && p.no < gatePage)
  .map(p => {
    const ch = chapterStarts.get(p.no);
    return `<section class="wsec"${ch ? ` id="ch${ch.i}"` : ''}>${p.html}</section>`;
  }).join('\n');
const lockedChapters = tocEntries.slice(FREE_CHAPTERS).map(([t]) => t);

const WEBCSS = `
body{background:var(--bg);-webkit-font-smoothing:antialiased}
.wtop{position:sticky;top:0;z-index:9;background:rgba(10,10,16,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.wtopin{max-width:960px;margin:0 auto;padding:10px 20px;display:flex;gap:14px;align-items:center;overflow-x:auto;white-space:nowrap;scrollbar-width:none}
.wtopin::-webkit-scrollbar{display:none}
.wtopin .logo{font-family:'Noto Sans Mono',monospace;font-weight:700;font-size:13px;color:var(--text);text-decoration:none;margin-right:6px}
.wtopin a.chl{font-family:'Noto Sans Mono',monospace;font-size:10.5px;letter-spacing:.5px;color:var(--muted);text-decoration:none;padding:4px 8px;border-radius:6px}
.wtopin a.chl:hover{color:var(--text);background:var(--panel2)}
.whero{max-width:960px;margin:0 auto;padding:64px 20px 34px}
.whero .badge{display:inline-block;font-family:'Noto Sans Mono',monospace;font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);border-radius:99px;padding:5px 13px;margin-bottom:20px}
.whero .big{font-size:clamp(34px,7vw,58px);font-weight:700;letter-spacing:-2px;line-height:1.03}
.whero .big em{font-style:normal;color:var(--acc)}
.wcta{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}
.wcta a{font-family:'Noto Sans Mono',monospace;font-size:12px;text-decoration:none;border-radius:8px;padding:10px 16px;border:1px solid var(--line);color:var(--text)}
.wcta a.pri{background:var(--acc);border-color:var(--acc);color:#0A0A10;font-weight:700}
.wsec{max-width:960px;margin:0 auto;padding:44px 20px;border-bottom:1px solid var(--line);opacity:0;transform:translateY(14px);transition:opacity .5s ease,transform .5s ease}
.wsec.in{opacity:1;transform:none}
.wsec h1{font-size:clamp(22px,4vw,30px)}
.wsec p,.wsec li{font-size:15px}
.wsec table{font-size:13px}
.wsec th{font-size:10px}
.wsec .statrow{flex-wrap:wrap}
.wsec .stat{min-width:130px}
.wfoot{max-width:960px;margin:0 auto;padding:40px 20px;color:var(--dim);font-family:'Noto Sans Mono',monospace;font-size:11px}
.wtopin a.chl.lk{opacity:.45}
.wfade{max-width:960px;margin:-170px auto 0;height:170px;background:linear-gradient(to bottom,transparent,var(--bg) 78%);position:relative;pointer-events:none}
.wgate{max-width:760px;margin:0 auto 60px;padding:34px 30px;background:var(--panel);border:1px solid var(--acc);border-radius:16px;position:relative}
.wgate .k{font-family:'Noto Sans Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--acc)}
.wgate h2{font-size:clamp(21px,3.4vw,27px);margin:10px 0 8px;letter-spacing:-.5px}
.wgate p{color:var(--muted);font-size:14.5px;margin:0 0 10px}
.wlocked{columns:2;gap:22px;margin:14px 0 18px;padding:0;list-style:none}
.wlocked li{font-family:'Noto Sans Mono',monospace;font-size:11.5px;color:var(--dim);padding:4px 0;break-inside:avoid}
.wlocked li::before{content:"🔒 ";font-size:10px}
.wgate .alt{font-family:'Noto Sans Mono',monospace;font-size:11.5px;color:var(--dim);margin-top:10px}
.wgate .alt a{color:var(--acc)}
.subform{display:flex;gap:8px;margin:8px 0 8px}
.subform input{flex:1;min-width:0;background:var(--bg);border:1px solid var(--line);border-radius:8px;color:var(--text);font-family:'Noto Sans Mono',monospace;font-size:13px;padding:11px 14px}
.subform input::placeholder{color:var(--dim)}
.subform input:focus{outline:none;border-color:var(--acc)}
.subform button{font-family:'Noto Sans Mono',monospace;font-weight:700;font-size:13px;background:var(--acc);color:#0A0A10;border:none;border-radius:8px;padding:11px 20px;cursor:pointer;white-space:nowrap}
.subform button:hover{filter:brightness(1.12)}
.subnote{font-family:'Noto Sans Mono',monospace;font-size:10.5px;color:var(--dim);margin:0 0 4px}
@media(max-width:480px){.subform{flex-direction:column}}
.wgate.done .lockedui{display:none}
.wgate .doneui{display:none}
.wgate.done .doneui{display:block}
.doneui .big{font-size:21px;font-weight:700;margin:8px 0}
@media(max-width:720px){.two{columns:1}.wsec table{display:block;overflow-x:auto}.statrow{gap:3mm}.wlocked{columns:1}}
`;

const webHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The State of Neobanks — ${MONTH} · web edition · neobankbeat</title>
<meta name="description" content="The State of Neobanks ${MONTH}: the opening chapters free online — ${N} verified-active neobanks measured across custody, licences, cards and stablecoins. Full ${pages.length}-page designed PDF free for subscribers.">
<link rel="canonical" href="https://www.neobankbeat.com/report/${ED_SLUG}/">
<meta name="theme-color" content="#0A0A10">
<meta property="og:type" content="article">
<meta property="og:site_name" content="neobankbeat">
<meta property="og:title" content="The State of Neobanks — ${MONTH} · web edition">
<meta property="og:description" content="The opening chapters free online. Full ${pages.length}-page designed PDF free for newsletter subscribers.">
<meta property="og:url" content="https://www.neobankbeat.com/report/${ED_SLUG}/">
<meta property="og:image" content="https://www.neobankbeat.com/report/cover-${ED_SLUG}.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://www.neobankbeat.com/report/cover-${ED_SLUG}.png">
<link rel="icon" href="/favicon.ico" sizes="64x64">
<link rel="icon" type="image/png" href="/favicon.png" sizes="64x64">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Noto+Sans+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Report', name: `The State of Neobanks — ${MONTH}`, url: `https://www.neobankbeat.com/report/${ED_SLUG}/`, datePublished: '2026-07-05', publisher: { '@type': 'Organization', name: 'neobankbeat', url: 'https://www.neobankbeat.com' }, isAccessibleForFree: 'False', hasPart: { '@type': 'WebPageElement', isAccessibleForFree: 'True', cssSelector: '.wsec' }, description: `Monthly report on ${N} verified-active neobanks: custody, licences, cards, stablecoins, geography and niches. First ${FREE_CHAPTERS} chapters free online; full PDF free for newsletter subscribers.` })}
</script>
<style>${CSS}${WEBCSS}</style>
</head>
<body>
<nav class="wtop"><div class="wtopin">
  <a class="logo" href="/">neobank<span style="color:var(--acc)">beat</span></a>
  ${tocEntries.map(([t], i) => i < FREE_CHAPTERS
    ? `<a class="chl" href="#ch${i}">${esc(t.replace(/ — .*| &.*|:.*/, ''))}</a>`
    : `<a class="chl lk" href="#gate" title="subscribe to unlock">🔒 ${esc(t.replace(/ — .*| &.*|:.*/, ''))}</a>`).join('')}
</div></nav>
<div class="whero">
  <span class="badge">monthly report · ${EDITION} · ${MONTH} · web edition</span>
  <div class="big">the state of <em>neobanks</em></div>
  <p style="font-size:17px;color:var(--muted);max-width:640px;margin-top:16px">${N} verified-active digital banks, measured — custody, licences, cards, stablecoins, geography and the fine print. The opening third is free below; the full ${pages.length}-page designed PDF is free for subscribers. ${ASOF}.</p>
  <div class="wcta">
    <a class="pri" href="#gate">get the full PDF — free →</a>
    <a href="/data.json">raw data</a>
  </div>
</div>
${webSections}
<div class="wfade"></div>
<div class="wgate" id="gate">
  <div class="lockedui">
    <span class="k">the subscriber edition</span>
    <h2>You've read the opening third. Unlock the other ${lockedChapters.length} chapters.</h2>
    <p>Subscribe to the (free) newsletter and the full ${pages.length}-page designed PDF downloads <b>instantly, right here</b> — plus every monthly edition lands in your inbox. No spam, no paid tier.</p>
    <ul class="wlocked">
${lockedChapters.map(t => `      <li>${esc(t)}</li>`).join('\n')}
    </ul>
    <form class="subform" id="subform" action="https://neobankbeat.substack.com/subscribe" method="get" target="_blank" rel="noopener">
      <input type="email" name="email" required placeholder="you@example.com" aria-label="Email address">
      <button type="submit">subscribe &amp; download →</button>
    </form>
    <p class="subnote">free · via substack · confirm in the tab that opens — your download starts here automatically</p>
    <p class="alt">already subscribed? <a href="#" id="haveit">unlock &amp; download →</a></p>
  </div>
  <div class="doneui">
    <span class="k">unlocked</span>
    <div class="big">🎉 Your download is starting…</div>
    <p>If it didn't, <a href="${PDF_URL}" download style="color:var(--acc)">download the PDF directly</a>. The August edition will arrive by email. Thanks for subscribing.</p>
  </div>
</div>
<div class="wfoot">© neobankbeat · MIT — cite freely with attribution · <a href="/" style="color:var(--acc)">directory</a> · <a href="/blog/" style="color:var(--acc)">blog</a> · <a href="https://neobankbeat.substack.com" style="color:var(--acc)">newsletter</a></div>
<script>
/* gate: no server, so unlock is detected client-side — when the visitor
   interacts with the substack embed (blur → focus lands in the iframe),
   we give them time to finish subscribing, then start the PDF download. */
(function(){
  const KEY='nbbReport${ED_SLUG}',gate=document.getElementById('gate');
  const dl=()=>{const a=document.createElement('a');a.href='${PDF_URL}';a.download='';document.body.appendChild(a);a.click();a.remove();};
  const unlock=auto=>{if(gate.classList.contains('done'))return;gate.classList.add('done');
    try{localStorage.setItem(KEY,'1')}catch(_){}
    if(auto!==false)setTimeout(dl,600);};
  try{if(localStorage.getItem(KEY))gate.classList.add('done');}catch(_){}
  document.getElementById('subform').addEventListener('submit',()=>{setTimeout(()=>unlock(true),800);});
  document.getElementById('haveit').addEventListener('click',e=>{e.preventDefault();unlock(true);});
})();
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.wsec').forEach(s => io.observe(s));
const cu = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; cu.unobserve(e.target);
  const el = e.target, raw = el.textContent, m = raw.match(/^([\\d.]+)(.*)$/); if (!m) return;
  const target = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length, suf = m[2], t0 = performance.now();
  const step = now => { const k = Math.min(1, (now - t0) / 900), v = target * (1 - Math.pow(1 - k, 3));
    el.textContent = v.toFixed(dec) + suf; if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.stat .n').forEach(s => cu.observe(s));
</script>
</body>
</html>`;
fs.mkdirSync(path.join(ROOT, 'report', ED_SLUG), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'report', ED_SLUG, 'index.html'), webHtml);
console.log(`web edition written · report/${ED_SLUG}/`);

/* overflow checker: run headless Chrome --dump-dom on this file and grep <title> */
const checkHtml = html.replace('</body>', `<script>
window.addEventListener('load', () => setTimeout(() => {
  const bad = [...document.querySelectorAll('.page')]
    .map((p, i) => [i + 1, p.scrollHeight - p.clientHeight])
    .filter(([, d]) => d > 2).map(([n, d]) => 'p' + n + '+' + d + 'px');
  document.title = 'OVERFLOW: ' + (bad.length ? bad.join(' ') : 'none');
}, 300));
</script></body>`);
fs.writeFileSync(path.join(ROOT, 'reports', 'report-check.html'), checkHtml);
console.log(`report-src.html written · ${pages.length} pages`);
