"use client";

import { useState } from "react";
import { resetAllProgress, resetEverything } from "@/lib/storage";

export default function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null);

  function handleResetProgress() {
    if (!window.confirm("読書の進捗(書架のアンロック状況)をリセットします。よろしいですか？")) {
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
    <main className="mx-auto max-w-md px-5 pt-12 pb-10 flex flex-col gap-8">
      <header className="text-center flex flex-col gap-3">
        <p className="font-serif text-[11px] tracking-[0.35em] text-gold uppercase">
          Preferences
        </p>
        <h1 className="font-serif text-4xl font-semibold text-green tracking-[0.3em] pl-[0.3em]">
          設定
        </h1>
        <div className="ornament-rule text-sm" aria-hidden>
          ❦
        </div>
      </header>

      <section className="plate-frame rounded-sm p-6 flex flex-col gap-5">
        <div>
          <h2 className="font-serif text-lg text-wine tracking-wider mb-1">
            読書の進捗をリセット
          </h2>
          <p className="text-sm text-ink-soft mb-3 leading-relaxed">
            書架の各表紙のアンロック状況と既読の一節をリセットします。単語リストは残ります。
          </p>
          <button
            type="button"
            onClick={handleResetProgress}
            className="rounded-sm border border-green text-green px-6 py-2.5 text-sm font-serif tracking-widest"
          >
            進捗をリセット
          </button>
        </div>

        <div className="border-t border-gold/30 pt-5">
          <h2 className="font-serif text-lg text-wine tracking-wider mb-1">
            すべてリセット
          </h2>
          <p className="text-sm text-ink-soft mb-3 leading-relaxed">
            単語リストと読書の進捗をすべて削除し、最初の状態に戻します。
          </p>
          <button
            type="button"
            onClick={handleResetEverything}
            className="rounded-sm bg-wine text-paper px-6 py-2.5 text-sm font-serif tracking-widest"
          >
            すべてリセット
          </button>
        </div>
      </section>

      {message && <p className="text-sm text-green text-center">{message}</p>}

      <section className="text-center text-xs text-ink-soft leading-relaxed">
        <p>
          すべてのデータはこの端末内(localStorage)にのみ保存され、外部には送信されません。
        </p>
      </section>
    </main>
  );
}
