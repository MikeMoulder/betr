"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  Trophy,
  Swords,
  Gavel,
  RotateCcw,
  Wallet,
  Clock,
  Check,
  Link2,
  TriangleAlert,
  CircleCheck,
} from "lucide-react";
import { Button, Panel } from "./ui";
import { WalletButton } from "./WalletButton";
import { Address } from "./Address";
import { Countdown } from "./Countdown";
import { useNow } from "@/hooks/useNow";
import { usePending } from "@/hooks/useBets";
import { useTx } from "@/hooks/useTx";
import {
  BETR_ADDRESS,
  betrAbi,
  BetState,
  type Bet,
} from "@/lib/contract";
import { monadTestnet } from "@/lib/chain";
import { bondOf, isOpenToAnyone, isParticipant, roleOf } from "@/lib/betView";
import { eqAddr, formatMon } from "@/lib/format";

export function BetActions({
  id,
  bet,
  onChange,
}: {
  id: number;
  bet: Bet;
  onChange: () => void | Promise<void>;
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const now = useNow();
  const { run, isPending } = useTx();
  const { data: pendingRaw } = usePending(address);
  const claimable = (pendingRaw as bigint | undefined) ?? 0n;

  const wrongChain = isConnected && chainId !== monadTestnet.id;
  const role = roleOf(bet, address);
  const participant = isParticipant(bet, address);
  const bond = bondOf(bet);
  const done = () => onChange();

  const call = (
    functionName: string,
    labels: { pending: string; success: string },
    opts: { args?: readonly unknown[]; value?: bigint } = {},
  ) =>
    run(
      {
        address: BETR_ADDRESS,
        abi: betrAbi,
        functionName,
        args: (opts.args ?? [BigInt(id)]) as never,
        value: opts.value,
      } as never,
      labels,
      done,
    );

  const withdraw = () =>
    call("withdraw", { pending: "Withdrawing…", success: "Withdrawn" }, {
      args: [],
    });

  const connectGate = (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm text-ink-3">
        <Wallet className="size-4" />
        Connect your wallet to take part.
      </p>
      <WalletButton />
    </div>
  );

  const chainGate = (
    <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-loss/30 bg-loss/12 p-3 text-[0.8125rem] text-loss">
      <TriangleAlert className="size-4" />
      Switch to Monad Testnet to continue.
    </div>
  );

  function body() {
    switch (bet.state) {
      /* -------------------------------------------------- OPEN */
      case BetState.Open: {
        const expired = now > Number(bet.matchBy);
        if (expired) {
          return (
            <Action
              title="Match window closed"
              note="No one matched the stake in time. The creator's stake can be reclaimed."
            >
              {!isConnected ? connectGate : wrongChain ? chainGate : (
                <Button
                  variant="secondary"
                  loading={isPending}
                  onClick={() =>
                    call("refund", {
                      pending: "Refunding…",
                      success: "Stake reclaimed",
                    })
                  }
                >
                  <RotateCcw className="size-4" />
                  Reclaim stake
                </Button>
              )}
            </Action>
          );
        }
        if (role === "creator") {
          return (
            <Action
              title="Waiting for a taker"
              note="Share this bet so someone can match your stake."
            >
              <ShareLink id={id} />
            </Action>
          );
        }
        const invited =
          isOpenToAnyone(bet) || eqAddr(bet.counterparty, address);
        if (role === "arbiter") {
          return (
            <Action
              title="You're the arbiter"
              note="You'll only step in if both sides claim the win. Nothing to do yet."
            />
          );
        }
        if (!invited) {
          return (
            <Action title="Private bet" note="Reserved for a specific wallet.">
              <div className="flex items-center gap-2 text-sm text-ink-2">
                <Wallet className="size-4 text-ink-3" />
                Only <Address value={bet.counterparty} /> can take this side.
              </div>
            </Action>
          );
        }
        return (
          <Action
            title="Take the other side"
            note={`Match the stake to lock in the bet. Your ${formatMon(
              bet.stake,
            )} MON is escrowed until it settles.`}
          >
            {!isConnected ? connectGate : wrongChain ? chainGate : (
              <Button
                loading={isPending}
                onClick={() =>
                  call(
                    "acceptBet",
                    { pending: "Matching stake…", success: "Bet matched, now live" },
                    { value: bet.stake },
                  )
                }
              >
                <Swords className="size-4" />
                Match &amp; stake {formatMon(bet.stake)} MON
              </Button>
            )}
          </Action>
        );
      }

      /* ------------------------------------------------ ACTIVE */
      case BetState.Active: {
        const expired = now > Number(bet.resolveBy);
        if (expired) {
          return (
            <Action
              title="No one claimed in time"
              note="The resolve window passed with no winner claimed. Both stakes can be refunded."
            >
              {!isConnected ? connectGate : wrongChain ? chainGate : (
                <Button
                  variant="secondary"
                  loading={isPending}
                  onClick={() =>
                    call("refund", {
                      pending: "Refunding…",
                      success: "Stakes refunded",
                    })
                  }
                >
                  <RotateCcw className="size-4" />
                  Refund both stakes
                </Button>
              )}
            </Action>
          );
        }
        if (participant) {
          return (
            <Action
              title="Claim the outcome"
              note={`If you won, claim it. This posts a ${formatMon(
                bond,
              )} MON bond, refunded when it settles unless the arbiter rules against you.`}
            >
              {!isConnected ? connectGate : wrongChain ? chainGate : (
                <Button
                  loading={isPending}
                  onClick={() =>
                    call(
                      "claimVictory",
                      { pending: "Claiming victory…", success: "Victory claimed" },
                      { value: bond },
                    )
                  }
                >
                  <Trophy className="size-4" />
                  Claim I won
                </Button>
              )}
            </Action>
          );
        }
        return (
          <Action
            title="Bet is live"
            note="Both sides have staked. Awaiting the outcome and a claim."
          />
        );
      }

      /* -------------------------------- PENDING SETTLEMENT */
      case BetState.PendingSettlement: {
        const windowClosed = now > Number(bet.challengeDeadline);
        const iAmClaimant = eqAddr(bet.claimant, address);

        if (windowClosed) {
          return (
            <Action
              title="Ready to settle"
              note="The challenge window has closed with no dispute. Settle to release the pot to the claimant."
            >
              {!isConnected ? connectGate : wrongChain ? chainGate : (
                <Button
                  loading={isPending}
                  onClick={() =>
                    call("finalize", {
                      pending: "Settling…",
                      success: "Bet settled",
                    })
                  }
                >
                  <CircleCheck className="size-4" />
                  Settle bet
                </Button>
              )}
            </Action>
          );
        }
        if (participant && !iAmClaimant) {
          return (
            <Action
              title="Someone claimed the win"
              note={`Disagree? Dispute it by posting a ${formatMon(
                bond,
              )} MON bond. This sends it to the arbiter. If you're right, you take the pot and both bonds.`}
            >
              {!isConnected ? connectGate : wrongChain ? chainGate : (
                <Button
                  variant="danger"
                  loading={isPending}
                  onClick={() =>
                    call(
                      "claimVictory",
                      { pending: "Disputing…", success: "Dispute opened" },
                      { value: bond },
                    )
                  }
                >
                  <Swords className="size-4" />
                  Dispute: I won
                </Button>
              )}
            </Action>
          );
        }
        if (iAmClaimant) {
          return (
            <Action
              title="You claimed the win"
              note="If no one disputes before the window closes, the pot settles to you. Silence is concession."
            >
              <span className="inline-flex items-center gap-2 text-sm text-ink-2">
                <Clock className="size-4 text-warn" />
                Settles in{" "}
                <Countdown deadline={bet.challengeDeadline} className="text-ink" />
              </span>
            </Action>
          );
        }
        return (
          <Action
            title="Awaiting settlement"
            note="A winner was claimed. The other side has the challenge window to dispute."
          />
        );
      }

      /* ---------------------------------------------- DISPUTED */
      case BetState.Disputed: {
        const expired = now > Number(bet.arbiterDeadline);
        if (role === "arbiter" && !expired) {
          return (
            <Action
              title="You're the arbiter: rule the winner"
              note="Both sides claim the win. Award the pot (and both bonds) to whoever actually won."
            >
              {wrongChain ? (
                chainGate
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    loading={isPending}
                    onClick={() =>
                      call(
                        "arbitrate",
                        { pending: "Ruling…", success: "Ruling recorded" },
                        { args: [BigInt(id), bet.creator] },
                      )
                    }
                  >
                    <Gavel className="size-4" />
                    Award creator
                  </Button>
                  <Button
                    variant="secondary"
                    loading={isPending}
                    onClick={() =>
                      call(
                        "arbitrate",
                        { pending: "Ruling…", success: "Ruling recorded" },
                        { args: [BigInt(id), bet.counterparty] },
                      )
                    }
                  >
                    <Gavel className="size-4" />
                    Award taker
                  </Button>
                </div>
              )}
            </Action>
          );
        }
        if (expired) {
          return (
            <Action
              title="Arbiter didn't rule"
              note="The arbiter deadline passed. Both stakes and bonds can be refunded."
            >
              {!isConnected ? connectGate : wrongChain ? chainGate : (
                <Button
                  variant="secondary"
                  loading={isPending}
                  onClick={() =>
                    call("refund", {
                      pending: "Refunding…",
                      success: "Refunded",
                    })
                  }
                >
                  <RotateCcw className="size-4" />
                  Refund stakes &amp; bonds
                </Button>
              )}
            </Action>
          );
        }
        return (
          <Action
            title="Awaiting the arbiter"
            note="Both sides claimed the win. The arbiter will decide."
          >
            <span className="inline-flex items-center gap-2 text-sm text-ink-2">
              <Gavel className="size-4 text-ink-3" />
              Arbiter <Address value={bet.arbiter} /> · ends in{" "}
              <Countdown deadline={bet.arbiterDeadline} className="text-ink" />
            </span>
          </Action>
        );
      }

      /* -------------------------------- RESOLVED / REFUNDED */
      case BetState.Resolved: {
        const iWon = eqAddr(bet.winner, address);
        return (
          <Action
            title={iWon ? "You won" : "Settled"}
            note={
              iWon
                ? "The pot is yours. Withdraw it to your wallet."
                : undefined
            }
          >
            <div className="flex items-center gap-2 text-sm text-ink-2">
              <Trophy className="size-4 text-win" />
              Winner: <Address value={bet.winner} you={iWon} />
            </div>
          </Action>
        );
      }
      case BetState.Refunded:
        return (
          <Action
            title="Bet unwound"
            note="This bet stalled and was refunded. Any balance owed to you is claimable below."
          />
        );

      default:
        return null;
    }
  }

  return (
    <Panel className="flex flex-col gap-4 p-5">
      <h2 className="text-sm font-semibold text-ink">Your move</h2>

      {claimable > 0n && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-win/25 bg-win/10 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="size-4 text-win" />
            <span className="text-ink-2">Claimable</span>
            <span className="font-mono font-semibold text-win tnum">
              {formatMon(claimable)} MON
            </span>
          </div>
          <Button
            variant="win"
            size="sm"
            loading={isPending}
            onClick={withdraw}
          >
            Withdraw
          </Button>
        </div>
      )}

      {body()}
    </Panel>
  );
}

function Action({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-sm font-medium text-ink">{title}</div>
        {note && (
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-3">
            {note}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function ShareLink({ id }: { id: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}/bet/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };
  return (
    <Button variant="secondary" onClick={copy}>
      {copied ? (
        <Check className="size-4 text-win" />
      ) : (
        <Link2 className="size-4" />
      )}
      {copied ? "Link copied" : "Copy share link"}
    </Button>
  );
}
