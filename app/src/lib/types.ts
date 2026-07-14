export type BookMeta = {
  id: string;
  title: string;
  author: string;
  totalWords: number;
  cover: string;
};

export type IndexEntry = {
  s: string; // core sentence containing the word
  n?: string; // neighbor sentence shown as context
  o?: "b"; // neighbor order: "b" = before the core (default: after)
  p: number; // position in the book, 0-1
  f?: string; // surface form of the word in s (e.g. "meant" for "mean")
};

export type BookIndex = Record<string, IndexEntry[]>;

export type UserWord = {
  word: string; // normalized: lowercased, trimmed
  meaning?: string;
};

export type PresetTier = "intermediate" | "advanced" | "expert";

export type SessionCard = {
  id: string; // stable id: `${bookId}::${core sentence}`
  bookId: string;
  lemma: string;
  sentence: string; // assembled passage shown on the card
  core: string; // the sentence that actually contains the word
  neighbor?: string; // context sentence, if any
  form?: string; // surface form of the word as it appears in core
  position: number;
  meaning?: string;
};

export type SessionResult = {
  cardsRead: number;
  booksVisited: string[];
  lemmasPracticed: string[];
};
