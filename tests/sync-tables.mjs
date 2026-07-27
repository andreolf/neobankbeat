#!/usr/bin/env node
/* Give every table header cell a scope.
 *
 * A <th> without scope leaves the association between a header and its cells up
 * to the screen reader's guesswork. For the simple grids here the guess is
 * usually right, which is why this went unnoticed across 577 files — but "usually
 * right" is not the same as announced correctly, and the rule is mechanical:
 *
 *   a row whose cells are all <th>   → those are column headers  → scope="col"
 *   a row that opens with <th>, then <td> → that is a row header → scope="row"
 *
 * Runs after the builders, like sync-crumbs and sync-footers, because the tables
 * are emitted from template strings in a dozen places and threading the attribute
 * through each one by hand is how it drifts again.
 *
 *   node tests/sync-tables.mjs           fix in place
 *   node tests/sync-tables.mjs --check   report gaps, exit 1 (used by flowtest)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const SKIP = new Set(['node_modules', '.git', 'reports', 'substack-html']);

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
};

/* Cells are matched one tag at a time rather than with a single row-wide regex,
   so a nested table or an attribute containing ">" cannot silently shift things. */
const CELL = /<(th|td)(\s[^>]*?)?(\/?)>/gi;

const fixRow = (row) => {
  const cells = [...row.matchAll(CELL)];
  if (!cells.length) return row;
  const kinds = cells.map((m) => m[1].toLowerCase());
  const allTh = kinds.every((k) => k === 'th');
  const leadTh = kinds[0] === 'th' && kinds.slice(1).some((k) => k === 'td');
  if (!allTh && !leadTh) return row;

  let out = '', last = 0;
  cells.forEach((m, i) => {
    const attrs = m[2] || '';
    const isTh = kinds[i] === 'th';
    const want = allTh ? 'col' : 'row';
    const apply = isTh && (allTh || i === 0) && !/\bscope\s*=/i.test(attrs);
    out += row.slice(last, m.index);
    out += apply ? `<th scope="${want}"${attrs}${m[3]}>` : m[0];
    last = m.index + m[0].length;
  });
  return out + row.slice(last);
};

const fixTables = (src) =>
  src.replace(/<table\b[\s\S]*?<\/table>/gi, (table) =>
    table.replace(/<tr\b[\s\S]*?(?=<tr\b|<\/table>|<\/tbody>|<\/thead>)/gi, fixRow));

const gaps = [];
let changed = 0;
for (const f of walk(ROOT)) {
  const src = fs.readFileSync(f, 'utf8');
  if (!/<th[\s>]/i.test(src)) continue;
  const want = fixTables(src);
  if (src === want) continue;
  const rel = path.relative(ROOT, f);
  const before = (src.match(/<th(?![^>]*\bscope\s*=)[\s>]/gi) || []).length;
  gaps.push(`${rel}  ${before} th without scope`);
  changed++;
  if (!check) fs.writeFileSync(f, want);
}

if (check) {
  if (gaps.length) {
    console.error(`✗ ${gaps.length} file(s) have table headers without a scope:`);
    gaps.slice(0, 15).forEach((g) => console.error('   ' + g));
    if (gaps.length > 15) console.error(`   … and ${gaps.length - 15} more`);
    console.error('  run: node tests/sync-tables.mjs');
    process.exit(1);
  }
  console.log('every table header has a scope');
} else {
  console.log(changed ? `scoped table headers in ${changed} file(s)` : 'table headers already scoped');
}
