"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { CheckCircleIcon, InfoIcon, ShieldIcon, WalletIcon } from "@/components/ui/icons";
import { formatCurrency, formatDate } from "@/lib/format";
import { apiErrorMessage, useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import { withdrawalsApi, type Bank, type Withdrawal, type WithdrawalSummary } from "@/lib/withdrawals-api";

const STATUS: Record<Withdrawal["status"], { label: string; tone: "success" | "amber" | "alert" | "neutral" }> = {
  paid: { label: "Paid", tone: "success" },
  processing: { label: "Processing", tone: "amber" },
  awaiting_otp: { label: "Awaiting code", tone: "neutral" },
  failed: { label: "Failed", tone: "alert" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

/** A 6-digit code box with a confirm button (used by all three steps). */
function CodeEntry({
  sentTo,
  testCode,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  sentTo: string;
  /** Test mode only (no SMS service connected yet): the code to type. */
  testCode?: string;
  confirmLabel: string;
  onConfirm: (code: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-3 rounded-card bg-warm/50 p-4">
      <p className="text-caption text-navy">
        We sent a 6-digit code by SMS to <span className="font-semibold">{sentTo}</span>. It expires in 10 minutes.
      </p>
      {testCode && (
        <p role="status" className="rounded-input border border-amber/40 bg-amber/10 p-3 text-caption text-navy">
          <span className="font-semibold">Test mode:</span> no SMS service is connected yet, so no text message was
          sent. Your code is <span className="font-mono text-body font-bold tracking-[0.2em]">{testCode}</span>
        </p>
      )}
      <Input
        label="SMS code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
          setError(null);
        }}
        error={error ?? undefined}
        className="tracking-[0.4em]"
        autoFocus
      />
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={code.length !== 6}
          onClick={async () => {
            try {
              await onConfirm(code);
            } catch (err) {
              setError(apiErrorMessage(err, "That code didn't work."));
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

function StepCard({
  n,
  title,
  done,
  locked,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("p-5", locked && "opacity-60")}>
      <div className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-caption font-bold",
            done ? "bg-success-soft text-success" : "bg-gold/15 text-gold-dark"
          )}
        >
          {done ? <CheckCircleIcon size={18} /> : n}
        </span>
        <h2 className="font-display text-h3 text-navy">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function PhoneStep({ s, reload }: { s: WithdrawalSummary; reload: () => Promise<void> }) {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [testCode, setTestCode] = useState<string | undefined>();

  if (s.phone.verified) {
    return (
      <StepCard n={1} title="Phone number" done>
        <p className="text-body text-navy">
          Verified: <span className="font-semibold">{s.phone.number}</span>
        </p>
        <p className="mt-1 text-caption text-muted">
          Withdrawal codes are sent to this number. To change it, please contact the administrator.
        </p>
      </StepCard>
    );
  }
  return (
    <StepCard n={1} title="Verify your phone number">
      <p className="mb-3 text-caption text-muted">
        For your security, every withdrawal is confirmed with a code sent to your phone.
      </p>
      {sentTo ? (
        <CodeEntry
          sentTo={sentTo}
          testCode={testCode}
          confirmLabel="Verify phone"
          onCancel={() => setSentTo(null)}
          onConfirm={async (code) => {
            await withdrawalsApi.verifyPhone(code);
            toast("Phone number verified.", "success");
            setSentTo(null);
            await reload();
          }}
        />
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Phone number"
              type="tel"
              placeholder="08031234567"
              defaultValue={s.phone.number ?? ""}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const r = await withdrawalsApi.sendPhoneCode(phone || s.phone.number || "");
                if (r.alreadyVerified) await reload();
                else {
                  setTestCode(r.testCode);
                  setSentTo(r.sentTo);
                }
              } catch (err) {
                toast(apiErrorMessage(err, "Couldn't send the code."), "error");
              }
            }}
          >
            Send code
          </Button>
        </div>
      )}
    </StepCard>
  );
}

function AccountStep({ s, reload }: { s: WithdrawalSummary; reload: () => Promise<void> }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(!s.account);
  const [banks, setBanks] = useState<Bank[] | null>(null);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [testCode, setTestCode] = useState<string | undefined>();
  const locked = !s.phone.verified;

  useEffect(() => {
    if (!editing || locked || banks) return;
    withdrawalsApi
      .banks()
      .then(setBanks)
      .catch((err) => toast(apiErrorMessage(err, "Couldn't load banks."), "error"));
  }, [editing, locked, banks, toast]);

  // Look up the account name as soon as a full number is typed.
  useEffect(() => {
    setResolvedName(null);
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) return;
    let live = true;
    withdrawalsApi
      .resolveAccount(bankCode, accountNumber)
      .then((r) => live && setResolvedName(r.accountName))
      .catch((err) => live && toast(apiErrorMessage(err, "Couldn't verify the account."), "error"));
    return () => {
      live = false;
    };
  }, [bankCode, accountNumber, toast]);

  return (
    <StepCard n={2} title="Bank account" done={!!s.account && !editing} locked={locked}>
      {locked ? (
        <p className="text-caption text-muted">Verify your phone number first.</p>
      ) : !editing && s.account ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-body font-semibold text-navy">{s.account.accountName}</p>
            <p className="text-caption text-muted">
              {s.account.bankName} · {s.account.accountNumber}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Change account
          </Button>
        </div>
      ) : sentTo ? (
        <CodeEntry
          sentTo={sentTo}
          testCode={testCode}
          confirmLabel="Save account"
          onCancel={() => setSentTo(null)}
          onConfirm={async (code) => {
            await withdrawalsApi.confirmAccount(code);
            toast("Bank account saved.", "success");
            setSentTo(null);
            setEditing(false);
            await reload();
          }}
        />
      ) : (
        <div className="space-y-3">
          <Select
            label="Bank"
            placeholder={banks ? "Choose your bank" : "Loading banks…"}
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            options={(banks ?? []).map((b) => ({ value: b.code, label: b.name }))}
          />
          <Input
            label="Account number"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
          {resolvedName && (
            <p className="flex items-center gap-2 rounded-input bg-success-soft px-3 py-2 text-caption font-semibold text-success">
              <CheckCircleIcon size={16} /> {resolvedName}
            </p>
          )}
          <p className="text-label text-muted">
            The account name comes from your bank. It should match your own name.
          </p>
          <div className="flex gap-2">
            {s.account && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              disabled={!resolvedName}
              onClick={async () => {
                try {
                  const r = await withdrawalsApi.requestAccount(bankCode, accountNumber);
                  setTestCode(r.testCode);
                  setSentTo(r.sentTo);
                } catch (err) {
                  toast(apiErrorMessage(err, "Couldn't save the account."), "error");
                }
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </StepCard>
  );
}

function WithdrawStep({ s, reload }: { s: WithdrawalSummary; reload: () => Promise<void> }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState<{ id: string; sentTo: string; testCode?: string } | null>(null);
  const locked = !s.phone.verified || !s.account;
  const value = Number(amount);
  const amountError =
    amount && (!Number.isFinite(value) || value <= 0)
      ? "Enter a valid amount."
      : amount && value < s.limits.min
        ? `The minimum is ${formatCurrency(s.limits.min, "NGN")}.`
        : amount && value > Math.min(s.available, s.limits.max)
          ? `You can withdraw up to ${formatCurrency(Math.min(s.available, s.limits.max), "NGN")}.`
          : null;

  return (
    <StepCard n={3} title="Withdraw" locked={locked}>
      {locked ? (
        <p className="text-caption text-muted">Verify your phone and add a bank account first.</p>
      ) : pending ? (
        <CodeEntry
          sentTo={pending.sentTo}
          testCode={pending.testCode}
          confirmLabel={`Confirm ${formatCurrency(value, "NGN")}`}
          onCancel={() => setPending(null)}
          onConfirm={async (code) => {
            const w = await withdrawalsApi.confirm(pending.id, code);
            setPending(null);
            setAmount("");
            if (w.status === "paid") toast(`${formatCurrency(w.amount, "NGN")} has been sent to your bank.`, "success");
            else if (w.status === "failed") toast(w.failureReason ?? "The withdrawal failed.", "error");
            else toast("Withdrawal is processing. We'll email you when the bank confirms.", "info");
            await reload();
          }}
        />
      ) : (
        <div className="space-y-3">
          <Input
            label="Amount (₦)"
            inputMode="decimal"
            placeholder={`${s.limits.min.toLocaleString()} – ${Math.min(s.available, s.limits.max).toLocaleString()}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            error={amountError ?? undefined}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              className="text-caption font-semibold text-accent hover:underline"
              onClick={() => setAmount(String(Math.min(s.available, s.limits.max)))}
            >
              Withdraw maximum
            </button>
            <Button
              variant="primary"
              disabled={!amount || !!amountError}
              onClick={async () => {
                try {
                  const r = await withdrawalsApi.start(value);
                  setPending({ id: r.withdrawal.id, sentTo: r.sentTo, testCode: r.testCode });
                } catch (err) {
                  toast(apiErrorMessage(err, "Couldn't start the withdrawal."), "error");
                }
              }}
            >
              Withdraw to {s.account?.bankName}
            </Button>
          </div>
          <p className="text-label text-muted">
            Limits: {formatCurrency(s.limits.min, "NGN")} minimum, {formatCurrency(s.limits.max, "NGN")} per withdrawal,{" "}
            {formatCurrency(s.limits.dailyMax, "NGN")} per day.
          </p>
        </div>
      )}
    </StepCard>
  );
}

export default function StudentWithdrawPage() {
  const { data, error, loading, reload } = useApi(() => withdrawalsApi.summary());

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle title="Withdraw funds" subtitle="Move the support you've received to your bank account." />
      {loading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-card bg-white/60 shadow-card" />
          <div className="h-48 animate-pulse rounded-card bg-white/60 shadow-card" />
        </div>
      ) : error || !data ? (
        <EmptyState
          icon={<WalletIcon size={28} />}
          title="Couldn't load your balance"
          description={error ?? undefined}
          action={<Button variant="secondary" onClick={() => reload()}>Try again</Button>}
        />
      ) : (
        <div className="space-y-5">
          <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">Available to withdraw</p>
              <p className="mt-1 font-display text-[2.25rem] font-bold leading-none text-navy">
                {formatCurrency(data.available, "NGN")}
              </p>
              {data.converted.length > 0 && (
                <p className="mt-2 text-caption text-muted">
                  Includes{" "}
                  {data.converted
                    .map(
                      (c) =>
                        `${formatCurrency(c.amount, c.currency)} = ${formatCurrency(c.naira, "NGN")} (converted at ${formatCurrency(c.rate, "NGN")} per 1 ${c.currency})`
                    )
                    .join(", ")}
                  .
                </p>
              )}
              {data.otherBalances.length > 0 && (
                <p className="mt-2 text-caption text-muted">
                  Also received:{" "}
                  {data.otherBalances.map((b) => formatCurrency(b.amount, b.currency)).join(", ")} (waiting for a
                  naira exchange rate; {data.otherBalances.length === 1 ? "it is" : "they are"} converted automatically once
                  one is available).
                </p>
              )}
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Badge tone="success">
                <ShieldIcon size={14} /> Protected by SMS code
              </Badge>
              {!data.liveTransfers && (
                <Badge tone="amber">
                  <InfoIcon size={14} /> Test mode: no real money moves
                </Badge>
              )}
            </div>
          </Card>

          <PhoneStep s={data} reload={reload} />
          <AccountStep key={data.account?.accountNumber ?? "none"} s={data} reload={reload} />
          <WithdrawStep s={data} reload={reload} />

          <Card className="p-5">
            <h2 className="mb-4 font-display text-h3 text-navy">Withdrawal history</h2>
            {data.withdrawals.length === 0 ? (
              <p className="text-caption text-muted">No withdrawals yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-caption">
                  <thead className="text-label uppercase tracking-wide text-muted">
                    <tr>
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Amount</th>
                      <th className="pb-2 font-semibold">To</th>
                      <th className="pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-inputborder/30">
                    {data.withdrawals.map((w) => (
                      <tr key={w.id}>
                        <td className="py-2.5 text-navy">{formatDate(w.createdAt)}</td>
                        <td className="py-2.5 font-semibold text-navy">{formatCurrency(w.amount, w.currency)}</td>
                        <td className="py-2.5 text-muted">
                          {w.bankName} · {w.accountNumber}
                        </td>
                        <td className="py-2.5">
                          <Badge tone={STATUS[w.status].tone}>{STATUS[w.status].label}</Badge>
                          {w.status === "failed" && w.failureReason && (
                            <p className="mt-1 text-label text-alert">{w.failureReason}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
