"""Build the full-text search corpus for the concordance app.

Unlike build_index.py (which keeps only 8-35 word sentences that carry a
study lemma), this keeps EVERY sentence of every book, in source order, so
the search app can look up any word or multi-word phrase -- including
phrasal verbs like "put me off" -- and show the sentence it appears in.

Reads pipeline/clean/{id}.txt and writes, for each book:
  app/public/data/search-{id}.json  - ["sentence", "sentence", ...]

Sentences are stored in reading order, so the app can show the sentence
before/after a hit as surrounding context. Splitting reuses the exact same
spaCy pipeline and abbreviation/paragraph handling as build_index.py, so
the two datasets stay consistent.

Usage: python3 build_search.py
"""

import json
import sys
from pathlib import Path

from books import BOOKS
from build_index import build_nlp, clean_sentence_text, protect_abbreviations

ROOT = Path(__file__).parent
CLEAN_DIR = ROOT / "clean"
OUT_DIR = ROOT.parent / "app" / "public" / "data"

# A sentence this short is almost always a stray heading fragment or a
# split artifact, not usable "usage" -- drop it from the search corpus.
MIN_CHARS = 6


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    nlp = build_nlp()
    nlp.max_length = 3_000_000

    manifest = []
    for book in BOOKS:
        clean_path = CLEAN_DIR / f"{book.id}.txt"
        raw_text = clean_path.read_text(encoding="utf-8")
        protected_text = protect_abbreviations(raw_text)

        print(f"[{book.id}] parsing ...", file=sys.stderr)
        doc = nlp(protected_text)

        sentences = []
        for sent in doc.sents:
            text = clean_sentence_text(sent.text)
            if len(text) < MIN_CHARS:
                continue
            sentences.append(text)

        out_path = OUT_DIR / f"search-{book.id}.json"
        out_path.write_text(
            json.dumps(sentences, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        size_kb = out_path.stat().st_size // 1024
        print(
            f"[{book.id}] {len(sentences)} sentences -> {out_path.name} ({size_kb} KB)",
            file=sys.stderr,
        )
        manifest.append({"id": book.id, "title": book.title, "author": book.author})

    manifest_path = OUT_DIR / "search-manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"wrote {manifest_path.name}", file=sys.stderr)


if __name__ == "__main__":
    main()
