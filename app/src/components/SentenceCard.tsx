"use client";

import { useState } from "react";
import { highlightSentence } from "@/lib/highlight";

type Props = {
  sentence: string;
  lemmas: string[];
  meanings: Map<string, string | undefined>;
  bookTitle: string;
  author: string;
};

export default function SentenceCard({ sentence, lemmas, meanings, bookTitle, author }: Props) {
  const [activeLemma, setActiveLemma] = useState<string | null>(null);
  const segments = highlightSentence(sentence, lemmas);
  const activeMeaning = activeLemma ? meanings.get(activeLemma) : undefined;

  return (
    <div className="rounded-2xl bg-white/70 border border-ink/10 shadow-sm p-6 flex flex-col gap-4">
      <p className="font-serif text-xl leading-relaxed text-ink" lang="en">
        {segments.map((seg, i) =>
          seg.highlight ? (
            <button
              key={i}
              type="button"
              onClick={() => setActiveLemma(seg.lemma ?? null)}
              className="relative inline font-semibold text-green underline decoration-gold decoration-2 underline-offset-4 cursor-pointer"
            >
              {seg.text}
            </button>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </p>

      {activeLemma && (
        <div
          className="rounded-lg bg-green text-paper text-sm px-4 py-2 flex items-start justify-between gap-3"
          onClick={() => setActiveLemma(null)}
        >
          <span>
            <span className="font-semibold">{activeLemma}</span>
            {activeMeaning ? ` — ${activeMeaning}` : "（意味の登録なし）"}
          </span>
          <span className="text-paper/60 text-xs">×</span>
        </div>
      )}

      <p className="text-xs text-ink-soft text-right italic">
        {bookTitle} — {author}
      </p>
    </div>
  );
}
