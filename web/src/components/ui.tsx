"use client";

import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";
import * as React from "react";

/* ------------------------------------------------------------------ Button */

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "win";
type Size = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap rounded-[var(--radius-sm)] transition-[background,border-color,color,box-shadow,transform] duration-150 disabled:opacity-45 disabled:pointer-events-none active:translate-y-px focus-visible:outline-2";

const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-ink hover:bg-brand-bright shadow-[0_10px_28px_-14px_var(--color-brand)]",
  secondary:
    "bg-surface-2 text-ink border border-line hover:bg-elevated hover:border-line-strong",
  outline:
    "bg-transparent text-ink border border-line hover:bg-surface-2 hover:border-line-strong",
  ghost: "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger:
    "bg-transparent text-loss border border-loss/35 hover:bg-loss/12 hover:border-loss/55",
  win: "bg-win text-win-ink hover:brightness-110",
};

const buttonSizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[0.8125rem]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[0.9375rem]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- Panel */

export function Panel({
  className,
  variant = "glass",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "solid" | "glass" | "glassStrong";
}) {
  const surface =
    variant === "glass"
      ? "glass"
      : variant === "glassStrong"
        ? "glass-strong"
        : "bg-surface border border-line";
  return (
    <div
      className={cn(surface, "rounded-[var(--radius-lg)]", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------- Label */

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("label block", className)} {...props} />;
}

/* ------------------------------------------------------------- Text inputs */

const controlBase =
  "w-full bg-bg-2 border border-line rounded-[var(--radius-sm)] text-ink placeholder:text-ink-3 transition-colors focus:border-brand/70 focus:bg-surface focus:outline-none";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }
>(function Input({ className, mono, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        controlBase,
        "h-10 px-3 text-sm",
        mono && "font-mono text-[0.8125rem] tracking-tight",
        className,
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(controlBase, "px-3 py-2.5 text-sm resize-none leading-relaxed", className)}
      {...props}
    />
  );
});

/* ------------------------------------------------------- Segmented control */

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-grid gap-1 p-1 bg-bg-2 border border-line rounded-[var(--radius-md)]",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 h-8 px-3 text-[0.8125rem] font-medium rounded-[var(--radius-sm)] transition-colors duration-150",
              active
                ? "bg-surface-2 text-ink shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]"
                : "text-ink-3 hover:text-ink-2",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- Field wrap */

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className="text-[0.75rem] text-ink-3">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} />;
}
