"use client";

import { PageTitle } from "@/components/dashboard/widgets";
import { PaymentHistoryTable, type PaymentRow } from "@/components/domain/PaymentHistoryTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { WalletIcon } from "@/components/ui/icons";
import { studentApi } from "@/lib/student-api";
import { useApi } from "@/lib/use-api";

export default function StudentPaymentsPage() {
  // Payments + the bill list (for bill names) in one go.
  const { data, error, loading, reload } = useApi(() =>
    Promise.all([studentApi.payments(), studentApi.dashboard()])
  );

  const rows: PaymentRow[] = data
    ? data[0].map((p) => ({
        ...p,
        billName: data[1].student.bills.find((b) => b.id === p.billId)?.name ?? "General Support",
      }))
    : [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Payment History"
        subtitle="Every contribution received toward your formation, with full traceability."
      />
      {loading ? (
        <div className="h-64 animate-pulse rounded-card bg-white/60 shadow-card" />
      ) : error ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title="Couldn't load your payments"
          description={error}
          action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
        />
      ) : (
        <PaymentHistoryTable rows={rows} perspective="received" />
      )}
    </div>
  );
}
