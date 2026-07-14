"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive =
    pathname?.startsWith("/session") || pathname?.startsWith("/welcome");

  return (
    <>
      <div className={immersive ? "flex-1" : "flex-1 pb-24"}>{children}</div>
      {!immersive && <BottomNav />}
    </>
  );
}
