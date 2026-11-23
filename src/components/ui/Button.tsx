"use client";

import { forwardRef, useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Show the spinner and block clicks (e.g. while a form submits). */
  loading?: boolean;
}

// PRD §2.4 — pill radius for primary CTAs, 8px for secondary.
const base =
  "relative inline-flex items-center justify-center gap-2 font-sans font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "rounded-pill bg-gold text-white shadow-sm hover:bg-gold-dark hover:shadow-md active:scale-[0.98]",
  secondary:
    "rounded-lg border-[1.5px] border-navy/25 bg-transparent text-navy hover:bg-navy/5 active:scale-[0.98]",
  ghost:
    "rounded-lg bg-transparent text-navy hover:bg-navy/5 active:scale-[0.98]",
  danger:
    "rounded-pill bg-alert text-white hover:brightness-95 active:scale-[0.98]",
  icon: "rounded-full bg-transparent text-navy hover:bg-navy/5 active:scale-95 aspect-square",
};

const sizes: Record<Size, string> = {
  sm: "text-caption px-4 py-2",
  md: "text-body px-6 py-2.5",
  lg: "text-body px-8 py-3.5",
};

const iconSizes: Record<Size, string> = {
  sm: "p-1.5",
  md: "p-2.5",
  lg: "p-3",
};

/** Small CSS ring spinner in the button's text colour. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-[1.1em] w-[1.1em] shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent",
        className
      )}
    />
  );
}

/**
 * The app's button. It shows a spinner when `loading` is set, and also by
 * itself while an `onClick` that returns a Promise is still running, so
 * every async action gives instant feedback and can't be double-clicked.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", fullWidth, loading, className, onClick, disabled, children, ...props },
    ref
  ) => {
    const [pending, setPending] = useState(false);
    const mounted = useRef(true);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);

    const handleClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        const result = onClick?.(e) as unknown;
        if (result && typeof (result as Promise<unknown>).then === "function") {
          setPending(true);
          (result as Promise<unknown>).finally(() => {
            if (mounted.current) setPending(false);
          });
        }
      },
      [onClick]
    );

    const busy = !!loading || pending;

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          variant === "icon" ? iconSizes[size] : sizes[size],
          fullWidth && "w-full",
          busy && "cursor-wait",
          className
        )}
        onClick={onClick ? handleClick : undefined}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        {...props}
      >
        {busy && <Spinner />}
        {variant === "icon" && busy ? null : children}
      </button>
    );
  }
);
Button.displayName = "Button";
