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
SLUG="neobankbeat"
TITLE="neobankbeat: open directory of neobanks"

prep() {
  [ -f "$ROOT/data.json" ] || { echo "✗ data.json missing"; exit 1; }
  [ -f "$ROOT/dataset/README.md" ] || { echo "✗ dataset/README.md (the data card) missing"; exit 1; }
  rm -rf "$STAGE"; mkdir -p "$STAGE"
  cp "$ROOT/data.json" "$STAGE/data.json"
  cp "$ROOT/dataset/README.md" "$STAGE/README.md"
  local total
  total=$(node -p "require('$ROOT/data.json').entities.length")
  echo "✓ staged $total entities → dataset/.staging/"
}

push_hf() {
  command -v hf >/dev/null 2>&1 || { echo "✗ hf not installed — run: brew install hf"; exit 1; }
  local user
  user=$(hf auth whoami 2>/dev/null | head -1 | tr -d '[:space:]') || true
  if [ -z "$user" ] || [ "$user" = "Notloggedin" ]; then
    echo "✗ not logged in to Hugging Face — run: hf auth login  (needs a WRITE token)"; exit 1
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
  user="${KAGGLE_USERNAME:-$(node -p "try{require(require('os').homedir()+'/.kaggle/kaggle.json').username}catch(e){''}")}"
  if [ -z "$user" ]; then
    echo "✗ no Kaggle credentials — put kaggle.json in ~/.kaggle/ (kaggle.com → Settings → API)"; exit 1
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
