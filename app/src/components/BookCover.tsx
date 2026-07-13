"use client";

import { useEffect, useState } from "react";
import type { BookMeta } from "@/lib/types";
import { getBookProgress, getCelebratedBooks, markBookCelebrated } from "@/lib/storage";

const CONFETTI_COLORS = ["#b3924a", "#1f3d2e", "#f6f1e4", "#33553f"];

export default function BookCover({ book }: { book: BookMeta }) {
  const [progress] = useState(() => getBookProgress(book.id));
  const [imgError, setImgError] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (progress.ratio >= 1 && !getCelebratedBooks().includes(book.id)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCelebrate(true);
      markBookCelebrated(book.id);
      const timer = setTimeout(() => setCelebrate(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [progress.ratio, book.id]);

  const r = progress.ratio;
  const filter = `grayscale(${1 - r}) blur(${4 * (1 - r)}px) brightness(${0.7 + 0.3 * r})`;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-green-soft ${
          r >= 1 ? "animate-glow" : ""
        }`}
      >
        {!imgError ? (
          // Arbitrary user-provided cover file with a JS onError fallback swap.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/covers/${book.cover}`}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-[filter] duration-700"
            style={{ filter }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-3 text-center transition-[filter] duration-700"
            style={{
              filter,
              background:
                "linear-gradient(160deg, var(--color-green) 0%, var(--color-green-soft) 100%)",
            }}
          >
            <span className="font-serif text-paper text-sm leading-snug">{book.title}</span>
          </div>
        )}

        {celebrate && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="animate-confetti absolute top-0 block w-1.5 h-3 rounded-sm"
                style={{
                  left: `${(i * 37) % 100}%`,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  animationDuration: `${1.2 + (i % 5) * 0.2}s`,
                  animationDelay: `${(i % 7) * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-ink truncate">{book.title}</p>
        <div className="w-full h-1.5 rounded-full bg-paper-dim overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${r * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-ink-soft">再会した単語: {progress.lemmaCount}</p>
      </div>
    </div>
  );
}
