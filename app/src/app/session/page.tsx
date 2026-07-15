"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SentenceCard from "@/components/SentenceCard";
import { loadAllIndexes, loadBookIndex, loadBooks } from "@/lib/dataLoader";
import { buildCandidateCards, pickSessionCards } from "@/lib/session";
import { buildSessionShareText, buildUnlockShareText, shareText } from "@/lib/share";
import {
  addLearnedWords,
  clearPendingFirstSession,
  getBookProgress,
  getPendingFirstSession,
  getReadState,
  getWordList,
  isWordHintSeen,
  markCardRead,
  markWordHintSeen,
  setOnboarded,
  type LearnedEntry,
} from "@/lib/storage";
import type { BookIndex, BookMeta, SessionCard as SessionCardType } from "@/lib/types";

type LoadState = "loading" | "empty" | "ready";

export default function SessionPage() {
  const router = useRouter();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [cards, setCards] = useState<SessionCardType[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [onboardingBook, setOnboardingBook] = useState<string | null>(null);
  const [showWordHint, setShowWordHint] = useState(false);
  const [learnedEntries, setLearnedEntries] = useState<LearnedEntry[]>([]);
  const [unlockedBooks, setUnlockedBooks] = useState<BookMeta[]>([]);

  // Words the user tapped to look up during this session (word -> bookId).
  const tappedRef = useRef<Map<string, string>>(new Map());
  // Books that were already fully unlocked before this session started.
  const startUnlockedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const words = getWordList();
      if (words.length === 0) {
        router.replace("/");
        return;
      }

      setProgressMsg("Opening your books…");
      const bookList = await loadBooks();
      const readState = getReadState();
      startUnlockedRef.current = new Set(
        bookList.filter((b) => getBookProgress(b.id).ratio >= 1).map((b) => b.id)
      );

      // A sentence counts as seen if it was stored as a key directly, or —
      // for data recorded before cores and neighbors were tracked
      // separately — if it appears inside a stored full-passage string.
      const isSeen = (bookId: string, key: string) => {
        const stored = readState[bookId]?.sentences;
        if (!stored) return false;
        return stored.some((x) => x === key || x.includes(key));
      };

      // The onboarding session is pinned to one featured book, so only that
      // book's index is needed -- one download instead of ten makes the
      // time-to-first-card much shorter on a first visit.
      const pendingBook = getPendingFirstSession();
      let picked: SessionCardType[] = [];
      if (pendingBook) {
        const index = await loadBookIndex(pendingBook);
        if (cancelled) return;
        const single = new Map<string, BookIndex>([[pendingBook, index]]);
        picked = buildCandidateCards(words, single, bookList, isSeen)
          .sort((a, b) => a.position - b.position)
          .slice(0, 10);
        if (picked.length > 0) setOnboardingBook(pendingBook);
      }

      if (picked.length === 0) {
        const indexes = await loadAllIndexes(bookList, (loaded, total) => {
          if (!cancelled) setProgressMsg(`Loading books… (${loaded}/${total})`);
        });
        if (cancelled) return;
        const candidates = buildCandidateCards(words, indexes, bookList, isSeen);
        const progressByBook = new Map(
          Object.entries(readState).map(([bookId, entry]) => [
            bookId,
            entry.cards ?? entry.sentences.length,
          ])
        );
        picked = pickSessionCards(
          candidates,
          10,
          3,
          progressByBook,
          startUnlockedRef.current
        );
      }

      setBooks(bookList);
      setCards(picked);
      setShowWordHint(!isWordHintSeen());
      setLoadState(picked.length === 0 ? "empty" : "ready");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const meanings = new Map(getWordList().map((w) => [w.word, w.meaning]));

  const bookById = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const currentCard = cards[cardIndex];

  function dismissWordHint() {
    if (!showWordHint) return;
    markWordHintSeen();
    setShowWordHint(false);
  }

  function handleWordTap(lemma: string) {
    dismissWordHint();
    if (currentCard) tappedRef.current.set(lemma, currentCard.bookId);
  }

  function finishSession() {
    // Collect this session's words -- each card's featured word plus every
    // word the user tapped -- into the learned-words log.
    const date = new Date().toISOString().slice(0, 10);
    const byKey = new Map<string, LearnedEntry>();
    for (const card of cards) {
      byKey.set(`${card.lemma}::${card.bookId}`, {
        word: card.lemma,
        meaning: card.meaning,
        bookId: card.bookId,
        bookTitle: bookById.get(card.bookId)?.title ?? card.bookId,
        date,
      });
    }
    for (const [word, bookId] of tappedRef.current) {
      byKey.set(`${word}::${bookId}`, {
        word,
        meaning: meanings.get(word),
        bookId,
        bookTitle: bookById.get(bookId)?.title ?? bookId,
        date,
      });
    }
    const entries = [...byKey.values()];
    addLearnedWords(entries);
    setLearnedEntries(entries);

    const newlyUnlocked = [...new Set(cards.map((c) => c.bookId))]
      .filter(
        (id) => !startUnlockedRef.current.has(id) && getBookProgress(id).ratio >= 1
      )
      .map((id) => bookById.get(id))
      .filter((b): b is BookMeta => Boolean(b));
    setUnlockedBooks(newlyUnlocked);

    // Completing a session retires the first-time word hint even if the
    // user never tapped a word: they've now seen 10 cards of it.
    dismissWordHint();
    if (onboardingBook) {
      clearPendingFirstSession();
      setOnboarded();
    }
  }

  function handleRead() {
    if (!currentCard) return;
    // Both the core sentence and its context neighbor count as seen, so
    // neither can resurface inside a different passage later.
    markCardRead(
      currentCard.bookId,
      [currentCard.core, ...(currentCard.neighbor ? [currentCard.neighbor] : [])],
      currentCard.lemma
    );
    setReadCount((n) => n + 1);
    const next = cardIndex + 1;
    if (next >= cards.length) finishSession();
    setCardIndex(next);
  }

  function handleShareSession() {
    const words = learnedEntries.map((e) => e.word);
    const titles = [...new Set(learnedEntries.map((e) => e.bookTitle))];
    void shareText(buildSessionShareText(words, titles));
  }

  function handleShareUnlock(title: string) {
    void shareText(buildUnlockShareText(title));
  }

  if (loadState === "loading") {
    return (
      <main className="mx-auto max-w-md px-5 pt-24 flex flex-col items-center gap-4 text-center">
        <p className="text-gold text-xl animate-play-pulse" aria-hidden>
          ✦
        </p>
        <p className="text-ink-soft text-sm">{progressMsg}</p>
      </main>
    );
  }

  if (loadState === "empty") {
    return (
      <main
        className="mx-auto max-w-md px-5 pt-24 flex flex-col items-center gap-5 text-center"
        lang="en"
      >
        <h1 className="font-serif text-2xl text-green tracking-wider">
          No sentences found
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed">
          Your words were not found in the books, or you have already read
          every matching sentence. Try adding more words.
        </p>
        <Link
          href="/"
          className="rounded-sm bg-green text-paper px-8 py-3 text-sm font-serif tracking-widest"
        >
          Back to My Words
        </Link>
      </main>
    );
  }

  const finished = cardIndex >= cards.length;

  if (finished) {
    const uniqueBooks = new Set(cards.map((c) => c.bookId));

    if (onboardingBook) {
      const unlocked = bookById.get(onboardingBook);
      return (
        <main className="scene min-h-dvh flex flex-col justify-between px-8 py-12 text-center">
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            aria-hidden
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <span
                key={i}
                className="animate-confetti absolute top-0 block w-1.5 h-3 rounded-sm"
                style={{
                  left: `${(i * 31) % 100}%`,
                  backgroundColor: ["#a98637", "#c8b078", "#f5efdf", "#6e2b35"][i % 4],
                  animationDuration: `${1.6 + (i % 5) * 0.3}s`,
                  animationDelay: `${(i % 8) * 0.12}s`,
                }}
              />
            ))}
          </div>

          <p className="font-serif text-xs tracking-[0.4em] text-gold-soft uppercase" lang="en">
            First book complete
          </p>

          <div className="flex flex-col items-center gap-4 animate-fade-up" lang="en">
            <p className="text-gold text-2xl" aria-hidden>
              ❦
            </p>
            <h1 className="font-serif text-2xl leading-relaxed">
              This book is now
              <br />
              in your collection.
            </h1>
            <div className="ornament-rule w-52 text-sm" aria-hidden>
              ◆
            </div>
            <p className="font-serif text-lg italic text-paper/85">{unlocked?.title}</p>
            <p className="text-sm text-paper/70 leading-relaxed">
              You read {readCount} sentences and met {learnedEntries.length} of
              your words in context.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-xs">
              {learnedEntries.slice(0, 8).map((e) => (
                <span
                  key={`${e.word}-${e.bookId}`}
                  className="text-xs font-serif border border-paper/30 text-paper/85 rounded-full px-2.5 py-1"
                >
                  {e.word}
                </span>
              ))}
              {learnedEntries.length > 8 && (
                <span className="text-xs text-paper/60 px-1 py-1">
                  +{learnedEntries.length - 8}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3" lang="en">
            <button
              type="button"
              onClick={() => unlocked && handleShareUnlock(unlocked.title)}
              className="rounded-sm bg-gold text-green py-4 text-base font-serif font-semibold tracking-[0.2em] shadow-lg"
            >
              Share ✦
            </button>
            <Link
              href="/shelf"
              className="rounded-sm border border-paper/40 text-paper py-3.5 text-sm font-serif tracking-[0.2em]"
            >
              See my collection
            </Link>
            <Link
              href="/"
              className="text-xs text-paper/60 underline underline-offset-4 py-1"
            >
              Go to My Words
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main
        className="mx-auto max-w-md px-5 pt-14 pb-10 flex flex-col items-center gap-5 text-center"
        lang="en"
      >
        <p className="text-gold text-lg" aria-hidden>
          ❦
        </p>
        <h1 className="font-serif text-3xl text-green tracking-[0.15em]">
          Session complete
        </h1>
        <div className="ornament-rule w-full text-xs" aria-hidden>
          ◆
        </div>

        {unlockedBooks.map((b) => (
          <div
            key={b.id}
            className="w-full rounded-sm bg-green text-paper px-5 py-4 flex flex-col gap-2 animate-fade-up"
          >
            <p className="text-xs tracking-[0.3em] uppercase text-gold-soft">
              New in your collection
            </p>
            <p className="font-serif text-lg italic">{b.title}</p>
            <button
              type="button"
              onClick={() => handleShareUnlock(b.title)}
              className="self-center mt-1 rounded-sm border border-gold-soft/60 text-gold-soft px-5 py-2 text-xs font-serif tracking-[0.2em]"
            >
              Share this book ✦
            </button>
          </div>
        ))}

        <p className="text-ink-soft text-sm leading-relaxed">
          You read {readCount} sentences and met {learnedEntries.length} of
          your words in {uniqueBooks.size} {uniqueBooks.size === 1 ? "book" : "books"}.
        </p>

        <section className="plate-frame rounded-sm w-full p-5 flex flex-col gap-3 text-left">
          <h2 className="font-serif text-base text-wine tracking-wider text-center">
            Words you met
          </h2>
          <ul className="flex flex-col gap-2.5">
            {learnedEntries.map((e) => (
              <li key={`${e.word}-${e.bookId}`} className="leading-snug">
                <span className="font-serif font-semibold text-wine">{e.word}</span>
                {e.meaning && (
                  <span className="text-xs text-ink-soft"> — {e.meaning}</span>
                )}
                <span className="block text-[11px] text-ink-soft/80 italic font-serif">
                  {e.bookTitle}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-3 w-full mt-1">
          <button
            type="button"
            onClick={handleShareSession}
            className="rounded-sm bg-gold text-green py-3.5 text-sm font-serif font-semibold tracking-[0.2em] shadow-sm"
          >
            Share today&apos;s words ✦
          </button>
          <Link
            href="/shelf"
            className="rounded-sm bg-green text-paper py-3.5 text-sm font-serif tracking-[0.2em]"
          >
            See my collection
          </Link>
          <Link
            href="/"
            className="rounded-sm border border-green text-green py-3.5 text-sm font-serif tracking-[0.2em]"
          >
            Back to My Words
          </Link>
        </div>
      </main>
    );
  }

  const book = bookById.get(currentCard.bookId);
  const remaining = cards.length - cardIndex;

  return (
    <main className="mx-auto max-w-md px-5 pt-6 pb-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-ink-soft underline underline-offset-2 decoration-gold/60"
          lang="en"
        >
          ✕ Quit
        </Link>
        <p className="text-xs text-ink-soft font-serif tracking-widest">
          {cardIndex + 1} / {cards.length}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="w-full h-px bg-gold/25 relative">
          <div
            className="absolute inset-y-0 left-0 -top-px h-[3px] bg-gold transition-all duration-300"
            style={{ width: `${(cardIndex / cards.length) * 100}%` }}
          />
        </div>
        {onboardingBook && (
          <p className="text-[11px] text-ink-soft text-center" lang="en">
            <span className="font-serif text-gold">{remaining}</span>{" "}
            {remaining === 1 ? "sentence" : "sentences"} left to collect this
            book
          </p>
        )}
      </div>

      {showWordHint && cardIndex === 0 && (
        <div
          className="animate-fade-up self-center rounded-full border border-gold/50 bg-paper-dim/80 px-4 py-2 text-xs text-ink-soft flex items-center gap-2"
          lang="en"
        >
          <span aria-hidden>👆</span>
          <span>
            Tap a <span className="text-wine font-semibold">highlighted</span>{" "}
            word to see its meaning
          </span>
        </div>
      )}

      <SentenceCard
        key={currentCard.id}
        sentence={currentCard.sentence}
        lemmas={[...meanings.keys()]}
        meanings={meanings}
        bookTitle={book?.title ?? currentCard.bookId}
        author={book?.author ?? ""}
        featured={{ form: currentCard.form, lemma: currentCard.lemma }}
        hintActive={showWordHint && cardIndex === 0}
        onWordTap={handleWordTap}
      />

      <button
        type="button"
        onClick={handleRead}
        className="rounded-sm bg-green text-paper py-4 text-base font-serif tracking-[0.25em] shadow-sm mt-4"
      >
        Got it ✓
      </button>
    </main>
  );
}
