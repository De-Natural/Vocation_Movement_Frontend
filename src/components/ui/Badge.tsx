import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

// PRD §5 Badge/Tag — colour-coded per type.
type BadgeTone =
  | "gold"
  | "navy"
  | "success"
  | "alert"
  | "amber"
  | "accent"
  | "neutral";

const tones: Record<BadgeTone, string> = {
  gold: "bg-gold/15 text-gold-dark",
  navy: "bg-navy/10 text-navy",
  success: "bg-success-soft text-success",
  alert: "bg-alert-soft text-alert",
  amber: "bg-amber-soft text-amber",
  accent: "bg-accent/10 text-accent",
  neutral: "bg-warm text-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-3 py-1 text-label uppercase tracking-wide font-semibold",
        tones[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
