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
    <header className="sticky top-0 z-[var(--z-sticky)] px-3 pt-3 sm:px-5">
      <div className="glass-nav relative mx-auto flex h-14 max-w-[1128px] items-center gap-5 rounded-full px-4 sm:px-5">
        {/* lit top edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full border border-white/[0.08]"
        />
        <Link href="/home" className="group flex items-baseline gap-1.5">
          <span className="font-mono text-[1.0625rem] font-semibold lowercase tracking-tight text-ink transition-colors group-hover:text-brand">
            betr
          </span>
          <span className="size-1.5 rounded-full bg-brand transition-transform group-hover:scale-125" />
          <span className="hidden rounded-full border border-line px-1.5 py-px font-mono text-[0.625rem] text-ink-3 sm:inline">
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
                  "inline-flex h-8 items-center rounded-full px-3.5 text-sm transition-colors",
                  active
                    ? "bg-elevated text-ink shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
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
