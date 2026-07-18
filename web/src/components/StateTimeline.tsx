"use client";

import { cn } from "@/lib/cn";
import { BetState } from "@/lib/contract";
import { Check } from "lucide-react";

type NodeStatus = "done" | "current" | "todo";
type Tone = "brand" | "win" | "loss" | "neutral";

function buildSteps(state: number): {
  label: string;
  status: NodeStatus;
  tone: Tone;
}[] {
  const disputed = state === BetState.Disputed;
  const refunded = state === BetState.Refunded;
  const resolved = state === BetState.Resolved;

  const idx = (() => {
    switch (state) {
      case BetState.Open:
        return 0;
      case BetState.Active:
        return 1;
      case BetState.PendingSettlement:
      case BetState.Disputed:
        return 2;
      case BetState.Resolved:
      case BetState.Refunded:
        return 3;
      default:
        return 0;
    }
  })();

  const labels = [
    "Created",
    "Matched",
    disputed ? "Disputed" : "Claimed",
    refunded ? "Refunded" : "Settled",
  ];

  return labels.map((label, i) => {
    const status: NodeStatus =
      i < idx ? "done" : i === idx ? "current" : "todo";
    let tone: Tone = "brand";
    if (i === 2 && disputed) tone = "loss";
    if (i === 3 && resolved) tone = "win";
    if (i === 3 && refunded) tone = "neutral";
    return { label, status, tone };
  });
}

const toneRing: Record<Tone, string> = {
  brand: "border-brand text-brand",
  win: "border-win text-win",
  loss: "border-loss text-loss",
  neutral: "border-ink-3 text-ink-3",
};
const toneFill: Record<Tone, string> = {
  brand: "bg-brand text-brand-ink border-brand",
  win: "bg-win text-win-ink border-win",
  loss: "bg-loss text-loss-ink border-loss",
  neutral: "bg-surface-2 text-ink-3 border-line",
};

export function StateTimeline({ state }: { state: number }) {
  const steps = buildSteps(state);

  return (
    <ol className="flex items-center">
      {steps.map((s, i) => (
        <li key={i} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full border text-[0.6875rem] font-semibold transition-colors",
                s.status === "done" && toneFill[s.tone],
                s.status === "current" &&
                  cn("bg-transparent", toneRing[s.tone], "shadow-[0_0_0_4px_var(--tw-ring)]"),
                s.status === "todo" && "border-line bg-bg-2 text-ink-3",
              )}
              style={
                s.status === "current"
                  ? ({
                      // faint ring glow around the active node
                      ["--tw-ring" as string]:
                        "color-mix(in oklch, currentColor 18%, transparent)",
                    } as React.CSSProperties)
                  : undefined
              }
            >
              {s.status === "done" ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "text-[0.6875rem] font-medium whitespace-nowrap",
                s.status === "todo" ? "text-ink-3" : "text-ink-2",
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mx-2 h-px flex-1 -translate-y-2.5",
                s.status === "done" ? "bg-line-strong" : "bg-line",
              )}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
