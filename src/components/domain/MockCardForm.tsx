"use client";

import { Input } from "@/components/ui/Input";

/**
 * TEST-MODE card form. No real payment gateway is connected yet: card details
 * are validated here and never leave the browser. When Stripe / Paystack are
 * wired in, replace this with their hosted card element (Stripe Elements /
 * Paystack Popup) — card data must never be sent to our own API.
 */

export interface CardDetails {
  number: string;
  expiry: string; // MM/YY
  cvc: string;
  name: string;
}

export const EMPTY_CARD: CardDetails = { number: "", expiry: "", cvc: "", name: "" };

/** Test cards, mirroring Stripe's test-mode numbers. */
export const TEST_CARDS = {
  success: "4242424242424242",
  decline: "4000000000000002",
} as const;

const digits = (s: string) => s.replace(/\D/g, "");

/** Luhn checksum — rejects mistyped card numbers like a real form does. */
function luhn(num: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return num.length >= 12 && sum % 10 === 0;
}

export type CardErrors = Partial<Record<keyof CardDetails, string>>;

export function validateCard(card: CardDetails): CardErrors {
  const errors: CardErrors = {};
  const num = digits(card.number);
  if (num.length < 12 || num.length > 19 || !luhn(num)) errors.number = "Your card number is invalid.";

  const m = card.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) {
    errors.expiry = "Use MM/YY.";
  } else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    const now = new Date();
    if (month < 1 || month > 12) errors.expiry = "Invalid month.";
    else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))
      errors.expiry = "Your card has expired.";
  }

  if (!/^\d{3,4}$/.test(card.cvc)) errors.cvc = "3 or 4 digits.";
  if (card.name.trim().length < 2) errors.name = "Enter the name on the card.";
  return errors;
}

/** The outcome the test gateway should simulate for this card. */
export const simulatedOutcome = (card: CardDetails): "success" | "decline" =>
  digits(card.number) === TEST_CARDS.decline ? "decline" : "success";

const formatNumber = (v: string) =>
  digits(v)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiry = (v: string) => {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export function MockCardForm({
  card,
  onChange,
  errors,
  provider,
}: {
  card: CardDetails;
  onChange: (card: CardDetails) => void;
  errors: CardErrors;
  provider: "Stripe" | "Paystack";
}) {
  const set = (key: keyof CardDetails, value: string) => onChange({ ...card, [key]: value });

  return (
    <div className="space-y-3">
      <div className="rounded-input border border-amber/40 bg-amber/10 p-3 text-caption text-navy">
        <p className="font-semibold">Test mode — no real money is charged.</p>
        <p className="mt-0.5 text-muted">
          Use <button type="button" className="font-mono text-accent underline" onClick={() => set("number", formatNumber(TEST_CARDS.success))}>4242 4242 4242 4242</button>{" "}
          for a successful payment or{" "}
          <button type="button" className="font-mono text-accent underline" onClick={() => set("number", formatNumber(TEST_CARDS.decline))}>4000 0000 0000 0002</button>{" "}
          for a declined card, any future expiry date and any 3-digit CVC.
        </p>
      </div>

      <Input
        label="Card number"
        inputMode="numeric"
        autoComplete="off"
        placeholder="1234 1234 1234 1234"
        value={card.number}
        onChange={(e) => set("number", formatNumber(e.target.value))}
        error={errors.number}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Expiry"
          inputMode="numeric"
          autoComplete="off"
          placeholder="MM/YY"
          value={card.expiry}
          onChange={(e) => set("expiry", formatExpiry(e.target.value))}
          error={errors.expiry}
        />
        <Input
          label="CVC"
          inputMode="numeric"
          autoComplete="off"
          placeholder="123"
          value={card.cvc}
          onChange={(e) => set("cvc", digits(e.target.value).slice(0, 4))}
          error={errors.cvc}
        />
      </div>
      <Input
        label="Name on card"
        autoComplete="off"
        placeholder="Full name"
        value={card.name}
        onChange={(e) => set("name", e.target.value)}
        error={errors.name}
      />
      <p className="text-label text-muted">Processed by {provider} (test mode). Card details never leave your browser.</p>
    </div>
  );
}
