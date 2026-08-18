"use client";

import Link from "next/link";
import Image from "next/image";
import { StatTile, SectionHeader } from "@/components/dashboard/widgets";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import {
  WalletIcon,
  UsersIcon,
  MessageIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "@/components/ui/icons";
import { currentStudent, messages, receivedPayments } from "@/lib/mock-data";
import { formatCurrency, formatDate, pct } from "@/lib/format";

export default function StudentDashboard() {
  const student = currentStudent;
  const totalNeeded = student.bills.reduce((s, b) => s + b.total, 0);
  const totalRaised = student.bills.reduce((s, b) => s + b.raised, 0);
  const overviewPct = pct(totalRaised, totalNeeded);

  const pendingBills = student.bills
    .filter((b) => b.status !== "Fully Funded" && b.status !== "Archived")
    .sort((a, b) => pct(a.raised, a.total) - pct(b.raised, b.total));

  const recent = receivedPayments.slice(0, 5);
  const unread = messages.filter((m) => !m.read).length;
  const anonSponsors = 4;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome Banner */}
      <Card className="overflow-hidden">
        <div className="relative bg-navy">
          <div className="absolute inset-0 opacity-20">
            <Image src={student.photo} alt="" fill sizes="100vw" className="object-cover" />
          </div>
          <div className="relative flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center">
            <Avatar name={student.name} src={student.photo} size="xl" ring />
            <div className="flex-1">
              <p className="text-caption uppercase tracking-widest text-gold">Welcome back</p>
              <h1 className="font-display text-h1 text-white">{student.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="gold">{student.formationStage}</Badge>
                <span className="text-caption text-cream/80">{student.congregation}</span>
                <span className="text-cream/40">·</span>
                <span className="text-caption text-cream/80">{student.school}</span>
              </div>
            </div>
            <div className="w-full border-t border-white/15 pt-4 sm:w-auto sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <p className="text-caption text-cream/70">Total received</p>
              <p className="font-display text-h1 text-gold">
                <CountUp value={totalRaised} prefix="$" />
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Total Funds Received"
          value={totalRaised}
          prefix="$"
          icon={<WalletIcon size={18} />}
          tone="success"
          hint="Across all bills, to date"
        />
        <StatTile
          label="Active Sponsors"
          value={student.sponsorCount}
          icon={<UsersIcon size={18} />}
          tone="accent"
          hint={`Including ${anonSponsors} anonymous`}
        />
        <StatTile
          label="Unread Messages"
          value={unread}
          icon={<MessageIcon size={18} />}
          tone="gold"
          animate={false}
          hint="Thank-you drafts & replies"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bills Overview donut */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center p-6">
            <SectionHeader title="Bills Overview" />
            <ProgressRing
              value={overviewPct}
              size={160}
              stroke={16}
              label={`${overviewPct}%`}
              sublabel="funded"
            />
            <div className="mt-5 grid w-full grid-cols-2 gap-3 text-center">
              <div className="rounded-input bg-warm/60 p-3">
                <p className="text-caption text-muted">Needed</p>
                <p className="font-display text-h3 text-navy">{formatCurrency(totalNeeded)}</p>
              </div>
              <div className="rounded-input bg-success-soft p-3">
                <p className="text-caption text-muted">Raised</p>
                <p className="font-display text-h3 text-success">{formatCurrency(totalRaised)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Bills */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <SectionHeader
              title="Pending Bills"
              subtitle="Sorted by urgency"
              action={
                <Link href="/dashboard/student/bills">
                  <Button variant="ghost" size="sm">View all <ArrowRightIcon size={14} /></Button>
                </Link>
              }
            />
            <div className="space-y-4">
              {pendingBills.map((bill) => {
                const p = pct(bill.raised, bill.total);
                return (
                  <div key={bill.id}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-caption font-semibold text-navy">{bill.name}</span>
                        {bill.status === "Overdue" && <Badge tone="alert">Overdue</Badge>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-label text-muted">
                        <CalendarIcon size={12} /> {formatDate(bill.dueDate)}
                      </span>
                    </div>
                    <ProgressBar value={p} height="sm" />
                    <div className="mt-1 flex justify-between text-label text-muted">
                      <span>{formatCurrency(bill.raised)} of {formatCurrency(bill.total)}</span>
                      <span>{p}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Payments */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <SectionHeader
              title="Recent Payments"
              action={
                <Link href="/dashboard/student/payments">
                  <Button variant="ghost" size="sm">Payment history <ArrowRightIcon size={14} /></Button>
                </Link>
              }
            />
            <div className="divide-y divide-inputborder/40">
              {recent.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3">
                  <Avatar name={p.donorName} anonymous={p.anonymous} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption font-semibold text-navy">{p.donorName}</p>
                    <p className="text-label text-muted">{formatDate(p.date)}</p>
                  </div>
                  <span className="font-semibold text-success">+{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Profile Completion + Active Sponsors */}
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col items-center p-6">
              <SectionHeader title="Profile" />
              <ProgressRing
                value={student.profileCompletion}
                size={120}
                label={`${student.profileCompletion}%`}
                sublabel="complete"
                color="#1A3A6B"
              />
              {student.profileCompletion < 100 && (
                <div className="mt-4 w-full rounded-input bg-warm/60 p-3 text-caption text-muted">
                  <p className="font-semibold text-navy">What&apos;s missing:</p>
                  <ul className="mt-1 list-inside list-disc">
                    <li>Add a recent photo update</li>
                    <li>Complete your biography</li>
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <SectionHeader title="Active Sponsors" />
              <AvatarStack
                items={[
                  { name: "Mrs. Onyeka A." },
                  { anonymous: true },
                  { name: "Mr. Chukwuma O." },
                  { name: "Grace Foundation" },
                  { anonymous: true },
                ]}
                extra={student.sponsorCount - 5}
                size="md"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
