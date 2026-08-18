"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { BillCard } from "@/components/domain/BillCard";
import { BillFormModal, type BillFormValue } from "@/components/domain/BillFormModal";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { currentStudent } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import type { Bill } from "@/lib/types";

export default function BillBoardPage() {
  const [bills, setBills] = useState<Bill[]>(currentStudent.bills);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const { toast } = useToast();

  const visible = bills.filter((b) => b.status !== "Archived");

  const totals = useMemo(() => {
    const needed = visible.reduce((s, b) => s + b.total, 0);
    const raised = visible.reduce((s, b) => s + b.raised, 0);
    return { needed, raised, gap: Math.max(0, needed - raised) };
  }, [visible]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(bill: Bill) {
    setEditing(bill);
    setModalOpen(true);
  }
  function archive(bill: Bill) {
    setBills((bs) => bs.map((b) => (b.id === bill.id ? { ...b, status: "Archived" } : b)));
    toast(`"${bill.name}" archived and hidden from public view.`, "info");
  }
  function save(value: BillFormValue) {
    if (editing) {
      setBills((bs) =>
        bs.map((b) =>
          b.id === editing.id
            ? { ...b, name: value.name, category: value.category, total: Number(value.total), dueDate: value.dueDate, description: value.description }
            : b
        )
      );
      toast("Bill updated.", "success");
    } else {
      const newBill: Bill = {
        id: `new-${bills.length + 1}`,
        studentId: currentStudent.id,
        name: value.name,
        category: value.category,
        total: Number(value.total),
        raised: 0,
        dueDate: value.dueDate,
        description: value.description,
        status: "Active",
        contributions: [],
      };
      setBills((bs) => [newBill, ...bs]);
      toast("New bill added to your Bill Board.", "success");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Sticky Total Summary Bar (PRD §4.4) */}
      <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-inputborder/40 bg-cream/90 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <p className="text-label uppercase tracking-wide text-muted">Total needed</p>
              <p className="font-display text-h3 text-navy">{formatCurrency(totals.needed)}</p>
            </div>
            <div>
              <p className="text-label uppercase tracking-wide text-muted">Total raised</p>
              <p className="font-display text-h3 text-success">{formatCurrency(totals.raised)}</p>
            </div>
            <div>
              <p className="text-label uppercase tracking-wide text-muted">Remaining gap</p>
              <p className="font-display text-h3 text-gold-dark">{formatCurrency(totals.gap)}</p>
            </div>
          </div>
          <Button variant="primary" onClick={openAdd}>
            <PlusIcon size={16} /> Add New Bill
          </Button>
        </div>
      </div>

      <PageTitle
        title="Bill Board"
        subtitle="Track every need and its funding progress. Sponsors see this on your profile."
      />

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((bill) => (
          <BillCard key={bill.id} bill={bill} editable onEdit={openEdit} onArchive={archive} />
        ))}
      </div>

      <BillFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={save} initial={editing} />
    </div>
  );
}
