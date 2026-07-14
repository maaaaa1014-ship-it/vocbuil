import type { UserWord } from "./types";

const KEYS = {
  wordlist: "vocbuil.wordlist.v1",
  readState: "vocbuil.readState.v1",
  celebrated: "vocbuil.celebrated.v1",
  onboarded: "vocbuil.onboarded.v1",
  firstBook: "vocbuil.firstBook.v1",
  pendingFirstSession: "vocbuil.pendingFirstSession.v1",
} as const;

// The very first book a user reads unlocks after only 10 sentences, so the
// onboarding session ends with a full unlock; every later book takes 30.
export const FIRST_BOOK_GOAL = 10;
export const BOOK_GOAL = 30;

// Design theme. Deliberately outside KEYS so data resets keep the choice.
// "library" = dark green antique (A), "crystal" = glass and pastel (B).
export type Theme = "library" | "crystal";
const THEME_KEY = "vocbuil.theme.v1";
export const DEFAULT_THEME: Theme = "crystal";

export function getTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const raw = window.localStorage.getItem(THEME_KEY);
  return raw === "library" || raw === "crystal" ? raw : DEFAULT_THEME;
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

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

  // The first book ever read gets the reduced unlock goal (see FIRST_BOOK_GOAL).
  if (!getFirstBook()) {
    writeJson(KEYS.firstBook, bookId);
  }
}

export function getFirstBook(): string | null {
  return readJson<string | null>(KEYS.firstBook, null);
}

export function isOnboarded(): boolean {
  return readJson<boolean>(KEYS.onboarded, false);
}

export function setOnboarded() {
  writeJson(KEYS.onboarded, true);
}

// While onboarding, the first session is pinned to one featured book;
// the pending flag stores its id and survives a mid-session quit.
export function getPendingFirstSession(): string | null {
  return readJson<string | null>(KEYS.pendingFirstSession, null);
}

export function setPendingFirstSession(bookId: string) {
  writeJson(KEYS.pendingFirstSession, bookId);
}

export function clearPendingFirstSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEYS.pendingFirstSession);
}

export function getReadSentenceSet(bookId: string): Set<string> {
  const state = getReadState();
  return new Set(state[bookId]?.sentences ?? []);
}

export function getBookGoal(bookId: string): number {
  return bookId === getFirstBook() ? FIRST_BOOK_GOAL : BOOK_GOAL;
}

export function getBookProgress(bookId: string) {
  const state = getReadState();
  const entry = state[bookId];
  const sentenceCount = entry?.sentences.length ?? 0;
  const lemmaCount = entry?.lemmas.length ?? 0;
  const ratio = Math.min(sentenceCount / getBookGoal(bookId), 1);
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
  window.localStorage.removeItem(KEYS.firstBook);
  window.localStorage.removeItem(KEYS.pendingFirstSession);
}

export function resetEverything() {
  if (!isBrowser()) return;
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}
