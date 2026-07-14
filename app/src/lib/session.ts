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

// Builds one session of up to `count` cards drawn from at most `maxBooks`
// books, so the reader stays with a story instead of hopping between all ten.
// Books the user has already started take priority (the story continues
// across sessions); cards within a book always run in source-text order.
export function pickSessionCards(
  candidates: SessionCard[],
  count = 10,
  maxBooks = 3,
  progressByBook: Map<string, number> = new Map()
): SessionCard[] {
  const byBook = new Map<string, SessionCard[]>();
  for (const card of candidates) {
    const bucket = byBook.get(card.bookId) ?? [];
    bucket.push(card);
    byBook.set(card.bookId, bucket);
  }
  for (const bucket of byBook.values()) {
    bucket.sort((a, b) => a.position - b.position);
  }

  // Shuffle for tie-breaking variety, then float in-progress books to the
  // front (Array.prototype.sort is stable, so the shuffle survives ties).
  const bookIds = shuffle([...byBook.keys()]).sort(
    (a, b) => (progressByBook.get(b) ?? 0) - (progressByBook.get(a) ?? 0)
  );
  const chosenBooks = bookIds.slice(0, maxBooks);

  // First pass: give each book an even share; second pass: top up from the
  // same books if some had too few cards. Result stays grouped by book and
  // ordered by position within each book.
  const perBookTarget = Math.ceil(count / Math.max(1, Math.min(maxBooks, chosenBooks.length)));
  const taken = new Map<string, number>();
  let total = 0;
  for (const bookId of chosenBooks) {
    const n = Math.min(perBookTarget, byBook.get(bookId)!.length, count - total);
    taken.set(bookId, n);
    total += n;
    if (total >= count) break;
  }
  for (const bookId of chosenBooks) {
    if (total >= count) break;
    const available = byBook.get(bookId)!.length;
    const already = taken.get(bookId) ?? 0;
    const extra = Math.min(available - already, count - total);
    if (extra > 0) {
      taken.set(bookId, already + extra);
      total += extra;
    }
  }

  const result: SessionCard[] = [];
  for (const bookId of chosenBooks) {
    const n = taken.get(bookId) ?? 0;
    if (n > 0) result.push(...byBook.get(bookId)!.slice(0, n));
  }
  return result;
}
