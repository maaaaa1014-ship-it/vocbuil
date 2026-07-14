import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "再読 — Meet your words in real books",
  description:
    "Learn English words in context. Read sentences from classic books, and every book you read becomes yours.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-paper text-ink antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
