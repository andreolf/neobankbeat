#!/usr/bin/env bash
# Mirror data.json to Hugging Face + Kaggle, so models and researchers meet the
# dataset where they actually look. This is the off-site half of the GEO work:
# HF dataset pages show up in retrieval/training corpora, which is how you get
# cited without anyone linking you.
#
#   bash tests/publish-dataset.sh prep      stage files only — no credentials needed
#   bash tests/publish-dataset.sh hf        push to Hugging Face
#   bash tests/publish-dataset.sh kaggle    push to Kaggle
#   bash tests/publish-dataset.sh all       both
#
# One-time auth:
#   Hugging Face   brew install hf && hf auth login
#                  Easiest: pick the browser login when prompted.
#                  Manual token: https://huggingface.co/settings/tokens
#                  (avatar → Access Tokens → Create new token → role: Write)
#   Kaggle         pipx install kaggle && kaggle auth login
#                  Browser flow, nothing to paste. (The old kaggle.json is gone;
#                  a manual token from kaggle.com → Settings → API goes in
#                  KAGGLE_API_TOKEN or ~/.kaggle/access_token instead.)

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAGE="$ROOT/dataset/.staging"
# Repo name on HF/Kaggle. Override to taste:  DATASET_SLUG=neobanks bash … hf
# (your HF user is already "neobankbeat", so a descriptive name reads better
#  and searches better than neobankbeat/neobankbeat)
SLUG="${DATASET_SLUG:-neobanks}"
TITLE="neobankbeat: open directory of neobanks"

prep() {
  [ -f "$ROOT/data.json" ] || { echo "✗ data.json missing"; exit 1; }
  [ -f "$ROOT/dataset/README.md" ] || { echo "✗ dataset/README.md (the data card) missing"; exit 1; }
  rm -rf "$STAGE"; mkdir -p "$STAGE"
  cp "$ROOT/data.json" "$STAGE/data.json"
  cp "$ROOT/dataset/README.md" "$STAGE/README.md"
  # Flat JSON Lines, one neobank per line. The Hub's dataset viewer can't parse
  # data.json (a single object with meta + entities), and a dataset with a broken
  # viewer gets far less pickup — the parsed rows feed Hub search and tooling.
  node -e '
    const fs=require("fs");
    const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
    fs.writeFileSync(process.argv[2], d.entities.map(e=>JSON.stringify(e)).join("\n")+"\n");
  ' "$ROOT/data.json" "$STAGE/entities.jsonl"
  local total
  total=$(node -p "require('$ROOT/data.json').entities.length")
  echo "✓ staged $total entities → dataset/.staging/ (data.json + entities.jsonl + README.md)"
}

valid_name() { printf '%s' "$1" | grep -qE '^[A-Za-z0-9][A-Za-z0-9._-]*$'; }

push_hf() {
  command -v hf >/dev/null 2>&1 || { echo "✗ hf not installed — run: brew install hf"; exit 1; }
  local user
  # -q forces the quiet format (bare username). Without it, `hf auth whoami`
  # switches between human ("✓ Logged in as …") and agent ("user=…") output
  # depending on whether stdout is a TTY — and either one poisons the repo id.
  user=$(hf auth whoami -q 2>/dev/null | head -1 | tr -d '[:space:]') || true
  if ! valid_name "$user"; then
    echo "✗ couldn't read your Hugging Face username (got: '${user:-empty}')."
    echo "  Log in first:  hf auth login"
    exit 1
  fi
  prep
  echo "→ uploading to huggingface.co/datasets/$user/$SLUG …"
  # hf upload creates the repo if it doesn't exist; public by default
  hf upload "$user/$SLUG" "$STAGE" . --repo-type dataset \
    --commit-message "refresh from neobankbeat.com ($(date -u +%F))"
  echo "✓ https://huggingface.co/datasets/$user/$SLUG"
}

push_kaggle() {
  command -v kaggle >/dev/null 2>&1 || { echo "✗ kaggle not installed — run: pipx install kaggle"; exit 1; }
  # Kaggle replaced the old kaggle.json (username + key) with an OAuth /
  # access-token model. `kaggle auth login` writes credentials.json; a manually
  # created token lands in access_token or the environment.
  if [ -z "${KAGGLE_API_TOKEN:-}" ] \
     && [ ! -f "$HOME/.kaggle/credentials.json" ] \
     && [ ! -f "$HOME/.kaggle/access_token" ] \
     && [ ! -f "$HOME/.kaggle/kaggle.json" ]; then
    echo "✗ not authenticated to Kaggle. Easiest:  kaggle auth login"
    exit 1
  fi
  # A dataset id is "<username>/<slug>" and the CLI has no whoami, so dig the
  # owner out of whichever credential file exists. A bare access_token has no
  # username in it, hence the ~/.kaggle/username fallback.
  local user
  user="${KAGGLE_USERNAME:-}"
  [ -n "$user" ] || user=$(node -p "try{require(require('os').homedir()+'/.kaggle/credentials.json').username}catch(e){''}" 2>/dev/null || true)
  [ -n "$user" ] || user=$(node -p "try{require(require('os').homedir()+'/.kaggle/kaggle.json').username}catch(e){''}" 2>/dev/null || true)
  [ -n "$user" ] || user=$(tr -d '[:space:]' < "$HOME/.kaggle/username" 2>/dev/null || true)
  if ! valid_name "$user"; then
    echo "✗ Kaggle username unknown — your credentials don't contain one."
    echo "  Set it once:  echo YOUR_KAGGLE_USERNAME > ~/.kaggle/username"
    echo "  Or per run:   KAGGLE_USERNAME=you bash tests/publish-dataset.sh kaggle"
    exit 1
  fi
  prep
  # NOTE: the filename is dataset-metadata.json — the CLI's own --help text
  # calls it "datasets-metadata.json", which is a typo and will not work.
  #
  # Subtitle, description, keywords and per-column descriptions all feed Kaggle's
  # "usability" score, which is an input to its search ranking — a bare
  # title/id/licence trio scores ~0.1 and buries the dataset.
  node -e '
    const fs=require("fs");
    const [dataPath,out,id,title]=process.argv.slice(1);
    const d=JSON.parse(fs.readFileSync(dataPath,"utf8"));
    const ents=d.entities, n=ents.length;
    const countries=new Set(ents.flatMap(e=>e.countries||[])).size;
    // Field dictionary straight off the data, so it can never drift from reality.
    const seen=new Map();
    for (const e of ents) for (const [k,v] of Object.entries(e)) {
      if (v===null||v===undefined||v==="") continue;
      if (!seen.has(k)) seen.set(k, Array.isArray(v)?"string":typeof v==="number"?"number":typeof v==="boolean"?"boolean":"string");
    }
    // data.json carries the canonical notes for the subtler fields; prefer them
    // so this file cannot drift from what the site itself publishes.
    const describe=Object.assign({
      name:"Brand name",
      audience:"Who the product targets (retail, SMB, freelancers, teens, migrants, crypto-native)",
      region:"Home region bucket",
      hq:"Headquarters city and country",
      founded:"Year founded",
      custody:"Who actually holds the money: a partner bank, the provider itself, or the user (self-custody)",
      regulation_type:"How it is authorised: own bank licence, e-money institution, sponsor/partner bank, or unregulated",
      card_network:"Card network behind the card, where one is issued",
      card_type:"debit, prepaid or credit",
      yield:"Advertised up-to yield on balances — see the rates note",
      stablecoins:"Stablecoins supported, for hybrid and web3-native apps",
      kyc:"Identity-verification requirement",
      domain:"Primary domain",
      website:"Official URL",
      active_regions:"Regions where the product is actually available, as opposed to where it is headquartered",
      note:"Short editorial note",
      story:"Longer profile write-up",
      licence:"The named authorisation held, where disclosed",
      founders:"Founder names",
      funding:"Disclosed funding raised",
      terms_url:"Terms of service",
      privacy_url:"Privacy policy",
      x_handle:"Handle on X",
      countries:"Countries served",
      investors:"Disclosed backers",
      reported_users:"Most recently reported user count — self-disclosed, not audited",
      cashback:"Advertised up-to cashback — see the rates note",
      ai:"AI-specific features offered",
      volume:"Reported transaction volume, where disclosed"
    }, d.meta&&d.meta.field_notes||{});
    const fields=[...seen].map(([name,type])=>({name,type,
      description:describe[name]||name.replace(/_/g," ")}));
    const description=[
      `A structured, continuously refreshed directory of **${n} verified-active neobanks** serving ${countries} countries.`,
      "",
      (c=>c?`Split by model: **${c.traditional} traditional** (licensed fiat, custodial), **${c.hybrid} hybrid** (fiat + custodial crypto) and **${c.web3_native} web3-native** (self-custodial, on-chain-first). ${c.niche_audience} target a niche audience rather than the general public.`:"")(d.meta&&d.meta.counts),
      "",
      "Built and maintained at [neobankbeat.com](https://www.neobankbeat.com). Field dictionary and methodology: [neobankbeat.com/data/](https://www.neobankbeat.com/data/).",
      "",
      "## Files",
      "",
      "| File | Shape |",
      "| --- | --- |",
      "| `entities.jsonl` | One neobank per line — use this for analysis |",
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
      "- `reported_users`, `funding` and `volume` are self-disclosed figures, not audited, and companies disclose selectively. Treat them as order-of-magnitude.",
      "- `cashback`, `yield` and `fx_markup` are *up to* figures that vary by region and change constantly. They are sourced and dated — confirm with the issuer before relying on them.",
      "- Coverage is deliberately of live consumer-facing products: defunct neobanks and pure BaaS/infrastructure providers are excluded.",
      "- Unverified fields are `null` rather than guessed, and `services` tags are omitted when unverified — absence of a tag is not proof of absence of the capability.",
      "",
      "## Licence and citation",
      "",
      "MIT. Attribution appreciated: neobankbeat — https://www.neobankbeat.com",
      "",
      `Refreshed from source regularly; this mirror is re-pushed on material changes. Snapshot: ${d.meta&&d.meta.updated?d.meta.updated:new Date().toISOString().slice(0,10)}.`
    ].join("\n");
    fs.writeFileSync(out, JSON.stringify({
      id, title,
      subtitle:`Regulation, custody, cards, FX and availability for ${n} neobanks`,
      description,
      licenses:[{name:"MIT"}],
      keywords:["finance","banking","business","economics","europe"],
      resources:[
        {path:"entities.jsonl",description:`One neobank per line (${n} rows). Recommended for analysis.`,schema:{fields}},
        {path:"data.json",description:"Site source of truth: a single object with meta and entities."},
        {path:"README.md",description:"Data card: provenance, field dictionary, caveats."}
      ]
    },null,2)+"\n");
  ' "$ROOT/data.json" "$STAGE/dataset-metadata.json" "$user/$SLUG" "$TITLE"
  if [ "${1:-}" = dry ]; then
    echo "✓ metadata written, nothing pushed → $STAGE/dataset-metadata.json"
    return 0
  fi
  if kaggle datasets status "$user/$SLUG" >/dev/null 2>&1; then
    echo "→ dataset exists, pushing a new version …"
    kaggle datasets version -p "$STAGE" -m "refresh from neobankbeat.com ($(date -u +%F))"
  else
    echo "→ creating kaggle.com/datasets/$user/$SLUG …"
    # -u = public. Without it Kaggle creates a PRIVATE dataset, which is
    # useless here: nothing can crawl or cite it.
    kaggle datasets create -p "$STAGE" -u
  fi
  echo "✓ https://www.kaggle.com/datasets/$user/$SLUG"
}

case "${1:-}" in
  prep)       prep ;;
  hf)         push_hf ;;
  kaggle)     push_kaggle ;;
  kaggle-dry) push_kaggle dry ;;
  all)    push_hf; push_kaggle ;;
  *)      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
