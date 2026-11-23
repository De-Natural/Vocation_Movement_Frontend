/** Currency + number formatting helpers used across dashboards. */

/**
 * Naira is the platform currency: bills, balances, progress bars and totals
 * are all in naira. Gifts paid in another currency keep their original amount
 * and get a naira value locked at the Super-Admin's exchange rate.
 */
export const PLATFORM_CURRENCY = "NGN";

/** "₦7,138" / "$50" / "€20" ("narrowSymbol" shows ₦, not "NGN"). */
export function formatCurrency(amount: number, currency: string = PLATFORM_CURRENCY): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatCompact(amount: number, currency: string = PLATFORM_CURRENCY): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

/** The ₦ / $ / € sign alone, e.g. for an input prefix. */
export function currencySymbol(currency: string = PLATFORM_CURRENCY): string {
  return (
    new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

/**
 * A single gift: naira as is; another currency as "$50 (₦75,000)", or just
 * "$50" while that currency has no exchange rate yet.
 */
export function formatGift(amount: number, currency?: string, nairaAmount?: number | null): string {
  if (!currency || currency === PLATFORM_CURRENCY) return formatCurrency(amount);
  const original = formatCurrency(amount, currency);
  return typeof nairaAmount === "number" ? `${original} (${formatCurrency(nairaAmount)})` : original;
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
