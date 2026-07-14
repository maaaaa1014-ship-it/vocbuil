"""Download the 10 source texts and strip them down to clean body text.

Usage: python3 download_books.py

Writes:
  pipeline/raw/{id}.txt    - untouched downloaded source
  pipeline/clean/{id}.txt  - Gutenberg license header/footer removed
"""

import re
import sys
from pathlib import Path

import warnings

import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

from books import BOOKS

ROOT = Path(__file__).parent
RAW_DIR = ROOT / "raw"
CLEAN_DIR = ROOT / "clean"

START_PATTERNS = [
    re.compile(r"^\*\*\*\s*START OF (THIS|THE) PROJECT GUTENBERG EBOOK.*\*\*\*\s*$", re.I),
    re.compile(r"^\*END THE SMALL PRINT.*\*END\*\s*$", re.I),
]
END_PATTERNS = [
    re.compile(r"^\*\*\*\s*END OF (THIS|THE) PROJECT GUTENBERG EBOOK.*\*\*\*\s*$", re.I),
    re.compile(r"^End of (the |The )?Project Gutenberg", re.I),
]

# Transcriber-credit lines some Gutenberg editions leave right after the
# START marker (before the actual title page / first chapter). These are
# not part of the book and, since they have no terminal punctuation, can
# otherwise get glued onto the first real sentence by the sentencizer.
FRONT_MATTER_PATTERNS = [
    re.compile(r"^Produced by .*$", re.I),
]


def strip_gutenberg_boilerplate(text: str) -> str:
    lines = text.splitlines()

    start_idx = 0
    for i, line in enumerate(lines):
        if any(p.search(line.strip()) for p in START_PATTERNS):
            start_idx = i + 1
            break

    end_idx = len(lines)
    for i in range(start_idx, len(lines)):
        if any(p.search(lines[i].strip()) for p in END_PATTERNS):
            end_idx = i
            break

    body_lines = [
        line
        for line in lines[start_idx:end_idx]
        if not any(p.search(line.strip()) for p in FRONT_MATTER_PATTERNS)
    ]
    body = "\n".join(body_lines)
    return body.strip() + "\n"


def download_gutenberg_txt(book) -> str:
    resp = requests.get(book.source, timeout=60)
    resp.raise_for_status()
    resp.encoding = resp.encoding or "utf-8"
    return resp.text


def download_standard_ebooks_xhtml(book) -> str:
    parts = []
    for chapter_file in book.chapters:
        url = (
            f"https://raw.githubusercontent.com/{book.source}/master/"
            f"src/epub/text/{chapter_file}"
        )
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        for tag in soup.find_all(["h1", "h2", "h3"]):
            tag.decompose()  # chapter numbers/titles, not narrative sentences
        paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
        parts.append("\n\n".join(p for p in paragraphs if p))
    return "\n\n".join(parts) + "\n"


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)

    for book in BOOKS:
        print(f"[{book.id}] downloading ...", file=sys.stderr)
        if book.source_type == "gutenberg_txt":
            raw_text = download_gutenberg_txt(book)
            (RAW_DIR / f"{book.id}.txt").write_text(raw_text, encoding="utf-8")
            clean_text = strip_gutenberg_boilerplate(raw_text)
        elif book.source_type == "standard_ebooks_xhtml":
            clean_text = download_standard_ebooks_xhtml(book)
            (RAW_DIR / f"{book.id}.txt").write_text(clean_text, encoding="utf-8")
        else:
            raise ValueError(f"unknown source_type {book.source_type}")

        (CLEAN_DIR / f"{book.id}.txt").write_text(clean_text, encoding="utf-8")
        word_count = len(clean_text.split())
        print(f"[{book.id}] clean text: {word_count} words", file=sys.stderr)

    print("Done.", file=sys.stderr)


if __name__ == "__main__":
    main()
