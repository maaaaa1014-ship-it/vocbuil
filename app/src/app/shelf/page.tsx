"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCover from "@/components/BookCover";
import { loadBooks } from "@/lib/dataLoader";
import { getReadState } from "@/lib/storage";
import type { BookMeta } from "@/lib/types";

export default function ShelfPage() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [hasProgress, setHasProgress] = useState(true);

  useEffect(() => {
    loadBooks().then(setBooks);
    const state = getReadState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasProgress(
      Object.values(state).some((entry) => entry.sentences.length > 0)
    );
  }, []);

  return (
    <main
      className="paper-blobs mx-auto max-w-md px-5 pt-12 pb-10 flex flex-col gap-8"
      lang="en"
    >
      <header className="text-center flex flex-col gap-3">
        <p className="font-serif text-[11px] tracking-[0.35em] text-gold uppercase">
          名作のかけら
        </p>
        <h1 className="font-serif text-4xl font-semibold text-green tracking-[0.1em]">
          Collection
        </h1>
        <div className="ornament-rule text-sm" aria-hidden>
          ✦
        </div>
        <p className="text-[13px] text-ink-soft">
          Every book you read joins your collection.
        </p>
      </header>

      {!hasProgress && books.length > 0 && (
        <div className="plate-frame rounded-sm px-5 py-4 text-center text-sm text-ink-soft leading-relaxed">
          <p>
            Covers start frosted, and become clear as you read. Your first
            book needs only 10 sentences.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 text-green font-serif tracking-wider underline underline-offset-4 decoration-gold/60"
          >
            Start reading
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-5 gap-y-8">
        {books.map((book) => (
          <BookCover key={book.id} book={book} />
        ))}
      </div>

      {books.length === 0 && (
        <p className="text-center text-sm text-ink-soft">Loading…</p>
      )}
    </main>
  );
}
