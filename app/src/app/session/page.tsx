"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SentenceCard from "@/components/SentenceCard";
import { loadAllIndexes, loadBooks } from "@/lib/dataLoader";
import { buildCandidateCards, pickSessionCards } from "@/lib/session";
import { getReadState, getWordList, markSentenceRead } from "@/lib/storage";
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
      const progressByBook = new Map(
        Object.entries(readState).map(([bookId, entry]) => [bookId, entry.sentences.length])
      );
      const picked = pickSessionCards(candidates, 10, 3, progressByBook);

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
    setCardIndex((i) => i + 1);
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
