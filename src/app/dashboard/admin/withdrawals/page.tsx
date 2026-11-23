"use client";

import { useState } from "react";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoIcon, WalletIcon } from "@/components/ui/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { withdrawalsApi, type WithdrawalStatus } from "@/lib/withdrawals-api";

const FILTERS: { key: "" | WithdrawalStatus; label: string }[] = [
  { key: "", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "paid", label: "Paid" },
  { key: "failed", label: "Failed" },
];

const TONE: Record<WithdrawalStatus, "success" | "amber" | "alert" | "neutral"> = {
  paid: "success",
  processing: "amber",
  awaiting_otp: "neutral",
  failed: "alert",
  cancelled: "neutral",
};

const LABEL: Record<WithdrawalStatus, string> = {
  paid: "Paid",
  processing: "Processing",
  awaiting_otp: "Awaiting code",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** Read-only view of student withdrawals (they pay out automatically after the SMS code). */
export default function AdminWithdrawalsPage() {
  const [status, setStatus] = useState<"" | WithdrawalStatus>("");
  const { data, error, loading, reload } = useApi(
    () => withdrawalsApi.adminList({ status: status || undefined }),
    [status]
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Withdrawals"
        subtitle="Money students have moved to their bank accounts. Each one was confirmed by an SMS code to the student's verified phone."
      />

      {data && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          {(["paid", "processing", "failed"] as const).map((k) => (
            <Card key={k} className="p-4">
              <p className="text-caption font-semibold text-muted">{LABEL[k]}</p>
              <p className="mt-1 font-display text-h2 text-navy">{formatCurrency(data.totals[k]?.amount ?? 0, "NGN")}</p>
              <p className="text-label text-muted">{data.totals[k]?.count ?? 0} withdrawals</p>
            </Card>
          ))}
        </div>
      )}
      {data && !data.liveTransfers && (
        <p className="mb-4 flex items-center gap-2 rounded-input bg-amber-soft px-3 py-2 text-caption text-amber">
          <InfoIcon size={16} /> Test mode: transfers are simulated and no real money moves.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              "rounded-pill px-4 py-1.5 text-caption font-semibold transition-colors",
              status === f.key ? "bg-navy text-white" : "bg-white text-navy hover:bg-warm"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-card bg-white/60 shadow-card" />
      ) : error || !data ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title="Couldn't load withdrawals"
          description={error ?? undefined}
          action={<Button variant="secondary" onClick={() => reload()}>Try again</Button>}
        />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<WalletIcon size={28} />} title="No withdrawals yet" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-caption">
            <thead className="border-b border-inputborder/30 text-label uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Bank account</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inputborder/30">
              {data.items.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 text-navy">{formatDate(w.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/students/${w.studentSlug}`} className="font-semibold text-navy hover:text-gold">
                      {w.studentName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-navy">{formatCurrency(w.amount, w.currency)}</td>
                  <td className="px-4 py-3 text-muted">
                    {w.accountName}
                    <br />
                    {w.bankName} · {w.accountNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-label text-muted">{w.reference}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TONE[w.status]}>{LABEL[w.status]}</Badge>
                    {w.failureReason && <p className="mt-1 text-label text-muted">{w.failureReason}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
