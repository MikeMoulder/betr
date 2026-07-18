"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { WalletButton } from "./WalletButton";
import { Button } from "./ui";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/markets", label: "Markets" },
  { href: "/my-bets", label: "My Bets" },
];

export function TopNav() {
  const path = usePathname();

  return (
    <header className="glass-nav sticky top-0 z-[var(--z-sticky)] border-b border-line">
      <div className="mx-auto flex h-14 max-w-[1160px] items-center gap-5 px-5">
        <Link href="/home" className="group flex items-baseline gap-1.5">
          <span className="font-mono text-[1.0625rem] font-semibold lowercase tracking-tight text-ink transition-colors group-hover:text-brand">
            betr
          </span>
          <span className="size-1.5 rounded-full bg-brand transition-transform group-hover:scale-125" />
          <span className="hidden rounded border border-line px-1 py-px font-mono text-[0.625rem] text-ink-3 sm:inline">
            TESTNET
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "inline-flex h-8 items-center rounded-[var(--radius-sm)] px-3 text-sm transition-colors",
                  active
                    ? "bg-surface-2 text-ink"
                    : "text-ink-3 hover:text-ink-2",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <Link href="/create" className="hidden sm:block">
            <Button size="sm" variant="secondary">
              <Plus className="size-4" />
              New bet
            </Button>
          </Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
