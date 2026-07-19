"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Inbox } from "lucide-react";
import { useAllBets } from "@/hooks/useBets";
import { BetTable, BetTableSkeleton } from "@/components/BetTable";
import { EmptyState } from "@/components/EmptyState";
import { Button, Segmented } from "@/components/ui";
import { BetState } from "@/lib/contract";
import { potOf } from "@/lib/betView";
import { formatMon } from "@/lib/format";

type Filter = "all" | "open" | "live" | "settled";

const LIVE_STATES = [
  BetState.Active,
  BetState.PendingSettlement,
  BetState.Disputed,
];
const SETTLED_STATES = [BetState.Resolved, BetState.Refunded];

export default function MarketsPage() {
  const { bets, isLoading } = useAllBets();
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    let locked = 0n;
    let open = 0;
    let live = 0;
    let settled = 0;
    for (const { bet } of bets) {
      if (bet.state === BetState.Open) {
        locked += bet.stake;
        open++;
      } else if (LIVE_STATES.includes(bet.state)) {
        locked += potOf(bet);
        live++;
      } else {
        settled++;
      }
    }
    return { locked, open, live, settled };
  }, [bets]);

  const filtered = useMemo(
    () =>
      bets.filter(({ bet }) => {
        if (filter === "all") return true;
        if (filter === "open") return bet.state === BetState.Open;
        if (filter === "live") return LIVE_STATES.includes(bet.state);
        return SETTLED_STATES.includes(bet.state);
      }),
    [bets, filter],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.75rem] text-ink sm:text-[2.1rem]">
            Markets
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            Public bets anyone can take. Stake, match, and settle onchain. The
            winner is paid automatically.
          </p>
        </div>
        <Link href="/create">
          <Button>
            <Plus className="size-4" />
            Create bet
          </Button>
        </Link>
      </div>

      {/* stat readout */}
      <div className="glass grid grid-cols-2 divide-line/70 rounded-[var(--radius-lg)] sm:grid-cols-4 sm:divide-x">
        <Stat label="Value Locked" value={`${formatMon(stats.locked, 2)} MON`} />
        <Stat label="Open" value={String(stats.open)} tone="brand" />
        <Stat label="Live" value={String(stats.live)} tone="brand" live />
        <Stat label="Settled" value={String(stats.settled)} tone="win" />
      </div>

      {/* toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "live", label: "Live" },
            { value: "settled", label: "Settled" },
          ]}
        />
        <span className="font-mono text-[0.75rem] text-ink-3">
          {filtered.length} market{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* body */}
      {isLoading ? (
        <BetTableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title={bets.length === 0 ? "No markets yet" : "Nothing here right now"}
          action={
            <Link href="/create">
              <Button variant="secondary">
                <Plus className="size-4" />
                Create the first bet
              </Button>
            </Link>
          }
        >
          {bets.length === 0
            ? "Be the first to open a public bet. Set the question, stake, and an arbiter. Anyone can take the other side."
            : "No bets match this filter. Try another view or create a new one."}
        </EmptyState>
      ) : (
        <BetTable bets={filtered} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  live,
}: {
  label: string;
  value: string;
  tone?: "brand" | "win";
  live?: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <div className="label flex items-center gap-1.5">
        {live && <span className="size-1.5 rounded-full bg-brand live-dot" />}
        {label}
      </div>
      <div
        className={`mt-1.5 font-mono text-xl font-medium tnum ${
          tone === "brand"
            ? "text-brand"
            : tone === "win"
              ? "text-win"
              : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
