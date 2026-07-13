import type { UserWord } from "./types";

const KEYS = {
  wordlist: "vocbuil.wordlist.v1",
  readState: "vocbuil.readState.v1",
  celebrated: "vocbuil.celebrated.v1",
} as const;

export type ReadState = Record<string, { sentences: string[]; lemmas: string[] }>;

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getWordList(): UserWord[] {
  return readJson<UserWord[]>(KEYS.wordlist, []);
}

export function setWordList(words: UserWord[]) {
  writeJson(KEYS.wordlist, words);
}

export function getReadState(): ReadState {
  return readJson<ReadState>(KEYS.readState, {});
}

export function markSentenceRead(bookId: string, sentence: string, lemma: string) {
  const state = getReadState();
  const entry = state[bookId] ?? { sentences: [], lemmas: [] };
  if (!entry.sentences.includes(sentence)) entry.sentences.push(sentence);
  if (!entry.lemmas.includes(lemma)) entry.lemmas.push(lemma);
  state[bookId] = entry;
  writeJson(KEYS.readState, state);
}

export function getReadSentenceSet(bookId: string): Set<string> {
  const state = getReadState();
  return new Set(state[bookId]?.sentences ?? []);
}

export function getBookProgress(bookId: string, goal = 30) {
  const state = getReadState();
  const entry = state[bookId];
  const sentenceCount = entry?.sentences.length ?? 0;
  const lemmaCount = entry?.lemmas.length ?? 0;
  const ratio = Math.min(sentenceCount / goal, 1);
  return { sentenceCount, lemmaCount, ratio };
}

export function getCelebratedBooks(): string[] {
  return readJson<string[]>(KEYS.celebrated, []);
}

export function markBookCelebrated(bookId: string) {
  const list = getCelebratedBooks();
  if (!list.includes(bookId)) {
    list.push(bookId);
    writeJson(KEYS.celebrated, list);
  }
}

export function resetAllProgress() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEYS.readState);
  window.localStorage.removeItem(KEYS.celebrated);
}

export function resetEverything() {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}
