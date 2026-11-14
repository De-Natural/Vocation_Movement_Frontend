"use client";

import { useEffect, useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PercentIcon } from "@/components/ui/icons";
import { adminApi } from "@/lib/admin-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { formatCurrency } from "@/lib/format";

const EXAMPLES = [20, 50, 100, 250];

export default function CommissionPage() {
  const { toast } = useToast();
  const { data, error, loading, reload, setData } = useApi(() => adminApi.settings());
  const [value, setValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setValue(String(data.platformFeePercent));
  }, [data]);

  const current = data?.platformFeePercent ?? 0;
  const next = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(next) && next >= 0 && next <= 100;
  const changed = valid && next !== current;
  const rate = valid ? next : current;

  async function save() {
    setSaving(true);
    try {
      const saved = await adminApi.updateSettings({ platformFeePercent: next });
      setData(saved);
      toast(`Platform commission set to ${saved.platformFeePercent}%.`, "success");
      setConfirmOpen(false);
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't update the commission."), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="mx-auto h-80 max-w-3xl animate-pulse rounded-card bg-white/60 shadow-card" />;
  if (error || !data) {
    return (
      <EmptyState
        icon={<PercentIcon size={28} />}
        title="Couldn't load the commission"
        description={error ?? "Please try again."}
        action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Platform Commission"
        subtitle="The percentage kept from every gift to fund maintenance and operations. Only the Super-Admin can change it."
      />

      <section className="mb-6 rounded-card bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Input
              label="Commission (%)"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={valid ? undefined : "Enter 0–100"}
            />
          </div>
          <div className="pb-1 text-caption text-muted">
            Currently <span className="font-semibold text-navy">{current}%</span>
            {current === 0 && " — giving is free"}
          </div>
          <div className="ml-auto flex gap-2 pb-0.5">
            <Button variant="secondary" disabled={!changed || saving} onClick={() => setValue(String(current))}>Reset</Button>
            <Button variant="primary" disabled={!changed || saving} onClick={() => setConfirmOpen(true)}>Save</Button>
          </div>
        </div>
      </section>

      {/* What it means */}
      <section className="rounded-card bg-white p-6 shadow-card">
        <h2 className="font-display text-h3 text-navy">How a gift is split at {rate}%</h2>
        <p className="mt-1 text-caption text-muted">
          The sponsor is charged the amount they choose. The commission is taken from it, and the rest is credited to the student&apos;s
          bill — so it is the student&apos;s share that moves their progress bar.
        </p>
        <div className="mt-4 overflow-hidden rounded-input border border-inputborder/50">
          <table className="w-full text-left text-caption">
            <thead className="bg-warm/60 text-navy">
              <tr>
                <th className="px-4 py-2 font-semibold">Sponsor gives</th>
                <th className="px-4 py-2 font-semibold">Platform keeps</th>
                <th className="px-4 py-2 font-semibold">Student receives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inputborder/40">
              {EXAMPLES.map((g) => {
                const fee = Math.round(g * rate) / 100;
                return (
                  <tr key={g}>
                    <td className="px-4 py-2 text-navy">{formatCurrency(g)}</td>
                    <td className="px-4 py-2 text-muted">{formatCurrency(fee)}</td>
                    <td className="px-4 py-2 font-semibold text-success">{formatCurrency(g - fee)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-label text-muted">A change applies to new gifts only. Gifts already made keep the rate they were made at.</p>
      </section>

      <Modal
        open={confirmOpen}
        onClose={() => !saving && setConfirmOpen(false)}
        title="Change the platform commission?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : `Set to ${next}%`}
            </Button>
          </>
        }
      >
        <p className="text-body text-navy/80">
          From now on, {next}% of every gift will be kept by the platform (currently {current}%). On a {formatCurrency(100)} gift the
          student will receive {formatCurrency(100 - next)}. Make sure your Terms of Service disclose the new rate.
        </p>
      </Modal>
    </div>
  );
}
