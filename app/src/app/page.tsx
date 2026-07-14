"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseWordListCsv } from "@/lib/csv";
import { loadPreset } from "@/lib/dataLoader";
import {
  getWordList,
  isOnboarded,
  setOnboarded,
  setWordList as saveWordList,
} from "@/lib/storage";
import type { UserWord } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [words, setWords] = useState<UserWord[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // First visit goes through onboarding instead of this management page.
    const stored = getWordList();
    if (!isOnboarded() && stored.length === 0) {
      router.replace("/welcome");
      return;
    }
    // Hydrate from localStorage after mount (unavailable during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWords(stored);
    setChecked(true);
  }, [router]);

  function applyWords(newWords: UserWord[], message: string) {
    saveWordList(newWords);
    setWords(newWords);
    setStatus(message);
  }

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseWordListCsv(text);
      if (parsed.length === 0) {
        setStatus("CSVから単語を読み取れませんでした。1列目に英単語があるか確認してください。");
      } else {
        applyWords(parsed, `CSVから ${parsed.length} 語を読み込みました。`);
      }
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePreset(tier: "intermediate" | "advanced") {
    setBusy(true);
    try {
      const preset = await loadPreset(tier);
      const label = tier === "intermediate" ? "中級" : "上級";
      applyWords(preset, `${label}プリセット(${preset.length}語)を読み込みました。`);
    } finally {
      setBusy(false);
    }
  }

  function handleClear() {
    applyWords([], "単語リストをクリアしました。");
    setOnboarded();
  }

  if (!checked) return null;

  return (
    <main className="paper-blobs mx-auto max-w-md px-5 pt-12 pb-10 flex flex-col gap-9">
      <header className="text-center flex flex-col gap-3">
        <p className="font-serif text-[11px] tracking-[0.35em] text-gold uppercase">
          Reading &amp; Reunion
        </p>
        <h1 className="font-serif text-4xl font-semibold text-green tracking-[0.3em] pl-[0.3em]">
          再読
        </h1>
        <div className="ornament-rule text-sm" aria-hidden>
          ❦
        </div>
        <p className="text-[13px] text-ink-soft leading-relaxed">
          勉強中の単語に、名著の一節でもういちど出会う
        </p>
      </header>

      <section className="plate-frame rounded-sm p-6 flex flex-col gap-3">
        <h2 className="font-serif text-lg text-wine tracking-wider">単語帖</h2>
        <p className="text-sm text-ink-soft">
          {words.length > 0
            ? `${words.length} 語が登録されています。`
            : "まだ単語が登録されていません。"}
        </p>
        {words.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {words.slice(0, 12).map((w) => (
              <span
                key={w.word}
                className="text-xs bg-paper-dim border border-gold/30 rounded-sm px-2.5 py-1 text-ink-soft font-serif"
              >
                {w.word}
              </span>
            ))}
            {words.length > 12 && (
              <span className="text-xs text-ink-soft px-1 py-1">
                他 {words.length - 12} 語
              </span>
            )}
          </div>
        )}
        {words.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="self-start text-xs text-ink-soft underline underline-offset-2 decoration-gold/60"
          >
            リストをクリア
          </button>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="ornament-rule font-serif text-base text-ink tracking-[0.2em]">
          単語を用意する
        </h2>

        <div className="plate-frame rounded-sm p-6 flex flex-col gap-3">
          <p className="text-sm text-ink-soft">
            CSVをアップロード(1列目=英単語、2列目=意味)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="text-sm file:mr-3 file:rounded-sm file:border file:border-green file:bg-green file:text-paper file:px-4 file:py-2 file:text-sm file:font-serif file:tracking-wider file:cursor-pointer cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => handlePreset("intermediate")}
            className="relative overflow-hidden rounded-md bg-teal text-paper text-left px-6 py-4 shadow-md disabled:opacity-60"
          >
            <span className="scene-blob w-28 h-28 -right-8 -top-10 bg-gold/25" aria-hidden />
            <span className="block font-serif text-base tracking-wider">中級の500語</span>
            <span className="block text-xs text-paper/75 mt-0.5">
              物語によく現れる、たしかな言葉から
            </span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handlePreset("advanced")}
            className="relative overflow-hidden rounded-md bg-wine text-paper text-left px-6 py-4 shadow-md disabled:opacity-60"
          >
            <span className="scene-blob w-28 h-28 -right-8 -bottom-10 bg-navy/50" aria-hidden />
            <span className="block font-serif text-base tracking-wider">上級の500語</span>
            <span className="block text-xs text-paper/75 mt-0.5">
              物語を深く味わうための言葉を
            </span>
          </button>
        </div>

        {status && (
          <p className="text-sm text-green text-center leading-relaxed">{status}</p>
        )}
      </section>

      <button
        type="button"
        disabled={words.length === 0}
        onClick={() => router.push("/session")}
        className="rounded-sm bg-green text-paper py-4 text-base font-serif tracking-[0.25em] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        読書をはじめる
      </button>
    </main>
  );
}
