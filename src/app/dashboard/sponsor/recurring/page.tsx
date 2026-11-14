"use client";

import { useState } from "react";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { RecurringBadge } from "@/components/domain/StatusBadges";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { RepeatIcon, CalendarIcon, PauseIcon, PlayIcon, XIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { sponsorApi } from "@/lib/sponsor-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RecurringSponsorship } from "@/lib/types";

export default function RecurringPage() {
  const { data, error, loading, reload, setData } = useApi(() => sponsorApi.recurring());
  const subs = data ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<RecurringSponsorship | null>(null);
  const { toast } = useToast();

  const activeCount = subs.filter((s) => s.active).length;
  const monthlyTotal = subs.filter((s) => s.active).reduce((sum, s) => sum + s.amount, 0);

  async function toggle(sub: RecurringSponsorship) {
    setBusyId(sub.id);
    try {
      const updated = sub.active
        ? await sponsorApi.pauseRecurring(sub.id)
        : await sponsorApi.resumeRecurring(sub.id);
      setData((list) => list && list.map((s) => (s.id === sub.id ? updated : s)));
      toast(
        updated.active ? "Recurring gift resumed." : "Recurring gift paused. You can resume anytime.",
        updated.active ? "success" : "info"
      );
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't update the recurring gift."), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(sub: RecurringSponsorship) {
    setBusyId(sub.id);
    try {
      await sponsorApi.cancelRecurring(sub.id);
      setData((list) => list && list.filter((s) => s.id !== sub.id));
      toast("Recurring gift cancelled.", "info");
      setConfirmCancel(null);
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't cancel the recurring gift."), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="Manage Recurring Gifts"
        subtitle="Pause, resume, or cancel your monthly sponsorships at any time — you're always in control."
      />

      {/* Summary */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card bg-white p-5 shadow-card">
          <p className="text-caption font-semibold uppercase tracking-wide text-muted">Active recurring gifts</p>
          <p className="mt-2 font-display text-h1 leading-none text-navy">{activeCount}</p>
        </div>
        <div className="rounded-card bg-white p-5 shadow-card">
          <p className="text-caption font-semibold uppercase tracking-wide text-muted">Monthly commitment</p>
          <p className="mt-2 font-display text-h1 leading-none text-navy">{formatCurrency(monthlyTotal)}</p>
          <p className="mt-1 text-caption text-muted">≈ {formatCurrency(monthlyTotal * 12)} per year</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<RepeatIcon size={28} />}
          title="Couldn't load your recurring gifts"
          description={error}
          action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
        />
      ) : subs.length === 0 ? (
        <EmptyState
          icon={<RepeatIcon size={28} />}
          title="No recurring gifts"
          description="Set up a monthly gift from any student's profile to sustain their formation over time."
          action={
            <Link href="/students">
              <Button variant="primary">Browse students</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <Avatar name={s.studentName} src={s.studentPhoto} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-h3 text-navy">{s.studentName}</p>
                    {s.active ? <RecurringBadge /> : null}
                  </div>
                  <p className="text-caption text-muted">{s.billName}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-caption text-muted">
                    <CalendarIcon size={13} />
                    {s.active ? <>Next gift {formatDate(s.nextDate)}</> : <span className="text-amber">Paused</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="font-display text-h2 text-navy">
                  {formatCurrency(s.amount)}
                  <span className="text-caption font-normal text-muted"> /mo</span>
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => void toggle(s)} disabled={busyId === s.id}>
                    {s.active ? <><PauseIcon size={15} /> Pause</> : <><PlayIcon size={15} /> Resume</>}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(s)} disabled={busyId === s.id} aria-label="Cancel recurring gift">
                    <XIcon size={15} /> Cancel
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancelling is permanent — confirm first. */}
      <Modal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        title="Cancel recurring gift?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmCancel(null)} disabled={!!busyId}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => confirmCancel && void cancel(confirmCancel)} disabled={!!busyId}>
              {busyId ? "Cancelling…" : "Cancel gift"}
            </Button>
          </>
        }
      >
        <p className="text-body text-navy/80">
          Your {confirmCancel ? formatCurrency(confirmCancel.amount) : ""} monthly gift to {confirmCancel?.studentName} will stop.
          To pause it temporarily instead, use Pause.
        </p>
      </Modal>
    </div>
  );
}
