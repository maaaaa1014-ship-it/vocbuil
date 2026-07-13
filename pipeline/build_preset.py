"""Build app/public/data/preset-intermediate.json and preset-advanced.json.

We want ~500 words per tier that actually occur often in this 10-book
corpus, so the "start with a preset" flow immediately produces matches.
The task calls for NGSL ranks 1001-2000, but the NGSL wordlist itself was
not reachable from this build environment's network policy (only a small
allowlist of hosts, mainly GitHub raw content and package registries, is
reachable here). As a stand-in "frequency band" we use ranks from the
Google 10000 English word list (a well-known general frequency list) as
the candidate pool for each tier, then keep the ~500 per tier that appear
most often in the corpus:

  intermediate: candidate ranks 1001-3000
  advanced:     candidate ranks 3001-8000

This keeps the same intent -- common-but-not-basic vocabulary, then
rarer vocabulary -- while working within the network constraints of
this environment.

Usage: python3 build_preset.py
"""

import json
import re
import sys
from pathlib import Path

import requests
from spacy.lang.en.stop_words import STOP_WORDS

ROOT = Path(__file__).parent
OUT_DIR = ROOT.parent / "app" / "public" / "data"
FREQ_PATH = ROOT / "lemma_freq.json"
PROPER_NOUN_RATIO_PATH = ROOT / "lemma_proper_noun_ratio.json"
PROPER_NOUN_RATIO_THRESHOLD = 0.5

CANDIDATE_POOL_URL = (
    "https://raw.githubusercontent.com/first20hours/google-10000-english/"
    "master/google-10000-english-no-swears.txt"
)
TARGET_COUNT = 500
MIN_CORPUS_OCCURRENCES = 3

TIERS = [
    {"name": "intermediate", "rank_start": 1000, "rank_end": 3000},  # rank 1001-3000
    {"name": "advanced", "rank_start": 3000, "rank_end": 8000},  # rank 3001-8000
]


def build_tier(all_words, lemma_freq, proper_noun_ratio, rank_start, rank_end, exclude):
    candidates = all_words[rank_start:rank_end]
    candidates = [w for w in candidates if re.fullmatch(r"[a-z]{3,}", w)]
    candidates = [w for w in candidates if w not in STOP_WORDS]
    candidates = [w for w in candidates if w not in exclude]
    candidates = [
        w for w in candidates
        if proper_noun_ratio.get(w, 0) < PROPER_NOUN_RATIO_THRESHOLD
    ]

    scored = [
        (w, lemma_freq.get(w, 0))
        for w in candidates
        if lemma_freq.get(w, 0) >= MIN_CORPUS_OCCURRENCES
    ]
    scored.sort(key=lambda pair: pair[1], reverse=True)

    preset = sorted(w for w, _count in scored[:TARGET_COUNT])
    return preset, len(candidates)


def main():
    if not FREQ_PATH.exists():
        print("Run build_index.py first (needs lemma_freq.json).", file=sys.stderr)
        sys.exit(1)

    lemma_freq = json.loads(FREQ_PATH.read_text(encoding="utf-8"))
    proper_noun_ratio = (
        json.loads(PROPER_NOUN_RATIO_PATH.read_text(encoding="utf-8"))
        if PROPER_NOUN_RATIO_PATH.exists()
        else {}
    )

    resp = requests.get(CANDIDATE_POOL_URL, timeout=60)
    resp.raise_for_status()
    all_words = [w.strip().lower() for w in resp.text.splitlines() if w.strip()]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    seen_in_earlier_tier: set[str] = set()

    for tier in TIERS:
        preset, candidate_count = build_tier(
            all_words, lemma_freq, proper_noun_ratio,
            tier["rank_start"], tier["rank_end"], seen_in_earlier_tier
        )
        seen_in_earlier_tier |= set(preset)

        out_path = OUT_DIR / f"preset-{tier['name']}.json"
        out_path.write_text(json.dumps(preset, ensure_ascii=False, indent=2), encoding="utf-8")
        print(
            f"wrote {out_path} ({len(preset)} words, from {candidate_count} candidates "
            f"in rank {tier['rank_start'] + 1}-{tier['rank_end']})",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
