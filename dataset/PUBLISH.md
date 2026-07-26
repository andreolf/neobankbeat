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

```bash
kaggle auth login          # browser flow; caches credentials, nothing to paste
echo YOUR_KAGGLE_USERNAME > ~/.kaggle/username
```

The username file is needed because a Kaggle dataset id is `<username>/<slug>`
and, unlike `hf`, the Kaggle CLI has no `whoami` to look it up.

Instead of the browser flow you can generate a token under kaggle.com →
**Settings** → **API** and either `export KAGGLE_API_TOKEN=KGAT_…` or write it
to `~/.kaggle/access_token`. This is the older `kaggle.json` file's replacement —
if you have a legacy `~/.kaggle/kaggle.json`, that still works too.

---

## Publishing

Run these **from the repo root** — the script path is relative:

```bash
cd ~/neobankbeat

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
- **Kaggle file and column descriptions cannot be set from the API — only the
  web UI.** This costs two "Pending Actions" on the data card ("Add file
  information", "Include column descriptors"). Both documented routes were
  tested against the live dataset and neither writes:
  - `kaggle datasets metadata --update`, which sends the `data` block, returns
    `errors: []` and stores nothing.
  - `kaggle datasets version`, which threads the `resources` block through
    `_upload_file` onto each upload token, also leaves them empty.

  Do not trust a read-back to check this either: `get_dataset` returns
  `files: []`, and `list_dataset_files` populates `name` and `totalBytes` but
  always leaves `description` and `columns` empty, whatever is stored. The
  dataset page is the only source of truth.

  To fill them in, generate the text and paste it in the UI:

  ```sh
  node tests/dataset-export.mjs --card    # 4 file + 38 column descriptions
  ```

  Column descriptions live in `COLUMNS` in `tests/dataset-export.mjs`, which is
  the single source for the CSV header, the Kaggle card and this output — so fix
  wording there, not in the UI, or the next edit will contradict it.
- Set the licence to MIT in the HF web UI if it isn't picked up from the card's
  frontmatter.

---

## Notebooks

Public notebooks are the part of Kaggle that actually brings people to the
dataset: they rank in Kaggle search independently of the dataset page, and they
appear on the dataset's Code tab. They are also the one input to the usability
score that metadata cannot buy.

One directory per notebook under `dataset/notebooks/<name>/`, each with its own
`kernel-metadata.json`. Sync them all, or one:

```sh
bash tests/publish-dataset.sh notebook                  # every notebook
bash tests/publish-dataset.sh notebook who-holds-your-money
```

Verify locally before pushing — a notebook that errors on Kaggle is public while
it is broken:

```sh
cd dataset/notebooks/<name> && jupyter nbconvert --to notebook --execute --stdout notebook.ipynb
```

Four traps, all hit at least once:

- **Push does create new notebooks.** An earlier note here claimed otherwise;
  that was wrong. "Notebook not found" is usually an account that is not phone
  verified, which Kaggle requires before publishing.
- **The slug comes from the title on create, not from your `id`.** Reconcile the
  real `id` and `id_no` (`kaggle kernels list -m`, then `kernels pull -m`) back
  into `kernel-metadata.json`, or the next push creates a duplicate rather than a
  new version.
- **`title` is ignored on update.** Renaming means doing it in the UI.
- **Input paths differ by attachment method.** The UI mounts a dataset at
  `/kaggle/input/<slug>/`; `dataset_sources` mounts it at
  `/kaggle/input/datasets/<owner>/<slug>/`. Hardcoding either one breaks the
  other, so the notebooks search `/kaggle/input` for `entities.csv`.

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
