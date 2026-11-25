"""Do open models know who holds your money? With and without the neobankbeat table.

For a fixed sample of neobanks, ask each model two closed questions, once from
memory and once with the neobank's row from the dataset placed in the prompt:

  custody  who holds customer funds        CUSTODIAL / SELF_CUSTODIAL / UNKNOWN
  licence  does it hold its own bank licence   YES / NO / UNKNOWN

The dataset is the answer key, so "accuracy" here means agreement with
neobankbeat, which is built from regulator registers and company terms.

  python run.py pilot     3 neobanks, 1 model: a wiring and cost check
  python run.py           the full run; resumes from results.jsonl
  python run.py score     print the tables from results.jsonl

Needs: pip install requests huggingface_hub, and `hf auth login`.
"""
import json, random, re, sys, time, pathlib, collections
from concurrent.futures import ThreadPoolExecutor
import requests
from huggingface_hub import get_token

HERE = pathlib.Path(__file__).parent
DATA = HERE.parent.parent.parent / "data.json"          # the repo's canonical file
OUT = HERE / "results.jsonl"
URL = "https://router.huggingface.co/v1/chat/completions"
MODELS = [
    "openai/gpt-oss-120b",
    "meta-llama/Llama-3.3-70B-Instruct",
    "Qwen/Qwen3.8-27B",
    "google/gemma-4-31B-it",
    "deepseek-ai/DeepSeek-V4.1-Flash",
]
SEED, PER_CATEGORY = 398, {"traditional": 25, "hybrid": 15, "web3-native": 15}


def sample(entities):
    """60 neobanks: the five whose custody contradicts their category label,
    plus a seeded random draw from each category. The one 'mixed' entry is left
    out because it has no single right answer."""
    # The draw depends on the data, and this run's findings changed the data,
    # so the 60 names actually asked are frozen in sample.json.
    frozen = HERE / "sample.json"
    if frozen.exists():
        by = {e["name"]: e for e in entities}
        return [by[n] for n in json.loads(frozen.read_text()) if n in by]
    rnd = random.Random(SEED)
    ok = [e for e in entities if not e["custody"].startswith("Mixed")]
    odd = [e for e in ok if (e["category"] == "web3-native" and e["custody"] == "Custodial")
           or (e["category"] == "hybrid" and e["custody"] != "Custodial")]
    picked = list(odd)
    for cat, n in PER_CATEGORY.items():
        pool = sorted((e for e in ok if e["category"] == cat and e not in odd), key=lambda e: e["name"])
        picked += rnd.sample(pool, n)
    return picked


def truth(e):
    return {"custody": "CUSTODIAL" if e["custody"] == "Custodial" else "SELF_CUSTODIAL",
            "licence": "YES" if e["regulation_type"] == "Licensed bank" else "NO"}


def ground(e):
    return (f"{e['name']} ({e['category']}, founded {e['founded']}, based in {e['hq']}). "
            f"Custody: {e['custody']}. Arrangement: {e['regulation_type']}. "
            f"Licence detail: {e.get('license') or 'not publicly verifiable'}.")


QUESTIONS = {
    "custody": ("Who holds customer funds at {name} ({domain})? Choose one label.\n"
                "CUSTODIAL: the company or its partner institution holds the funds.\n"
                "SELF_CUSTODIAL: the user holds the keys, including split-key (MPC) wallets.\n"
                "UNKNOWN: you do not know."),
    "licence": ("Does {name} ({domain}) hold a banking licence or bank charter in its own name, "
                "as opposed to relying on a partner bank, an e-money or payment licence, "
                "a crypto registration, or no licence? Choose one label.\n"
                "YES / NO / UNKNOWN: you do not know."),
}
LABELS = {"custody": ["SELF_CUSTODIAL", "CUSTODIAL", "UNKNOWN"], "licence": ["YES", "NO", "UNKNOWN"]}
TAIL = "\nReply with one short sentence, then a final line in the form ANSWER: <LABEL>."


def ask(model, e, q, grounded, token):
    prompt = QUESTIONS[q].format(name=e["name"], domain=e.get("domain") or "no website listed") + TAIL
    if grounded:
        prompt = "Reference record from the neobankbeat directory:\n" + ground(e) + "\n\n" + prompt
    body = {"model": model, "messages": [{"role": "user", "content": prompt}], "temperature": 0, "max_tokens": 6000}   # reasoning models spend most of this thinking
    for attempt in range(4):
        try:
            r = requests.post(URL, headers={"Authorization": f"Bearer {token}"}, json=body, timeout=120)
            if r.status_code == 200:
                j = r.json()
                text = j["choices"][0]["message"].get("content") or ""
                return text, j.get("usage", {}), None
            err = f"{r.status_code} {r.text[:200]}"
            if r.status_code in (400, 401, 402, 403, 404):
                return "", {}, err
        except Exception as ex:                      # network hiccup: retry
            err = repr(ex)[:200]
        time.sleep(3 * (attempt + 1))
    return "", {}, err


def parse(text, q):
    m = re.findall(r"ANSWER:\s*\**\s*([A-Z_]+)", text.upper())
    if m and m[-1] in LABELS[q]:
        return m[-1]
    return "UNPARSED"


def run(entities, models):
    token = get_token()
    done = set()
    if OUT.exists():
        for line in OUT.read_text().splitlines():
            r = json.loads(line)
            # an errored call, or a reply with no readable label (cut off, or all
            # thinking and no answer), is asked again; the last line per key wins
            if not r.get("error") and r["answer"] != "UNPARSED":
                done.add((r["model"], r["name"], r["q"], r["grounded"]))
    jobs = [(m, e, q, g) for m in models for e in entities for q in QUESTIONS for g in (False, True)
            if (m, e["name"], q, g) not in done]
    print(f"{len(jobs)} calls to make, {len(done)} already done")

    def one(job):
        m, e, q, g = job
        text, usage, err = ask(m, e, q, g, token)
        return {"model": m, "name": e["name"], "category": e["category"], "q": q, "grounded": g,
                "truth": truth(e)[q], "answer": parse(text, q) if not err else "ERROR",
                "text": text[-400:], "usage": usage, "error": err}

    with ThreadPoolExecutor(6) as pool, OUT.open("a") as f:
        for i, row in enumerate(pool.map(one, jobs), 1):
            f.write(json.dumps(row, ensure_ascii=False) + "\n"); f.flush()
            if i % 100 == 0:
                print(f"  {i}/{len(jobs)}")


def score():
    rows = {}
    for line in OUT.read_text().splitlines():
        r = json.loads(line)
        if not r.get("error"):
            rows[(r["model"], r["name"], r["q"], r["grounded"])] = r
    rows = list(rows.values())
    # Score against the dataset as it is now. Reading this run's disagreements
    # led to corrections in six entries, so some answer keys changed after the
    # models were asked. A memory answer is re-marked against the corrected key.
    # An answer given with the record is dropped when that record was one of the
    # corrected ones, because the model was shown the faulty version.
    now = {e["name"]: truth(e) for e in json.loads(DATA.read_text())["entities"]}
    kept = []
    for r in rows:
        new = now[r["name"]][r["q"]]
        if new != r["truth"]:
            if r["grounded"]:
                continue
            r = dict(r, truth=new)
        kept.append(r)
    print(f"{len(rows) - len(kept)} with-record answers set aside: the record shown has since been corrected")
    rows = kept
    tin = sum(r["usage"].get("prompt_tokens", 0) for r in rows)
    tout = sum(r["usage"].get("completion_tokens", 0) for r in rows)
    print(f"{len(rows)} answers · {tin:,} tokens in · {tout:,} tokens out\n")

    def table(title, key, keep=lambda r: True):
        agg = collections.defaultdict(lambda: collections.Counter())
        for r in rows:
            if not keep(r):
                continue
            c = agg[(key(r), r["q"], r["grounded"])]
            c["n"] += 1
            c["right"] += r["answer"] == r["truth"]
            c["unknown"] += r["answer"] in ("UNKNOWN", "UNPARSED")
            c["wrong"] += r["answer"] not in (r["truth"], "UNKNOWN", "UNPARSED")
        print(title)
        print(f"{'':38}{'question':9}{'n':>4}  {'memory: right / wrong / unsure':34}{'with record: right / wrong / unsure'}")
        for k in sorted({k[0] for k in agg}):
            for q in QUESTIONS:
                a, b = agg[(k, q, False)], agg[(k, q, True)]
                if not a["n"]:
                    continue
                f = lambda c: f"{c['right']/c['n']:5.0%} / {c['wrong']/c['n']:4.0%} / {c['unknown']/c['n']:4.0%}" if c["n"] else "-"
                print(f"{k:38}{q:9}{a['n']:>4}  {f(a):34}{f(b)}")
        print()

    table("By model", lambda r: r["model"])
    table("By category (all models)", lambda r: r["category"])
    odd = lambda r: (r["category"] == "web3-native" and r["truth"] == "CUSTODIAL") or (r["category"] == "hybrid" and r["truth"] == "SELF_CUSTODIAL")
    table("The five whose custody contradicts their label (custody question)", lambda r: "all models", lambda r: r["q"] == "custody" and odd(r))


if __name__ == "__main__":
    entities = sample(json.loads(DATA.read_text())["entities"])
    mode = sys.argv[1] if len(sys.argv) > 1 else "full"
    if mode == "pilot":
        OUT = HERE / "pilot.jsonl"
        run(entities[:3], MODELS[:1]); score()
    elif mode == "score":
        score()
    else:
        print(f"sample: {len(entities)} neobanks · {collections.Counter(e['category'] for e in entities)}")
        run(entities, MODELS); score()
