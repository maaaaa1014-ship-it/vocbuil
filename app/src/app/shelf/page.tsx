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
    <main className="mx-auto max-w-md px-5 pt-10 pb-8 flex flex-col gap-6">
      <header className="text-center flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold text-green">本棚</h1>
        <p className="text-sm text-ink-soft">読むほどに、表紙が目覚めていく</p>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
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
