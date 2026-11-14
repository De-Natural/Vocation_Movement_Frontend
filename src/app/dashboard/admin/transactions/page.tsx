"use client";

import { useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Select, Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentStatusBadge, RecurringBadge } from "@/components/domain/StatusBadges";
import { useToast } from "@/components/ui/Toast";
import { DownloadIcon, WalletIcon } from "@/components/ui/icons";
import { adminApi, type TransactionFilters } from "@/lib/admin-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { formatCurrency, formatDate } from "@/lib/format";

const PER_PAGE = 50;

export default function TransactionsPage() {
  const { toast } = useToast();
  const [congregation, setCongregation] = useState("all");
  const [donorType, setDonorType] = useState<"all" | "named" | "anonymous">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Filtering, totals and pagination all happen on the server.
  const filters: TransactionFilters = {
    congregation: congregation === "all" ? undefined : congregation,
    donorType,
    from: from || undefined,
    to: to || undefined,
  };
  const { data, error, loading, reload } = useApi(
    () => adminApi.transactions({ ...filters, page, perPage: PER_PAGE }),
    [congregation, donorType, from, to, page]
  );
  // Congregation filter options come from the real per-congregation report.
  const { data: reports } = useApi(() => adminApi.reports());
  const congregations = (reports?.byCongregation ?? []).map((c) => c.congregation);

  const filtered = data?.data.transactions ?? [];
  const total = data?.data.totalAmount ?? 0;
  const count = data?.meta?.total ?? filtered.length;
  const totalPages = data?.meta?.totalPages ?? 1;

  // Changing a filter returns to page 1.
  const onFilter = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  async function exportCsv() {
    setExporting(true);
    try {
      const csv = await adminApi.transactionsCsv(filters);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vocation-transactions.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast("Transactions exported to CSV.", "success");
    } catch (err) {
      toast(apiErrorMessage(err, "Export failed."), "error");
    } finally {
      setExporting(false);
    }
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
            onChange={(e) => onFilter(setCongregation)(e.target.value)}
            options={[{ value: "all", label: "All congregations" }, ...congregations.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            label="Donor type"
            value={donorType}
            onChange={(e) => onFilter(setDonorType)(e.target.value as typeof donorType)}
            options={[
              { value: "all", label: "All donors" },
              { value: "named", label: "Named only" },
              { value: "anonymous", label: "Anonymous only" },
            ]}
          />
          <Input label="From" type="date" value={from} onChange={(e) => onFilter(setFrom)(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => onFilter(setTo)(e.target.value)} />
          <div className="flex items-end">
            <Button variant="secondary" fullWidth onClick={() => void exportCsv()} disabled={exporting || count === 0}>
              <DownloadIcon size={16} /> {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-card bg-navy px-5 py-3 text-white">
        <span className="text-caption text-white/70">
          {loading ? "Loading…" : `${count} transaction${count !== 1 ? "s" : ""}`}
        </span>
        <span className="font-display text-h3">{formatCurrency(total)} total</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title="Couldn't load transactions"
          description={error}
          action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title={congregation === "all" && donorType === "all" && !from && !to ? "No transactions yet" : "No transactions match your filters"}
          description={congregation === "all" && donorType === "all" && !from && !to ? "Contributions from sponsors will appear here as soon as they are made." : "Try widening the date range or clearing filters."}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setCongregation("all");
                setDonorType("all");
                setFrom("");
                setTo("");
                setPage(1);
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
                        {r.anonymous && <span className="text-label text-muted">(anonymous)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy">{r.studentName}</td>
                    <td className="px-4 py-3 text-muted">{r.billName}</td>
                    <td className="px-4 py-3 text-right font-semibold text-navy">{formatCurrency(r.amount)}</td>
                    <td className="px-4 py-3 font-mono text-accent">{r.transactionId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PaymentStatusBadge status={r.status} />
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
                      <p className="text-caption font-semibold text-navy">
                        {r.donorName}
                        {r.anonymous && <span className="ml-1 text-label font-normal text-muted">(anonymous)</span>}
                      </p>
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
                  <PaymentStatusBadge status={r.status} />
                  {r.recurring && <RecurringBadge />}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-caption text-muted">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
