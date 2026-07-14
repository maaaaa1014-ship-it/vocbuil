"use client";

import { useEffect, useState } from "react";
import {
  getTheme,
  resetAllProgress,
  resetEverything,
  setTheme,
  type Theme,
} from "@/lib/storage";

const THEME_OPTIONS: { value: Theme; name: string; note: string }[] = [
  { value: "crystal", name: "B — Crystal", note: "Glass, prism light, pastel" },
  { value: "library", name: "A — Library", note: "Deep green, antique gold" },
];

export default function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [theme, setThemeState] = useState<Theme | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(getTheme());
  }, []);

  function handleTheme(next: Theme) {
    setTheme(next);
    setThemeState(next);
  }

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
          ✦
        </div>
      </header>

      <section className="plate-frame rounded-sm p-6 flex flex-col gap-4">
        <h2 className="font-serif text-lg text-wine tracking-wider">Design</h2>
        <div className="flex flex-col gap-3">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTheme(opt.value)}
              className={`rounded-sm border px-5 py-3.5 text-left transition-colors ${
                theme === opt.value
                  ? "border-green bg-green text-paper"
                  : "border-ink/20 text-ink"
              }`}
            >
              <span className="block font-serif text-sm tracking-wider">
                {opt.name}
              </span>
              <span
                className={`block text-xs mt-0.5 ${
                  theme === opt.value ? "text-paper/75" : "text-ink-soft"
                }`}
              >
                {opt.note}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="plate-frame rounded-sm p-6 flex flex-col gap-5">
        <div>
          <h2 className="font-serif text-lg text-wine tracking-wider mb-1">
            Reset reading progress
          </h2>
          <p className="text-sm text-ink-soft mb-3 leading-relaxed">
            This clears your collection progress and read sentences. Your word
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
