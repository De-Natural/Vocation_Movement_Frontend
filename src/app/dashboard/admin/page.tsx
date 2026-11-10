"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatTile, SectionHeader, PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  UsersIcon,
  ShieldIcon,
  WalletIcon,
  FileIcon,
  MessageIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { students, platformStats } from "@/lib/mock-data";
import { useInquiries } from "@/lib/inquiries-store";
import { formatCurrency, formatDate, formatRelative } from "@/lib/format";

const pending = students.filter((s) => s.verification === "Pending Verification");
const overdueBills = students.flatMap((s) =>
  s.bills.filter((b) => b.status === "Overdue").map((b) => ({ student: s, bill: b }))
);

export default function AdminOverviewPage() {
  const inquiries = useInquiries((s) => s.inquiries);

  // Persisted store hydrates client-side only — gate counts until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const unreadInquiries = mounted ? inquiries.filter((i) => !i.read).length : 0;
  const recentInquiries = mounted ? inquiries.slice(0, 3) : [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Platform Overview"
        subtitle="Monitor students, verify profiles, and keep every transaction transparent."
      />

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Students" value={platformStats.studentsSupported} icon={<UsersIcon size={18} />} tone="accent" />
        <StatTile label="Pending Verification" value={pending.length} icon={<ShieldIcon size={18} />} tone="alert" hint="Awaiting review" />
        <StatTile label="Funds Raised" value={platformStats.fundsRaised} prefix="$" compact icon={<WalletIcon size={18} />} tone="gold" />
        <StatTile label="Unread Inquiries" value={unreadInquiries} icon={<MessageIcon size={18} />} tone="navy" hint="From the contact form" />
      </div>

      {/* Needs attention */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Verification queue preview */}
        <div className="rounded-card bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-h3 text-navy">Verification Queue</h2>
            <Badge tone={pending.length ? "alert" : "success"}>{pending.length} pending</Badge>
          </div>
          {pending.length === 0 ? (
            <p className="py-6 text-center text-caption text-muted">All caught up — no profiles awaiting review.</p>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <Avatar name={s.name} src={s.photo} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption font-semibold text-navy">{s.name}</p>
                    <p className="truncate text-label text-muted">{s.congregation}</p>
                  </div>
                  <span className="text-label text-muted">{formatDate(s.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/admin/verifications" className="mt-4 block">
            <Button variant="secondary" size="sm" fullWidth>
              Review queue <ArrowRightIcon size={15} />
            </Button>
          </Link>
        </div>

        {/* Overdue bills */}
        <div className="rounded-card bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-h3 text-navy">Overdue Bills</h2>
            <Badge tone={overdueBills.length ? "amber" : "success"}>{overdueBills.length} overdue</Badge>
          </div>
          {overdueBills.length === 0 ? (
            <p className="py-6 text-center text-caption text-muted">No overdue bills across the platform.</p>
          ) : (
            <div className="space-y-3">
              {overdueBills.slice(0, 3).map(({ student, bill }) => (
                <div key={bill.id} className="flex items-center gap-3">
                  <Avatar name={student.name} src={student.photo} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption font-semibold text-navy">{bill.name}</p>
                    <p className="truncate text-label text-muted">{student.name} · due {formatDate(bill.dueDate)}</p>
                  </div>
                  <span className="shrink-0 text-caption font-semibold text-alert">
                    {formatCurrency(Math.max(0, bill.total - bill.raised))}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/admin/transactions" className="mt-4 block">
            <Button variant="secondary" size="sm" fullWidth>
              View transactions <ArrowRightIcon size={15} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Recent contact inquiries */}
      <section className="mb-8 rounded-card bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-h3 text-navy">Recent Inquiries</h2>
          <Badge tone={unreadInquiries ? "gold" : "success"}>
            {unreadInquiries} unread
          </Badge>
        </div>
        {recentInquiries.length === 0 ? (
          <p className="py-6 text-center text-caption text-muted">
            No contact messages yet — submissions from the public contact form will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {recentInquiries.map((inq) => (
              <div key={inq.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/12 text-gold-dark">
                  <MessageIcon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-caption font-semibold text-navy">
                    {inq.name}
                    {!inq.read && <span className="ml-2 align-middle text-label font-normal text-gold-dark">• new</span>}
                  </p>
                  <p className="truncate text-label text-muted">{inq.message}</p>
                </div>
                <span className="shrink-0 text-label text-muted">{formatRelative(inq.date)}</span>
              </div>
            ))}
          </div>
        )}
        <Link href="/dashboard/admin/inquiries" className="mt-4 block">
          <Button variant="secondary" size="sm" fullWidth>
            View all inquiries <ArrowRightIcon size={15} />
          </Button>
        </Link>
      </section>

      {/* Quick links */}
      <SectionHeader title="Administration" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/dashboard/admin/verifications", icon: <ShieldIcon size={22} />, title: "Verifications", desc: "Approve, reject, or request more info." },
          { href: "/dashboard/admin/transactions", icon: <WalletIcon size={22} />, title: "Transactions", desc: "Full, filterable payment feed." },
          { href: "/dashboard/admin/reports", icon: <FileIcon size={22} />, title: "Reports", desc: "Congregation & platform reports." },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="group rounded-card bg-white p-6 shadow-card transition-shadow hover:shadow-cardhover">
            <span className="flex h-11 w-11 items-center justify-center rounded-input bg-gold/12 text-gold-dark">{c.icon}</span>
            <h3 className="mt-3 font-display text-h3 text-navy">{c.title}</h3>
            <p className="mt-1 text-caption text-muted">{c.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-accent group-hover:gap-2 transition-all">
              Open <ArrowRightIcon size={14} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
