"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Words" },
  { href: "/shelf", label: "Collection" },
  { href: "/search", label: "Search" },
  { href: "/settings", label: "Settings" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-paper/95 backdrop-blur border-t border-gold/40 shadow-[0_-1px_0_0_rgba(169,134,55,0.2),0_-4px_0_0_transparent]">
      <p className="text-center text-[10px] leading-4 text-ink-soft/70 pt-1">
        Covers adapted from Standard Ebooks (public domain)
      </p>
      <ul className="flex justify-around items-center h-13 pb-1">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 font-serif text-[13px] tracking-wide transition-colors ${
                  active ? "text-wine" : "text-ink-soft"
                }`}
              >
                <span
                  aria-hidden
                  className={`text-[9px] leading-none ${
                    active ? "text-gold" : "text-transparent"
                  }`}
                >
                  ◆
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
