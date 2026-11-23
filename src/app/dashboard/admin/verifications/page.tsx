"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationBadge } from "@/components/domain/StatusBadges";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon, XIcon, InfoIcon, FileIcon, ShieldIcon } from "@/components/ui/icons";
import { adminApi, type AdminStudent } from "@/lib/admin-api";
import { ApiError } from "@/lib/api-client";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "Pending Verification" | "Verified" | "all";

const TABS: { key: Filter; label: string }[] = [
  { key: "Pending Verification", label: "Pending" },
  { key: "Verified", label: "Verified" },
  { key: "all", label: "All" },
];

type ActionKind = "reject" | "request" | "suspend";

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError && err.status === 0
    ? "Can't reach the server. Please try again."
    : err instanceof Error
      ? err.message
      : fallback;

export default function VerificationsPage() {
  // The full roster ("all") is fetched once; tabs filter it client-side so counts stay in sync.
  const [roster, setRoster] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("Pending Verification");
  const [action, setAction] = useState<{ kind: ActionKind; student: AdminStudent } | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setRoster(await adminApi.verifications("all"));
    } catch (err) {
      setLoadError(errorMessage(err, "Couldn't load the verification queue."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    if (filter === "all") return roster;
    return roster.filter((s) => s.verification === filter);
  }, [roster, filter]);

  /** Run a backend action, then re-fetch so the list reflects the stored state. */
  async function run(student: AdminStudent, fn: () => Promise<unknown>, success: string) {
    setBusyId(student.id);
    try {
      await fn();
      toast(success, "success");
      await load();
      return true;
    } catch (err) {
      toast(errorMessage(err, "Action failed. Please try again."), "error");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function approve(s: AdminStudent) {
    void run(s, () => adminApi.verify(s.id), `${s.name} has been verified and is now visible to sponsors.`);
  }

  function openAction(kind: ActionKind, student: AdminStudent) {
    setAction({ kind, student });
    setReason("");
  }

  async function confirmAction() {
    if (!action) return;
    const { kind, student } = action;
    const text = reason.trim();
    if (text.length < 3) {
      toast("Please provide a reason (at least 3 characters) — it will be sent to the student.", "warning");
      return;
    }
    const ok =
      kind === "reject"
        ? await run(student, () => adminApi.reject(student.id, text), `${student.name}'s profile was rejected. They have been notified.`)
        : kind === "suspend"
          ? await run(student, () => adminApi.suspend(student.userId, text), `${student.name}'s profile has been suspended.`)
          : await run(student, () => adminApi.requestInfo(student.id, text), `Information request sent to ${student.name}.`);
    if (ok) {
      setAction(null);
      setReason("");
    }
  }

  const actionCopy: Record<ActionKind, { title: string; label: string; hint: string; danger?: boolean }> = {
    reject: { title: "Reject Profile", label: "Reject", hint: "Explain why this profile cannot be approved.", danger: true },
    request: { title: "Request More Information", label: "Send request", hint: "What does the student need to provide or clarify?" },
    suspend: { title: "Suspend Profile", label: "Suspend", hint: "Reason for suspension (visible to the student).", danger: true },
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Student Verification Queue"
        subtitle="Review submitted profiles and supporting documents before they go live to sponsors."
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-pill bg-warm p-1">
        {TABS.map((t) => {
          const count =
            t.key === "all" ? roster.length : roster.filter((s) => s.verification === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "flex-1 rounded-pill px-4 py-2 text-caption font-semibold transition-colors",
                filter === t.key ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy"
              )}
            >
              {t.label} {!loading && <span className="ml-1 text-muted">({count})</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-card bg-white shadow-card" />
          ))}
        </div>
      ) : loadError ? (
        <EmptyState
          icon={<ShieldIcon size={28} />}
          title="Couldn't load profiles"
          description={loadError}
          action={<Button variant="secondary" onClick={() => { setLoading(true); void load(); }}>Try again</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ShieldIcon size={28} />}
          title="Nothing to review"
          description="There are no profiles in this category right now."
          action={<Button variant="secondary" onClick={() => setFilter("all")}>View all students</Button>}
        />
      ) : (
        <div className="space-y-4">
          {visible.map((s) => (
            <div key={s.id} className="rounded-card bg-white p-5 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <Avatar name={s.name} src={s.photo} size="lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-h3 text-navy">{s.name}</h3>
                      <VerificationBadge status={s.verification} />
                    </div>
                    <p className="mt-1 text-caption text-muted">{s.email}</p>
                    <p className="text-caption text-muted">{s.formationStage} · {s.congregation}</p>
                    <p className="text-caption text-muted">
                      {[s.school, s.location || s.country].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-label text-muted">Submitted {formatDate(s.createdAt)}</p>

                    {s.biography && (
                      <p className="mt-3 line-clamp-3 text-caption text-navy/80">{s.biography}</p>
                    )}

                    {/* Supporting documents */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.documents.length === 0 ? (
                        <span className="text-label text-alert">No documents uploaded</span>
                      ) : (
                        s.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={mediaUrl(doc.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-pill border border-inputborder bg-warm/40 px-3 py-1 text-label font-medium text-navy hover:border-gold"
                          >
                            <FileIcon size={13} /> {doc.label}
                            <span className="text-muted">
                              ({doc.mimeType === "application/pdf" ? "PDF" : "Image"})
                            </span>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-inputborder/40 pt-4">
                {s.verification === "Pending Verification" && (
                  <>
                    <Button loading={busyId === s.id} variant="primary" size="sm" onClick={() => approve(s)} disabled={!!busyId}>
                      <CheckIcon size={15} /> {busyId === s.id ? "Approving…" : "Approve"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openAction("request", s)} disabled={!!busyId}>
                      <InfoIcon size={15} /> Request Info
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => openAction("reject", s)} disabled={!!busyId}>
                      <XIcon size={15} /> Reject
                    </Button>
                  </>
                )}
                {s.verification === "Verified" && (
                  <Button variant="danger" size="sm" onClick={() => openAction("suspend", s)} disabled={!!busyId}>
                    <ShieldIcon size={15} /> Flag &amp; Suspend
                  </Button>
                )}
                {(s.verification === "Rejected" || s.verification === "Suspended") && (
                  <Button variant="secondary" size="sm" onClick={() => approve(s)} disabled={!!busyId}>
                    <CheckIcon size={15} /> Reinstate &amp; Verify
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action modal (reject / request info / suspend) */}
      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action ? actionCopy[action.kind].title : ""}
        footer={
          action && (
            <>
              <Button variant="secondary" onClick={() => setAction(null)} disabled={!!busyId}>Cancel</Button>
              <Button loading={!!busyId}
                variant={actionCopy[action.kind].danger ? "danger" : "primary"}
                onClick={() => void confirmAction()}
                disabled={!!busyId}
              >
                {busyId ? "Sending…" : actionCopy[action.kind].label}
              </Button>
            </>
          )
        }
      >
        {action && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-input bg-warm/50 p-3">
              <Avatar name={action.student.name} src={action.student.photo} size="sm" />
              <div>
                <p className="text-caption font-semibold text-navy">{action.student.name}</p>
                <p className="text-label text-muted">{action.student.congregation}</p>
              </div>
            </div>
            <Textarea
              label="Reason / message to student"
              placeholder="This message will be emailed to the student…"
              hint={actionCopy[action.kind].hint}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
