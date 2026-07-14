"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SentenceCard from "@/components/SentenceCard";
import { loadAllIndexes, loadBooks } from "@/lib/dataLoader";
import { buildCandidateCards, pickSessionCards } from "@/lib/session";
import {
  clearPendingFirstSession,
  getPendingFirstSession,
  getReadState,
  getWordList,
  markSentenceRead,
  setOnboarded,
} from "@/lib/storage";
import type { BookMeta, SessionCard as SessionCardType } from "@/lib/types";

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const words = getWordList();
      if (words.length === 0) {
        router.replace("/");
        return;
      }

      setProgressMsg("本を開いています…");
      const bookList = await loadBooks();
      const readState = getReadState();
      const indexes = await loadAllIndexes(bookList, (loaded, total) => {
        if (!cancelled) setProgressMsg(`索引を読み込み中… (${loaded}/${total})`);
      });
      if (cancelled) return;

      const isAlreadyRead = (bookId: string, sentence: string) =>
        readState[bookId]?.sentences.includes(sentence) ?? false;

      const candidates = buildCandidateCards(words, indexes, bookList, isAlreadyRead);

      // Onboarding: the first session is pinned to the featured book so the
      // 10 cards complete its reduced unlock goal in one sitting.
      const pendingBook = getPendingFirstSession();
      let picked: SessionCardType[];
      if (pendingBook) {
        picked = candidates
          .filter((c) => c.bookId === pendingBook)
          .sort((a, b) => a.position - b.position)
          .slice(0, 10);
        if (picked.length > 0) setOnboardingBook(pendingBook);
      } else {
        picked = [];
      }
      if (picked.length === 0) {
        const progressByBook = new Map(
          Object.entries(readState).map(([bookId, entry]) => [bookId, entry.sentences.length])
        );
        picked = pickSessionCards(candidates, 10, 3, progressByBook);
      }

      setBooks(bookList);
      setCards(picked);
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

  function handleRead() {
    if (!currentCard) return;
    markSentenceRead(currentCard.bookId, currentCard.sentence, currentCard.lemma);
    setReadCount((n) => n + 1);
    const next = cardIndex + 1;
    if (next >= cards.length && onboardingBook) {
      clearPendingFirstSession();
      setOnboarded();
    }
    setCardIndex(next);
  }

  if (loadState === "loading") {
    return (
      <main className="mx-auto max-w-md px-5 pt-24 flex flex-col items-center gap-4 text-center">
        <p className="text-ink-soft text-sm">{progressMsg}</p>
      </main>
    );
  }

  if (loadState === "empty") {
    return (
      <main className="mx-auto max-w-md px-5 pt-24 flex flex-col items-center gap-5 text-center">
        <h1 className="font-serif text-2xl text-green tracking-wider">
          一致するセンテンスがありません
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed">
          登録した単語がまだ本の中で見つからなかったか、すでに読み終えています。
          単語リストを増やすか、書架で進捗を確認してみてください。
        </p>
        <Link
          href="/"
          className="rounded-sm bg-green text-paper px-8 py-3 text-sm font-serif tracking-widest"
        >
          単語帖に戻る
        </Link>
      </main>
    );
  }

  const finished = cardIndex >= cards.length;

  if (finished) {
    const uniqueBooks = new Set(cards.map((c) => c.bookId));
    const uniqueLemmas = new Set(cards.map((c) => c.lemma));

    if (onboardingBook) {
      const unlocked = bookById.get(onboardingBook);
      return (
        <main className="scene min-h-dvh flex flex-col justify-between px-8 py-14 text-center">
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

          <p className="font-serif text-xs tracking-[0.4em] text-gold-soft uppercase">
            Chapter One — Complete
          </p>

          <div className="flex flex-col items-center gap-5 animate-fade-up">
            <p className="text-gold text-2xl" aria-hidden>
              ❦
            </p>
            <h1 className="font-serif text-2xl leading-relaxed">
              最初の一冊が
              <br />
              目を覚ましました
            </h1>
            <div className="ornament-rule w-52 text-sm" aria-hidden>
              ◆
            </div>
            <p className="font-serif text-lg italic text-paper/85" lang="en">
              {unlocked?.title}
            </p>
            <p className="text-sm text-paper/70 leading-relaxed mt-1">
              {readCount} の一節、{uniqueLemmas.size} の言葉との再会。
              <br />
              あなたの書架に、最初の彩りが差しました。
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/shelf"
              className="rounded-sm bg-gold text-green py-4 text-base font-serif font-semibold tracking-[0.25em] shadow-lg"
            >
              書架で確かめる
            </Link>
            <Link
              href="/"
              className="text-xs text-paper/60 underline underline-offset-4 py-2"
            >
              単語帖へ
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-md px-5 pt-20 flex flex-col items-center gap-6 text-center">
        <p className="text-gold text-lg" aria-hidden>
          ❦
        </p>
        <h1 className="font-serif text-3xl text-green tracking-[0.15em]">
          おつかれさまでした
        </h1>
        <div className="ornament-rule w-full text-xs" aria-hidden>
          ◆
        </div>
        <p className="text-ink-soft text-sm leading-relaxed">
          {readCount} の一節を読み、
          <br />
          {uniqueLemmas.size} 語・{uniqueBooks.size} 冊の本と再会しました。
        </p>
        <div className="flex flex-col gap-3 w-full mt-2">
          <Link
            href="/shelf"
            className="rounded-sm bg-green text-paper py-3.5 text-sm font-serif tracking-[0.25em]"
          >
            書架を見る
          </Link>
          <Link
            href="/"
            className="rounded-sm border border-green text-green py-3.5 text-sm font-serif tracking-[0.25em]"
          >
            単語帖に戻る
          </Link>
        </div>
      </main>
    );
  }

  const book = bookById.get(currentCard.bookId);

  return (
    <main className="mx-auto max-w-md px-5 pt-6 pb-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs text-ink-soft underline underline-offset-2 decoration-gold/60"
        >
          ✕ やめる
        </Link>
        <p className="text-xs text-ink-soft font-serif tracking-widest">
          {cardIndex + 1} / {cards.length}
        </p>
      </div>

      <div className="w-full h-px bg-gold/25 relative">
        <div
          className="absolute inset-y-0 left-0 -top-px h-[3px] bg-gold transition-all duration-300"
          style={{ width: `${(cardIndex / cards.length) * 100}%` }}
        />
      </div>

      <SentenceCard
        sentence={currentCard.sentence}
        lemmas={[...meanings.keys()]}
        meanings={meanings}
        bookTitle={book?.title ?? currentCard.bookId}
        author={book?.author ?? ""}
      />

      <button
        type="button"
        onClick={handleRead}
        className="rounded-sm bg-green text-paper py-4 text-base font-serif tracking-[0.25em] shadow-sm mt-4"
      >
        読めた ✓
      </button>
    </main>
  );
}
