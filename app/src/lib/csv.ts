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
    const word = rawWord.toLowerCase();
    if (seen.has(word)) continue;
    seen.add(word);
    const meaning = row[1]?.trim();
    words.push({ word, meaning: meaning || undefined });
  }
  return words;
}
