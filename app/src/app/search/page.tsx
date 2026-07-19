"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadSearchCorpus } from "@/lib/searchLoader";
import { search, toSegments, type Hit, type SearchBook } from "@/lib/concordance";

const EXAMPLES = ["put off", "make up", "look forward to", "at once", "so that"];

export default function SearchPage() {
  const [corpus, setCorpus] = useState<SearchBook[] | null>(null);
  const [loadMsg, setLoadMsg] = useState("Preparing the library…");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [bookFilter, setBookFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch the corpus once on mount so the first search is ready to run.
  useEffect(() => {
    let cancelled = false;
    loadSearchCorpus((loaded, total) => {
      if (!cancelled) setLoadMsg(`Preparing the library… (${loaded}/${total})`);
    })
      .then((c) => {
        if (!cancelled) setCorpus(c);
      })
      .catch(() => {
        if (!cancelled) setLoadMsg("Could not load the books. Please retry.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce typing so we don't scan 41k sentences on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  const scoped = useMemo(() => {
    if (!corpus) return null;
    return bookFilter === "all"
      ? corpus
      : corpus.filter((b) => b.book.id === bookFilter);
  }, [corpus, bookFilter]);

  const hits = useMemo(() => {
    if (!scoped || debounced.trim().length === 0) return [];
    return search(debounced, scoped, { limit: 200 });
  }, [scoped, debounced]);

  const trimmed = debounced.trim();
  const ready = corpus !== null;

  return (
    <main className="paper-blobs mx-auto max-w-md px-5 pt-12 pb-10 flex flex-col gap-6" lang="en">
      <header className="text-center flex flex-col gap-3">
        <p className="font-serif text-[11px] tracking-[0.35em] text-gold uppercase">
          Bookshard
        </p>
        <h1 className="font-serif text-2xl font-semibold text-green tracking-[0.16em]">
          Phrase Finder
        </h1>
        <div className="ornament-rule text-sm" aria-hidden>
          ✦
        </div>
        <p className="text-[13px] text-ink-soft leading-relaxed">
          Search any word or phrase across 10 classic novels, and see how it is
          really used — even phrasal verbs like <em>put me off</em>.
        </p>
      </header>

      <div className="sticky top-2 z-30 flex flex-col gap-2">
        <div className="plate-frame rounded-sm p-2 flex items-center gap-2">
          <span className="pl-2 text-gold" aria-hidden>
            ⌕
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputMode="search"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="put off, make up, at once…"
            className="flex-1 bg-transparent py-2 pr-2 text-[15px] text-ink outline-none placeholder:text-ink-soft/60"
            aria-label="Search the books"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="px-2 text-ink-soft"
              aria-label="Clear"
            >
              ✕
            </button>
          )}
        </div>

        {ready && (
          <div className="overflow-x-auto -mx-5 px-5">
            <div className="flex gap-1.5 w-max">
              <FilterChip
                label="All books"
                active={bookFilter === "all"}
                onClick={() => setBookFilter("all")}
              />
              {corpus!.map((b) => (
                <FilterChip
                  key={b.book.id}
                  label={b.book.title}
                  active={bookFilter === b.book.id}
                  onClick={() => setBookFilter(b.book.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {!ready && (
        <p className="text-center text-sm text-ink-soft py-10">{loadMsg}</p>
      )}

      {ready && trimmed.length === 0 && (
        <section className="flex flex-col gap-4 pt-2">
          <p className="text-xs text-ink-soft leading-relaxed">
            A multi-word search matches words <strong>in order</strong>, even
            with other words in between — so <em>put off</em> also finds
            &ldquo;put <em>her</em> off&rdquo; and &ldquo;put <em>the visit</em>{" "}
            off&rdquo;. Wrap it in quotes for an exact phrase.
          </p>
          <div className="flex flex-col gap-2">
            <p className="font-serif text-sm text-wine tracking-wide">Try:</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setQuery(ex)}
                  className="text-sm bg-paper-dim border border-gold/30 rounded-sm px-3 py-1.5 text-ink-soft font-serif"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {ready && trimmed.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-xs text-ink-soft">
            {hits.length === 0
              ? "No usages found."
              : `${hits.length}${hits.length === 200 ? "+" : ""} usage${
                  hits.length === 1 ? "" : "s"
                }${bookFilter === "all" ? "" : " in this book"}`}
          </p>

          <ul className="flex flex-col gap-3">
            {hits.map((hit) => (
              <ResultCard
                key={`${hit.book.id}-${hit.sentenceIndex}`}
                hit={hit}
                corpus={corpus!}
                expanded={expanded === `${hit.book.id}-${hit.sentenceIndex}`}
                onToggle={() =>
                  setExpanded((cur) =>
                    cur === `${hit.book.id}-${hit.sentenceIndex}`
                      ? null
                      : `${hit.book.id}-${hit.sentenceIndex}`
                  )
                }
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-serif tracking-wide border transition-colors ${
        active
          ? "bg-green text-paper border-green"
          : "bg-paper/70 text-ink-soft border-gold/30"
      }`}
    >
      {label}
    </button>
  );
}

function ResultCard({
  hit,
  corpus,
  expanded,
  onToggle,
}: {
  hit: Hit;
  corpus: SearchBook[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const segments = toSegments(hit.sentence, hit.spans);
  const context = useMemo(() => {
    if (!expanded) return null;
    const book = corpus.find((b) => b.book.id === hit.book.id);
    if (!book) return null;
    return {
      before: hit.sentenceIndex > 0 ? book.sentences[hit.sentenceIndex - 1] : null,
      after:
        hit.sentenceIndex < book.sentences.length - 1
          ? book.sentences[hit.sentenceIndex + 1]
          : null,
    };
  }, [expanded, corpus, hit]);

  return (
    <li className="plate-frame rounded-sm p-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={onToggle}
        className="text-left"
        aria-expanded={expanded}
      >
        <p className="font-serif text-[15px] leading-relaxed text-ink">
          {expanded && context?.before && (
            <span className="text-ink-soft/60">{context.before} </span>
          )}
          {segments.map((seg, i) =>
            seg.highlight ? (
              <mark
                key={i}
                className="bg-gold/25 text-wine font-semibold rounded-[2px] px-0.5"
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
          {expanded && context?.after && (
            <span className="text-ink-soft/60"> {context.after}</span>
          )}
        </p>
      </button>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ink-soft italic font-serif">
          {hit.book.title} · {hit.book.author}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="text-[11px] text-ink-soft underline underline-offset-2 decoration-gold/60"
        >
          {expanded ? "Less" : "Context"}
        </button>
      </div>
    </li>
  );
}
