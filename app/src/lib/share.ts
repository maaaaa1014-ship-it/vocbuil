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

// Opens X's compose screen directly with the text pre-filled and ready to
// post. `navigator.share()` was tried first here previously, but on many
// devices its OS share sheet either omits X as a target entirely or only
// offers "copy text" -- neither lets the user post in one tap. Going
// straight to the X intent URL guarantees the same, reliable result
// everywhere: the intent opens the X app (if installed) or x.com's mobile
// compose view, with the template text and link already in the box.
export function shareText(text: string): void {
  if (typeof window === "undefined") return;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
