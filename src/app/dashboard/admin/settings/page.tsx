"use client";

import { useEffect, useState } from "react";
import { PageTitle, SectionHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SettingsIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { adminApi, type PlatformSettings } from "@/lib/admin-api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { useIsSuperAdmin, useStaffBase } from "@/lib/use-staff";
import Link from "next/link";

/** Foreign currencies a gift can arrive in; each needs a naira rate to be withdrawable. */
const FX_CURRENCIES = ["USD", "GBP", "EUR", "GHS"] as const;

export default function SettingsPage() {
  const { toast } = useToast();
  // Maintenance mode, minimum gift and the platform fee are Super-Admin only
  // (the backend enforces this too).
  const isSuperAdmin = useIsSuperAdmin();
  const base = useStaffBase();
  // The message box always starts empty; the saved message is shown under it instead.
  const [savedMessage, setSavedMessage] = useState("");
  const { data, error, loading, reload, setData } = useApi(() =>
    adminApi.settings().then((s) => {
      setSavedMessage(s.maintenanceMessage ?? "");
      return { ...s, maintenanceMessage: "" };
    })
  );
  // Editable copy of the saved settings.
  const [form, setForm] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  // Switching maintenance on signs everyone out and emails them: confirm first.
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = <K extends keyof PlatformSettings>(key: K) => (value: PlatformSettings[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  const dirty = !!form && !!data && JSON.stringify(form) !== JSON.stringify(data);
  const turningMaintenanceOn = !!form && !!data && form.maintenanceMode && !data.maintenanceMode;

  function setRate(currency: string, raw: string) {
    setForm((f) => {
      if (!f) return f;
      const rates = { ...f.payoutFxRates };
      const n = Number(raw);
      if (raw.trim() === "" || !(n > 0)) delete rates[currency];
      else rates[currency] = n;
      return { ...f, payoutFxRates: rates };
    });
  }

  async function save(confirmed = false) {
    if (!form) return;
    if (turningMaintenanceOn && !confirmed) {
      setConfirmMaintenance(true);
      return;
    }
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
        // The box is emptied after every save, so empty means "keep the message
        // already on the site" — except when switching maintenance off, which
        // clears it so an old notice is never reused.
        maintenanceMessage: form.maintenanceMessage.trim()
          ? form.maintenanceMessage.trim()
          : data?.maintenanceMode && !form.maintenanceMode
            ? ""
            : undefined,
      });
      const { maintenance, ...settings } = saved;
      // Empty the message box once saved (the message itself stays on the site).
      setSavedMessage(settings.maintenanceMessage ?? "");
      setData({ ...settings, maintenanceMessage: "" });
      setConfirmMaintenance(false);
      toast(
        maintenance
          ? `Maintenance mode is on. ${maintenance.sessionsEnded} session(s) signed out; ${maintenance.emailsQueued} user(s) are being emailed.`
          : "Platform settings saved.",
        "success"
      );
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
            desc="Take the site offline for everyone except the Super-Admin. Students, sponsors and admins are signed out, see a maintenance notice and can't sign in until it's switched off."
            locked={!isSuperAdmin}
          >
            <Toggle checked={form.maintenanceMode} onChange={set("maintenanceMode")} id="maintenance" disabled={!isSuperAdmin} />
          </SettingRow>
          {isSuperAdmin && (
            <Textarea
              id="maintenance-message"
              label="Maintenance message"
              rows={3}
              maxLength={2000}
              placeholder="e.g. We are upgrading Vocation Movement. The site will be back on Monday at 9:00 AM."
              value={form.maintenanceMessage}
              onChange={(e) => set("maintenanceMessage")(e.target.value)}
              hint="Shown on the site while maintenance is on, and emailed to every student, sponsor and admin when you switch it on. The box empties after saving."
            />
          )}
          {isSuperAdmin && savedMessage && (
            <p className="text-caption text-muted">
              Saved message: <span className="text-navy">&ldquo;{savedMessage}&rdquo;</span>. Leave the box empty to keep
              it; switching maintenance off clears it.
            </p>
          )}
        </div>
      </section>

      {/* Exchange rates */}
      <section className="mb-8 rounded-card bg-white p-6 shadow-card">
        <SectionHeader title="Exchange rates (to naira)" />
        <p className="mb-4 text-caption text-muted">
          Naira is the platform currency. A gift paid in another currency is converted to naira when it is confirmed,
          and that naira value counts towards bills, balances and withdrawals (it doesn&apos;t change later). Rates are
          fetched automatically every day. Leave an override empty to use the live rate, or enter your own rate to use
          that instead.
          {!isSuperAdmin && " Overrides are Super-Admin only."}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FX_CURRENCIES.map((c) => {
            const live = data?.liveFx?.rates[c];
            const override = form.payoutFxRates[c];
            return (
              <div key={c} className="rounded-input border border-inputborder/60 p-3">
                <p className="text-caption font-semibold text-navy">1 {c}</p>
                <p className="mt-1 text-caption text-muted">
                  Live: <span className="font-semibold text-navy">{live ? formatCurrency(live) : "not available yet"}</span>
                </p>
                <div className="mt-2">
                  <Input
                    label="Override (₦)"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Use live rate"
                    value={override !== undefined ? String(override) : ""}
                    onChange={(e) => setRate(c, e.target.value)}
                    disabled={!isSuperAdmin}
                  />
                </div>
                <p className="mt-1 text-label text-muted">
                  In use:{" "}
                  <span className="font-semibold text-navy">
                    {override !== undefined ? `${formatCurrency(override)} (override)` : live ? `${formatCurrency(live)} (live)` : "none, gifts wait"}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-label text-muted">
          {data?.liveFx ? (
            <>
              Live rates updated {formatDate(data.liveFx.updatedAt)}.{" "}
              {data.liveFx.source === "ExchangeRate-API" ? (
                <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">
                  Rates By Exchange Rate API
                </a>
              ) : (
                `Source: ${data.liveFx.source}.`
              )}
            </>
          ) : (
            "Live rates haven't been fetched yet; they load automatically when the server starts."
          )}
        </p>
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
        <Button loading={saving} variant="primary" onClick={() => void save()} disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Modal
        open={confirmMaintenance}
        onClose={() => !saving && setConfirmMaintenance(false)}
        title="Switch on maintenance mode?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmMaintenance(false)} disabled={saving}>
              Cancel
            </Button>
            <Button loading={saving} variant="primary" onClick={() => void save(true)} disabled={saving}>
              Turn on and notify everyone
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-body text-navy/80">
          <p>
            Every student, sponsor and admin will be signed out straight away and see the maintenance page. Only you
            (Super-Admin) can keep using the site.
          </p>
          <p>Everyone will also receive this message by email:</p>
          <blockquote className="rounded-input bg-warm/60 p-3 text-caption text-navy">
            {form.maintenanceMessage.trim() ||
              savedMessage ||
              "Vocation Movement is undergoing scheduled maintenance. Please check back shortly."}
          </blockquote>
        </div>
      </Modal>
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
