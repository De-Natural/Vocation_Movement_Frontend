"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  MessageIcon,
  ShieldIcon,
  UploadIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ThankYouMessage } from "@/lib/types";

const CHAR_LIMIT = 1000;

/** Rich-text-ish composer (bold/italic/line breaks) with char limit + photo attach. */
function Composer({
  open,
  onClose,
  onSend,
  recipient,
  anonymous,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => void;
  recipient: string;
  anonymous: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const { toast } = useToast();

  function apply(tag: "b" | "i") {
    const wrap = tag === "b" ? "**" : "_";
    setBody((t) => `${t}${wrap}text${wrap}`);
  }

  function send() {
    if (!body.trim()) {
      toast("Please write your message first.", "warning");
      return;
    }
    onSend(subject || "Thank you", body);
    setSubject("");
    setBody("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compose Thank-You"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={send}>Send message</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-input bg-warm/60 p-3 text-caption">
          <span className="text-muted">To:</span>
          <span className="font-semibold text-navy">{recipient}</span>
          {anonymous && (
            <Badge tone="navy" icon={<ShieldIcon size={12} />}>Via Admin — anonymity preserved</Badge>
          )}
        </div>

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-input border-[1.5px] border-inputborder bg-white px-4 py-2.5 text-body text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        />

        {/* Rich text toolbar */}
        <div className="rounded-input border-[1.5px] border-inputborder bg-white">
          <div className="flex items-center gap-1 border-b border-inputborder/50 p-2">
            <button onClick={() => apply("b")} className="h-8 w-8 rounded font-bold text-navy hover:bg-warm" aria-label="Bold">B</button>
            <button onClick={() => apply("i")} className="h-8 w-8 rounded italic text-navy hover:bg-warm" aria-label="Italic">I</button>
            <div className="mx-1 h-5 w-px bg-inputborder/50" />
            <button className="flex items-center gap-1 rounded px-2 py-1 text-caption text-muted hover:bg-warm" aria-label="Attach photo">
              <UploadIcon size={16} /> Attach photo
            </button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, CHAR_LIMIT))}
            placeholder="Write your heartfelt thanks…"
            rows={7}
            className="w-full resize-y bg-transparent px-4 py-3 text-body text-navy focus:outline-none"
          />
          <div className="flex justify-end px-4 pb-2 text-label text-muted">
            {body.length}/{CHAR_LIMIT}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function MessagesView({
  initialMessages,
  perspective,
}: {
  initialMessages: ThankYouMessage[];
  perspective: "student" | "sponsor";
}) {
  const [msgs, setMsgs] = useState(initialMessages);
  const [activeId, setActiveId] = useState<string | null>(initialMessages[0]?.id ?? null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [reply, setReply] = useState("");
  const { toast } = useToast();

  const active = msgs.find((m) => m.id === activeId) ?? null;

  function openMessage(id: string) {
    setActiveId(id);
    setMsgs((ms) => ms.map((m) => (m.id === id ? { ...m, read: true } : m)));
  }

  function sendThankYou(subject: string, body: string) {
    const newMsg: ThankYouMessage = {
      id: `msg-${msgs.length + 1}`,
      studentId: "stu-1",
      studentName: "Brother Emeka Okonkwo",
      studentPhoto: initialMessages[0]?.studentPhoto ?? "",
      sponsorName: "Mrs. Onyeka A.",
      anonymousDonor: false,
      subject,
      body,
      date: "2026-08-18",
      read: true,
      replies: [],
    };
    setMsgs((ms) => [newMsg, ...ms]);
    setActiveId(newMsg.id);
    toast("Thank-you message sent. Your sponsor will be notified by email.", "success");
  }

  function sendReply() {
    if (!active || !reply.trim()) return;
    setMsgs((ms) =>
      ms.map((m) =>
        m.id === active.id
          ? {
              ...m,
              replies: [
                ...m.replies,
                { id: `r-${Date.now()}`, from: perspective === "student" ? "student" : "sponsor", body: reply, date: "2026-08-18" },
              ],
            }
          : m
      )
    );
    setReply("");
    toast("Reply sent.", "success");
  }

  if (msgs.length === 0) {
    return (
      <EmptyState
        icon={<MessageIcon size={28} />}
        title="No messages yet"
        description={perspective === "student" ? "Send a thank-you note to a sponsor from your Payment History." : "Messages from students you've sponsored will appear here."}
        action={perspective === "student" ? <Button onClick={() => setComposerOpen(true)}><PlusIcon size={16} /> Compose Thank-You</Button> : undefined}
      />
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
                    activeId === m.id && "bg-gold/8"
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
                    <div className="mt-3 rounded-input bg-white p-2 text-caption text-muted">📎 Photo update attached</div>
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
                    <p className="text-body text-navy">{r.body}</p>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <div className="border-t border-inputborder/40 p-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={perspective === "sponsor" ? "Write a reply (optional)…" : "Continue the conversation…"}
                    rows={2}
                    className="flex-1 resize-none rounded-input border-[1.5px] border-inputborder bg-white px-4 py-2.5 text-body text-navy focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
                  />
                  <Button variant="primary" onClick={sendReply}>Send</Button>
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

      <Composer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSend={sendThankYou}
        recipient="Mrs. Onyeka A."
        anonymous={false}
      />
    </>
  );
}
