/** Currency + number formatting helpers used across dashboards. */

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatCompact(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((now - then) / 1000);
  const mins = Math.round(diff / 60);
  const hours = Math.round(diff / 3600);
  const days = Math.round(diff / 86400);
  if (diff < 60) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function pct(raised: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((raised / total) * 100));
}

/**
 * Progress-bar fill tier per PRD §4.4:
 * 0–49% Red · 50–79% Amber · 80–99% Gold · 100% Green.
 */
export function progressTier(percent: number): "red" | "amber" | "gold" | "green" {
  if (percent >= 100) return "green";
  if (percent >= 80) return "gold";
  if (percent >= 50) return "amber";
  return "red";
}
