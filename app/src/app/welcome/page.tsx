"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadBooks, loadPreset } from "@/lib/dataLoader";
import {
  FIRST_BOOK_GOAL,
  isOnboarded,
  setOnboarded,
  setPendingFirstSession,
  setWordList,
} from "@/lib/storage";
import type { BookMeta, PresetTier } from "@/lib/types";

// Curated first book per level: large enough index to guarantee a full
// 10-card session, and a fitting first encounter for each audience.
const FEATURED_BOOK: Record<PresetTier, string> = {
  intermediate: "anne-of-green-gables",
  advanced: "pride-and-prejudice",
  expert: "the-secret-garden",
};

type Step = 0 | 1 | 2;

function Dots({ step }: { step: Step }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            i === step ? "bg-gold" : "bg-paper/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [busy, setBusy] = useState(false);
  const [featured, setFeatured] = useState<BookMeta | null>(null);

  useEffect(() => {
    if (isOnboarded()) router.replace("/");
  }, [router]);

  async function chooseLevel(tier: PresetTier) {
    setBusy(true);
    try {
      const [preset, books] = await Promise.all([loadPreset(tier), loadBooks()]);
      setWordList(preset);
      const book = books.find((b) => b.id === FEATURED_BOOK[tier]) ?? books[0];
      setFeatured(book);
      setPendingFirstSession(book.id);
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  function skipToHome() {
    setOnboarded();
    router.replace("/");
  }

  function startFirstSession() {
    router.push("/session");
  }

  return (
    <main className="scene min-h-dvh flex flex-col">
      {step === 0 && (
        <div className="flex-1 flex flex-col justify-between px-8 py-14 text-center animate-fade-up">
          <div />
          <div className="flex flex-col items-center gap-6">
            <p className="font-serif text-[11px] tracking-[0.4em] text-gold-soft uppercase">
              Bookshard
            </p>
            <h1 className="font-serif text-4xl font-semibold tracking-[0.2em] pl-[0.2em]">
              名作のかけら
            </h1>
            <div className="ornament-rule w-40 text-base" aria-hidden>
              ✦
            </div>
            <p className="text-[15px] leading-relaxed text-paper/85" lang="en">
              Meet the words you study
              <br />
              inside real classic books.
            </p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <Dots step={0} />
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-sm bg-gold text-green py-4 text-base font-serif font-semibold tracking-[0.2em] shadow-lg"
              lang="en"
            >
              Get started
            </button>
            <button
              type="button"
              onClick={skipToHome}
              className="text-xs text-paper/60 underline underline-offset-4"
              lang="en"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between px-6 py-14 animate-fade-up" lang="en">
          <div className="text-center flex flex-col gap-2">
            <h1 className="font-serif text-2xl tracking-wider">Choose your words</h1>
            <p className="text-sm text-paper/70">You can change this later.</p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => chooseLevel("intermediate")}
              className="relative overflow-hidden rounded-md bg-teal text-left px-6 py-5 shadow-lg disabled:opacity-60"
            >
              <span
                className="scene-blob w-36 h-36 -right-10 -top-14 bg-gold/25"
                aria-hidden
              />
              <span className="block font-serif text-lg tracking-wider">
                Intermediate — 500 words
              </span>
              <span className="block text-xs text-paper/75 mt-1">
                Common words you will see often in novels
              </span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => chooseLevel("advanced")}
              className="relative overflow-hidden rounded-md bg-wine text-left px-6 py-5 shadow-lg disabled:opacity-60"
            >
              <span
                className="scene-blob w-36 h-36 -right-10 -bottom-14 bg-navy/50"
                aria-hidden
              />
              <span className="block font-serif text-lg tracking-wider">
                Advanced — 500 words
              </span>
              <span className="block text-xs text-paper/75 mt-1">
                Less common words for deeper reading
              </span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => chooseLevel("expert")}
              className="relative overflow-hidden rounded-md bg-ink text-left px-6 py-5 shadow-lg disabled:opacity-60"
            >
              <span
                className="scene-blob w-36 h-36 -right-10 -top-14 bg-gold/20"
                aria-hidden
              />
              <span className="block font-serif text-lg tracking-wider">
                Expert — 500 words
              </span>
              <span className="block text-xs text-paper/75 mt-1">
                Rare, literary vocabulary
              </span>
            </button>

            <button
              type="button"
              onClick={skipToHome}
              className="rounded-md border border-paper/30 text-paper/80 px-6 py-4 text-sm text-center"
            >
              Use my own CSV list
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Dots step={1} />
            {busy && <p className="text-xs text-paper/60">Loading…</p>}
          </div>
        </div>
      )}

      {step === 2 && featured && (
        <div
          className="flex-1 flex flex-col justify-between px-8 py-14 text-center animate-fade-up"
          lang="en"
        >
          <p className="font-serif text-xs tracking-[0.4em] text-gold-soft uppercase">
            Your first book
          </p>

          <div className="flex flex-col items-center gap-5">
            <div className="ornament-rule w-52 text-base" aria-hidden>
              ❧
            </div>
            <h1 className="font-serif text-3xl leading-snug">{featured.title}</h1>
            <p className="font-serif text-sm italic text-paper/70">{featured.author}</p>
            <div className="ornament-rule w-52 text-base" aria-hidden>
              ❧
            </div>
            <p className="text-sm leading-relaxed text-paper/85 mt-2">
              Your words are waiting in this book.
              <br />
              Read {FIRST_BOOK_GOAL} sentences, and this book
              <br />
              becomes the first piece in your collection.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={startFirstSession}
              aria-label="Start reading"
              className="animate-play-pulse w-20 h-20 rounded-full bg-gold text-green flex items-center justify-center shadow-xl"
            >
              <span className="text-3xl translate-x-0.5" aria-hidden>
                ▶
              </span>
            </button>
            <Dots step={2} />
          </div>
        </div>
      )}
    </main>
  );
}
