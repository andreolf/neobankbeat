// Builds the mirror artefacts for Hugging Face and Kaggle from data.json.
//
//   node tests/dataset-export.mjs <root> <stage> [kaggleId] [title]
//
// Writes entities.jsonl (one neobank per line — what the HF viewer parses),
// entities.csv (flattened; Kaggle only previews and describes columns for
// tabular files) and, when a Kaggle id is given, dataset-metadata.json.
//
// The column dictionary below is the single source of truth for both the CSV
// header and Kaggle's per-column descriptions, so the two cannot drift apart.

import fs from "node:fs";
import path from "node:path";

const [root, stage, kaggleId, title] = process.argv.slice(2);
if (!root || !stage) {
  console.error("usage: dataset-export.mjs <root> <stage> [kaggleId] [title]");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path.join(root, "data.json"), "utf8"));
const entities = data.entities;
const meta = data.meta || {};
const notes = meta.field_notes || {};

// `get` flattens the nested shapes: reported_users/fx_markup/volume are objects
// carrying a value plus its as_of and source, and investors is a list of objects.
const list = (v) => (Array.isArray(v) ? v.filter(Boolean).join("; ") : "");
const COLUMNS = [
  { name: "name", get: (e) => e.name, description: "Brand name" },
  { name: "category", get: (e) => e.category, description: notes.category || "Product model" },
  { name: "audience", get: (e) => e.audience, description: "Who the product targets, where it is not the general public" },
  { name: "region", get: (e) => e.region, description: "Home region bucket" },
  { name: "hq", get: (e) => e.hq, description: "Headquarters city and country" },
  { name: "countries", get: (e) => list(e.countries), description: "Countries served, semicolon-separated" },
  { name: "active_regions", get: (e) => list(e.active_regions), description: "Regions where the product is actually available, as opposed to where it is headquartered" },
  { name: "founded", get: (e) => e.founded, description: "Year founded" },
  { name: "custody", get: (e) => e.custody, description: "Who actually holds the money: a partner bank, the provider itself, or the user" },
  { name: "regulation_type", get: (e) => e.regulation_type, description: "How it is authorised: own bank licence, e-money institution, sponsor/partner bank, or unregulated" },
  { name: "licence", get: (e) => e.licence, description: "The named authorisation held, where disclosed" },
  { name: "card_network", get: (e) => e.card_network, description: "Card network behind the card, where one is issued" },
  { name: "card_type", get: (e) => e.card_type, description: "debit, prepaid or credit" },
  { name: "services", get: (e) => list(e.services), description: notes.services || "Money-movement capabilities, semicolon-separated" },
  { name: "stablecoins", get: (e) => e.stablecoins, description: "Whether stablecoins are supported" },
  { name: "kyc", get: (e) => e.kyc, description: "Identity-verification requirement" },
  { name: "yield", get: (e) => e.yield, description: notes.rates || "Advertised up-to yield on balances" },
  { name: "cashback", get: (e) => e.cashback, description: notes.rates || "Advertised up-to cashback" },
  { name: "fx_markup", get: (e) => e.fx_markup?.markup, description: notes.fx_markup || "Foreign-exchange markup on the standard plan" },
  { name: "fx_markup_as_of", get: (e) => e.fx_markup?.as_of, description: "Month the FX markup was last verified" },
  { name: "fx_markup_source", get: (e) => e.fx_markup?.source, description: "Source for the FX markup" },
  { name: "reported_users_millions", get: (e) => e.reported_users?.value_millions, description: "Most recently reported user count in millions — self-disclosed, not audited" },
  { name: "reported_users_metric", get: (e) => e.reported_users?.metric, description: "What the user figure actually counts: customers, members, downloads, wallets" },
  { name: "reported_users_as_of", get: (e) => e.reported_users?.as_of, description: "Year the user figure was reported" },
  { name: "volume", get: (e) => e.volume?.figure, description: "Reported transaction volume, where disclosed" },
  { name: "volume_metric", get: (e) => e.volume?.metric, description: "What the volume figure measures, and over what period" },
  { name: "volume_source", get: (e) => e.volume?.source, description: "Source for the volume figure" },
  { name: "funding", get: (e) => e.funding, description: "Disclosed funding raised" },
  { name: "investors", get: (e) => list((e.investors || []).map((i) => i.name)), description: "Disclosed backers, semicolon-separated" },
  { name: "founders", get: (e) => e.founders, description: "Founder names" },
  { name: "ai", get: (e) => e.ai, description: "AI-specific features offered" },
  { name: "note", get: (e) => e.note, description: "Short editorial note" },
  { name: "story", get: (e) => e.story, description: "Longer profile write-up" },
  { name: "domain", get: (e) => e.domain, description: "Primary domain" },
  { name: "website", get: (e) => e.website, description: "Official URL" },
  { name: "x_handle", get: (e) => e.x_handle, description: "Handle on X" },
  { name: "terms_url", get: (e) => e.terms_url, description: "Terms of service" },
  { name: "privacy_url", get: (e) => e.privacy_url, description: "Privacy policy" },
];

fs.mkdirSync(stage, { recursive: true });

fs.writeFileSync(
  path.join(stage, "entities.jsonl"),
  entities.map((e) => JSON.stringify(e)).join("\n") + "\n",
);

// Newlines inside a quoted CSV field are legal but break enough naive parsers
// (Kaggle's preview among them) that collapsing them is the kinder default.
const cell = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/\s+/g, " ").trim();
  return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [
  COLUMNS.map((c) => c.name).join(","),
  ...entities.map((e) => COLUMNS.map((c) => cell(c.get(e))).join(",")),
].join("\n");
fs.writeFileSync(path.join(stage, "entities.csv"), csv + "\n");

const n = entities.length;
const countries = new Set(entities.flatMap((e) => e.countries || [])).size;

if (kaggleId) {
  const c = meta.counts;
  const description = [
    `A structured, continuously refreshed directory of **${n} verified-active neobanks** serving ${countries} countries.`,
    "",
    c &&
      `Split by model: **${c.traditional} traditional** (licensed fiat, custodial), **${c.hybrid} hybrid** (fiat + custodial crypto) and **${c.web3_native} web3-native** (self-custodial, on-chain-first). ${c.niche_audience} target a niche audience rather than the general public.`,
    "",
    "Built and maintained at [neobankbeat.com](https://www.neobankbeat.com). Field dictionary and methodology: [neobankbeat.com/data/](https://www.neobankbeat.com/data/).",
    "",
    "## Files",
    "",
    "| File | Shape |",
    "| --- | --- |",
    "| `entities.csv` | Flattened, one row per neobank — start here |",
    "| `entities.jsonl` | Same data, one JSON object per line, nested fields intact |",
    "| `data.json` | Source of truth for the site: `{ meta, entities }` |",
    "",
    "## What makes it different",
    "",
    "Most neobank lists are marketing roundups. This one records what decides whether your money is safe: **how each product is authorised** (`regulation_type`, `licence` — own bank licence vs e-money institution vs riding on a sponsor bank) and **who actually holds the money** (`custody` — a partner bank, the provider, or you). That regulatory layer is the part nobody else publishes in machine-readable form.",
    "",
    "It also separates **where a product is available** (`active_regions`, `countries`) from where it is headquartered (`hq`) — the distinction most roundups collapse, and the one that matters if you are picking a product rather than writing about one.",
    "",
    "## Caveats worth reading",
    "",
    "- `reported_users_millions`, `funding` and `volume` are self-disclosed figures, not audited, and companies disclose selectively. Treat them as order-of-magnitude, and check `reported_users_metric` before comparing — a wallet download is not a funded account.",
    "- `cashback`, `yield` and `fx_markup` are *up to* figures that vary by region and change constantly. They are sourced and dated — confirm with the issuer before relying on them.",
    "- Coverage is deliberately of live consumer-facing products: defunct neobanks and pure BaaS/infrastructure providers are excluded.",
    `- ${notes.verification || "Unverified fields are empty rather than guessed"}. Absence of a \`services\` tag is not proof the capability is missing.`,
    "",
    "## Licence and citation",
    "",
    "MIT. Attribution appreciated: neobankbeat — https://www.neobankbeat.com",
    "",
    `Snapshot: ${meta.updated || new Date().toISOString().slice(0, 10)}.`,
  ]
    .filter((l) => l !== undefined && l !== null && l !== false)
    .join("\n");

  const schema = {
    fields: COLUMNS.map((c) => ({
      name: c.name,
      description: c.description,
      type: c.name === "founded" || c.name === "reported_users_millions" ? "number" : c.name === "stablecoins" ? "boolean" : "string",
    })),
  };

  const FILE_NOTES = {
    "entities.csv": `Flattened directory, one row per neobank (${n} rows, ${COLUMNS.length} columns).`,
    "entities.jsonl": "Same data as JSON Lines, with the nested source and as-of objects intact.",
    "data.json": "Site source of truth: a single object with meta and entities, including counts and methodology.",
    "README.md": "Data card: provenance, field dictionary, caveats.",
  };
  const sizeOf = (f) => {
    try {
      return fs.statSync(path.join(stage, f)).size;
    } catch {
      return 0;
    }
  };
  // The CLI's own resources->data conversion never sets totalBytes, and without
  // it the settings endpoint accepts the request but silently drops the file and
  // column descriptions. Supplying `data` directly takes precedence over
  // `resources`, so this is the path that actually sticks.
  const data = Object.entries(FILE_NOTES).map(([file, description]) => ({
    name: file,
    description,
    totalBytes: sizeOf(file),
    ...(file === "entities.csv" ? { columns: schema.fields } : {}),
  }));

  fs.writeFileSync(
    path.join(stage, "dataset-metadata.json"),
    JSON.stringify(
      {
        id: kaggleId,
        title,
        subtitle: `Regulation, custody, cards, FX and availability for ${n} neobanks`,
        description,
        licenses: [{ name: "MIT" }],
        keywords: ["finance", "banking", "business", "economics", "europe"],
        // Accepted values: not specified, never, annually, quarterly, monthly,
        // weekly, daily, hourly.
        expectedUpdateFrequency: "weekly",
        userSpecifiedSources:
          "Compiled by neobankbeat from provider documentation, regulator registers and company disclosures. Source repository: https://github.com/andreolf/neobankbeat",
        // `resources` is what the upload path reads; `data` is what the settings
        // endpoint reads. Both are needed, and they describe the same files.
        resources: Object.entries(FILE_NOTES).map(([file, description]) => ({
          path: file,
          description,
          ...(file === "entities.csv" ? { schema } : {}),
        })),
        data,
      },
      null,
      2,
    ) + "\n",
  );
}

console.log(`✓ ${n} entities, ${COLUMNS.length} columns → ${path.basename(stage)}/`);
