"use client";

import Link from "next/link";
import { Globe, Lock, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Countdown } from "./Countdown";
import type { IndexedBet } from "@/hooks/useBets";
import { Visibility } from "@/lib/contract";
import { formatMon, shortAddr } from "@/lib/format";
import { potOf, primaryDeadline, isOpenToAnyone } from "@/lib/betView";

export function BetTable({ bets }: { bets: IndexedBet[] }) {
  return (
    <div className="glass-strong overflow-hidden rounded-[var(--radius-lg)]">
      {/* header */}
      <div className="flex items-center gap-4 border-b border-line px-4 py-2.5">
        <span className="label flex-1">Market</span>
        <span className="label w-20 text-right">Stake</span>
        <span className="label hidden w-20 text-right md:block">Pot</span>
        <span className="label w-24">Status</span>
        <span className="label hidden w-36 lg:block">Deadline</span>
        <span className="w-4" />
      </div>

      <div className="divide-y divide-line">
        {bets.map(({ id, bet }) => {
          const dl = primaryDeadline(bet);
          return (
            <Link
              key={id}
              href={`/bet/${id}`}
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2"
            >
              {/* market */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">
                  {bet.question || "Untitled bet"}
                </div>
                <div className="mt-1 flex items-center gap-1.5 font-mono text-[0.6875rem] text-ink-3">
                  {bet.visibility === Visibility.Private ? (
                    <Lock className="size-3" />
                  ) : (
                    <Globe className="size-3" />
                  )}
                  <span>#{id}</span>
                  <span className="text-line-strong">·</span>
                  <span>{shortAddr(bet.creator, 3)}</span>
                  <span className="text-line-strong">vs</span>
                  <span>
                    {isOpenToAnyone(bet)
                      ? "open"
                      : shortAddr(bet.counterparty, 3)}
                  </span>
                </div>
              </div>

              {/* stake */}
              <div className="w-20 text-right font-mono text-[0.8125rem] text-ink tnum">
                {formatMon(bet.stake, 3)}
                <span className="ml-1 text-ink-3">MON</span>
              </div>

              {/* pot */}
              <div className="hidden w-20 text-right font-mono text-[0.8125rem] text-ink-2 tnum md:block">
                {formatMon(potOf(bet), 3)}
              </div>

              {/* status */}
              <div className="w-24">
                <StatusBadge state={bet.state} size="sm" />
              </div>

              {/* deadline */}
              <div className="hidden w-36 lg:block">
                {dl ? (
                  <div className="flex flex-col">
                    <span className="label !text-ink-3">{dl.label}</span>
                    <Countdown
                      deadline={dl.deadline}
                      className="text-[0.8125rem] text-ink-2"
                    />
                  </div>
                ) : (
                  <span className="font-mono text-[0.8125rem] text-ink-3">—</span>
                )}
              </div>

              <ChevronRight className="size-4 shrink-0 text-ink-3" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function BetTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-strong overflow-hidden rounded-[var(--radius-lg)]">
      <div className="flex items-center gap-4 border-b border-line px-4 py-2.5">
        <span className="label flex-1">Market</span>
        <span className="label w-20 text-right">Stake</span>
        <span className="label hidden w-20 text-right md:block">Pot</span>
        <span className="label w-24">Status</span>
        <span className="label hidden w-36 lg:block">Deadline</span>
        <span className="w-4" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3.5 w-2/3 rounded" />
              <div className="skeleton h-2.5 w-1/3 rounded" />
            </div>
            <div className="skeleton h-3.5 w-16 rounded" />
            <div className="skeleton hidden h-3.5 w-16 rounded md:block" />
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton hidden h-8 w-32 rounded lg:block" />
            <div className="w-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
