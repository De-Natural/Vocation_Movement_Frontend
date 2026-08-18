"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Toggle, Select, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  HeartHandIcon,
  RepeatIcon,
  ShieldIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { formatCurrency, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Student, Bill } from "@/lib/types";

const QUICK_AMOUNTS = [20, 50, 100, 250];

/**
 * Contribution Panel (PRD §4.8) — select bill, enter amount, anonymous toggle,
 * payment method, recurring toggle with annual impact, Sponsor This Bill CTA.
 * Payment gateway (Stripe/Paystack) simulated for the demo.
 */
export function ContributionPanel({
  student,
  selectedBillId,
  onSelectBill,
}: {
  student: Student;
  selectedBillId?: string;
  onSelectBill?: (id: string) => void;
}) {
  const activeBills = student.bills.filter(
    (b) => b.status !== "Fully Funded" && b.status !== "Archived"
  );
  const [billId, setBillId] = useState(selectedBillId ?? activeBills[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(50);
  const [anonymous, setAnonymous] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [method, setMethod] = useState("card");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const { toast } = useToast();

  // Keep in sync when parent selects a bill (e.g. clicking a bill card).
  const effectiveBillId = selectedBillId ?? billId;
  const bill = student.bills.find((b) => b.id === effectiveBillId) ?? activeBills[0];

  function choose(id: string) {
    setBillId(id);
    onSelectBill?.(id);
  }

  function confirm() {
    setConfirmOpen(false);
    setSuccessOpen(true);
    toast(
      recurring
        ? `Monthly sponsorship of ${formatCurrency(amount)} started. Thank you!`
        : `Thank you! You gave ${formatCurrency(amount)} toward ${bill?.name}.`,
      "success"
    );
  }

  if (!bill) {
    return (
      <div className="rounded-card bg-success-soft p-6 text-center">
        <CheckCircleIcon size={32} className="mx-auto mb-2 text-success" />
        <p className="font-semibold text-success">All bills are fully funded!</p>
        <p className="mt-1 text-caption text-muted">Check back soon or browse other students.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-card bg-white p-6 shadow-card">
        <h3 className="font-display text-h3 text-navy">Sponsor {student.name.split(" ").slice(-1)[0]}</h3>
        <p className="mt-1 text-caption text-muted">
          {student.sponsorCount} people are sponsoring {student.name.split(" ")[0]}
        </p>

        {/* Bill selector */}
        <div className="mt-4">
          <Label>Choose a bill to fund</Label>
          <div className="space-y-2">
            {activeBills.map((b) => {
              const p = pct(b.raised, b.total);
              return (
                <button
                  key={b.id}
                  onClick={() => choose(b.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-input border-[1.5px] p-3 text-left transition-colors",
                    effectiveBillId === b.id ? "border-gold bg-gold/8" : "border-inputborder hover:border-gold/50"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-caption font-semibold text-navy">{b.name}</p>
                    <p className="text-label text-muted">{formatCurrency(remainingFor(b))} still needed</p>
                  </div>
                  <span className="ml-2 shrink-0 text-label font-semibold text-muted">{p}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div className="mt-4">
          <Label htmlFor="amount">Amount</Label>
          <div className="mb-2 grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={cn(
                  "rounded-input border-[1.5px] py-2 text-caption font-semibold transition-colors",
                  amount === a ? "border-gold bg-gold/10 text-gold-dark" : "border-inputborder text-navy hover:border-gold/50"
                )}
              >
                ${a}
              </button>
            ))}
          </div>
          <div className="flex items-center rounded-input border-[1.5px] border-inputborder bg-white px-4 focus-within:border-gold">
            <span className="text-body text-muted">$</span>
            <input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent px-2 py-2.5 text-body text-navy focus:outline-none"
            />
          </div>
        </div>

        {/* Recurring toggle with annual impact */}
        <div className="mt-4 rounded-input bg-warm/50 p-3">
          <Toggle
            checked={recurring}
            onChange={setRecurring}
            id="recurring"
            label="Make this a monthly gift"
          />
          {recurring && (
            <p className="mt-2 flex items-center gap-1.5 text-caption text-accent">
              <RepeatIcon size={14} />
              Estimated annual impact: <span className="font-semibold">{formatCurrency(amount * 12)}</span>
            </p>
          )}
        </div>

        {/* Anonymous toggle */}
        <div className="mt-3">
          <Toggle checked={anonymous} onChange={setAnonymous} id="anon" label="Give anonymously" />
        </div>

        {/* Payment method */}
        <div className="mt-4">
          <Select
            label="Payment method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: "card", label: "Card (Stripe)" },
              { value: "paystack", label: "Paystack (NGN, GHS…)" },
            ]}
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="mt-5"
          onClick={() => setConfirmOpen(true)}
          disabled={amount <= 0}
        >
          <HeartHandIcon size={18} /> Sponsor This Bill
        </Button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-label text-muted">
          <ShieldIcon size={12} /> Secure payment · every gift is traceable
        </p>
      </div>

      {/* Confirm modal (simulated Stripe/Paystack) */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Your Gift"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirm}>Pay {formatCurrency(amount)}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-card bg-warm/50 p-4">
            <div className="flex justify-between text-caption">
              <span className="text-muted">Student</span>
              <span className="font-semibold text-navy">{student.name}</span>
            </div>
            <div className="mt-2 flex justify-between text-caption">
              <span className="text-muted">Bill</span>
              <span className="font-semibold text-navy">{bill.name}</span>
            </div>
            <div className="mt-2 flex justify-between text-caption">
              <span className="text-muted">Amount</span>
              <span className="font-semibold text-navy">{formatCurrency(amount)}{recurring && " / month"}</span>
            </div>
            <div className="mt-2 flex justify-between text-caption">
              <span className="text-muted">Visibility</span>
              <span>{anonymous ? <Badge tone="navy">Anonymous</Badge> : <Badge tone="gold">Named</Badge>}</span>
            </div>
          </div>
          {/* Simulated card field */}
          <div className="rounded-input border-[1.5px] border-inputborder bg-white p-4">
            <p className="mb-2 text-label font-semibold text-muted">Card details (demo)</p>
            <div className="font-mono text-caption text-navy">4242 4242 4242 4242 · 12/28 · 123</div>
          </div>
        </div>
      </Modal>

      {/* Success modal */}
      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="">
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircleIcon size={36} />
          </div>
          <h3 className="font-display text-h2 text-navy">Thank you for your generosity!</h3>
          <p className="mt-2 text-body text-muted">
            Your gift of {formatCurrency(amount)} toward <span className="font-semibold text-navy">{bill.name}</span> has been recorded.
            {student.name.split(" ")[0]} may send you a thank-you note soon.
          </p>
          <Button variant="primary" className="mt-6" onClick={() => setSuccessOpen(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </>
  );
}

function remainingFor(b: Bill) {
  return Math.max(0, b.total - b.raised);
}
