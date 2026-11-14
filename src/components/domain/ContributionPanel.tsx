"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { useSession } from "@/lib/store";
import { paymentsApi, sponsorApi, type PaymentReceipt } from "@/lib/sponsor-api";
import { publicApi } from "@/lib/public-api";
import {
  MockCardForm,
  EMPTY_CARD,
  validateCard,
  simulatedOutcome,
  type CardDetails,
  type CardErrors,
} from "./MockCardForm";
import { apiErrorMessage } from "@/lib/use-api";
import { displayFirstName } from "@/lib/names";
import type { Student, Bill } from "@/lib/types";

const QUICK_AMOUNTS = [20, 50, 100, 250];

/**
 * Contribution Panel (PRD §4.8) — select bill, enter amount, anonymous toggle,
 * payment method, recurring toggle with annual impact, Sponsor This Bill CTA.
 * Payments go through the backend: POST /payments/intent (or /recurring),
 * then POST /payments/confirm. No real gateway is connected yet: the backend
 * runs in test (stub) mode and the card form below is a test-mode stand-in
 * (4242… succeeds, 4000 0000 0000 0002 is declined). Every payment, success
 * or failure, is recorded for real.
 */
export function ContributionPanel({
  student,
  selectedBillId,
  onSelectBill,
  onPaid,
}: {
  student: Student;
  selectedBillId?: string;
  onSelectBill?: (id: string) => void;
  /** Called after a confirmed gift so the page can refresh totals. */
  onPaid?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useSession((s) => s.role);
  const firstName = displayFirstName(student.name);
  const [paying, setPaying] = useState(false);
  const [pendingNotice, setPendingNotice] = useState(false);
  const [card, setCard] = useState<CardDetails>(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [declined, setDeclined] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const activeBills = student.bills.filter(
    (b) => b.status !== "Fully Funded" && b.status !== "Archived"
  );
  const [billId, setBillId] = useState(selectedBillId ?? activeBills[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(50);
  const [anonymous, setAnonymous] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [method, setMethod] = useState<"card" | "paystack">("card");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [minGift, setMinGift] = useState(1);
  const { toast } = useToast();

  // Platform minimum gift + default anonymity. A signed-in sponsor's own
  // "give anonymously by default" preference wins over the platform default.
  useEffect(() => {
    let alive = true;
    publicApi
      .settings()
      .then((s) => {
        if (!alive) return;
        setMinGift(s.minGift);
        if (role !== "sponsor") setAnonymous(s.anonymousDefault);
      })
      .catch(() => undefined);
    if (role === "sponsor") {
      sponsorApi
        .me()
        .then((sp) => alive && setAnonymous(sp.anonymousByDefault))
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [role]);
  const belowMin = !(amount >= minGift);

  // Keep in sync when parent selects a bill (e.g. clicking a bill card).
  const effectiveBillId = selectedBillId ?? billId;
  const bill = student.bills.find((b) => b.id === effectiveBillId) ?? activeBills[0];

  function choose(id: string) {
    setBillId(id);
    onSelectBill?.(id);
  }

  /** Only signed-in sponsors can give (the payment endpoints are [SPONSOR]). */
  function startCheckout() {
    if (role !== "sponsor") {
      toast(
        role ? "Only sponsor accounts can make gifts." : "Please sign in as a sponsor to give.",
        role ? "warning" : "info"
      );
      if (!role) router.push(`/signin?role=sponsor&redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (belowMin) {
      toast(`The minimum gift is ${formatCurrency(minGift)}.`, "warning");
      return;
    }
    setDeclined(null);
    setCardErrors({});
    setConfirmOpen(true);
  }

  async function confirm() {
    if (!bill || paying) return;
    const errors = validateCard(card);
    setCardErrors(errors);
    if (Object.keys(errors).length) return;
    setPaying(true);
    setDeclined(null);
    try {
      const gift = { billId: bill.id, amount, anonymous, method };
      const started = recurring ? await paymentsApi.recurring(gift) : await paymentsApi.intent(gift);
      const result = await paymentsApi.confirm(started.paymentId, simulatedOutcome(card));
      if (result.status === "Failed") {
        // Keep the checkout open so the sponsor can try another card.
        setDeclined("Your card was declined. You have not been charged — please try another card.");
        return;
      }
      setConfirmOpen(false);
      setCard(EMPTY_CARD);
      if (result.status === "Confirmed") {
        setReceipt(await paymentsApi.receipt(started.paymentId).catch(() => null));
        setSuccessOpen(true);
        toast(
          recurring
            ? `Monthly sponsorship of ${formatCurrency(amount)} started. Thank you!`
            : `Thank you! You gave ${formatCurrency(amount)} toward ${bill.name}.`,
          "success"
        );
        onPaid?.();
      } else if (result.status === "Pending") {
        // Live gateways confirm asynchronously via webhook.
        setPendingNotice(true);
      }
    } catch (err) {
      toast(apiErrorMessage(err, "The payment could not be started."), "error");
    } finally {
      setPaying(false);
    }
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
        <h3 className="font-display text-h3 text-navy">Sponsor {firstName}</h3>
        <p className="mt-1 text-caption text-muted">
          {student.sponsorCount > 0
            ? `${student.sponsorCount} ${student.sponsorCount === 1 ? "person is" : "people are"} sponsoring ${firstName}`
            : `Be the first to sponsor ${firstName}`}
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
              min={minGift}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-transparent px-2 py-2.5 text-body text-navy focus:outline-none"
            />
          </div>
          <p className={cn("mt-1 text-label", belowMin ? "font-semibold text-alert" : "text-muted")}>
            Minimum gift: {formatCurrency(minGift)}
          </p>
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
            onChange={(e) => setMethod(e.target.value as "card" | "paystack")}
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
          onClick={startCheckout}
          disabled={belowMin}
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
        onClose={() => !paying && setConfirmOpen(false)}
        title="Confirm Your Gift"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={paying}>Cancel</Button>
            <Button variant="primary" onClick={() => void confirm()} disabled={paying}>
              {paying ? "Processing…" : `Pay ${formatCurrency(amount)}`}
            </Button>
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
          {declined && (
            <p role="alert" className="rounded-input bg-alert/10 p-3 text-caption font-semibold text-alert">
              {declined}
            </p>
          )}
          <MockCardForm
            card={card}
            onChange={(c) => {
              setCard(c);
              setDeclined(null);
            }}
            errors={cardErrors}
            provider={method === "card" ? "Stripe" : "Paystack"}
          />
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
            {firstName} may send you a thank-you note soon.
          </p>
          {receipt && (
            <dl className="mx-auto mt-5 max-w-sm space-y-1.5 rounded-card bg-warm/50 p-4 text-left text-caption">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Transaction ID</dt>
                <dd className="truncate font-mono text-accent">{receipt.transactionId}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Amount</dt>
                <dd className="font-semibold text-navy">
                  {formatCurrency(receipt.amount)} {receipt.currency}
                  {receipt.recurring && " / month"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Given as</dt>
                <dd className="text-navy">{receipt.anonymous ? "Anonymous" : receipt.donorName}</dd>
              </div>
            </dl>
          )}
          <p className="mt-3 text-label text-muted">You can find this gift in your Giving History.</p>
          <Button variant="primary" className="mt-6" onClick={() => setSuccessOpen(false)}>
            Done
          </Button>
        </div>
      </Modal>

      {/* Live gateway: payment recorded but awaiting the gateway's webhook */}
      <Modal open={pendingNotice} onClose={() => setPendingNotice(false)} title="Payment processing">
        <p className="text-body text-navy/80">
          Your gift has been started and is awaiting confirmation from the payment provider. It will appear in your
          Giving History once confirmed.
        </p>
      </Modal>
    </>
  );
}

function remainingFor(b: Bill) {
  return Math.max(0, b.total - b.raised);
}
