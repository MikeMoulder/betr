import * as React from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid-field flex flex-col items-center px-6 py-20 text-center",
        className,
      )}
    >
      <div className="mb-5 grid size-14 place-items-center rounded-[var(--radius-lg)] border border-line bg-surface-2/80 text-ink-3 shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_16px_40px_-20px_rgba(0,0,0,0.7)]">
        {icon}
      </div>
      <h3 className="font-medium text-ink">{title}</h3>
      {children && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-3">
          {children}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
