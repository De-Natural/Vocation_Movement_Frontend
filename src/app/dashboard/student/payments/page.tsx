"use client";

import { PageTitle } from "@/components/dashboard/widgets";
import { PaymentHistoryTable, type PaymentRow } from "@/components/domain/PaymentHistoryTable";
import { receivedPayments, currentStudent } from "@/lib/mock-data";

export default function StudentPaymentsPage() {
  // Map each contribution to its bill name for display.
  const billName = (billId: string) =>
    currentStudent.bills.find((b) => b.id === billId)?.name ?? "General Support";

  const rows: PaymentRow[] = receivedPayments.map((p) => ({
    ...p,
    billName: billName(p.billId),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Payment History"
        subtitle="Every contribution received toward your formation, with full traceability."
      />
      <PaymentHistoryTable rows={rows} perspective="received" />
    </div>
  );
}
