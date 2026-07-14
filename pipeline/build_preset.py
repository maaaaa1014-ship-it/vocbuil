"""Build app/public/data/preset-{intermediate,advanced,expert}.json.

We want ~500 words per tier that actually occur in this 10-book corpus,
so the "start with a preset" flow immediately produces matches. The task
calls for NGSL ranks 1001-2000, but the NGSL wordlist itself was not
reachable from this build environment's network policy (only a small
allowlist of hosts, mainly GitHub raw content and package registries, is
reachable here). As a stand-in "frequency band" we use ranks from a
Google 20000 English word frequency list (a well-known general frequency
list, extended edition of the "Google 10000" list):

  intermediate: candidate ranks 1001-3000, top 500 by CORPUS frequency
  advanced:     candidate ranks 8001-13000, top 500 by CORPUS frequency
  expert:       candidate rank 10001+ (open-ended), top 500 by RANK
                (i.e. the rarest-in-general-English words that still
                appear at least twice in the corpus)

intermediate/advanced rank the candidates by how often they occur IN THE
CORPUS, which is right for "common enough to practice" but wrong for
"hard": sorting a rank band by corpus frequency surfaces whichever words
happen to recur most in 19th-century narration (whisper, splendid,
curiosity...), which reads as easy even from a nominally rare rank band,
because it's optimizing for recurrence, not rarity. expert instead sorts
by GENERAL-ENGLISH RANK descending across the entire rest of the word
list, so it actually finds the rarest words in the corpus (magistrate,
ascertain, incumbent, solicitor, voluntarily, restraint...) rather than
merely-uncommon-but-recurring ones. Its occurrence floor is lower (2
instead of 3) since genuinely rare words don't recur often by definition.

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
MEANINGS_DIR = ROOT / "meanings"

# 20k.txt is the same Google frequency ordering as the original 10k list,
# just extended to rank 20,000.
CANDIDATE_POOL_URL = (
    "https://raw.githubusercontent.com/first20hours/google-10000-english/"
    "master/20k.txt"
)
TARGET_COUNT = 500

# Known tokenizer/lemmatizer artifacts and dialect/contraction fragments
# that are not real standalone words to study:
#   doo    - from "cock-a-doodle-doo" split on the hyphen
#   sha    - from "sha'n't" (shan't) split on the apostrophe
#   tha, yer - Yorkshire/Cockney dialect for "you"/"your" (Secret Garden,
#              A Little Princess dialogue)
#   dunno  - informal contraction of "don't know"
#   fairies - lemmatizer failed to reduce this to "fairy" (already covered)
EXCLUDE_WORDS = {"doo", "sha", "tha", "yer", "dunno", "fairies"}

TIERS = [
    {
        "name": "intermediate",
        "rank_start": 1000,
        "rank_end": 3000,  # rank 1001-3000
        "sort_by": "frequency",
        "min_occurrences": 3,
    },
    {
        "name": "advanced",
        "rank_start": 8000,
        "rank_end": 13000,  # rank 8001-13000
        "sort_by": "frequency",
        "min_occurrences": 3,
    },
    {
        "name": "expert",
        "rank_start": 8000,
        "rank_end": None,  # open-ended: rest of the 20k list
        "sort_by": "rank",  # hardest (rarest in general English) first
        "min_occurrences": 2,
    },
]


def build_tier(all_words, lemma_freq, proper_noun_ratio, tier, exclude):
    rank_end = tier["rank_end"] if tier["rank_end"] is not None else len(all_words)
    candidates = all_words[tier["rank_start"] : rank_end]
    candidates = [w for w in candidates if re.fullmatch(r"[a-z]{3,}", w)]
    candidates = [w for w in candidates if w not in STOP_WORDS]
    candidates = [w for w in candidates if w not in exclude]
    candidates = [w for w in candidates if w not in EXCLUDE_WORDS]
    candidates = [
        w for w in candidates
        if proper_noun_ratio.get(w, 0) < PROPER_NOUN_RATIO_THRESHOLD
    ]

    min_occ = tier["min_occurrences"]
    qualifying = [w for w in candidates if lemma_freq.get(w, 0) >= min_occ]

    if tier["sort_by"] == "rank":
        # candidates is already in ascending-rank (easy-to-hard) order from
        # the slice above, so reverse it: hardest (highest rank) first.
        scored = list(reversed(qualifying))
    else:
        scored = sorted(qualifying, key=lambda w: lemma_freq.get(w, 0), reverse=True)

    preset = sorted(scored[:TARGET_COUNT])
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

    # Hand-written ja/en glosses maintained under pipeline/meanings/*.json.
    # Merged into one dict; a word missing from every file ships without a
    # meaning (the app tolerates that) but gets warned about here.
    meanings: dict[str, str] = {}
    if MEANINGS_DIR.is_dir():
        for path in sorted(MEANINGS_DIR.glob("*.json")):
            meanings.update(json.loads(path.read_text(encoding="utf-8")))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    seen_in_earlier_tier: set[str] = set()

    for tier in TIERS:
        preset, candidate_count = build_tier(
            all_words, lemma_freq, proper_noun_ratio, tier, seen_in_earlier_tier
        )
        seen_in_earlier_tier |= set(preset)

        missing = [w for w in preset if w not in meanings]
        if missing:
            print(
                f"WARNING [{tier['name']}]: {len(missing)} words lack a gloss in "
                f"pipeline/meanings/: {', '.join(missing[:20])}"
                + (" ..." if len(missing) > 20 else ""),
                file=sys.stderr,
            )

        entries = [
            {"word": w, **({"meaning": meanings[w]} if w in meanings else {})}
            for w in preset
        ]
        out_path = OUT_DIR / f"preset-{tier['name']}.json"
        out_path.write_text(json.dumps(entries, ensure_ascii=False, indent=1), encoding="utf-8")
        rank_end = tier["rank_end"] if tier["rank_end"] is not None else len(all_words)
        print(
            f"wrote {out_path} ({len(preset)} words, {len(preset) - len(missing)} with meanings, "
            f"from {candidate_count} candidates in rank {tier['rank_start'] + 1}-{rank_end}, "
            f"sorted by {tier['sort_by']})",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
