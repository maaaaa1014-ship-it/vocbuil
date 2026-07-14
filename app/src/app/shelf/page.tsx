"use client";

import { useEffect, useState } from "react";
import BookCover from "@/components/BookCover";
import { loadBooks } from "@/lib/dataLoader";
import type { BookMeta } from "@/lib/types";

export default function ShelfPage() {
  const [books, setBooks] = useState<BookMeta[]>([]);

  useEffect(() => {
    loadBooks().then(setBooks);
  }, []);

  return (
    <main className="paper-blobs mx-auto max-w-md px-5 pt-12 pb-10 flex flex-col gap-8">
      <header className="text-center flex flex-col gap-3">
        <p className="font-serif text-[11px] tracking-[0.35em] text-gold uppercase">
          Private Library
        </p>
        <h1 className="font-serif text-4xl font-semibold text-green tracking-[0.3em] pl-[0.3em]">
          書架
        </h1>
        <div className="ornament-rule text-sm" aria-hidden>
          ❦
        </div>
        <p className="text-[13px] text-ink-soft">読むほどに、表紙が目を覚ます</p>
      </header>

      <div className="grid grid-cols-2 gap-x-5 gap-y-8">
        {books.map((book) => (
          <BookCover key={book.id} book={book} />
        ))}
      </div>

      {books.length === 0 && (
        <p className="text-center text-sm text-ink-soft">読み込み中…</p>
      )}
    </main>
  );
}
