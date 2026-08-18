"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Select, Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentStatusBadge, RecurringBadge } from "@/components/domain/StatusBadges";
import { useToast } from "@/components/ui/Toast";
import { DownloadIcon, WalletIcon } from "@/components/ui/icons";
import { students } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";

interface FeedRow {
  id: string;
  date: string;
  donorName: string;
  anonymous: boolean;
  studentName: string;
  congregation: string;
  billName: string;
  amount: number;
  transactionId: string;
  status: string;
  recurring?: boolean;
}

// Flatten every contribution across all students into one platform feed.
const feed: FeedRow[] = students
  .flatMap((s) =>
    s.bills.flatMap((b) =>
      b.contributions.map((c) => ({
        id: c.id,
        date: c.date,
        donorName: c.donorName,
        anonymous: c.anonymous,
        studentName: s.name,
        congregation: s.congregation,
        billName: b.name,
        amount: c.amount,
        transactionId: c.transactionId,
        status: c.status,
        recurring: c.recurring,
      }))
    )
  )
  .sort((a, b) => b.date.localeCompare(a.date));

const congregations = Array.from(new Set(students.map((s) => s.congregation)));

export default function TransactionsPage() {
  const { toast } = useToast();
  const [congregation, setCongregation] = useState("all");
  const [donorType, setDonorType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () =>
      feed.filter((r) => {
        if (congregation !== "all" && r.congregation !== congregation) return false;
        if (donorType === "named" && r.anonymous) return false;
        if (donorType === "anonymous" && !r.anonymous) return false;
        if (from && new Date(r.date) < new Date(from)) return false;
        if (to && new Date(r.date) > new Date(to)) return false;
        return true;
      }),
    [congregation, donorType, from, to]
  );

  const total = filtered.reduce((sum, r) => sum + r.amount, 0);

  function exportCsv() {
    const header = ["Date", "Donor", "Student", "Congregation", "Bill", "Amount", "Transaction ID", "Status"];
    const lines = filtered.map((r) =>
      [formatDate(r.date), r.donorName, r.studentName, r.congregation, r.billName, r.amount, r.transactionId, r.status]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocation-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("Transactions exported to CSV.", "success");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="All Transactions"
        subtitle="Every contribution across the platform — fully traceable and exportable."
      />

      {/* Filters */}
      <div className="mb-4 rounded-card bg-white p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Congregation"
            value={congregation}
            onChange={(e) => setCongregation(e.target.value)}
            options={[{ value: "all", label: "All congregations" }, ...congregations.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            label="Donor type"
            value={donorType}
            onChange={(e) => setDonorType(e.target.value)}
            options={[
              { value: "all", label: "All donors" },
              { value: "named", label: "Named only" },
              { value: "anonymous", label: "Anonymous only" },
            ]}
          />
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex items-end">
            <Button variant="secondary" fullWidth onClick={exportCsv}>
              <DownloadIcon size={16} /> Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-card bg-navy px-5 py-3 text-white">
        <span className="text-caption text-white/70">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </span>
        <span className="font-display text-h3">{formatCurrency(total)} total</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title="No transactions match your filters"
          description="Try widening the date range or clearing filters."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setCongregation("all");
                setDonorType("all");
                setFrom("");
                setTo("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-card bg-white shadow-card lg:block">
            <table className="w-full text-left">
              <thead className="bg-navy text-caption font-semibold text-white">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Donor</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Bill</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inputborder/40">
                {filtered.map((r) => (
                  <tr key={r.id} className="text-caption hover:bg-warm/40">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(r.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.donorName} anonymous={r.anonymous} size="xs" />
                        <span className="font-medium text-navy">{r.donorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy">{r.studentName}</td>
                    <td className="px-4 py-3 text-muted">{r.billName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-navy">{formatCurrency(r.amount)}</td>
                    <td className="px-4 py-3 font-mono text-accent">{r.transactionId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PaymentStatusBadge status={r.status as "Confirmed" | "Pending" | "Failed"} />
                        {r.recurring && <RecurringBadge />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((r) => (
              <div key={r.id} className="rounded-card bg-white p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.donorName} anonymous={r.anonymous} size="sm" />
                    <div>
                      <p className="text-caption font-semibold text-navy">{r.donorName}</p>
                      <p className="text-label text-muted">{formatDate(r.date)}</p>
                    </div>
                  </div>
                  <span className="font-display text-h3 text-navy">{formatCurrency(r.amount)}</span>
                </div>
                <div className="mt-3 space-y-1 border-t border-inputborder/40 pt-3 text-label text-muted">
                  <p><span className="text-navy">{r.studentName}</span> · {r.billName}</p>
                  <p className="font-mono text-accent">{r.transactionId}</p>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <PaymentStatusBadge status={r.status as "Confirmed" | "Pending" | "Failed"} />
                  {r.recurring && <RecurringBadge />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
