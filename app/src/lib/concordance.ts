// Client-side concordance search over the 10-book corpus.
//
// The point of this tool is "usage confirmation": find the sentences where a
// word -- or a multi-word phrase like a phrasal verb ("put me off") --
// actually appears, so you can see how it is used. A phrasal verb is often
// split by its object ("put HER off", "made THEM up"), so a multi-word query
// is matched IN ORDER but allowing a few words in between, instead of only as
// a rigid substring. Wrapping the query in double quotes forces an exact,
// adjacent, whole-word match.

export type BookRef = { id: string; title: string; author: string };

export type SearchBook = { book: BookRef; sentences: string[] };

export type Hit = {
  book: BookRef;
  sentenceIndex: number;
  sentence: string;
  // Character spans (in `sentence`) of the query words that matched, so the
  // UI can highlight exactly the words that formed the hit.
  spans: [number, number][];
  // How many extra words fell between the first and last matched word; 0 is
  // an adjacent phrase. Tighter matches rank first.
  gap: number;
};

export type ParsedQuery = {
  tokens: string[];
  exact: boolean; // quoted -> adjacent, whole-word, no inflection
};

type WordToken = { text: string; start: number; end: number };

// Words may contain internal apostrophes ("don't", "o'clock").
const WORD_RE = /[A-Za-z][A-Za-z']*/g;

// Inflection endings accepted when matching a bare query word, so "gaze"
// finds "gazed/gazes/gazing" and "put" finds "puts/putting". Exact-phrase
// (quoted) queries switch this off.
const SUFFIXES = new Set([
  "s", "es", "ed", "d", "ing", "ings", "er", "ers", "est", "'s", "n't",
]);

export function tokenizeWords(sentence: string): WordToken[] {
  const tokens: WordToken[] = [];
  for (const m of sentence.matchAll(WORD_RE)) {
    tokens.push({ text: m[0], start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
  }
  return tokens;
}

function wordMatches(word: string, query: string, allowInflection: boolean): boolean {
  const w = word.toLowerCase();
  const q = query.toLowerCase();
  if (w === q) return true;
  if (!allowInflection || !w.startsWith(q)) return false;
  const rest = w.slice(q.length);
  if (SUFFIXES.has(rest)) return true;
  // Final-consonant doubling: put -> putting, run -> running, big -> bigger.
  if (q.length >= 2 && rest[0] === q[q.length - 1]) {
    const rest2 = rest.slice(1);
    if (rest2 === "ing" || rest2 === "ed" || rest2 === "er" || rest2 === "est") {
      return true;
    }
  }
  return false;
}

export function parseQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  const quoted = trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"');
  const inner = quoted ? trimmed.slice(1, -1) : trimmed;
  const tokens = inner.split(/\s+/).filter(Boolean);
  return { tokens, exact: quoted };
}

// Finds the tightest in-order match of `queryTokens` inside a tokenized
// sentence, or null if there is none. `maxGap` is the most words allowed
// between two consecutive query words (0 for an exact phrase).
function matchTokens(
  tokens: WordToken[],
  queryTokens: string[],
  maxGap: number,
  allowInflection: boolean
): { spans: [number, number][]; gap: number } | null {
  const n = tokens.length;
  const k = queryTokens.length;
  if (k === 0 || n === 0) return null;

  let best: { spans: [number, number][]; gap: number } | null = null;
  for (let start = 0; start < n; start++) {
    if (!wordMatches(tokens[start].text, queryTokens[0], allowInflection)) continue;
    const chosen = [start];
    let cur = start;
    let ok = true;
    for (let qi = 1; qi < k; qi++) {
      let found = -1;
      for (let j = cur + 1; j < n && j - cur - 1 <= maxGap; j++) {
        if (wordMatches(tokens[j].text, queryTokens[qi], allowInflection)) {
          found = j;
          break;
        }
      }
      if (found < 0) {
        ok = false;
        break;
      }
      chosen.push(found);
      cur = found;
    }
    if (!ok) continue;
    const gap = chosen[chosen.length - 1] - chosen[0] - (k - 1);
    if (!best || gap < best.gap) {
      best = {
        spans: chosen.map((i) => [tokens[i].start, tokens[i].end] as [number, number]),
        gap,
      };
      if (gap === 0) break;
    }
  }
  return best;
}

export type SearchOptions = { maxGap?: number; limit?: number };

export function search(
  raw: string,
  corpus: SearchBook[],
  options: SearchOptions = {}
): Hit[] {
  const { tokens, exact } = parseQuery(raw);
  if (tokens.length === 0) return [];

  const maxGap = exact ? 0 : options.maxGap ?? 3;
  const limit = options.limit ?? 200;
  const allowInflection = !exact;
  const lowerTokens = tokens.map((t) => t.toLowerCase());

  const hits: Hit[] = [];
  for (const { book, sentences } of corpus) {
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      // Cheap superset pre-filter: a sentence can only match if it contains
      // every query word as a substring. Skips the tokenizer on the vast
      // majority of the ~41k sentences on each keystroke.
      const lower = sentence.toLowerCase();
      let maybe = true;
      for (const t of lowerTokens) {
        if (!lower.includes(t)) {
          maybe = false;
          break;
        }
      }
      if (!maybe) continue;

      const tokenized = tokenizeWords(sentence);
      const m = matchTokens(tokenized, tokens, maxGap, allowInflection);
      if (m) {
        hits.push({ book, sentenceIndex: i, sentence, spans: m.spans, gap: m.gap });
      }
    }
  }

  // Tightest matches first (adjacent phrase before scattered words); ties
  // keep corpus order so results feel stable.
  hits.sort((a, b) => a.gap - b.gap);
  return hits.slice(0, limit);
}

// Splits a sentence into rendered segments given the matched spans, so the
// UI can bold exactly the words that matched.
export type Segment = { text: string; highlight: boolean };

export function toSegments(sentence: string, spans: [number, number][]): Segment[] {
  if (spans.length === 0) return [{ text: sentence, highlight: false }];
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  const segments: Segment[] = [];
  let last = 0;
  for (const [start, end] of sorted) {
    if (start > last) segments.push({ text: sentence.slice(last, start), highlight: false });
    segments.push({ text: sentence.slice(start, end), highlight: true });
    last = end;
  }
  if (last < sentence.length) segments.push({ text: sentence.slice(last), highlight: false });
  return segments;
}
