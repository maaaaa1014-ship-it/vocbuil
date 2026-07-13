"""Build app/public/data/preset-intermediate.json.

We want ~500 intermediate-level words that actually occur often in this
10-book corpus, so the "start with a preset" flow immediately produces
matches. The task calls for NGSL ranks 1001-2000, but the NGSL wordlist
itself was not reachable from this build environment's network policy
(only a small allowlist of hosts, mainly GitHub raw content and package
registries, is reachable here). As a stand-in "intermediate frequency
band" we use ranks 1001-3000 of the Google 10000 English word list
(a well-known general frequency list) as the candidate pool, then keep
the ~500 that appear most often in the corpus. This keeps the same
intent -- common-but-not-basic vocabulary -- while working within the
network constraints of this environment.

Usage: python3 build_preset.py
"""

import json
import re
import sys
from pathlib import Path

import requests
from spacy.lang.en.stop_words import STOP_WORDS

ROOT = Path(__file__).parent
OUT_PATH = ROOT.parent / "app" / "public" / "data" / "preset-intermediate.json"
FREQ_PATH = ROOT / "lemma_freq.json"

CANDIDATE_POOL_URL = (
    "https://raw.githubusercontent.com/first20hours/google-10000-english/"
    "master/google-10000-english-no-swears.txt"
)
CANDIDATE_RANK_START = 1000  # 0-indexed -> rank 1001
CANDIDATE_RANK_END = 3000
TARGET_COUNT = 500
MIN_CORPUS_OCCURRENCES = 3


def main():
    if not FREQ_PATH.exists():
        print("Run build_index.py first (needs lemma_freq.json).", file=sys.stderr)
        sys.exit(1)

    lemma_freq = json.loads(FREQ_PATH.read_text(encoding="utf-8"))

    resp = requests.get(CANDIDATE_POOL_URL, timeout=60)
    resp.raise_for_status()
    all_words = [w.strip().lower() for w in resp.text.splitlines() if w.strip()]
    candidates = all_words[CANDIDATE_RANK_START:CANDIDATE_RANK_END]
    candidates = [w for w in candidates if re.fullmatch(r"[a-z]{3,}", w)]
    candidates = [w for w in candidates if w not in STOP_WORDS]

    scored = [
        (w, lemma_freq.get(w, 0))
        for w in candidates
        if lemma_freq.get(w, 0) >= MIN_CORPUS_OCCURRENCES
    ]
    scored.sort(key=lambda pair: pair[1], reverse=True)

    preset = [w for w, _count in scored[:TARGET_COUNT]]
    preset.sort()

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(preset, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"wrote {OUT_PATH} ({len(preset)} words, "
        f"from {len(candidates)} candidates in rank {CANDIDATE_RANK_START + 1}-{CANDIDATE_RANK_END})",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
