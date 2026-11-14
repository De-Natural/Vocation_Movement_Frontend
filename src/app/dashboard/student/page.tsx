"use client";

import Link from "next/link";
import { StatTile, SectionHeader } from "@/components/dashboard/widgets";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  WalletIcon,
  UsersIcon,
  MessageIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "@/components/ui/icons";
import { studentApi } from "@/lib/student-api";
import { useApi } from "@/lib/use-api";
import { mediaUrl } from "@/lib/media";
import { formatCurrency, formatDate, pct } from "@/lib/format";
import type { Contribution, Student } from "@/lib/types";

/** Concrete, data-driven suggestions for raising profile completion. */
function missingItems(s: Student): string[] {
  const out: string[] = [];
  if (!s.photo) out.push("Upload a profile photo");
  if (s.biography.trim().length < 100) out.push("Complete your biography (100+ characters)");
  if (!s.location) out.push("Add your location");
  if (!s.yearOfFormation || !s.expectedYear) out.push("Add your formation years");
  if (s.bills.filter((b) => b.status !== "Archived").length === 0) out.push("Add at least one bill");
  return out;
}

/** Distinct recent donors (anonymous gifts stay anonymous). */
function recentSponsors(payments: Contribution[]) {
  const seen = new Set<string>();
  const out: { name?: string; anonymous?: boolean }[] = [];
  for (const p of payments) {
    const key = p.anonymous ? `anon-${p.id}` : p.donorName;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p.anonymous ? { anonymous: true } : { name: p.donorName });
  }
  return out;
}

export default function StudentDashboard() {
  const { data, error, loading, reload } = useApi(() => studentApi.dashboard());

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
        <div className="h-40 animate-pulse rounded-card bg-white/60 shadow-card" />
        <div className="grid gap-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <EmptyState
        icon={<WalletIcon size={28} />}
        title="Couldn't load your dashboard"
        description={error ?? "Please try again."}
        action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
      />
    );
  }

  const { student, kpis, pendingBills, recentPayments } = data;
  const sponsors = recentSponsors(recentPayments);
  const missing = missingItems(student);
  const photo = mediaUrl(student.photo);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {student.verification !== "Verified" && (
        <div role="status" className="rounded-card border border-gold/40 bg-gold/10 p-4 text-caption text-navy">
          <span className="font-semibold">Profile status: {student.verification}.</span>{" "}
          {student.verification === "Pending Verification"
            ? "An administrator is reviewing your profile. Sponsors will see it once it is verified."
            : "Your profile is not visible to sponsors. Check your email for details from the admin team."}
        </div>
      )}

      {/* Welcome Banner */}
      <Card className="overflow-hidden">
        <div className="relative bg-navy">
          {photo && (
            <div className="absolute inset-0 opacity-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </div>
          )}
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
                <CountUp value={kpis.totalRaised} prefix="$" />
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI row */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Total Funds Received"
          value={kpis.totalRaised}
          prefix="$"
          icon={<WalletIcon size={18} />}
          tone="success"
          hint="Across all bills, to date"
        />
        <StatTile
          label="Active Sponsors"
          value={kpis.sponsorCount}
          icon={<UsersIcon size={18} />}
          tone="accent"
          hint={kpis.anonymousSponsors ? `Including ${kpis.anonymousSponsors} anonymous` : undefined}
        />
        <StatTile
          label="Unread Messages"
          value={kpis.unreadMessages}
          icon={<MessageIcon size={18} />}
          tone="gold"
          animate={false}
          hint="Thank-you notes & replies"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bills Overview donut */}
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center p-6">
            <SectionHeader title="Bills Overview" />
            <ProgressRing
              value={kpis.overviewPct}
              size={160}
              stroke={16}
              label={`${kpis.overviewPct}%`}
              sublabel="funded"
            />
            <div className="mt-5 grid w-full grid-cols-2 gap-3 text-center">
              <div className="rounded-input bg-warm/60 p-3">
                <p className="text-caption text-muted">Needed</p>
                <p className="font-display text-h3 text-navy">{formatCurrency(kpis.totalNeeded)}</p>
              </div>
              <div className="rounded-input bg-success-soft p-3">
                <p className="text-caption text-muted">Raised</p>
                <p className="font-display text-h3 text-success">{formatCurrency(kpis.totalRaised)}</p>
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
            {pendingBills.length === 0 ? (
              <p className="py-6 text-center text-caption text-muted">
                No pending bills. <Link href="/dashboard/student/bills" className="font-semibold text-accent hover:underline">Add a bill</Link> to start receiving support.
              </p>
            ) : (
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
            )}
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
            {recentPayments.length === 0 ? (
              <p className="py-6 text-center text-caption text-muted">
                No contributions yet. They will appear here as soon as a sponsor gives.
              </p>
            ) : (
              <div className="divide-y divide-inputborder/40">
                {recentPayments.map((p) => (
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
            )}
          </div>
        </Card>

        {/* Profile Completion + Recent Sponsors */}
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col items-center p-6">
              <SectionHeader title="Profile" />
              <ProgressRing
                value={kpis.profileCompletion}
                size={120}
                label={`${kpis.profileCompletion}%`}
                sublabel="complete"
                color="#1A3A6B"
              />
              {missing.length > 0 && (
                <div className="mt-4 w-full rounded-input bg-warm/60 p-3 text-caption text-muted">
                  <p className="font-semibold text-navy">What&apos;s missing:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {missing.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <SectionHeader title="Recent Sponsors" />
              {sponsors.length === 0 ? (
                <p className="text-caption text-muted">Your sponsors will appear here.</p>
              ) : (
                <AvatarStack
                  items={sponsors.slice(0, 5)}
                  extra={Math.max(0, kpis.sponsorCount - Math.min(5, sponsors.length))}
                  size="md"
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
