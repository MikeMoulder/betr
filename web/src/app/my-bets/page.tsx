"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Plus, Inbox, Wallet, Gavel } from "lucide-react";
import { useAllBets, usePending } from "@/hooks/useBets";
import { useTx } from "@/hooks/useTx";
import { BetTable, BetTableSkeleton } from "@/components/BetTable";
import { EmptyState } from "@/components/EmptyState";
import { WalletButton } from "@/components/WalletButton";
import { Button, Panel, Segmented } from "@/components/ui";
import { BETR_ADDRESS, betrAbi } from "@/lib/contract";
import { isParticipant } from "@/lib/betView";
import { eqAddr, formatMon } from "@/lib/format";

type Tab = "playing" | "arbitrating";

export default function MyBetsPage() {
  const { address, isConnected } = useAccount();
  const { bets, isLoading } = useAllBets();
  const { data: pendingRaw, refetch: refetchPending } = usePending(address);
  const { run, isPending } = useTx();
  const [tab, setTab] = useState<Tab>("playing");

  const claimable = (pendingRaw as bigint | undefined) ?? 0n;

  const playing = useMemo(
    () => bets.filter(({ bet }) => isParticipant(bet, address)),
    [bets, address],
  );
  const arbitrating = useMemo(
    () => bets.filter(({ bet }) => eqAddr(bet.arbiter, address)),
    [bets, address],
  );

  const list = tab === "playing" ? playing : arbitrating;

  async function withdraw() {
    await run(
      {
        address: BETR_ADDRESS,
        abi: betrAbi,
        functionName: "withdraw",
        args: [],
      },
      { pending: "Withdrawing…", success: "Withdrawn to your wallet" },
      () => {
        void refetchPending();
      },
    );
  }

  if (!isConnected) {
    return (
      <EmptyState
        icon={<Wallet className="size-5" />}
        title="Connect your wallet"
        action={<WalletButton />}
      >
        Connect to see the bets you&apos;ve created, taken, or been asked to
        arbitrate, and to withdraw your winnings.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[1.75rem] text-ink sm:text-[2.1rem]">
            My Bets
          </h1>
          <p className="mt-1.5 text-sm text-ink-2">
            Everything you&apos;re staked in or refereeing.
          </p>
        </div>
        <Link href="/create">
          <Button>
            <Plus className="size-4" />
            Create bet
          </Button>
        </Link>
      </div>

      {/* claimable */}
      {claimable > 0n && (
        <Panel className="flex flex-wrap items-center justify-between gap-3 border-win/25 bg-win/5 p-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-win/12 text-win">
              <Wallet className="size-4" />
            </div>
            <div>
              <div className="label !text-ink-3">Ready to withdraw</div>
              <div className="font-mono text-lg font-semibold text-win tnum">
                {formatMon(claimable)} MON
              </div>
            </div>
          </div>
          <Button variant="win" loading={isPending} onClick={withdraw}>
            Withdraw all
          </Button>
        </Panel>
      )}

      <div className="flex items-center justify-between gap-4">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "playing", label: `Playing · ${playing.length}` },
            {
              value: "arbitrating",
              label: `Arbitrating · ${arbitrating.length}`,
            },
          ]}
        />
      </div>

      {isLoading ? (
        <BetTableSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={
            tab === "playing" ? (
              <Inbox className="size-5" />
            ) : (
              <Gavel className="size-5" />
            )
          }
          title={
            tab === "playing" ? "No bets yet" : "Nothing to arbitrate"
          }
          action={
            tab === "playing" ? (
              <Link href="/markets">
                <Button variant="secondary">Browse markets</Button>
              </Link>
            ) : undefined
          }
        >
          {tab === "playing"
            ? "Bets you create or take will show up here."
            : "When someone names you as arbiter, their bet appears here if it's disputed."}
        </EmptyState>
      ) : (
        <BetTable bets={list} />
      )}
    </div>
  );
}
