import { betrAbi } from "./betrAbi";

export { betrAbi };

export const BETR_ADDRESS =
  "0x733b6423fe71372B9940071683d63a8Bd00c2fA8" as const;

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

/**
 * Betr's default arbiter — used when a creator doesn't name one. The contract
 * requires a non-zero arbiter, so the UI substitutes this admin wallet.
 */
export const DEFAULT_ARBITER =
  "0xF69674F579Fa076B10DB209E7531A5bfEef9C1AB" as const;

export enum BetState {
  Open = 0,
  Active = 1,
  PendingSettlement = 2,
  Disputed = 3,
  Resolved = 4,
  Refunded = 5,
}

export enum Visibility {
  Public = 0,
  Private = 1,
}

/** Shape returned by `getBet(betId)`. uint64/uint256 decode to bigint. */
export type Bet = {
  creator: `0x${string}`;
  counterparty: `0x${string}`;
  arbiter: `0x${string}`;
  visibility: number;
  state: number;
  stake: bigint;
  matchBy: bigint;
  resolveBy: bigint;
  challengeDeadline: bigint;
  arbiterDeadline: bigint;
  claimant: `0x${string}`;
  winner: `0x${string}`;
  creatorClaimed: boolean;
  counterpartyClaimed: boolean;
  question: string;
};

export type StateTone = "brand" | "win" | "loss" | "warn" | "neutral";

export const STATE_META: Record<
  number,
  { label: string; tone: StateTone; short: string; desc: string }
> = {
  [BetState.Open]: {
    label: "Open",
    tone: "brand",
    short: "OPEN",
    desc: "Waiting for someone to match the stake.",
  },
  [BetState.Active]: {
    label: "Live",
    tone: "brand",
    short: "LIVE",
    desc: "Both sides staked. Awaiting the outcome.",
  },
  [BetState.PendingSettlement]: {
    label: "Settling",
    tone: "warn",
    short: "SETTLING",
    desc: "A winner was claimed. Challenge window is open.",
  },
  [BetState.Disputed]: {
    label: "Disputed",
    tone: "loss",
    short: "DISPUTED",
    desc: "Both sides claim the win. Arbiter to rule.",
  },
  [BetState.Resolved]: {
    label: "Settled",
    tone: "win",
    short: "SETTLED",
    desc: "Resolved. The winner can withdraw the pot.",
  },
  [BetState.Refunded]: {
    label: "Refunded",
    tone: "neutral",
    short: "REFUND",
    desc: "Unwound. Stakes were returned.",
  },
};

export function isOpen(state: number) {
  return state === BetState.Open;
}
