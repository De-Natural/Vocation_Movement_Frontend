"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { BillCard } from "@/components/domain/BillCard";
import { BillFormModal, type BillFormValue } from "@/components/domain/BillFormModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusIcon, WalletIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { studentApi } from "@/lib/student-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { formatCurrency } from "@/lib/format";
import type { Bill } from "@/lib/types";

export default function BillBoardPage() {
  // The dashboard payload includes the student's full bill list.
  const { data, error, loading, reload, setData } = useApi(() => studentApi.dashboard());
  const bills = useMemo(() => data?.student.bills ?? [], [data]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const { toast } = useToast();

  const visible = useMemo(() => bills.filter((b) => b.status !== "Archived"), [bills]);

  const totals = useMemo(() => {
    const needed = visible.reduce((s, b) => s + b.total, 0);
    const raised = visible.reduce((s, b) => s + b.raised, 0);
    return { needed, raised, gap: Math.max(0, needed - raised) };
  }, [visible]);

  /** Replace (or prepend) a bill in the cached list with the server's copy. */
  function upsertLocal(bill: Bill) {
    setData((d) => {
      if (!d) return d;
      const exists = d.student.bills.some((b) => b.id === bill.id);
      const next = exists ? d.student.bills.map((b) => (b.id === bill.id ? bill : b)) : [bill, ...d.student.bills];
      return { ...d, student: { ...d.student, bills: next } };
    });
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(bill: Bill) {
    setEditing(bill);
    setModalOpen(true);
  }
  async function archive(bill: Bill) {
    try {
      upsertLocal(await studentApi.archiveBill(bill.id));
      toast(`"${bill.name}" archived and hidden from public view.`, "info");
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't archive the bill."), "error");
    }
  }
  async function save(value: BillFormValue) {
    const body = {
      name: value.name.trim(),
      category: value.category,
      total: Number(value.total),
      dueDate: value.dueDate,
      description: value.description.trim() || undefined,
    };
    try {
      if (editing) {
        upsertLocal(await studentApi.updateBill(editing.id, body));
        toast("Bill updated.", "success");
      } else {
        upsertLocal(await studentApi.createBill(body));
        toast("New bill added to your Bill Board.", "success");
      }
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't save the bill."), "error");
      void reload();
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

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title="Couldn't load your bills"
          description={error}
          action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title="No bills yet"
          description="Add the school fees, books or other needs you'd like sponsors to help with."
          action={<Button onClick={openAdd}><PlusIcon size={16} /> Add New Bill</Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((bill) => (
            <BillCard key={bill.id} bill={bill} editable onEdit={openEdit} onArchive={(b) => void archive(b)} />
          ))}
        </div>
      )}

      <BillFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={(v) => void save(v)} initial={editing} />
    </div>
  );
}
