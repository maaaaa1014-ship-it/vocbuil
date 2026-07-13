"use client";

import { useState } from "react";
import { resetAllProgress, resetEverything } from "@/lib/storage";

export default function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null);

  function handleResetProgress() {
    if (!window.confirm("読書の進捗(本棚のアンロック状況)をリセットします。よろしいですか？")) {
      return;
    }
    resetAllProgress();
    setMessage("読書の進捗をリセットしました。");
  }

  function handleResetEverything() {
    if (!window.confirm("単語リストと読書の進捗をすべて削除します。よろしいですか？")) {
      return;
    }
    resetEverything();
    setMessage("すべてのデータをリセットしました。");
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-10 pb-8 flex flex-col gap-6">
      <header className="text-center flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-semibold text-green">設定</h1>
      </header>

      <section className="rounded-2xl bg-white/60 border border-ink/10 p-5 flex flex-col gap-4">
        <div>
          <h2 className="font-serif text-lg text-ink mb-1">読書の進捗をリセット</h2>
          <p className="text-sm text-ink-soft mb-3">
            本棚の各表紙のアンロック状況と既読センテンスをリセットします。単語リストは残ります。
          </p>
          <button
            type="button"
            onClick={handleResetProgress}
            className="rounded-full border border-green text-green px-5 py-2.5 text-sm font-medium"
          >
            進捗をリセット
          </button>
        </div>

        <div className="border-t border-ink/10 pt-4">
          <h2 className="font-serif text-lg text-ink mb-1">すべてリセット</h2>
          <p className="text-sm text-ink-soft mb-3">
            単語リストと読書の進捗をすべて削除し、最初の状態に戻します。
          </p>
          <button
            type="button"
            onClick={handleResetEverything}
            className="rounded-full bg-ink/80 text-paper px-5 py-2.5 text-sm font-medium"
          >
            すべてリセット
          </button>
        </div>
      </section>

      {message && <p className="text-sm text-green text-center">{message}</p>}

      <section className="text-center text-xs text-ink-soft leading-relaxed">
        <p>すべてのデータはこの端末内(localStorage)にのみ保存され、外部には送信されません。</p>
      </section>
    </main>
  );
}
