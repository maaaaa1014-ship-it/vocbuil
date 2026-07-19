"use client";

import { useEffect, useRef, useState } from "react";
import type { BookMeta } from "@/lib/types";
import {
  getBookProgress,
  getCelebratedBooks,
  getTheme,
  markBookCelebrated,
} from "@/lib/storage";

const CONFETTI_COLORS = ["#a98637", "#1e3b2c", "#f5efdf", "#6e2b35"];

// Muted, oil-painting-style washes for the Library theme's placeholder
// covers, one per book so the collection reads like a small gallery
// instead of ten identical green rectangles. [wash, mid tone, warm edge]
const PAINTING_PALETTES: Record<string, [string, string, string]> = {
  "anne-of-green-gables": ["#3a5a40", "#8a9b6e", "#d9c98b"],
  "pride-and-prejudice": ["#1f2a44", "#6f7fa8", "#c9a668"],
  "the-secret-garden": ["#3f5b3a", "#8a9b6e", "#c98a93"],
  "a-little-princess": ["#5c2a2a", "#8a5a3a", "#c9a668"],
  "the-wonderful-wizard-of-oz": ["#245c46", "#4d7a5a", "#d4af37"],
  "peter-pan": ["#22284a", "#3d4a7a", "#8896c4"],
  "alices-adventures-in-wonderland": ["#4a3f6b", "#6a5a8f", "#4f8a8b"],
  "heidi": ["#3a5f4d", "#5f8a6e", "#7fa6c9"],
  "daddy-long-legs": ["#4a3524", "#7a5a3a", "#a97a4b"],
  "the-wind-in-the-willows": ["#2f4a3d", "#5a6b3f", "#8a9b5e"],
  "around-the-world-in-eighty-days": ["#274156", "#3f6b82", "#d4b06a"],
  "the-blue-castle": ["#26385f", "#4a6ea3", "#9db6d8"],
  "a-damsel-in-distress": ["#4a2f3a", "#7a4a5a", "#c9a668"],
};
const DEFAULT_PALETTE: [string, string, string] = ["#3a5a40", "#8a9b6e", "#c9a668"];

export default function BookCover({ book }: { book: BookMeta }) {
  const [progress] = useState(() => getBookProgress(book.id));
  const [imgError, setImgError] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [theme] = useState(() => getTheme());
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // A missing cover can 404 before hydration attaches onError, so the
    // event never reaches React. Re-check the already-settled state here.
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setImgError(true);
    }
  }, []);

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
  const [wash, mid, edge] = PAINTING_PALETTES[book.id] ?? DEFAULT_PALETTE;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`relative aspect-[2/3] rounded-sm overflow-hidden bg-green-soft border border-gold/40 shadow-[2px_3px_6px_rgba(51,41,31,0.18)] ${
          r >= 1 ? "animate-glow" : ""
        }`}
      >
        {!imgError ? (
          // Arbitrary user-provided cover file with a JS onError fallback swap.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={`/covers/${book.cover}`}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-[filter] duration-700"
            style={{ filter }}
          />
        ) : theme === "library" ? (
          <div
            className="w-full h-full relative transition-[filter] duration-700"
            style={{
              filter,
              background: `
                radial-gradient(120% 90% at 22% 18%, ${mid}66, transparent 60%),
                radial-gradient(100% 80% at 82% 78%, ${edge}55, transparent 55%),
                radial-gradient(140% 110% at 50% 100%, ${wash}cc, transparent 70%),
                linear-gradient(165deg, ${wash} 0%, ${mid} 55%, ${wash} 100%)
              `,
            }}
          >
            {/* Vignette, like gallery lighting on a canvas */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(120% 120% at 50% 45%, transparent 45%, rgba(20,16,10,0.45) 100%)",
              }}
            />
            {/* Gilt frame: dark bevel, gold line, soft inner highlight */}
            <div
              className="absolute inset-[7px] pointer-events-none"
              style={{
                boxShadow: `
                  0 0 0 1px rgba(20,16,10,0.55),
                  0 0 0 3px ${edge}cc,
                  0 0 0 4px rgba(20,16,10,0.35),
                  inset 0 0 0 1px rgba(255,244,214,0.25)
                `,
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-5 text-center">
              <span className="text-gold-soft text-[10px]" aria-hidden>
                ✦
              </span>
              <span className="font-serif text-paper text-sm leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {book.title}
              </span>
              <span className="text-gold-soft text-[10px]" aria-hidden>
                ✦
              </span>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-2.5 transition-[filter] duration-700"
            style={{
              filter,
              background:
                "linear-gradient(160deg, var(--color-green) 0%, var(--color-green-soft) 100%)",
            }}
          >
            <div className="w-full h-full border border-gold-soft/70 flex flex-col items-center justify-center gap-2 p-2 text-center">
              <span className="text-gold-soft text-[10px]" aria-hidden>
                ✦
              </span>
              <span className="font-serif text-paper text-sm leading-snug">
                {book.title}
              </span>
              <span className="text-gold-soft text-[10px]" aria-hidden>
                ✦
              </span>
            </div>
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
        <p className="text-xs font-serif text-ink truncate">{book.title}</p>
        <div className="w-full h-1 bg-paper-dim overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${r * 100}%` }}
          />
        </div>
        <p className="text-[11px] text-ink-soft" lang="en">
          Words met: {progress.lemmaCount}
        </p>
      </div>
    </div>
  );
}
