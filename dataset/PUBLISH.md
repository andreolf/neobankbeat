# Publishing the dataset to model-ingested catalogs (GEO)

Goal: get `data.json` into the places LLMs and researchers pull from, so
neobankbeat gets **cited by AI answer engines** even without a backlink. Do these
once, then re-run the sync whenever the data changes materially.

`dataset/README.md` is a ready Hugging Face **dataset card** (YAML frontmatter
included). Keep it next to a copy of `data.json` when you upload.

---

## 1. Hugging Face Datasets (highest priority — in training/retrieval corpora)

```bash
pip install -U huggingface_hub
huggingface-cli login                      # paste a write token from hf.co/settings/tokens

# create the repo (once)
huggingface-cli repo create neobankbeat --type dataset -y

# stage the two files and push
cp data.json dataset/data.json
huggingface-cli upload <your-hf-username>/neobankbeat dataset/README.md README.md --repo-type dataset
huggingface-cli upload <your-hf-username>/neobankbeat dataset/data.json data.json --repo-type dataset
```

Result: `https://huggingface.co/datasets/<your-hf-username>/neobankbeat`
Set the license to MIT in the UI if not picked up from the frontmatter.

## 2. Kaggle Datasets

```bash
pip install kaggle                          # put kaggle.json in ~/.kaggle/
mkdir -p /tmp/nb-kaggle && cp data.json dataset/README.md /tmp/nb-kaggle/
cat > /tmp/nb-kaggle/dataset-metadata.json <<'JSON'
{
  "title": "neobankbeat — open directory of neobanks worldwide",
  "id": "<your-kaggle-username>/neobankbeat",
  "licenses": [{ "name": "MIT" }]
}
JSON
kaggle datasets create -p /tmp/nb-kaggle --dir-mode zip
# later updates:  kaggle datasets version -p /tmp/nb-kaggle -m "refresh"
```

## 3. data.world (optional, quick)

Create a project at data.world, upload `data.json` + `README.md`, set license MIT.
Its pages are crawled and it exposes a SPARQL/SQL endpoint some tools index.

## 4. Confirm Google Dataset Search eligibility

The site already emits `schema.org/Dataset` JSON-LD on the homepage. Verify it:

1. Run the homepage through the **Rich Results Test** (search.google.com/test/rich-results) — confirm a *Dataset* item is detected with no errors.
2. In **Google Search Console → Sitemaps**, make sure `/sitemap.xml` is submitted.
3. Search **datasetsearch.research.google.com** for "neobankbeat" after the next crawl (can take 1–3 weeks).

## Keeping it fresh

Re-run steps 1–2 after notable data changes (new entities, removals, new fields).
Mention the refresh in the [changelog](https://www.neobankbeat.com/changelog/) — a
visible cadence is itself a citability signal.
