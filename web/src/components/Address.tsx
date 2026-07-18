"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Address({
  value,
  you = false,
  size = 4,
  className,
}: {
  value?: string;
  you?: boolean;
  size?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!value)
    return <span className={cn("font-mono text-ink-3", className)}>—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="font-mono text-[0.8125rem] text-ink-2" title={value}>
        {shortAddr(value, size)}
      </span>
      {you && (
        <span className="rounded bg-brand/12 border border-brand/25 px-1 py-px text-[0.625rem] font-medium leading-none text-brand">
          YOU
        </span>
      )}
      <button
        onClick={copy}
        className="text-ink-3 transition-colors hover:text-ink"
        aria-label="Copy address"
        type="button"
      >
        {copied ? (
          <Check className="size-3 text-win" />
        ) : (
          <Copy className="size-3" />
        )}
      </button>
    </span>
  );
}
