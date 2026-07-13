"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "単語", icon: "📖" },
  { href: "/shelf", label: "本棚", icon: "🗄" },
  { href: "/settings", label: "設定", icon: "⚙" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur">
      <p className="text-center text-[10px] leading-4 text-ink-soft/70 pt-0.5">
        Covers adapted from Standard Ebooks (public domain)
      </p>
      <ul className="flex justify-around items-center h-14">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                  active ? "text-green" : "text-ink-soft"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {tab.icon}
                </span>
                <span className={active ? "font-semibold" : ""}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
