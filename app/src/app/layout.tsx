import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import { Analytics } from "@vercel/analytics/next";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "名作のかけら Bookshard — Collect the classics, word by word",
  description:
    "Learn English words in context. Read sentences from classic books, and build your own collection of literary treasures.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Applies the saved theme before first paint so there is no flash of the
// wrong palette. Kept tiny and defensive; falls back to the default theme.
const themeInitScript = `(function(){try{var t=localStorage.getItem("vocbuil.theme.v1");document.documentElement.dataset.theme=(t==="library"||t==="crystal")?t:"crystal";}catch(e){document.documentElement.dataset.theme="crystal";}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the theme init script sets data-theme on
    // <html> before hydration, which is an expected server/client mismatch.
    <html lang="en" className={`${playfair.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-paper text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Shell>{children}</Shell>
        <Analytics />
      </body>
    </html>
  );
}
