import type { BookIndex, BookMeta, PresetTier, UserWord } from "./types";

let booksCache: BookMeta[] | null = null;
const indexCache = new Map<string, BookIndex>();
const presetCache = new Map<string, UserWord[]>();

export async function loadBooks(): Promise<BookMeta[]> {
  if (booksCache) return booksCache;
  const res = await fetch("/data/books.json");
  if (!res.ok) throw new Error("failed to load books.json");
  booksCache = (await res.json()) as BookMeta[];
  return booksCache;
}

export async function loadBookIndex(bookId: string): Promise<BookIndex> {
  const cached = indexCache.get(bookId);
  if (cached) return cached;
  const res = await fetch(`/data/index-${bookId}.json`);
  if (!res.ok) throw new Error(`failed to load index for ${bookId}`);
  const data = (await res.json()) as BookIndex;
  indexCache.set(bookId, data);
  return data;
}

export async function loadAllIndexes(
  books: BookMeta[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Map<string, BookIndex>> {
  const result = new Map<string, BookIndex>();
  let loaded = 0;
  await Promise.all(
    books.map(async (book) => {
      const index = await loadBookIndex(book.id);
      result.set(book.id, index);
      loaded += 1;
      onProgress?.(loaded, books.length);
    })
  );
  return result;
}

export async function loadPreset(tier: PresetTier): Promise<UserWord[]> {
  const cached = presetCache.get(tier);
  if (cached) return cached;
  const res = await fetch(`/data/preset-${tier}.json`);
  if (!res.ok) throw new Error(`failed to load preset-${tier}.json`);
  const data = (await res.json()) as { word: string; meaning?: string }[];
  const words: UserWord[] = data.map((e) => ({ word: e.word, meaning: e.meaning }));
  presetCache.set(tier, words);
  return words;
}
