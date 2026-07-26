# Publishing the dataset to model-ingested catalogs (GEO)

Goal: get `data.json` into the places LLMs and researchers pull from, so
neobankbeat gets **cited by AI answer engines** even without a backlink.

`dataset/README.md` is the Hugging Face **dataset card** (YAML frontmatter
included). `tests/publish-dataset.sh` does the staging and pushing — you only
need to authenticate once.

---

## One-time setup

### Hugging Face (highest priority — HF datasets land in retrieval/training corpora)

You need a Hugging Face account first: <https://huggingface.co/join>.

```bash
brew install hf          # the CLI is `hf`; `huggingface-cli` is deprecated
hf auth login
```

`hf auth login` offers a **browser login** — take it, and you never have to
handle a token by hand.

If you'd rather paste a token, create one at
<https://huggingface.co/settings/tokens> (in the UI: avatar → **Access Tokens**
→ **Create new token**). Give it the **Write** role — a Read token logs in fine
and then fails at upload, which is a confusing way to lose ten minutes.

Note the full domain: `huggingface.co`. The `hf.co` shortener exists but some
browsers treat it as a search term.

### Kaggle

```bash
pipx install kaggle
```

Then kaggle.com → your avatar → **Settings** → **API** → **Create New Token**.
That downloads `kaggle.json`:

```bash
mkdir -p ~/.kaggle && mv ~/Downloads/kaggle.json ~/.kaggle/ && chmod 600 ~/.kaggle/kaggle.json
```

---

## Publishing

```bash
bash tests/publish-dataset.sh prep      # stage only — safe, no credentials, no network
bash tests/publish-dataset.sh hf        # → huggingface.co/datasets/<you>/neobankbeat
bash tests/publish-dataset.sh kaggle    # → kaggle.com/datasets/<you>/neobankbeat
bash tests/publish-dataset.sh all       # both
```

The script is idempotent. On Kaggle it detects an existing dataset and pushes a
new *version* instead of failing; on HF every run is a fresh commit. Re-run
after any material data change.

### Gotchas that will silently bite you

- **Kaggle defaults to private.** The script passes `-u` to create a public
  dataset. A private dataset is worthless here — nothing can crawl or cite it.
- **The Kaggle metadata file is `dataset-metadata.json`.** The Kaggle CLI's own
  `--help` calls it `datasets-metadata.json`; that is a typo and won't work.
- **`huggingface-cli` is deprecated** in favour of `hf`. The old command still
  runs but warns.
- Set the licence to MIT in the HF web UI if it isn't picked up from the card's
  frontmatter.

---

## Confirm Google Dataset Search eligibility

The site emits `schema.org/Dataset` JSON-LD on the homepage **and** on
[`/data/`](https://www.neobankbeat.com/data/), which is the canonical, linkable
dataset page. To verify:

1. Run `/data/` through the **Rich Results Test**
   (search.google.com/test/rich-results) — confirm a *Dataset* item is detected
   with no errors.
2. In **Google Search Console → Sitemaps**, make sure `/sitemap.xml` is submitted.
3. Search **datasetsearch.research.google.com** for "neobankbeat" after the next
   crawl (can take 1–3 weeks).

## Optional third mirror

**data.world** — create a project, upload `data.json` + `README.md`, licence MIT.
Its pages are crawled and it exposes a SQL endpoint some tools index. No CLI
step in the script; it's a 5-minute web upload.

## Keeping it fresh

Re-run after notable data changes (new entities, removals, new fields), and
mention the refresh in the [changelog](https://www.neobankbeat.com/changelog/) —
a visible update cadence is itself a citability signal.
