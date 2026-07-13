export type HighlightSegment = {
  text: string;
  highlight: boolean;
  lemma?: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Matches the lemma plus any trailing letters, so e.g. lemma "play" also
// highlights "playing"/"played"/"plays" as they appear in the sentence.
// Irregular inflections (run -> ran) won't be caught by this heuristic.
export function highlightSentence(sentence: string, lemmas: string[]): HighlightSegment[] {
  const uniqueLemmas = Array.from(new Set(lemmas.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );
  if (uniqueLemmas.length === 0) {
    return [{ text: sentence, highlight: false }];
  }

  const pattern = new RegExp(
    `\\b(${uniqueLemmas.map(escapeRegExp).join("|")})[a-zA-Z']*`,
    "gi"
  );

  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  for (const match of sentence.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ text: sentence.slice(lastIndex, start), highlight: false });
    }
    const lowerMatch = match[0].toLowerCase();
    const matchedLemma = uniqueLemmas.find((w) => lowerMatch.startsWith(w));
    segments.push({ text: match[0], highlight: true, lemma: matchedLemma });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < sentence.length) {
    segments.push({ text: sentence.slice(lastIndex), highlight: false });
  }
  return segments;
}
