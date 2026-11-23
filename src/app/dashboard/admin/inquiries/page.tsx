"use client";

import { useState } from "react";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon, MessageIcon, XIcon } from "@/components/ui/icons";
import { adminApi } from "@/lib/admin-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ContactInquiry } from "@/lib/types";

type Filter = "unread" | "all";

export default function InquiriesPage() {
  const { data, error, loading, reload, setData } = useApi(() => adminApi.inquiries());
  const inquiries = data ?? [];
  const { toast } = useToast();

  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<ContactInquiry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactInquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const unreadCount = inquiries.filter((i) => !i.read).length;
  const visible = filter === "unread" ? inquiries.filter((i) => !i.read) : inquiries;

  function open(inquiry: ContactInquiry) {
    setActive(inquiry);
    if (!inquiry.read) {
      // Optimistic: mark read locally, persist in the background.
      setData((list) => list && list.map((i) => (i.id === inquiry.id ? { ...i, read: true } : i)));
      adminApi.markInquiryRead(inquiry.id).catch(() => void reload());
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteInquiry(pendingDelete.id);
      setData((list) => list && list.filter((i) => i.id !== pendingDelete.id));
      toast("Inquiry deleted.", "info");
      setPendingDelete(null);
      setActive(null);
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't delete the inquiry."), "error");
    } finally {
      setDeleting(false);
    }
  }

  const TABS: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: inquiries.length },
    { key: "unread", label: "Unread", count: unreadCount },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Contact Inquiries"
        subtitle="Messages submitted through the public contact form arrive here."
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-pill bg-warm p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "flex-1 rounded-pill px-4 py-2 text-caption font-semibold transition-colors",
              filter === t.key ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy"
            )}
          >
            {t.label} <span className="ml-1 text-muted">({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={<MessageIcon size={28} />}
          title="Couldn't load inquiries"
          description={error}
          action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<MessageIcon size={28} />}
          title={filter === "unread" ? "No unread inquiries" : "No inquiries yet"}
          description={
            filter === "unread"
              ? "You're all caught up — every message has been read."
              : "When a visitor submits the contact form, their message will appear here."
          }
          action={
            filter === "unread" ? (
              <Button variant="secondary" onClick={() => setFilter("all")}>
                View all
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((inq) => (
            <button
              key={inq.id}
              onClick={() => open(inq)}
              className={cn(
                "flex w-full items-start gap-4 rounded-card bg-white p-5 text-left shadow-card transition-shadow hover:shadow-cardhover",
                !inq.read && "ring-1 ring-gold/40"
              )}
            >
              <span
                className={cn(
                  "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  inq.read ? "bg-warm text-muted" : "bg-gold/15 text-gold-dark"
                )}
              >
                <MessageIcon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-display text-h3 text-navy">{inq.name}</p>
                  {!inq.read && <Badge tone="gold">New</Badge>}
                </div>
                <p className="truncate text-caption text-muted">
                  {[inq.email, inq.phone].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 line-clamp-2 text-body text-navy/80">{inq.message}</p>
              </div>
              <span className="shrink-0 text-label text-muted">{formatRelative(inq.date)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title="Inquiry"
        footer={
          active && (
            <>
              <Button variant="danger" onClick={() => setPendingDelete(active)}>
                <XIcon size={15} /> Delete
              </Button>
              <a href={active ? `mailto:${active.email}?subject=Re:%20your%20enquiry` : "#"}>
                <Button variant="primary">
                  <CheckIcon size={15} /> Reply by email
                </Button>
              </a>
            </>
          )
        }
      >
        {active && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 rounded-input bg-warm/50 p-4 text-caption">
              <div>
                <p className="text-label uppercase tracking-wide text-muted">Name</p>
                <p className="font-semibold text-navy">{active.name}</p>
              </div>
              <div>
                <p className="text-label uppercase tracking-wide text-muted">Received</p>
                <p className="font-semibold text-navy">{formatRelative(active.date)}</p>
              </div>
              <div>
                <p className="text-label uppercase tracking-wide text-muted">Email</p>
                <a href={`mailto:${active.email}`} className="font-semibold text-accent hover:underline">
                  {active.email}
                </a>
              </div>
              <div>
                <p className="text-label uppercase tracking-wide text-muted">Phone</p>
                {active.phone ? (
                  <a href={`tel:${active.phone}`} className="font-semibold text-accent hover:underline">
                    {active.phone}
                  </a>
                ) : (
                  <p className="text-muted">—</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-label uppercase tracking-wide text-muted">Message</p>
              <p className="whitespace-pre-wrap text-body leading-relaxed text-navy/85">{active.message}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete inquiry?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button loading={deleting} variant="danger" onClick={() => void confirmDelete()} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-body text-navy/80">
          This will permanently remove the message from {pendingDelete?.name}. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
