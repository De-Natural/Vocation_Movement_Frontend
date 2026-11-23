"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Toggle, Select, Label, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  HeartHandIcon,
  RepeatIcon,
  ShieldIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { formatCurrency, currencySymbol, pct } from "@/lib/format";
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

/** One-tap amounts, sized to the currency the gift is charged in. */
const QUICK_AMOUNTS: Record<string, number[]> = {
  NGN: [5000, 10000, 20000, 50000],
  GHS: [100, 200, 500, 1000],
};
const DEFAULT_QUICK = [20, 50, 100, 250];
const quickAmounts = (currency: string) => QUICK_AMOUNTS[currency] ?? DEFAULT_QUICK;

/**
 * Contribution Panel (PRD §4.8) — select bill, enter amount, anonymous toggle,
 * payment method, recurring toggle with annual impact, Sponsor This Bill CTA.
 * Payments go through the backend: POST /payments/intent (or /recurring),
 * then POST /payments/confirm. No real gateway is connected yet: the backend
 * runs in test (stub) mode and the card form below is a test-mode stand-in
 * (4242… succeeds, 4000 0000 0000 0002 is declined). Every payment, success
 * or failure, is recorded for real.
 *
 * Signed-out visitors can give a one-time gift as a guest (name + email, no
 * account): POST /payments/guest/intent then /payments/guest/confirm, and the
 * receipt is emailed to them. Monthly gifts still need a sponsor account.
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
  const isGuest = !role;
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
  // The currency the gift is actually charged in: the sponsor's own currency,
  // or the platform default for guests. Every amount in this panel uses it.
  const [giftCurrency, setGiftCurrency] = useState<string | null>(null);
  const cur = giftCurrency ?? "NGN";
  const money = (n: number) => formatCurrency(n, cur);
  const [anonymous, setAnonymous] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [method, setMethod] = useState<"card" | "paystack">("card");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [minGift, setMinGift] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestErrors, setGuestErrors] = useState<{ name?: string; email?: string }>({});
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
        if (role !== "sponsor") {
          setAnonymous(s.anonymousDefault);
          setGiftCurrency(s.currency);
        }
      })
      .catch(() => undefined);
    if (role === "sponsor") {
      sponsorApi
        .me()
        .then((sp) => {
          if (!alive) return;
          setAnonymous(sp.anonymousByDefault);
          setGiftCurrency(sp.currency);
        })
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [role]);
  // Start on a sensible amount for the currency (e.g. ₦10,000, not ₦50).
  useEffect(() => {
    if (giftCurrency) setAmount(quickAmounts(giftCurrency)[1]);
  }, [giftCurrency]);
  const belowMin = !(amount >= minGift);

  // Keep in sync when parent selects a bill (e.g. clicking a bill card).
  const effectiveBillId = selectedBillId ?? billId;
  const bill = student.bills.find((b) => b.id === effectiveBillId) ?? activeBills[0];

  function choose(id: string) {
    setBillId(id);
    onSelectBill?.(id);
  }

  const signInHref = `/signin?role=sponsor&redirect=${encodeURIComponent(pathname)}`;

  /**
   * Sponsors give from their account; signed-out visitors give as a guest
   * (one-time only). Other signed-in roles (students, staff) cannot give.
   */
  function startCheckout() {
    if (role && role !== "sponsor") {
      toast("Only sponsor accounts can make gifts.", "warning");
      return;
    }
    if (isGuest && recurring) {
      toast("Monthly gifts need a sponsor account. Please sign in to give monthly.", "info");
      router.push(signInHref);
      return;
    }
    if (belowMin) {
      toast(`The minimum gift is ${money(minGift)}.`, "warning");
      return;
    }
    setDeclined(null);
    setCardErrors({});
    setGuestErrors({});
    setConfirmOpen(true);
  }

  function validateGuest() {
    const errors: { name?: string; email?: string } = {};
    if (guestName.trim().length < 2) errors.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) errors.email = "Please enter a valid email address.";
    return errors;
  }

  async function confirm() {
    if (!bill || paying) return;
    const errors = validateCard(card);
    setCardErrors(errors);
    const gErrors = isGuest ? validateGuest() : {};
    setGuestErrors(gErrors);
    if (Object.keys(errors).length || Object.keys(gErrors).length) return;
    setPaying(true);
    setDeclined(null);
    try {
      const gift = { billId: bill.id, amount, anonymous, method };
      const started = isGuest
        ? await paymentsApi.guestIntent({ ...gift, name: guestName.trim(), email: guestEmail.trim() })
        : recurring
          ? await paymentsApi.recurring(gift)
          : await paymentsApi.intent(gift);
      const result = isGuest
        ? await paymentsApi.guestConfirm(started.paymentId, started.clientSecret, simulatedOutcome(card))
        : await paymentsApi.confirm(started.paymentId, simulatedOutcome(card));
      if (result.status === "Failed") {
        // Keep the checkout open so the sponsor can try another card.
        setDeclined("Your card was declined. You have not been charged — please try another card.");
        return;
      }
      setConfirmOpen(false);
      setCard(EMPTY_CARD);
      if (result.status === "Confirmed") {
        // Guests have no session to fetch a receipt with — theirs is emailed.
        setReceipt(isGuest ? null : await paymentsApi.receipt(started.paymentId).catch(() => null));
        setSuccessOpen(true);
        toast(
          recurring
            ? `Monthly sponsorship of ${money(amount)} started. Thank you!`
            : `Thank you! You gave ${money(amount)} toward ${bill.name}.`,
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
            {quickAmounts(cur).map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={cn(
                  "rounded-input border-[1.5px] py-2 text-caption font-semibold transition-colors",
                  amount === a ? "border-gold bg-gold/10 text-gold-dark" : "border-inputborder text-navy hover:border-gold/50"
                )}
              >
                {money(a)}
              </button>
            ))}
          </div>
          <div className="flex items-center rounded-input border-[1.5px] border-inputborder bg-white px-4 focus-within:border-gold">
            <span className="text-body text-muted">{currencySymbol(cur)}</span>
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
            Minimum gift: {money(minGift)}
          </p>
          {cur !== "NGN" && (
            <p className="mt-1 text-label text-muted">
              You are charged in {cur}. Bills are in naira: your gift is credited at the platform&apos;s exchange rate.
            </p>
          )}
        </div>

        {/* Recurring toggle with annual impact */}
        <div className="mt-4 rounded-input bg-warm/50 p-3">
          <Toggle
            checked={recurring}
            onChange={setRecurring}
            id="recurring"
            label="Make this a monthly gift"
          />
          {isGuest && recurring && (
            <p className="mt-2 text-caption text-muted">
              Monthly gifts need a free sponsor account.{" "}
              <Link href={signInHref} className="font-semibold text-gold-dark underline">
                Sign in
              </Link>{" "}
              or turn this off to give once as a guest.
            </p>
          )}
          {recurring && (
            <p className="mt-2 flex items-center gap-1.5 text-caption text-accent">
              <RepeatIcon size={14} />
              Estimated annual impact: <span className="font-semibold">{money(amount * 12)}</span>
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
        {isGuest && (
          <p className="mt-2 text-center text-label text-muted">
            No account needed to give once.{" "}
            <Link href={signInHref} className="font-semibold text-gold-dark underline">
              Sign in
            </Link>{" "}
            to track your gifts.
          </p>
        )}
      </div>

      {/* Confirm modal (simulated Stripe/Paystack) */}
      <Modal
        open={confirmOpen}
        onClose={() => !paying && setConfirmOpen(false)}
        title="Confirm Your Gift"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={paying}>Cancel</Button>
            <Button loading={paying} variant="primary" onClick={() => void confirm()} disabled={paying}>
              {paying ? "Processing…" : `Pay ${money(amount)}`}
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
              <span className="font-semibold text-navy">{money(amount)}{recurring && " / month"}</span>
            </div>
            <div className="mt-2 flex justify-between text-caption">
              <span className="text-muted">Visibility</span>
              <span>{anonymous ? <Badge tone="navy">Anonymous</Badge> : <Badge tone="gold">Named</Badge>}</span>
            </div>
          </div>
          {isGuest && (
            <div className="space-y-3">
              <p className="text-caption text-muted">
                Giving as a guest. Your receipt will be emailed to you.{" "}
                <Link href={signInHref} className="font-semibold text-gold-dark underline">
                  Have an account? Sign in
                </Link>
              </p>
              <Input
                id="guest-name"
                label="Your name"
                required
                autoComplete="name"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  setGuestErrors((g) => ({ ...g, name: undefined }));
                }}
                error={guestErrors.name}
                hint={anonymous ? "Kept private: the student will see “Anonymous”." : undefined}
              />
              <Input
                id="guest-email"
                type="email"
                label="Email for your receipt"
                required
                autoComplete="email"
                value={guestEmail}
                onChange={(e) => {
                  setGuestEmail(e.target.value);
                  setGuestErrors((g) => ({ ...g, email: undefined }));
                }}
                error={guestErrors.email}
              />
            </div>
          )}
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
            Your gift of {money(amount)} toward <span className="font-semibold text-navy">{bill.name}</span> has been recorded.
            {isGuest ? (
              <> A receipt is on its way to <span className="font-semibold text-navy">{guestEmail.trim()}</span>.</>
            ) : (
              <> {firstName} may send you a thank-you note soon.</>
            )}
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
                  {formatCurrency(receipt.amount, receipt.currency)}
                  {receipt.recurring && " / month"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Given as</dt>
                <dd className="text-navy">{receipt.anonymous ? "Anonymous" : receipt.donorName}</dd>
              </div>
            </dl>
          )}
          {isGuest ? (
            <p className="mt-3 text-label text-muted">
              Want to follow {firstName}&apos;s progress?{" "}
              <Link href="/register?role=sponsor" className="font-semibold text-gold-dark underline">
                Create a free sponsor account
              </Link>
              .
            </p>
          ) : (
            <p className="mt-3 text-label text-muted">You can find this gift in your Giving History.</p>
          )}
          <Button variant="primary" className="mt-6" onClick={() => setSuccessOpen(false)}>
            Done
          </Button>
        </div>
      </Modal>

      {/* Live gateway: payment recorded but awaiting the gateway's webhook */}
      <Modal open={pendingNotice} onClose={() => setPendingNotice(false)} title="Payment processing">
        <p className="text-body text-navy/80">
          Your gift has been started and is awaiting confirmation from the payment provider.{" "}
          {isGuest
            ? "We will email your receipt once it is confirmed."
            : "It will appear in your Giving History once confirmed."}
        </p>
      </Modal>
    </>
  );
}

function remainingFor(b: Bill) {
  return Math.max(0, b.total - b.raised);
}
