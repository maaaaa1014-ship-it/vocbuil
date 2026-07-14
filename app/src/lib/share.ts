// SNS sharing helpers. Templates follow the product spec:
//   session:  "xxxx, xxxx などの単語とzzzzzzで出会いました MM/DD 名作のかけら URL"
//   unlock:   "作品zzzzzzの一部を読了しました！MM/DD 名作のかけら URL"

const APP_URL = "https://vocbuil.vercel.app";
const APP_NAME = "名作のかけら";

function formatDateMMDD(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

export function buildSessionShareText(words: string[], bookTitles: string[]): string {
  const sample = words.slice(0, 2).join(", ");
  const book = bookTitles[0] ?? "";
  const bookPart = bookTitles.length > 1 ? `${book}など` : book;
  return `${sample} などの単語と${bookPart}で出会いました ${formatDateMMDD()} ${APP_NAME} ${APP_URL}`;
}

export function buildUnlockShareText(bookTitle: string): string {
  return `作品${bookTitle}の一部を読了しました！${formatDateMMDD()} ${APP_NAME} ${APP_URL}`;
}

// Native share sheet on mobile; X/Twitter intent as the desktop fallback.
export async function shareText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // user cancelled the sheet -- nothing else to do
      return;
    }
  }
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
