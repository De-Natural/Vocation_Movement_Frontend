"use client";

import { useEffect, useState } from "react";
import { PageTitle, SectionHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { SettingsIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { adminApi, type PlatformSettings } from "@/lib/admin-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { useIsSuperAdmin, useStaffBase } from "@/lib/use-staff";
import Link from "next/link";

export default function SettingsPage() {
  const { toast } = useToast();
  // Maintenance mode, minimum gift and the platform fee are Super-Admin only
  // (the backend enforces this too).
  const isSuperAdmin = useIsSuperAdmin();
  const base = useStaffBase();
  const { data, error, loading, reload, setData } = useApi(() => adminApi.settings());
  // Editable copy of the saved settings.
  const [form, setForm] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof PlatformSettings>(key: K) => (value: PlatformSettings[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  const dirty = !!form && !!data && JSON.stringify(form) !== JSON.stringify(data);

  async function save() {
    if (!form) return;
    const fee = Number(form.platformFeePercent);
    const min = Number(form.minGift);
    if (!(fee >= 0 && fee <= 100)) return toast("Platform fee must be between 0 and 100%.", "warning");
    if (!(min > 0)) return toast("Minimum gift must be greater than 0.", "warning");
    if (form.organizationName.trim().length < 2) return toast("Please enter the apostolate name.", "warning");
    setSaving(true);
    try {
      const saved = await adminApi.updateSettings({
        ...form,
        organizationName: form.organizationName.trim(),
        supportEmail: form.supportEmail.trim(),
        platformFeePercent: fee,
        minGift: min,
      });
      setData(saved);
      toast("Platform settings saved.", "success");
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't save settings."), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading || (!form && !error)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-card bg-white/60 shadow-card" />
        ))}
      </div>
    );
  }
  if (error || !form) {
    return (
      <EmptyState
        icon={<SettingsIcon size={28} />}
        title="Couldn't load settings"
        description={error ?? "Please try again."}
        action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Platform Settings" subtitle="Configure verification, giving, and platform-wide behavior." />

      {/* Verification & moderation */}
      <section className="mb-8 rounded-card bg-white p-6 shadow-card">
        <SectionHeader title="Verification & Moderation" />
        <div className="space-y-4">
          <SettingRow
            title="Auto-approve new profiles"
            desc="Off by default: admins review and approve every student one by one. When on, a student's profile goes live as soon as they verify their email. Not recommended."
            locked={!isSuperAdmin}
          >
            <Toggle checked={form.autoApprove} onChange={set("autoApprove")} id="auto-approve" disabled={!isSuperAdmin} />
          </SettingRow>
          <SettingRow
            title="Maintenance mode"
            desc="Take the site offline for everyone except staff. Visitors, students and sponsors see a maintenance notice and can't sign in."
            locked={!isSuperAdmin}
          >
            <Toggle checked={form.maintenanceMode} onChange={set("maintenanceMode")} id="maintenance" disabled={!isSuperAdmin} />
          </SettingRow>
        </div>
      </section>

      {/* Giving */}
      <section className="mb-8 rounded-card bg-white p-6 shadow-card">
        <SectionHeader title="Giving" />
        <div className="space-y-4">
          <SettingRow
            title="Anonymous by default"
            desc="New sponsors start with &quot;give anonymously&quot; switched on. They can still change it for any gift."
          >
            <Toggle checked={form.anonymousDefault} onChange={set("anonymousDefault")} id="anon-default" />
          </SettingRow>
          <SettingRow
            title="Email receipts"
            desc="Send an emailed receipt after every confirmed gift."
          >
            <Toggle checked={form.emailReceipts} onChange={set("emailReceipts")} id="email-receipts" />
          </SettingRow>

          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            <Input
              label="Minimum gift"
              type="number"
              min={1}
              value={String(form.minGift)}
              onChange={(e) => set("minGift")(e.target.value as unknown as number)}
              disabled={!isSuperAdmin}
              hint={isSuperAdmin ? undefined : "Super-Admin only"}
            />
            <div>
              <Input
                label="Platform fee (%)"
                type="number"
                value={String(form.platformFeePercent)}
                disabled
                hint={isSuperAdmin ? undefined : "Super-Admin only"}
              />
              {isSuperAdmin && (
                <Link href={`${base}/commission`} className="mt-1 block text-caption font-semibold text-accent hover:underline">
                  Change on the Commission page
                </Link>
              )}
            </div>
            <Select
              label="Default currency"
              value={form.defaultCurrency}
              onChange={(e) => set("defaultCurrency")(e.target.value)}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "NGN", label: "NGN (₦)" },
                { value: "GHS", label: "GHS (₵)" },
                { value: "EUR", label: "EUR (€)" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mb-8 rounded-card bg-white p-6 shadow-card">
        <SectionHeader title="Organization" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Apostolate name" value={form.organizationName} onChange={(e) => set("organizationName")(e.target.value)} />
          <Input label="Support email" type="email" value={form.supportEmail} onChange={(e) => set("supportEmail")(e.target.value)} />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          disabled={!dirty || saving}
          onClick={() => {
            setForm(data);
            toast("Changes discarded.", "info");
          }}
        >
          Cancel
        </Button>
        <Button variant="primary" onClick={() => void save()} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  desc,
  children,
  locked = false,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
  /** Shown read-only with a "Super-Admin only" note. */
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-body font-semibold text-navy">
          {title}
          {locked && <span className="ml-2 align-middle text-label font-normal text-muted">Super-Admin only</span>}
        </p>
        <p className="text-caption text-muted">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
