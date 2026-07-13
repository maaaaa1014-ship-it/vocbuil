import type { BookIndex, BookMeta, SessionCard, UserWord } from "./types";

export function buildCandidateCards(
  words: UserWord[],
  indexes: Map<string, BookIndex>,
  books: BookMeta[],
  isAlreadyRead: (bookId: string, sentence: string) => boolean
): SessionCard[] {
  const meaningByWord = new Map(words.map((w) => [w.word, w.meaning]));
  const seenSentenceIds = new Set<string>();
  const cards: SessionCard[] = [];

  for (const book of books) {
    const index = indexes.get(book.id);
    if (!index) continue;
    for (const w of words) {
      const entries = index[w.word];
      if (!entries) continue;
      for (const entry of entries) {
        if (isAlreadyRead(book.id, entry.sentence)) continue;
        const id = `${book.id}::${entry.sentence}`;
        if (seenSentenceIds.has(id)) continue;
        seenSentenceIds.add(id);
        cards.push({
          id,
          bookId: book.id,
          lemma: w.word,
          sentence: entry.sentence,
          position: entry.position,
          meaning: meaningByWord.get(w.word),
        });
      }
    }
  }
  return cards;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickSessionCards(candidates: SessionCard[], count = 10): SessionCard[] {
  return shuffle(candidates).slice(0, count);
}
