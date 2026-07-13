"""Build the per-book lemma index and books.json metadata.

Reads pipeline/clean/{id}.txt, splits into sentences with spaCy, lemmatizes,
and writes:
  app/public/data/index-{id}.json  - { lemma: [{sentence, position}, ...] }
  app/public/data/books.json       - book metadata

Usage: python3 build_index.py
"""

import json
import re
import sys
from pathlib import Path

import spacy
from spacy.lang.en.stop_words import STOP_WORDS

from books import BOOKS

ROOT = Path(__file__).parent
CLEAN_DIR = ROOT / "clean"
OUT_DIR = ROOT.parent / "app" / "public" / "data"

MIN_WORDS = 8
MAX_WORDS = 35
MAX_SENTENCES_PER_LEMMA_PER_BOOK = 20
MIN_LEMMA_LEN = 2

# Protect common abbreviations from the rule-based sentencizer by swapping
# their period for a placeholder, then restoring it after sentence split.
ABBREVIATIONS = [
    "Mr.", "Mrs.", "Ms.", "Dr.", "St.", "Mme.", "Mlle.", "Prof.",
    "Jr.", "Sr.", "vs.", "etc.", "i.e.", "e.g.", "No.", "Col.",
    "Gen.", "Capt.", "Lt.", "Rev.", "Fraulein.",
]
_PLACEHOLDER = "⌘"


def protect_abbreviations(text: str) -> str:
    for abbr in ABBREVIATIONS:
        replacement = abbr[:-1] + _PLACEHOLDER
        text = re.sub(re.escape(abbr), replacement, text)
    return text


def restore_abbreviations(text: str) -> str:
    return text.replace(_PLACEHOLDER, ".")


def build_nlp():
    nlp = spacy.blank("en")
    nlp.add_pipe("sentencizer")
    nlp.add_pipe("lemmatizer", config={"mode": "lookup"})
    nlp.initialize()
    return nlp


def clean_sentence_text(raw: str) -> str:
    text = restore_abbreviations(raw)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    nlp = build_nlp()
    nlp.max_length = 3_000_000

    books_meta = []
    lemma_freq: dict[str, int] = {}
    lemma_cap_mid: dict[str, int] = {}
    lemma_occurrences: dict[str, int] = {}

    for book in BOOKS:
        clean_path = CLEAN_DIR / f"{book.id}.txt"
        raw_text = clean_path.read_text(encoding="utf-8")
        total_words = len(raw_text.split())
        protected_text = protect_abbreviations(raw_text)

        print(f"[{book.id}] parsing {total_words} words ...", file=sys.stderr)
        doc = nlp(protected_text)
        total_len = len(protected_text) or 1

        index: dict[str, list[dict]] = {}
        sentence_count = 0

        for sent in doc.sents:
            words = [t for t in sent if t.is_alpha]
            if not (MIN_WORDS <= len(words) <= MAX_WORDS):
                continue

            sentence_text = clean_sentence_text(sent.text)
            if not sentence_text:
                continue

            position = round(sent.start_char / total_len, 4)
            sentence_count += 1

            lemmas_in_sentence = set()
            for tok in words:
                if tok.is_stop:
                    continue
                lemma = tok.lemma_.lower().strip()
                if len(lemma) < MIN_LEMMA_LEN or not lemma.isalpha():
                    continue
                lemmas_in_sentence.add(lemma)

                # Proper-noun heuristic: capitalized mid-sentence (not the
                # sentence's first word), tallied per raw occurrence so the
                # preset builder can filter out character/place names.
                lemma_occurrences[lemma] = lemma_occurrences.get(lemma, 0) + 1
                if tok.i != sent.start and tok.text[:1].isupper():
                    lemma_cap_mid[lemma] = lemma_cap_mid.get(lemma, 0) + 1

            for lemma in lemmas_in_sentence:
                lemma_freq[lemma] = lemma_freq.get(lemma, 0) + 1
                bucket = index.setdefault(lemma, [])
                if len(bucket) >= MAX_SENTENCES_PER_LEMMA_PER_BOOK:
                    continue
                bucket.append({"sentence": sentence_text, "position": position})

        out_path = OUT_DIR / f"index-{book.id}.json"
        out_path.write_text(
            json.dumps(index, ensure_ascii=False, separators=(",", ":"), sort_keys=True),
            encoding="utf-8",
        )
        print(
            f"[{book.id}] {sentence_count} qualifying sentences, "
            f"{len(index)} lemmas -> {out_path.name}",
            file=sys.stderr,
        )

        books_meta.append(
            {
                "id": book.id,
                "title": book.title,
                "author": book.author,
                "totalWords": total_words,
                "cover": book.cover_file,
            }
        )

    books_path = OUT_DIR / "books.json"
    books_path.write_text(
        json.dumps(books_meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"wrote {books_path}", file=sys.stderr)

    freq_path = ROOT / "lemma_freq.json"
    freq_path.write_text(
        json.dumps(lemma_freq, ensure_ascii=False, sort_keys=True), encoding="utf-8"
    )
    print(f"wrote {freq_path} ({len(lemma_freq)} lemmas, pipeline-internal)", file=sys.stderr)

    proper_noun_ratio = {
        lemma: round(lemma_cap_mid.get(lemma, 0) / count, 4)
        for lemma, count in lemma_occurrences.items()
    }
    cap_path = ROOT / "lemma_proper_noun_ratio.json"
    cap_path.write_text(
        json.dumps(proper_noun_ratio, ensure_ascii=False, sort_keys=True), encoding="utf-8"
    )
    print(f"wrote {cap_path} (pipeline-internal, for preset filtering)", file=sys.stderr)


if __name__ == "__main__":
    main()
