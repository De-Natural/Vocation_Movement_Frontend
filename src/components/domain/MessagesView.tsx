"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { MessageIcon, ShieldIcon, PlusIcon } from "@/components/ui/icons";
import { messagesApi, studentApi } from "@/lib/student-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { mediaUrl } from "@/lib/media";
import { formatGift, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Contribution } from "@/lib/types";

const CHAR_LIMIT = 1000;

/** A gift the student can thank its sponsor for. */
interface Recipient {
  paymentId: string;
  donorName: string;
  anonymous: boolean;
  label: string;
}

/** One entry per payment (a payment may be split across several bills). */
function toRecipients(payments: Contribution[]): Recipient[] {
  const byPayment = new Map<string, Recipient>();
  for (const p of payments) {
    if (!p.paymentId || p.status !== "Confirmed" || byPayment.has(p.paymentId)) continue;
    byPayment.set(p.paymentId, {
      paymentId: p.paymentId,
      donorName: p.donorName,
      anonymous: p.anonymous,
      label: `${p.donorName} — ${formatGift(p.amount, p.currency, p.nairaAmount)} on ${formatDate(p.date)}`,
    });
  }
  return Array.from(byPayment.values());
}

/** Thank-you composer (student → sponsor). */
function Composer({
  open,
  onClose,
  onSend,
  recipients,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (paymentId: string, subject: string, body: string) => Promise<boolean>;
  recipients: Recipient[];
}) {
  const [paymentId, setPaymentId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const selected = recipients.find((r) => r.paymentId === paymentId) ?? recipients[0];

  async function send() {
    if (!selected) return;
    if (!body.trim()) {
      toast("Please write your message first.", "warning");
      return;
    }
    setSending(true);
    const ok = await onSend(selected.paymentId, subject.trim() || "Thank you", body.trim());
    setSending(false);
    if (ok) {
      setSubject("");
      setBody("");
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compose Thank-You"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button loading={sending} variant="primary" onClick={() => void send()} disabled={sending || !selected}>
            {sending ? "Sending…" : "Send message"}
          </Button>
        </>
      }
    >
      {recipients.length === 0 ? (
        <p className="text-body text-navy/80">
          You can send a thank-you note once a sponsor has contributed to one of your bills.
        </p>
      ) : (
        <div className="space-y-4">
          <Select
            label="To"
            value={selected?.paymentId ?? ""}
            onChange={(e) => setPaymentId(e.target.value)}
            options={recipients.map((r) => ({ value: r.paymentId, label: r.label }))}
          />
          {selected?.anonymous && (
            <Badge tone="navy" icon={<ShieldIcon size={12} />}>Via Admin — anonymity preserved</Badge>
          )}

          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 160))}
            placeholder="Subject (optional)"
            aria-label="Subject"
            className="w-full rounded-input border-[1.5px] border-inputborder bg-white px-4 py-2.5 text-body text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />

          <div className="rounded-input border-[1.5px] border-inputborder bg-white">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, CHAR_LIMIT))}
              placeholder="Write your heartfelt thanks…"
              aria-label="Message"
              rows={7}
              className="w-full resize-y bg-transparent px-4 py-3 text-body text-navy focus:outline-none"
            />
            <div className="flex justify-end px-4 pb-2 text-label text-muted">
              {body.length}/{CHAR_LIMIT}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function MessagesView({ perspective }: { perspective: "student" | "sponsor" }) {
  const { data, error, loading, reload, setData } = useApi(() => messagesApi.list());
  // Students address thank-yous by gift, so they need their received payments.
  const { data: payments } = useApi(
    () => (perspective === "student" ? studentApi.payments() : Promise.resolve([] as Contribution[])),
    [perspective]
  );
  const recipients = useMemo(() => toRecipients(payments ?? []), [payments]);

  const msgs = useMemo(() => data ?? [], [data]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const { toast } = useToast();

  const active = msgs.find((m) => m.id === activeId) ?? msgs[0] ?? null;

  function openMessage(id: string) {
    setActiveId(id);
    const m = msgs.find((x) => x.id === id);
    if (m && !m.read) {
      setData((list) => list && list.map((x) => (x.id === id ? { ...x, read: true } : x)));
      messagesApi.markRead(id).catch(() => undefined);
    }
  }

  async function sendThankYou(paymentId: string, subject: string, body: string) {
    try {
      const msg = await messagesApi.send({ paymentId, subject, body });
      setData((list) => [msg, ...(list ?? [])]);
      setActiveId(msg.id);
      toast("Thank-you message sent. Your sponsor will be notified by email.", "success");
      return true;
    } catch (err) {
      toast(apiErrorMessage(err, "Your message could not be sent."), "error");
      return false;
    }
  }

  async function sendReply() {
    if (!active || !reply.trim()) return;
    setReplying(true);
    try {
      const updated = await messagesApi.reply(active.id, reply.trim());
      setData((list) => list && list.map((m) => (m.id === updated.id ? updated : m)));
      setReply("");
      toast("Reply sent.", "success");
    } catch (err) {
      toast(apiErrorMessage(err, "Your reply could not be sent."), "error");
    } finally {
      setReplying(false);
    }
  }

  const composer = (
    <Composer
      open={composerOpen}
      onClose={() => setComposerOpen(false)}
      onSend={sendThankYou}
      recipients={recipients}
    />
  );

  if (loading) {
    return <div className="h-96 animate-pulse rounded-card bg-white/60 shadow-card" />;
  }
  if (error) {
    return (
      <EmptyState
        icon={<MessageIcon size={28} />}
        title="Couldn't load messages"
        description={error}
        action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
      />
    );
  }

  if (msgs.length === 0) {
    return (
      <>
        <EmptyState
          icon={<MessageIcon size={28} />}
          title="No messages yet"
          description={
            perspective === "student"
              ? "Send a thank-you note to a sponsor who has supported you."
              : "Messages from students you've sponsored will appear here."
          }
          action={
            perspective === "student" ? (
              <Button onClick={() => setComposerOpen(true)}><PlusIcon size={16} /> Compose Thank-You</Button>
            ) : undefined
          }
        />
        {composer}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Thread list */}
        <div className="rounded-card bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-inputborder/40 p-4">
            <h2 className="font-display text-h3 text-navy">
              {perspective === "student" ? "Thank-You Notes" : "Messages"}
            </h2>
            {perspective === "student" && (
              <Button variant="primary" size="sm" onClick={() => setComposerOpen(true)}>
                <PlusIcon size={14} /> New
              </Button>
            )}
          </div>
          <div className="max-h-[70vh] divide-y divide-inputborder/40 overflow-y-auto">
            {msgs.map((m) => {
              const who = perspective === "student" ? m.sponsorName : m.studentName;
              const photo = perspective === "student" ? undefined : m.studentPhoto;
              return (
                <button
                  key={m.id}
                  onClick={() => openMessage(m.id)}
                  className={cn(
                    "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-warm/50",
                    active?.id === m.id && "bg-gold/8"
                  )}
                >
                  <Avatar name={who} src={photo} anonymous={m.anonymousDonor && perspective === "student"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-caption font-semibold text-navy">{who}</p>
                      {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-label="Unread" />}
                    </div>
                    <p className="truncate text-caption text-navy/80">{m.subject}</p>
                    <p className="truncate text-label text-muted">{m.body}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread view */}
        <div className="rounded-card bg-white shadow-card">
          {active ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-inputborder/40 p-6">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={perspective === "student" ? active.sponsorName : active.studentName}
                    src={perspective === "student" ? undefined : active.studentPhoto}
                    anonymous={active.anonymousDonor && perspective === "student"}
                    size="md"
                  />
                  <div>
                    <h3 className="font-display text-h3 text-navy">{active.subject}</h3>
                    <p className="text-caption text-muted">
                      {perspective === "student" ? "To " : "From "}
                      {perspective === "student" ? active.sponsorName : active.studentName} · {formatDate(active.date)}
                    </p>
                  </div>
                </div>
                {active.anonymousDonor && (
                  <div className="mt-3 flex items-center gap-2 rounded-input bg-navy/5 p-3 text-caption text-muted">
                    <ShieldIcon size={16} className="text-navy" />
                    This donor gave anonymously. Messages are relayed through the platform admin, preserving anonymity in both directions.
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                <div className="rounded-card bg-warm/50 p-4">
                  <p className="whitespace-pre-line text-body text-navy">{active.body}</p>
                  {active.photoAttachment && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(active.photoAttachment)}
                      alt="Photo attached to this message"
                      className="mt-3 max-h-72 rounded-input object-contain"
                    />
                  )}
                </div>
                {active.replies.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      "max-w-[85%] rounded-card p-4",
                      r.from === "sponsor" ? "ml-auto bg-accent/10" : "bg-gold/10"
                    )}
                  >
                    <p className="mb-1 text-label font-semibold text-muted">
                      {r.from === "sponsor" ? "Sponsor" : "Student"} · {formatDate(r.date)}
                    </p>
                    <p className="whitespace-pre-line text-body text-navy">{r.body}</p>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <div className="border-t border-inputborder/40 p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value.slice(0, CHAR_LIMIT))}
                    placeholder={perspective === "sponsor" ? "Write a reply (optional)…" : "Continue the conversation…"}
                    aria-label="Reply"
                    rows={2}
                    className="flex-1 resize-none rounded-input border-[1.5px] border-inputborder bg-white px-4 py-2.5 text-body text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                  />
                  <Button loading={replying} variant="primary" onClick={() => void sendReply()} disabled={replying || !reply.trim()}>
                    {replying ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-12 text-muted">
              Select a message to read
            </div>
          )}
        </div>
      </div>

      {composer}
    </>
  );
}
