"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationBadge } from "@/components/domain/StatusBadges";
import { useToast } from "@/components/ui/Toast";
import { SearchIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import { superAdminApi, type PlatformUser, type UsersQuery } from "@/lib/superadmin-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { formatCurrency, formatDate, formatRelative } from "@/lib/format";

const PER_PAGE = 25;

export default function UsersPage() {
  const { toast } = useToast();
  const [role, setRole] = useState<NonNullable<UsersQuery["role"]>>("all");
  const [status, setStatus] = useState<NonNullable<UsersQuery["status"]>>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  // New filters start from page 1.
  useEffect(() => setPage(1), [role, status, debounced]);

  const { data, error, loading, reload } = useApi(
    () => superAdminApi.users({ role, status, search: debounced || undefined, page, perPage: PER_PAGE }),
    [role, status, debounced, page]
  );
  const users = data?.data ?? [];
  const total = data?.meta?.total ?? users.length;
  const totalPages = data?.meta?.totalPages ?? 1;

  const [action, setAction] = useState<{ kind: "suspend" | "reactivate"; user: PlatformUser } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function confirmAction() {
    if (!action) return;
    const why = reason.trim();
    if (why.length < 3) return toast("Please give a reason (at least 3 characters).", "warning");
    setBusy(true);
    try {
      if (action.kind === "suspend") await superAdminApi.suspendUser(action.user.id, why);
      else await superAdminApi.reactivateUser(action.user.id, why);
      toast(
        action.kind === "suspend" ? `${action.user.name} has been suspended.` : `${action.user.name} has been reactivated.`,
        action.kind === "suspend" ? "info" : "success"
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
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Users" subtitle="Every student and sponsor account on the platform, with their status and activity." />

      {/* Filters */}
      <div className="mb-4 grid gap-3 rounded-card bg-white p-4 shadow-card sm:grid-cols-[1fr_180px_180px]">
        <div>
          <label htmlFor="user-search" className="mb-1.5 block text-caption font-semibold text-navy">Search</label>
          <div className="flex items-center gap-2 rounded-input border-[1.5px] border-inputborder bg-white px-3 py-2.5 focus-within:border-gold">
            <SearchIcon size={16} className="text-muted" />
            <input
              id="user-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email…"
              className="flex-1 bg-transparent text-body text-navy placeholder:text-muted/60 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <XIcon size={14} className="text-muted" />
              </button>
            )}
          </div>
        </div>
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          options={[
            { value: "all", label: "Students & sponsors" },
            { value: "student", label: "Students" },
            { value: "sponsor", label: "Sponsors" },
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          options={[
            { value: "all", label: "Any status" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ]}
        />
      </div>

      <p className="mb-3 text-caption text-muted">{loading ? "Loading…" : `${total} account${total !== 1 ? "s" : ""}`}</p>

      {loading && users.length === 0 ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<UsersIcon size={28} />}
          title="Couldn't load users"
          description={error}
          action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
        />
      ) : users.length === 0 ? (
        <EmptyState icon={<UsersIcon size={28} />} title="No accounts match" description="Try a different search or filter." />
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={u.name} size="md" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-navy">{u.name}</p>
                    <Badge tone={u.role === "student" ? "accent" : "gold"}>{u.role === "student" ? "Student" : "Sponsor"}</Badge>
                    {u.verification && <VerificationBadge status={u.verification} />}
                    {u.status === "Suspended" && <Badge tone="alert">Suspended</Badge>}
                    {!u.emailVerified && <Badge tone="neutral">Email unverified</Badge>}
                  </div>
                  <p className="truncate text-caption text-muted">{u.email}</p>
                  <p className="text-label text-muted">
                    Joined {formatDate(u.createdAt)} · {u.lastActive ? `last signed in ${formatRelative(u.lastActive)}` : "no sign-in recorded"} ·{" "}
                    {u.role === "student" ? `${formatCurrency(u.amount)} raised` : `${formatCurrency(u.amount)} given`}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {u.role === "student" && u.slug && u.verification === "Verified" && (
                  <Link href={`/students/${u.slug}`} target="_blank">
                    <Button variant="ghost" size="sm">View profile</Button>
                  </Link>
                )}
                {u.status === "Active" ? (
                  <Button variant="secondary" size="sm" onClick={() => { setAction({ kind: "suspend", user: u }); setReason(""); }}>
                    Suspend
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => { setAction({ kind: "reactivate", user: u }); setReason(""); }}>
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-caption text-muted">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <Modal
        open={!!action}
        onClose={() => !busy && setAction(null)}
        title={action?.kind === "suspend" ? "Suspend account" : "Reactivate account"}
        footer={
          action && (
            <>
              <Button variant="secondary" onClick={() => setAction(null)} disabled={busy}>Cancel</Button>
              <Button loading={busy} variant={action.kind === "suspend" ? "danger" : "primary"} onClick={() => void confirmAction()} disabled={busy}>
                {busy ? "Working…" : action.kind === "suspend" ? "Suspend" : "Reactivate"}
              </Button>
            </>
          )
        }
      >
        {action && (
          <div className="space-y-4">
            <p className="text-body text-navy/80">
              {action.kind === "suspend"
                ? `${action.user.name} will be signed out and can't sign in.${action.user.role === "student" ? " Their profile is hidden from sponsors." : ""} The reason is emailed to them.`
                : `${action.user.name} will be able to sign in again.${action.user.role === "student" ? " Their profile goes back to the verification queue before it is public again." : ""}`}
            </p>
            <Textarea label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Recorded in the activity log…" />
          </div>
        )}
      </Modal>
    </div>
  );
}
