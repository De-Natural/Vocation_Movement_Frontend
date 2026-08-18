"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { progressTier } from "@/lib/format";

const tierFill: Record<string, string> = {
  red: "bg-alert",
  amber: "bg-amber",
  gold: "bg-gold",
  green: "bg-success",
};

/**
 * Pill-shaped progress bar (PRD §2.4 / §4.4).
 * Fill colour follows the required tier logic:
 * 0–49% red · 50–79% amber · 80–99% gold · 100% green.
 */
export function ProgressBar({
  value,
  className,
  showLabel = false,
  height = "md",
}: {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  height?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const tier = progressTier(clamped);
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-progress bg-warm",
          heights[height]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={cn("h-full rounded-progress", tierFill[tier])}
          initial={{ width: 0 }}
          whileInView={{ width: `${clamped}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between text-caption text-muted">
          <span>{clamped}% funded</span>
        </div>
      )}
    </div>
  );
}
