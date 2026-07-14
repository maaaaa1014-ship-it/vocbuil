import Papa from "papaparse";
import type { UserWord } from "./types";

const HEADER_HINTS = new Set([
  "word",
  "words",
  "english",
  "vocab",
  "vocabulary",
  "term",
  "単語",
  "英単語",
  "語彙",
]);

const WORD_LIKE = /^[a-zA-Z][a-zA-Z'\-\s]*$/;

// A trailing part-of-speech / usage tag some vocab lists append, e.g.
// "wax (v)", "run (n.)" -- strip it so the bare word can still match.
const TRAILING_ANNOTATION = /\s*\([^)]*\)\s*$/;

// Expands one CSV word cell into the individual word forms worth trying
// to match, e.g. "ardor / ardour" -> ["ardor", "ardour"]. Multi-word
// phrases (e.g. "kick up", "tuckered out") are left as a single phrase
// rather than split into their component words: matching just "kick"
// for "kick up" would show sentences about literal kicking, not the
// idiom the learner actually wants, which is more misleading than no
// match at all.
function expandWordCell(raw: string): string[] {
  return raw
    .split("/")
    .map((part) => part.replace(TRAILING_ANNOTATION, "").trim().toLowerCase())
    .filter(Boolean);
}

export function parseWordListCsv(text: string): UserWord[] {
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  const rows = parsed.data.filter((row) => row.length > 0);
  if (rows.length === 0) return [];

  const firstCell = (rows[0][0] ?? "").trim();
  const looksLikeHeader =
    HEADER_HINTS.has(firstCell.toLowerCase()) || !WORD_LIKE.test(firstCell);
  const startIdx = looksLikeHeader ? 1 : 0;

  const words: UserWord[] = [];
  const seen = new Set<string>();
  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    const rawWord = (row[0] ?? "").trim();
    if (!rawWord) continue;
    const meaning = row[1]?.trim();
    for (const word of expandWordCell(rawWord)) {
      if (seen.has(word)) continue;
      seen.add(word);
      words.push({ word, meaning: meaning || undefined });
    }
  }
  return words;
}
