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
// forms (mean -> meant) are covered separately: the index stores each
// card's exact surface form, passed here via `exactForms`.
const SUFFIX = "(?:s|es|ed|d|ing|ings|er|ers|est|'s|s')?";

export function highlightSentence(
  sentence: string,
  lemmas: string[],
  exactForms: { form: string; lemma: string }[] = []
): HighlightSegment[] {
  const uniqueLemmas = Array.from(new Set(lemmas.filter(Boolean))).sort(
    (a, b) => b.length - a.length
  );
  const forms = exactForms.filter((e) => e.form);
  if (uniqueLemmas.length === 0 && forms.length === 0) {
    return [{ text: sentence, highlight: false }];
  }

  const alternatives = [
    ...forms.map((e) => escapeRegExp(e.form)),
    ...uniqueLemmas.map((w) => `${escapeRegExp(w)}${SUFFIX}`),
  ];
  const pattern = new RegExp(`\\b(?:${alternatives.join("|")})\\b`, "gi");

  const formByLower = new Map(forms.map((e) => [e.form.toLowerCase(), e.lemma]));

  const segments: HighlightSegment[] = [];
  let lastIndex = 0;
  for (const match of sentence.matchAll(pattern)) {
    const start = match.index ?? 0;
    const matched = match[0];
    const lowerMatch = matched.toLowerCase();
    const isExactForm = formByLower.has(lowerMatch);
    const isCapitalized = /^[A-Z]/.test(matched);
    // A capitalized word is most likely a proper noun ("Peter" would match
    // lemma "pet" + "er"), including at sentence starts, so the suffix
    // heuristic never highlights it. The card's exact studied form is the
    // one exception: the index guarantees it is this card's real word,
    // capitalized or not.
    if (isCapitalized && !isExactForm) {
      continue;
    }

    if (start > lastIndex) {
      segments.push({ text: sentence.slice(lastIndex, start), highlight: false });
    }
    const matchedLemma =
      formByLower.get(lowerMatch) ??
      uniqueLemmas.find((w) => lowerMatch.startsWith(w));
    segments.push({ text: matched, highlight: true, lemma: matchedLemma });
    lastIndex = start + matched.length;
  }
  if (lastIndex < sentence.length) {
    segments.push({ text: sentence.slice(lastIndex), highlight: false });
  }
  return segments;
}
