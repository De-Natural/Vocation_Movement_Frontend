"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentStatusBadge, RecurringBadge } from "./StatusBadges";
import { DownloadIcon, WalletIcon } from "@/components/ui/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { Contribution } from "@/lib/types";

export type PaymentRow = Contribution & {
  studentName?: string;
  billName?: string;
};

/**
 * Payment History table (PRD §4.5). Used for student (received) and sponsor (sent).
 * Monospace TX IDs, status pills, filters, CSV export.
 */
export function PaymentHistoryTable({
  rows,
  perspective,
}: {
  rows: PaymentRow[];
  perspective: "received" | "sent";
}) {
  const { toast } = useToast();
  const [donorType, setDonorType] = useState("all");
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (donorType === "named" && r.anonymous) return false;
      if (donorType === "anonymous" && !r.anonymous) return false;
      if (from && new Date(r.date) < new Date(from)) return false;
      if (to && new Date(r.date) > new Date(to)) return false;
      if (category !== "all" && r.billName && !r.billName.toLowerCase().includes(category.toLowerCase())) return false;
      return true;
    });
  }, [rows, donorType, category, from, to]);

  function exportCsv() {
    const header = perspective === "sent"
      ? ["Date", "Student", "Bill", "Amount", "Transaction ID", "Status"]
      : ["Date", "Donor", "Bill", "Amount", "Transaction ID", "Status"];
    const lines = filtered.map((r) =>
      [
        formatDate(r.date),
        perspective === "sent" ? r.studentName : r.donorName,
        r.billName ?? "",
        r.amount.toFixed(2),
        r.transactionId,
        r.status,
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${perspective}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Payment history exported to CSV.", "success");
  }

  const primaryCol = perspective === "sent" ? "Student" : "Donor";

  return (
    <div>
      {/* Filter controls (PRD §4.5) */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-card bg-white p-4 shadow-card">
        <div className="w-36">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="w-36">
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="w-44">
          <Select
            label="Bill category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: "all", label: "All categories" },
              { value: "School", label: "School Fees" },
              { value: "Medical", label: "Medical" },
              { value: "Books", label: "Books" },
              { value: "Clothing", label: "Clothing" },
              { value: "Feeding", label: "Feeding" },
            ]}
          />
        </div>
        <div className="w-40">
          <Select
            label="Donor type"
            value={donorType}
            onChange={(e) => setDonorType(e.target.value)}
            options={[
              { value: "all", label: "All donors" },
              { value: "named", label: "Named" },
              { value: "anonymous", label: "Anonymous" },
            ]}
          />
        </div>
        <div className="ml-auto">
          <Button variant="secondary" onClick={exportCsv}>
            <DownloadIcon size={16} /> Export to CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title="No payments found"
          description="No payments match your current filters. Try adjusting the date range or donor type."
          action={
            <Button variant="secondary" onClick={() => { setDonorType("all"); setCategory("all"); setFrom(""); setTo(""); }}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-card bg-white shadow-card">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy text-caption uppercase tracking-wide text-white">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">{primaryCol}</th>
                  <th className="px-5 py-3 font-semibold">Bill Funded</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Transaction ID</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inputborder/40">
                {filtered.map((r, i) => (
                  <tr key={r.id} className={i % 2 ? "bg-warm/30" : "bg-white"}>
                    <td className="whitespace-nowrap px-5 py-3 text-caption text-muted">{formatDate(r.date)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {perspective === "received" && (
                          <Avatar name={r.donorName} anonymous={r.anonymous} size="xs" />
                        )}
                        <span className="text-caption font-semibold text-navy">
                          {perspective === "sent" ? r.studentName : r.donorName}
                        </span>
                        {r.recurring && <RecurringBadge />}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-caption text-navy">{r.billName ?? "—"}</td>
                    <td className="px-5 py-3 text-caption font-semibold text-navy">{formatCurrency(r.amount)}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-caption text-accent">{r.transactionId}</span>
                    </td>
                    <td className="px-5 py-3"><PaymentStatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-inputborder/40 md:hidden">
            {filtered.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {perspective === "received" && <Avatar name={r.donorName} anonymous={r.anonymous} size="sm" />}
                    <div>
                      <p className="text-caption font-semibold text-navy">
                        {perspective === "sent" ? r.studentName : r.donorName}
                      </p>
                      <p className="text-label text-muted">{formatDate(r.date)}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-navy">{formatCurrency(r.amount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-label text-accent">{r.transactionId}</span>
                  <PaymentStatusBadge status={r.status} />
                </div>
                {r.billName && <p className="mt-1 text-label text-muted">{r.billName}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
