"use client";

import { useState } from "react";
import { highlightSentence } from "@/lib/highlight";

type Props = {
  sentence: string;
  lemmas: string[];
  meanings: Map<string, string | undefined>;
  bookTitle: string;
  author: string;
  // Word taps bubble up (with the tapped lemma) so the session can retire
  // the first-time hint and record the lookup in the learned-words log.
  hintActive?: boolean;
  onWordTap?: (lemma: string) => void;
};

export default function SentenceCard({
  sentence,
  lemmas,
  meanings,
  bookTitle,
  author,
  hintActive = false,
  onWordTap,
}: Props) {
  const [activeLemma, setActiveLemma] = useState<string | null>(null);
  const segments = highlightSentence(sentence, lemmas);
  const activeMeaning = activeLemma ? meanings.get(activeLemma) : undefined;

  return (
    <div className="plate-frame rounded-sm p-7 flex flex-col gap-5">
      <p
        className="drop-cap font-serif text-[21px] leading-[1.75] text-ink"
        lang="en"
      >
        {segments.map((seg, i) =>
          seg.highlight ? (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveLemma(seg.lemma ?? null);
                if (seg.lemma) onWordTap?.(seg.lemma);
              }}
              className={`relative inline font-semibold text-wine underline decoration-gold decoration-2 underline-offset-4 cursor-pointer ${
                hintActive ? "animate-word-hint" : ""
              }`}
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
          className="rounded-sm bg-wine text-paper text-sm px-4 py-3 flex items-start justify-between gap-3 cursor-pointer"
          onClick={() => setActiveLemma(null)}
        >
          <span className="leading-relaxed">
            <span className="font-serif font-semibold tracking-wide">{activeLemma}</span>
            {activeMeaning ? ` — ${activeMeaning}` : " — no meaning saved"}
          </span>
          <span className="text-paper/60 text-xs mt-0.5">×</span>
        </div>
      )}

      <div className="flex items-center gap-3" aria-hidden>
        <span className="flex-1 h-px bg-gold/30" />
        <span className="text-gold text-xs">❦</span>
        <span className="flex-1 h-px bg-gold/30" />
      </div>

      <p className="text-xs text-ink-soft text-center italic font-serif -mt-2">
        {bookTitle} — {author}
      </p>
    </div>
  );
}
