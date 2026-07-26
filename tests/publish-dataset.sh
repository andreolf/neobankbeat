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
#   Kaggle         pipx install kaggle
#                  kaggle.com → your avatar → Settings → API → "Create New Token"
#                  saves kaggle.json → move it to ~/.kaggle/kaggle.json && chmod 600

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
  local user
  user="${KAGGLE_USERNAME:-$(node -p "try{require(require('os').homedir()+'/.kaggle/kaggle.json').username}catch(e){''}" 2>/dev/null)}"
  if ! valid_name "$user"; then
    echo "✗ couldn't read your Kaggle username (got: '${user:-empty}')."
    echo "  Put kaggle.json in ~/.kaggle/  (kaggle.com → avatar → Settings → API → Create New Token)"
    exit 1
  fi
  prep
  # NOTE: the filename is dataset-metadata.json — the CLI's own --help text
  # calls it "datasets-metadata.json", which is a typo and will not work.
  cat > "$STAGE/dataset-metadata.json" <<JSON
{
  "title": "$TITLE",
  "id": "$user/$SLUG",
  "licenses": [{ "name": "MIT" }]
}
JSON
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
  prep)   prep ;;
  hf)     push_hf ;;
  kaggle) push_kaggle ;;
  all)    push_hf; push_kaggle ;;
  *)      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
