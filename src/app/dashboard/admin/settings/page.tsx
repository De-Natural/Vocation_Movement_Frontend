"use client";

import { useState } from "react";
import { PageTitle, SectionHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Input, Select, Toggle } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { toast } = useToast();

  // Platform settings (PRD §4.10) — mock local state.
  const [autoApprove, setAutoApprove] = useState(false);
  const [anonDefault, setAnonDefault] = useState(false);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [minGift, setMinGift] = useState("5");
  const [platformFee, setPlatformFee] = useState("0");
  const [currency, setCurrency] = useState("USD");

  function save() {
    toast("Platform settings saved.", "success");
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
            desc="Skip manual review and publish profiles immediately. Not recommended."
          >
            <Toggle checked={autoApprove} onChange={setAutoApprove} id="auto-approve" />
          </SettingRow>
          <SettingRow
            title="Maintenance mode"
            desc="Temporarily take the public site offline for updates."
          >
            <Toggle checked={maintenance} onChange={setMaintenance} id="maintenance" />
          </SettingRow>
        </div>
      </section>

      {/* Giving */}
      <section className="mb-8 rounded-card bg-white p-6 shadow-card">
        <SectionHeader title="Giving" />
        <div className="space-y-4">
          <SettingRow
            title="Anonymous by default"
            desc="New sponsors give anonymously unless they opt out."
          >
            <Toggle checked={anonDefault} onChange={setAnonDefault} id="anon-default" />
          </SettingRow>
          <SettingRow
            title="Email receipts"
            desc="Send an emailed receipt after every confirmed gift."
          >
            <Toggle checked={emailReceipts} onChange={setEmailReceipts} id="email-receipts" />
          </SettingRow>

          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            <Input label="Minimum gift" type="number" min={1} value={minGift} onChange={(e) => setMinGift(e.target.value)} />
            <Input label="Platform fee (%)" type="number" min={0} max={100} value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} hint="0% keeps giving free" />
            <Select
              label="Default currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
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
          <Input label="Apostolate name" defaultValue="Apostolate of the Most Precious Blood" />
          <Input label="Support email" type="email" defaultValue="support@vocationmovement.org" />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => toast("Changes discarded.", "info")}>Cancel</Button>
        <Button variant="primary" onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-body font-semibold text-navy">{title}</p>
        <p className="text-caption text-muted">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
