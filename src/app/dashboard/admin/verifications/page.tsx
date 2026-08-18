"use client";

import { useMemo, useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationBadge } from "@/components/domain/StatusBadges";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon, XIcon, InfoIcon, FileIcon, ShieldIcon } from "@/components/ui/icons";
import { students as seedStudents } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Student, VerificationStatus } from "@/lib/types";

type Filter = "Pending Verification" | "Verified" | "all";

const TABS: { key: Filter; label: string }[] = [
  { key: "Pending Verification", label: "Pending" },
  { key: "Verified", label: "Verified" },
  { key: "all", label: "All" },
];

type ActionKind = "reject" | "request" | "suspend";

export default function VerificationsPage() {
  const [roster, setRoster] = useState<Student[]>(seedStudents);
  const [filter, setFilter] = useState<Filter>("Pending Verification");
  const [action, setAction] = useState<{ kind: ActionKind; student: Student } | null>(null);
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const visible = useMemo(() => {
    if (filter === "all") return roster;
    return roster.filter((s) => s.verification === filter);
  }, [roster, filter]);

  function setStatus(id: string, status: VerificationStatus) {
    setRoster((list) => list.map((s) => (s.id === id ? { ...s, verification: status } : s)));
  }

  function approve(s: Student) {
    setStatus(s.id, "Verified");
    toast(`${s.name} has been verified and is now visible to sponsors.`, "success");
  }

  function openAction(kind: ActionKind, student: Student) {
    setAction({ kind, student });
    setReason("");
  }

  function confirmAction() {
    if (!action) return;
    const { kind, student } = action;
    if (!reason.trim()) {
      toast("Please provide a reason — it will be sent to the student.", "warning");
      return;
    }
    if (kind === "reject") {
      setStatus(student.id, "Rejected");
      toast(`${student.name}'s profile was rejected. They have been notified.`, "info");
    } else if (kind === "suspend") {
      setStatus(student.id, "Suspended");
      toast(`${student.name}'s profile has been suspended.`, "info");
    } else {
      toast(`Information request sent to ${student.name}.`, "info");
    }
    setAction(null);
    setReason("");
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
              {t.label} <span className="ml-1 text-muted">({count})</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
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
                    <p className="mt-1 text-caption text-muted">{s.formationStage} · {s.congregation}</p>
                    <p className="text-caption text-muted">{s.school} · {s.location}</p>
                    <p className="mt-1 text-label text-muted">Submitted {formatDate(s.createdAt)}</p>

                    {/* Mock supporting documents */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Letter of recommendation", "Formation ID", "Bill statement"].map((doc) => (
                        <button
                          key={doc}
                          onClick={() => toast(`Opening “${doc}” (demo).`, "info")}
                          className="inline-flex items-center gap-1.5 rounded-pill border border-inputborder bg-warm/40 px-3 py-1 text-label font-medium text-navy hover:border-gold"
                        >
                          <FileIcon size={13} /> {doc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-inputborder/40 pt-4">
                {s.verification === "Pending Verification" && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => approve(s)}>
                      <CheckIcon size={15} /> Approve
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openAction("request", s)}>
                      <InfoIcon size={15} /> Request Info
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => openAction("reject", s)}>
                      <XIcon size={15} /> Reject
                    </Button>
                  </>
                )}
                {s.verification === "Verified" && (
                  <Button variant="danger" size="sm" onClick={() => openAction("suspend", s)}>
                    <ShieldIcon size={15} /> Flag &amp; Suspend
                  </Button>
                )}
                {(s.verification === "Rejected" || s.verification === "Suspended") && (
                  <Button variant="secondary" size="sm" onClick={() => approve(s)}>
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
              <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
              <Button variant={actionCopy[action.kind].danger ? "danger" : "primary"} onClick={confirmAction}>
                {actionCopy[action.kind].label}
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
