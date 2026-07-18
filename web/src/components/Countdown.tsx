"use client";

import { useEffect, useState } from "react";
import { secondsLeft, formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Countdown({
  deadline,
  className,
  urgentUnder = 60,
}: {
  deadline: bigint;
  className?: string;
  urgentUnder?: number;
}) {
  const [left, setLeft] = useState(() => secondsLeft(deadline));

  useEffect(() => {
    const tick = () => setLeft(secondsLeft(deadline));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const done = left <= 0;
  const urgent = !done && left <= urgentUnder;

  return (
    <span
      className={cn(
        "font-mono tnum tabular-nums",
        done && "text-ink-3",
        urgent && "text-warn",
        className,
      )}
    >
      {done ? "elapsed" : formatDuration(left)}
    </span>
  );
}
