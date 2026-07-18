import { formatEther } from "viem";

export function shortAddr(addr?: string, size = 4): string {
  if (!addr || addr.length < 10) return addr ?? "—";
  return `${addr.slice(0, 2 + size)}…${addr.slice(-size)}`;
}

/** Format wei as MON, trimmed to `maxFrac` decimals without trailing zeros. */
export function formatMon(wei?: bigint, maxFrac = 4): string {
  if (wei === undefined || wei === null) return "—";
  const s = formatEther(wei);
  const [int, frac = ""] = s.split(".");
  if (!frac) return int;
  const trimmed = frac.slice(0, maxFrac).replace(/0+$/, "");
  return trimmed ? `${int}.${trimmed}` : int;
}

export function bondOf(stake: bigint): bigint {
  return stake / 5n;
}

export function secondsLeft(
  deadline: bigint,
  nowSec = Math.floor(Date.now() / 1000),
): number {
  return Number(deadline) - nowSec;
}

/** Compact human duration: `2d 4h`, `12m 05s`, `43s`. */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0s";
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatDateTime(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** For <input type="datetime-local"> min/value helpers. */
export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function eqAddr(a?: string, b?: string): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}
