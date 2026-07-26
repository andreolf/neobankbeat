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
#   bash tests/publish-dataset.sh kaggle-dry       render the Kaggle card, push nothing
#   bash tests/publish-dataset.sh kaggle-settings  re-apply the card without re-uploading
#   bash tests/publish-dataset.sh notebook         publish the starter notebook to Kaggle
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
  # entities.jsonl + entities.csv, and the Kaggle card when an id is passed.
  # Neither hub can read data.json directly: it is one object wrapping meta +
  # entities, and a dataset whose viewer is broken gets far less pickup.
  node "$ROOT/tests/dataset-export.mjs" "$ROOT" "$STAGE" "$@"
}

valid_name() { printf '%s' "$1" | grep -qE '^[A-Za-z0-9][A-Za-z0-9._-]*$'; }

# A file upload carries title/subtitle/description/keywords, but the rest of the
# data card — update frequency, provenance, per-file and per-column descriptions
# — only lands through the settings endpoint.
apply_settings() {
  local user="$1"
  [ -f "$STAGE/dataset-metadata.json" ] || prep "$user/$SLUG" "$TITLE"
  # Kaggle scores a cover image, and auto-detects dataset-cover-image.* sitting
  # beside the metadata. Stage it only for this call, so the file upload in
  # push_kaggle doesn't ship the banner as though it were data.
  local cover="$STAGE/dataset-cover-image.png"
  [ -f "$ROOT/og.png" ] && cp "$ROOT/og.png" "$cover"
  echo "→ applying data-card settings …"
  # This endpoint returns an empty body while a version is still finalising,
  # which surfaces as a JSON decode error. It succeeds on a retry.
  local rc=0 attempt
  for attempt in 1 2 3; do
    rc=0
    kaggle datasets metadata --update -p "$STAGE" "$user/$SLUG" && break || rc=$?
    [ "$attempt" = 3 ] || { echo "   retrying in 15s …"; sleep 15; }
  done
  rm -f "$cover"
  return "$rc"
}

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

kaggle_user() {
  command -v kaggle >/dev/null 2>&1 || { echo "✗ kaggle not installed — run: pipx install kaggle" >&2; exit 1; }
  # Kaggle replaced the old kaggle.json (username + key) with an OAuth /
  # access-token model. `kaggle auth login` writes credentials.json; a manually
  # created token lands in access_token or the environment.
  if [ -z "${KAGGLE_API_TOKEN:-}" ] \
     && [ ! -f "$HOME/.kaggle/credentials.json" ] \
     && [ ! -f "$HOME/.kaggle/access_token" ] \
     && [ ! -f "$HOME/.kaggle/kaggle.json" ]; then
    echo "✗ not authenticated to Kaggle. Easiest:  kaggle auth login" >&2
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
    echo "✗ Kaggle username unknown — your credentials don't contain one." >&2
    echo "  Set it once:  echo YOUR_KAGGLE_USERNAME > ~/.kaggle/username" >&2
    echo "  Or per run:   KAGGLE_USERNAME=you bash tests/publish-dataset.sh kaggle" >&2
    exit 1
  fi
  printf '%s' "$user"
}

# A public notebook is the one part of Kaggle's usability score that metadata
# cannot buy, and it is also the thing that actually gets the dataset in front
# of people — notebooks surface in Kaggle search and on the dataset page.
#
# Caveat that costs an afternoon if you don't know it: `kernels push` can only
# UPDATE a notebook that already has a saved version. It cannot create one, so
# the first version has to be made in the web UI. This is long-standing and
# acknowledged upstream: github.com/Kaggle/kaggle-api/issues/575
push_notebook() {
  local user nb="$ROOT/dataset/notebook" out
  user=$(kaggle_user)
  [ -f "$nb/kernel-metadata.json" ] || { echo "✗ $nb/kernel-metadata.json missing"; exit 1; }
  echo "→ pushing notebook to kaggle.com/code/$user/… "
  out=$(kaggle kernels push -p "$nb" 2>&1) || true
  echo "$out"
  if printf '%s' "$out" | grep -q "Notebook not found"; then
    cat <<'MSG'

  The notebook does not exist yet, and the API cannot create it. Once only:
    1. https://www.kaggle.com/code → New Notebook
    2. File → Import Notebook → dataset/notebook/starter.ipynb
    3. Add Input → your neobanks dataset
    4. Save Version → "Save & Run All" (a quick save is not enough)
  Then this command keeps it in sync from the repo.
MSG
    return 1
  fi
}

push_kaggle() {
  local user
  user=$(kaggle_user)
  # NOTE: the filename dataset-export.mjs writes is dataset-metadata.json — the
  # Kaggle CLI's own --help calls it "datasets-metadata.json", which is a typo
  # and will not work. Subtitle, description, keywords and column descriptions
  # all feed Kaggle's "usability" score, an input to its search ranking: the
  # bare title/id/licence trio scored 0.125.
  prep "$user/$SLUG" "$TITLE"
  if [ "${1:-}" = dry ]; then
    echo "✓ card written, nothing pushed → $STAGE/dataset-metadata.json"
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
  # Kaggle ingests the upload asynchronously, and column descriptions only stick
  # once it has parsed the CSV and knows the columns exist — push settings too
  # early and they are silently dropped.
  printf '→ waiting for Kaggle to finish processing '
  for _ in $(seq 1 30); do
    [ "$(kaggle datasets status "$user/$SLUG" 2>/dev/null)" = ready ] && break
    printf '.'; sleep 5
  done
  echo
  apply_settings "$user"
  echo "✓ https://www.kaggle.com/datasets/$user/$SLUG"
}

case "${1:-}" in
  prep)            prep ;;
  hf)              push_hf ;;
  kaggle)          push_kaggle ;;
  kaggle-dry)      push_kaggle dry ;;
  kaggle-settings) apply_settings "$(kaggle_user)" ;;
  notebook)        push_notebook ;;
  all)             push_hf; push_kaggle ;;
  *)               sed -n '2,23p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
