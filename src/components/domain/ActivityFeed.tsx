"use client";

import { Avatar } from "@/components/ui/Avatar";
import { AUDIT_LABELS, type AuditEntry } from "@/lib/superadmin-api";
import { formatDate, formatRelative } from "@/lib/format";

/** Staff audit log entries: "<actor> <action> <target>" + reason + time. */
export function ActivityFeed({ entries, empty }: { entries: AuditEntry[]; empty?: string }) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-caption text-muted">{empty ?? "No staff activity yet."}</p>;
  }
  return (
    <ul className="divide-y divide-inputborder/40">
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-3 py-3">
          <Avatar name={e.actorName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-caption text-navy">
              <span className="font-semibold">{e.actorName}</span> {AUDIT_LABELS[e.action] ?? e.action.toLowerCase()}
              {e.targetName && <span className="font-semibold"> {e.targetName}</span>}
            </p>
            {e.reason && <p className="mt-0.5 line-clamp-2 text-label text-muted">“{e.reason}”</p>}
          </div>
          <time dateTime={e.createdAt} title={formatDate(e.createdAt)} className="shrink-0 text-label text-muted">
            {formatRelative(e.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
