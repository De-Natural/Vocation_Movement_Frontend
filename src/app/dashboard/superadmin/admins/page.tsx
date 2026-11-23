"use client";

import { useState } from "react";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PlusIcon, ShieldIcon, XIcon, CheckIcon } from "@/components/ui/icons";
import { superAdminApi, type StaffMember } from "@/lib/superadmin-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { useSession } from "@/lib/store";
import { formatDate, formatRelative } from "@/lib/format";

type ActionKind = "suspend" | "reactivate" | "delete";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ACTION_COPY: Record<ActionKind, { title: string; label: string; hint: string; danger: boolean }> = {
  suspend: {
    title: "Suspend admin",
    label: "Suspend",
    hint: "They will be signed out and can't sign in until reactivated.",
    danger: true,
  },
  reactivate: {
    title: "Reactivate admin",
    label: "Reactivate",
    hint: "They will be able to sign in again.",
    danger: false,
  },
  delete: {
    title: "Delete admin permanently",
    label: "Delete permanently",
    hint: "The account is removed for good. Their past actions stay in the activity log, marked “(deleted)”.",
    danger: true,
  },
};

/** Must match MAX_ADMINS in the backend (superadmin.service.ts). */
const MAX_ADMINS = 3;

export default function ManageAdminsPage() {
  const { toast } = useToast();
  const myId = useSession((s) => s.userId);
  const { data, error, loading, reload } = useApi(() => superAdminApi.admins());
  const staff = data ?? [];
  const adminCount = staff.filter((a) => a.tier !== "superadmin").length;
  const atLimit = adminCount >= MAX_ADMINS;

  // Create admin
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);

  // Suspend / reactivate / delete
  const [action, setAction] = useState<{ kind: ActionKind; admin: StaffMember } | null>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function createAdmin() {
    const name = draft.name.trim();
    const email = draft.email.trim().toLowerCase();
    if (name.length < 2) return toast("Please enter the admin's name.", "warning");
    if (!EMAIL_RE.test(email)) return toast("Please enter a valid email address.", "warning");
    if (draft.password.length < 8) return toast("The initial password must be at least 8 characters.", "warning");
    setCreating(true);
    try {
      await superAdminApi.createAdmin({ name, email, password: draft.password });
      toast(`Admin account created for ${name}. Share the sign-in details with them securely.`, "success");
      setCreateOpen(false);
      setDraft({ name: "", email: "", password: "" });
      void reload();
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't create the admin."), "error");
    } finally {
      setCreating(false);
    }
  }

  function openAction(kind: ActionKind, admin: StaffMember) {
    setAction({ kind, admin });
    setReason("");
    setConfirmText("");
  }

  async function confirmAction() {
    if (!action) return;
    const { kind, admin } = action;
    const why = reason.trim();
    if (why.length < 3) return toast("Please give a reason (at least 3 characters) — it is kept in the activity log.", "warning");
    if (kind === "delete" && confirmText.trim().toLowerCase() !== admin.email.toLowerCase()) {
      return toast("Type the admin's email address to confirm deletion.", "warning");
    }
    setBusy(true);
    try {
      if (kind === "suspend") await superAdminApi.suspendAdmin(admin.id, why);
      else if (kind === "reactivate") await superAdminApi.reactivateAdmin(admin.id, why);
      else await superAdminApi.deleteAdmin(admin.id, why);
      toast(
        kind === "delete"
          ? `${admin.name}'s account was deleted.`
          : kind === "suspend"
            ? `${admin.name} has been suspended.`
            : `${admin.name} has been reactivated.`,
        kind === "reactivate" ? "success" : "info"
      );
      setAction(null);
      void reload();
    } catch (err) {
      toast(apiErrorMessage(err, "The action failed. Please try again."), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageTitle title="Manage Admins" subtitle="Create admin accounts, and suspend or remove access. Every change is recorded in the activity log." />
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="primary"
            onClick={() => setCreateOpen(true)}
            disabled={loading || atLimit}
            title={atLimit ? `You can have at most ${MAX_ADMINS} admins. Delete one to add another.` : undefined}
          >
            <PlusIcon size={16} /> New admin
          </Button>
          {!loading && (
            <span className={atLimit ? "text-label font-semibold text-amber" : "text-label text-muted"}>
              {adminCount} of {MAX_ADMINS} admins{atLimit ? " (limit reached)" : ""}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<ShieldIcon size={28} />}
          title="Couldn't load staff"
          description={error}
          action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
        />
      ) : (
        <div className="space-y-3">
          {staff.map((a) => {
            const isMe = a.id === myId;
            const isSuper = a.tier === "superadmin";
            return (
              <div key={a.id} className="flex flex-col gap-4 rounded-card bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar name={a.name} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-display text-h3 text-navy">{a.name}</p>
                      <Badge tone={isSuper ? "gold" : "navy"}>{isSuper ? "Super-Admin" : "Admin"}</Badge>
                      {a.status === "Suspended" && <Badge tone="alert">Suspended</Badge>}
                      {isMe && <Badge tone="neutral">You</Badge>}
                    </div>
                    <p className="truncate text-caption text-muted">{a.email}</p>
                    <p className="text-label text-muted">
                      Added {formatDate(a.createdAt)} · {a.lastActive ? `last signed in ${formatRelative(a.lastActive)}` : "never signed in"} ·{" "}
                      <Link href={`/dashboard/superadmin/activity?actor=${a.id}`} className="text-accent hover:underline">
                        {a.actionsCount} action{a.actionsCount !== 1 ? "s" : ""}
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Super-admin accounts (including your own) can't be changed here. */}
                {!isSuper && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {a.status === "Active" ? (
                      <Button variant="secondary" size="sm" onClick={() => openAction("suspend", a)}>
                        <ShieldIcon size={15} /> Suspend
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => openAction("reactivate", a)}>
                        <CheckIcon size={15} /> Reactivate
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => openAction("delete", a)}>
                      <XIcon size={15} /> Delete
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {staff.filter((a) => a.tier === "admin").length === 0 && (
            <p className="py-4 text-center text-caption text-muted">No admin accounts yet. Create one with “New admin”.</p>
          )}
        </div>
      )}

      {/* Create admin */}
      <Modal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        title="New admin account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button loading={creating} variant="primary" onClick={() => void createAdmin()} disabled={creating}>
              {creating ? "Creating…" : "Create admin"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full name" required value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Sr. Mary Okafor" />
          <Input label="Email" type="email" required value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} placeholder="mary@vocationmovement.org" />
          <Input
            label="Initial password"
            type="password"
            required
            value={draft.password}
            onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
            hint="At least 8 characters. Share it with the new admin securely; they can change it with “Forgot password”."
          />
          <p className="rounded-input bg-warm/60 p-3 text-caption text-muted">
            Admins can review student profiles, transactions, inquiries and reports, and change everyday settings. Only you can change
            maintenance mode, the minimum gift and the commission, or manage other admins.
          </p>
        </div>
      </Modal>

      {/* Suspend / reactivate / delete */}
      <Modal
        open={!!action}
        onClose={() => !busy && setAction(null)}
        title={action ? ACTION_COPY[action.kind].title : ""}
        footer={
          action && (
            <>
              <Button variant="secondary" onClick={() => setAction(null)} disabled={busy}>Cancel</Button>
              <Button loading={busy} variant={ACTION_COPY[action.kind].danger ? "danger" : "primary"} onClick={() => void confirmAction()} disabled={busy}>
                {busy ? "Working…" : ACTION_COPY[action.kind].label}
              </Button>
            </>
          )
        }
      >
        {action && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-input bg-warm/50 p-3">
              <Avatar name={action.admin.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-caption font-semibold text-navy">{action.admin.name}</p>
                <p className="truncate text-label text-muted">{action.admin.email}</p>
              </div>
            </div>
            <p className="text-caption text-muted">{ACTION_COPY[action.kind].hint}</p>
            <Textarea
              label="Reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Recorded in the activity log…"
            />
            {action.kind === "delete" && (
              <Input
                label={`Type ${action.admin.email} to confirm`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
