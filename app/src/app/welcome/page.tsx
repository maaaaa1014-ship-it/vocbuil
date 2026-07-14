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
import type { BookMeta } from "@/lib/types";

// Curated first book per level: large enough index to guarantee a full
// 10-card session, and a fitting first encounter for each audience.
const FEATURED_BOOK: Record<"intermediate" | "advanced", string> = {
  intermediate: "anne-of-green-gables",
  advanced: "pride-and-prejudice",
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

  async function chooseLevel(tier: "intermediate" | "advanced") {
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
              Reading &amp; Reunion
            </p>
            <h1 className="font-serif text-5xl font-semibold tracking-[0.3em] pl-[0.3em]">
              再読
            </h1>
            <div className="ornament-rule w-40 text-base" aria-hidden>
              ❦
            </div>
            <p className="text-[15px] leading-relaxed text-paper/85">
              勉強中の単語と、
              <br />
              名著の一節でもういちど出会う。
            </p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <Dots step={0} />
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-sm bg-gold text-green py-4 text-base font-serif font-semibold tracking-[0.25em] shadow-lg"
            >
              旅をはじめる
            </button>
            <button
              type="button"
              onClick={skipToHome}
              className="text-xs text-paper/60 underline underline-offset-4"
            >
              スキップして単語帖へ
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-between px-6 py-14 animate-fade-up">
          <div className="text-center flex flex-col gap-2">
            <h1 className="font-serif text-2xl tracking-wider">
              どんな言葉と再会しますか？
            </h1>
            <p className="text-sm text-paper/70">あとからいつでも変えられます</p>
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
                中級の500語
              </span>
              <span className="block text-xs text-paper/75 mt-1">
                物語によく現れる、たしかな言葉から
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
                上級の500語
              </span>
              <span className="block text-xs text-paper/75 mt-1">
                物語を深く味わうための言葉を
              </span>
            </button>

            <button
              type="button"
              onClick={skipToHome}
              className="rounded-md border border-paper/30 text-paper/80 px-6 py-4 text-sm text-center"
            >
              自分の単語CSVを使う
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Dots step={1} />
            {busy && <p className="text-xs text-paper/60">準備しています…</p>}
          </div>
        </div>
      )}

      {step === 2 && featured && (
        <div className="flex-1 flex flex-col justify-between px-8 py-14 text-center animate-fade-up">
          <p className="font-serif text-xs tracking-[0.4em] text-gold-soft uppercase">
            Chapter One
          </p>

          <div className="flex flex-col items-center gap-5">
            <p className="font-serif text-sm tracking-[0.3em] text-paper/70">
              第一章
            </p>
            <div className="ornament-rule w-52 text-base" aria-hidden>
              ❧
            </div>
            <h1 className="font-serif text-3xl leading-snug" lang="en">
              {featured.title}
            </h1>
            <p className="font-serif text-sm italic text-paper/70" lang="en">
              {featured.author}
            </p>
            <div className="ornament-rule w-52 text-base" aria-hidden>
              ❧
            </div>
            <p className="text-sm leading-relaxed text-paper/85 mt-2">
              あなたの単語が眠るこの本から、
              <br />
              {FIRST_BOOK_GOAL}の一節をお届けします。
              <br />
              読み終えると、最初の一冊が目を覚まします。
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button
              type="button"
              onClick={startFirstSession}
              aria-label="最初のセッションをはじめる"
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
