import type { BookRef, SearchBook } from "./concordance";

// The full-text corpus is ~3.6 MB of sentences across 10 files. It is
// fetched once, in parallel, and kept in memory for the rest of the session
// so repeat searches are instant. Vercel serves the JSON brotli-compressed,
// so the real transfer is far smaller than the raw size.
let cache: SearchBook[] | null = null;
let inflight: Promise<SearchBook[]> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function loadSearchCorpus(
  onProgress?: (loaded: number, total: number) => void
): Promise<SearchBook[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const manifest = await fetchJson<BookRef[]>("/data/search-manifest.json");
    let loaded = 0;
    const books = await Promise.all(
      manifest.map(async (book) => {
        const sentences = await fetchJson<string[]>(`/data/search-${book.id}.json`);
        loaded += 1;
        onProgress?.(loaded, manifest.length);
        return { book, sentences };
      })
    );
    cache = books;
    inflight = null;
    return books;
  })();

  return inflight;
}
