import { type ReactNode } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { cn } from "@/lib/utils";

/** KPI stat tile used across all dashboards (PRD §4.3, §4.9, §4.10). */
export function StatTile({
  label,
  value,
  prefix,
  suffix,
  icon,
  tone = "gold",
  compact = false,
  animate = true,
  hint,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: ReactNode;
  tone?: "gold" | "navy" | "success" | "accent" | "alert";
  compact?: boolean;
  animate?: boolean;
  hint?: string;
}) {
  const toneMap = {
    gold: "bg-gold/12 text-gold-dark",
    navy: "bg-navy/10 text-navy",
    success: "bg-success-soft text-success",
    accent: "bg-accent/10 text-accent",
    alert: "bg-alert-soft text-alert",
  };
  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-caption font-semibold uppercase tracking-wide text-muted">{label}</p>
        {icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", toneMap[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-h1 leading-none text-navy">
        {animate ? (
          <CountUp value={value} prefix={prefix} suffix={suffix} compact={compact} />
        ) : (
          <>
            {prefix}
            {value}
            {suffix}
          </>
        )}
      </div>
      {hint && <p className="mt-2 text-caption text-muted">{hint}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  action,
  subtitle,
}: {
  title: string;
  action?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-h2 text-navy">{title}</h2>
        {subtitle && <p className="mt-1 text-caption text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-h1 text-navy">{title}</h1>
      {subtitle && <p className="mt-1 text-body text-muted">{subtitle}</p>}
    </div>
  );
}
