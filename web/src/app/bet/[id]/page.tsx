"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ArrowLeft, Globe, Lock, Search } from "lucide-react";
import { useBet } from "@/hooks/useBets";
import { BetActions } from "@/components/BetActions";
import { StatusBadge } from "@/components/StatusBadge";
import { StateTimeline } from "@/components/StateTimeline";
import { Address } from "@/components/Address";
import { Countdown } from "@/components/Countdown";
import { EmptyState } from "@/components/EmptyState";
import { Panel } from "@/components/ui";
import {
  BetState,
  STATE_META,
  Visibility,
  ZERO_ADDRESS,
  type Bet,
} from "@/lib/contract";
import { eqAddr, formatDateTime, formatMon } from "@/lib/format";
import { bondOf, isOpenToAnyone, potOf, primaryDeadline } from "@/lib/betView";
import { cn } from "@/lib/cn";

export default function BetDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { address } = useAccount();
  const { data, isLoading, refetch } = useBet(
    Number.isFinite(id) ? id : undefined,
  );
  const bet = data as unknown as Bet | undefined;

  if (isLoading) return <DetailSkeleton />;

  if (!bet || eqAddr(bet.creator, ZERO_ADDRESS)) {
    return (
      <EmptyState
        icon={<Search className="size-5" />}
        title="Bet not found"
        action={
          <Link
            href="/markets"
            className="text-sm text-brand transition-colors hover:text-brand-bright"
          >
            Back to Markets
          </Link>
        }
      >
        There's no bet at #{params.id}. It may not exist on this network.
      </EmptyState>
    );
  }

  const meta = STATE_META[bet.state] ?? STATE_META[BetState.Open];
  const dl = primaryDeadline(bet);
  const iAmWinner =
    bet.state === BetState.Resolved && eqAddr(bet.winner, address);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/markets"
        className="inline-flex items-center gap-1.5 text-sm text-ink-3 transition-colors hover:text-ink-2"
      >
        <ArrowLeft className="size-4" />
        Markets
      </Link>

      {/* header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 font-mono text-[0.6875rem] text-ink-3">
          {bet.visibility === Visibility.Private ? (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" /> PRIVATE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Globe className="size-3" /> PUBLIC
            </span>
          )}
          <span className="text-line-strong">·</span>
          <span>BET #{id}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-ink text-balance">
            {bet.question || "Untitled bet"}
          </h1>
          <StatusBadge state={bet.state} />
        </div>
        <p className="text-sm text-ink-2">{meta.desc}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* left */}
        <div className="flex flex-col gap-6">
          <Panel className="p-6">
            <StateTimeline state={bet.state} />
            {dl && (
              <div className="mt-6 flex items-center justify-center gap-2 border-t border-line pt-4 text-sm text-ink-2">
                <span className="label !text-ink-3">{dl.label}</span>
                <Countdown
                  deadline={dl.deadline}
                  className="text-base text-ink"
                />
              </div>
            )}
          </Panel>

          {/* matchup */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
            <PartyCard
              label="Creator"
              address={bet.creator}
              you={eqAddr(bet.creator, address)}
              stake={bet.stake}
              claimed={
                bet.creatorClaimed &&
                (bet.state === BetState.PendingSettlement ||
                  bet.state === BetState.Disputed)
              }
              won={bet.state === BetState.Resolved && eqAddr(bet.winner, bet.creator)}
            />
            <div className="hidden items-center justify-center sm:flex">
              <span className="font-mono text-[0.6875rem] text-ink-3">VS</span>
            </div>
            {isOpenToAnyone(bet) && bet.state === BetState.Open ? (
              <OpenSeat />
            ) : (
              <PartyCard
                label="Taker"
                address={bet.counterparty}
                you={eqAddr(bet.counterparty, address)}
                stake={bet.state === BetState.Open ? undefined : bet.stake}
                claimed={
                  bet.counterpartyClaimed &&
                  (bet.state === BetState.PendingSettlement ||
                    bet.state === BetState.Disputed)
                }
                won={
                  bet.state === BetState.Resolved &&
                  eqAddr(bet.winner, bet.counterparty)
                }
              />
            )}
          </div>

          {/* details */}
          <Panel className="p-5">
            <h2 className="label mb-3">Details</h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              <Detail label="Stake per side" value={`${formatMon(bet.stake)} MON`} />
              <Detail label="Total pot" value={`${formatMon(potOf(bet))} MON`} strong />
              <Detail label="Dispute bond" value={`${formatMon(bondOf(bet))} MON`} />
              <Detail
                label="Visibility"
                value={
                  bet.visibility === Visibility.Private ? "Private" : "Public"
                }
              />
              <Detail
                label="Arbiter"
                value={<Address value={bet.arbiter} you={eqAddr(bet.arbiter, address)} />}
              />
              {iAmWinner || bet.state === BetState.Resolved ? (
                <Detail
                  label="Winner"
                  value={<Address value={bet.winner} you={iAmWinner} />}
                />
              ) : (
                <Detail label="Match deadline" value={formatDateTime(bet.matchBy)} />
              )}
              <Detail label="Resolve deadline" value={formatDateTime(bet.resolveBy)} />
              {bet.challengeDeadline > 0n && (
                <Detail
                  label="Challenge ends"
                  value={formatDateTime(bet.challengeDeadline)}
                />
              )}
            </dl>
          </Panel>
        </div>

        {/* right — actions */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <BetActions
            id={id}
            bet={bet}
            onChange={() => {
              void refetch();
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function PartyCard({
  label,
  address,
  you,
  stake,
  claimed,
  won,
}: {
  label: string;
  address?: string;
  you?: boolean;
  stake?: bigint;
  claimed?: boolean;
  won?: boolean;
}) {
  return (
    <Panel
      className={cn(
        "flex flex-col gap-3 p-4",
        won && "border-win/40 bg-win/5",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {won && (
          <span className="rounded bg-win/12 border border-win/25 px-1.5 py-px text-[0.625rem] font-medium text-win">
            WON
          </span>
        )}
        {claimed && !won && (
          <span className="rounded bg-warn/12 border border-warn/25 px-1.5 py-px text-[0.625rem] font-medium text-warn">
            CLAIMED
          </span>
        )}
      </div>
      <Address value={address} you={you} size={5} />
      <div className="font-mono text-lg text-ink tnum">
        {stake !== undefined ? (
          <>
            {formatMon(stake)} <span className="text-sm text-ink-3">MON</span>
          </>
        ) : (
          <span className="text-sm text-ink-3">not staked yet</span>
        )}
      </div>
    </Panel>
  );
}

function OpenSeat() {
  return (
    <div className="flex flex-col justify-center gap-1.5 rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-bg-2 p-4">
      <span className="label">Taker</span>
      <span className="text-sm text-ink-2">Open seat</span>
      <span className="text-[0.75rem] text-ink-3">
        Anyone can match the stake.
      </span>
    </div>
  );
}

function Detail({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-2.5 last:border-0 sm:last:border-b">
      <dt className="text-[0.8125rem] text-ink-3">{label}</dt>
      <dd
        className={cn(
          "text-right font-mono text-[0.8125rem] tnum",
          strong ? "font-semibold text-ink" : "text-ink-2",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="flex flex-col gap-3">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-7 w-2/3 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div className="skeleton h-28 rounded-[var(--radius-lg)]" />
          <div className="skeleton h-32 rounded-[var(--radius-lg)]" />
          <div className="skeleton h-40 rounded-[var(--radius-lg)]" />
        </div>
        <div className="skeleton h-56 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
