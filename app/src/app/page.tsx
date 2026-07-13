"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseWordListCsv } from "@/lib/csv";
import { loadPreset } from "@/lib/dataLoader";
import { getWordList, setWordList as saveWordList } from "@/lib/storage";
import type { UserWord } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [words, setWords] = useState<UserWord[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage after mount (unavailable during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWords(getWordList());
  }, []);

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
      applyWords(
        preset.map((word) => ({ word })),
        `${label}プリセット(${preset.length}語)を読み込みました。`
      );
    } finally {
      setBusy(false);
    }
  }

  function handleClear() {
    applyWords([], "単語リストをクリアしました。");
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-10 pb-8 flex flex-col gap-8">
      <header className="text-center flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold text-green">再読</h1>
        <p className="text-sm text-ink-soft">
          勉強中の単語に、名著の中で再会する多読体験
        </p>
      </header>

      <section className="rounded-2xl bg-white/60 border border-ink/10 p-5 flex flex-col gap-3">
        <h2 className="font-serif text-lg text-ink">単語リスト</h2>
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
                className="text-xs bg-paper-dim border border-ink/10 rounded-full px-2.5 py-1 text-ink-soft"
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
            className="self-start text-xs text-ink-soft underline underline-offset-2"
          >
            リストをクリア
          </button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-lg text-ink">単語を用意する</h2>

        <div className="rounded-2xl bg-white/60 border border-ink/10 p-5 flex flex-col gap-3">
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
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-green file:text-paper file:px-4 file:py-2 file:text-sm file:font-medium file:cursor-pointer cursor-pointer"
          />
        </div>

        <div className="rounded-2xl bg-white/60 border border-ink/10 p-5 flex flex-col gap-3">
          <p className="text-sm text-ink-soft">プリセットで始める</p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => handlePreset("intermediate")}
              className="flex-1 rounded-full border border-green text-green py-2.5 text-sm font-medium disabled:opacity-50"
            >
              中級プリセット
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handlePreset("advanced")}
              className="flex-1 rounded-full border border-green text-green py-2.5 text-sm font-medium disabled:opacity-50"
            >
              上級プリセット
            </button>
          </div>
        </div>

        {status && <p className="text-sm text-green text-center">{status}</p>}
      </section>

      <button
        type="button"
        disabled={words.length === 0}
        onClick={() => router.push("/session")}
        className="rounded-full bg-green text-paper py-3.5 text-base font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        読書セッションを始める
      </button>
    </main>
  );
}
