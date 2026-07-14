"use client";

import { useState } from "react";
import { resetAllProgress, resetEverything } from "@/lib/storage";

export default function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null);

  function handleResetProgress() {
    if (!window.confirm("Reset your reading progress? Your word list will stay.")) {
      return;
    }
    resetAllProgress();
    setMessage("Reading progress reset.");
  }

  function handleResetEverything() {
    if (!window.confirm("Delete your word list and all reading progress?")) {
      return;
    }
    resetEverything();
    setMessage("All data reset.");
  }

  return (
    <main
      className="mx-auto max-w-md px-5 pt-12 pb-10 flex flex-col gap-8"
      lang="en"
    >
      <header className="text-center flex flex-col gap-3">
        <p className="font-serif text-[11px] tracking-[0.35em] text-gold uppercase">
          Preferences
        </p>
        <h1 className="font-serif text-4xl font-semibold text-green tracking-[0.1em]">
          Settings
        </h1>
        <div className="ornament-rule text-sm" aria-hidden>
          ❦
        </div>
      </header>

      <section className="plate-frame rounded-sm p-6 flex flex-col gap-5">
        <div>
          <h2 className="font-serif text-lg text-wine tracking-wider mb-1">
            Reset reading progress
          </h2>
          <p className="text-sm text-ink-soft mb-3 leading-relaxed">
            This clears your bookshelf progress and read sentences. Your word
            list stays.
          </p>
          <button
            type="button"
            onClick={handleResetProgress}
            className="rounded-sm border border-green text-green px-6 py-2.5 text-sm font-serif tracking-widest"
          >
            Reset progress
          </button>
        </div>

        <div className="border-t border-gold/30 pt-5">
          <h2 className="font-serif text-lg text-wine tracking-wider mb-1">
            Reset everything
          </h2>
          <p className="text-sm text-ink-soft mb-3 leading-relaxed">
            This deletes your word list and all reading progress.
          </p>
          <button
            type="button"
            onClick={handleResetEverything}
            className="rounded-sm bg-wine text-paper px-6 py-2.5 text-sm font-serif tracking-widest"
          >
            Reset all
          </button>
        </div>
      </section>

      {message && <p className="text-sm text-green text-center">{message}</p>}

      <section className="text-center text-xs text-ink-soft leading-relaxed">
        <p>
          All data is stored only on this device (localStorage). Nothing is
          sent anywhere.
        </p>
      </section>
    </main>
  );
}
