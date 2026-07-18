"use client";

import { cn } from "@/lib/cn";
import { STATE_META, BetState, type StateTone } from "@/lib/contract";

const toneClass: Record<StateTone, string> = {
  brand: "bg-brand/12 text-brand border-brand/25",
  win: "bg-win/12 text-win border-win/25",
  loss: "bg-loss/14 text-loss border-loss/30",
  warn: "bg-warn/12 text-warn border-warn/25",
  neutral: "bg-surface-2 text-ink-3 border-line",
};

const dotClass: Record<StateTone, string> = {
  brand: "bg-brand",
  win: "bg-win",
  loss: "bg-loss",
  warn: "bg-warn",
  neutral: "bg-ink-3",
};

export function StatusBadge({
  state,
  size = "md",
}: {
  state: number;
  size?: "sm" | "md";
}) {
  const meta = STATE_META[state] ?? STATE_META[BetState.Open];
  const pulse =
    state === BetState.Active || state === BetState.PendingSettlement;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-full font-medium",
        toneClass[meta.tone],
        size === "sm"
          ? "h-5 pl-1.5 pr-2 text-[0.6875rem]"
          : "h-6 pl-2 pr-2.5 text-xs",
      )}
    >
      <span
        className={cn(
          "rounded-full",
          dotClass[meta.tone],
          size === "sm" ? "size-1.5" : "size-2",
          pulse && "live-dot",
        )}
      />
      {meta.label}
    </span>
  );
}
