import { BetState, ZERO_ADDRESS, type Bet } from "./contract";
import { eqAddr } from "./format";

export type Role = "creator" | "counterparty" | "arbiter" | "observer";

export function roleOf(bet: Bet, account?: string): Role {
  if (eqAddr(bet.creator, account)) return "creator";
  if (eqAddr(bet.counterparty, account)) return "counterparty";
  if (eqAddr(bet.arbiter, account)) return "arbiter";
  return "observer";
}

export function isParticipant(bet: Bet, account?: string) {
  return eqAddr(bet.creator, account) || eqAddr(bet.counterparty, account);
}

export function potOf(bet: Bet) {
  return bet.stake * 2n;
}

export function bondOf(bet: Bet) {
  return bet.stake / 5n;
}

/** Open bet with no named counterparty → anyone may take it. */
export function isOpenToAnyone(bet: Bet) {
  return eqAddr(bet.counterparty, ZERO_ADDRESS);
}

export function primaryDeadline(
  bet: Bet,
): { deadline: bigint; label: string } | null {
  switch (bet.state) {
    case BetState.Open:
      return { deadline: bet.matchBy, label: "Match closes" };
    case BetState.Active:
      return { deadline: bet.resolveBy, label: "Resolve by" };
    case BetState.PendingSettlement:
      return { deadline: bet.challengeDeadline, label: "Challenge ends" };
    case BetState.Disputed:
      return { deadline: bet.arbiterDeadline, label: "Arbiter deadline" };
    default:
      return null;
  }
}
