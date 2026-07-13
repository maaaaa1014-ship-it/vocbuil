export type BookMeta = {
  id: string;
  title: string;
  author: string;
  totalWords: number;
  cover: string;
};

export type IndexEntry = {
  sentence: string;
  position: number;
};

export type BookIndex = Record<string, IndexEntry[]>;

export type UserWord = {
  word: string; // normalized: lowercased, trimmed
  meaning?: string;
};

export type SessionCard = {
  id: string; // stable id: `${bookId}::${sentence}`
  bookId: string;
  lemma: string;
  sentence: string;
  position: number;
  meaning?: string;
};

export type SessionResult = {
  cardsRead: number;
  booksVisited: string[];
  lemmasPracticed: string[];
};
