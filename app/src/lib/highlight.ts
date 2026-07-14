export type HighlightSegment = {
  text: string;
  highlight: boolean;
  lemma?: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Inflection endings we accept after the lemma, so "play" also highlights
// "plays/played/playing" but "turn" does NOT capture "turnip". Irregular
// forms (run -> ran) are still missed; that is an accepted limitation.
const SUFFIX = "(?:s|es|ed|d|ing|ings|er|ers|est|'s|s')?";

export function highlightSentence(sentence: string, lemmas: string[]): HighlightSegment[] {
  const uniqueLemmas = Array.from(new Set(lemmas.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );
  if (uniqueLemmas.length === 0) {
    return [{ text: sentence, highlight: false }];
  }

  const pattern = new RegExp(
    `\\b(${uniqueLemmas.map(escapeRegExp).join("|")})${SUFFIX}\\b`,
    "gi"
  );

  // A capitalized match that is not the sentence's first word is almost
  // always a proper noun (e.g. "Peter" when the lemma is "pet"): skip it.
  const firstLetterIndex = sentence.search(/[a-zA-Z]/);

  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  for (const match of sentence.matchAll(pattern)) {
    const start = match.index ?? 0;
    const matched = match[0];
    const isCapitalized = /^[A-Z]/.test(matched);
    if (isCapitalized && start !== firstLetterIndex) continue;

    if (start > lastIndex) {
      segments.push({ text: sentence.slice(lastIndex, start), highlight: false });
    }
    const lowerMatch = matched.toLowerCase();
    const matchedLemma = uniqueLemmas.find((w) => lowerMatch.startsWith(w));
    segments.push({ text: matched, highlight: true, lemma: matchedLemma });
    lastIndex = start + matched.length;
  }
  if (lastIndex < sentence.length) {
    segments.push({ text: sentence.slice(lastIndex), highlight: false });
  }
  return segments;
}
