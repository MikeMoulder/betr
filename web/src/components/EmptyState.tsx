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
        "flex flex-col items-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 grid size-12 place-items-center rounded-[var(--radius-lg)] border border-line bg-surface-2 text-ink-3">
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
