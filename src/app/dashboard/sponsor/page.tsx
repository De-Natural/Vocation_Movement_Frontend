"use client";

import Link from "next/link";
import { StatTile, SectionHeader, PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PaymentHistoryTable, type PaymentRow } from "@/components/domain/PaymentHistoryTable";
import { useToast } from "@/components/ui/Toast";
import {
  WalletIcon,
  UsersIcon,
  RepeatIcon,
  HeartHandIcon,
  DownloadIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { sponsor, sentPayments, students, recurringSponsorships } from "@/lib/mock-data";
import { formatCurrency, pct } from "@/lib/format";

// Students this sponsor has given to (derive from recurring + sent history).
const sponsoredIds = Array.from(
  new Set([
    ...recurringSponsorships.map((r) => r.studentId),
    ...sentPayments.map((p) => p.billId.split("-b")[0]),
  ])
);
const myStudents = sponsoredIds
  .map((id) => students.find((s) => s.id === id))
  .filter((s): s is (typeof students)[number] => Boolean(s));

export default function SponsorDashboardPage() {
  const { toast } = useToast();

  const rows: PaymentRow[] = sentPayments.map((p) => ({ ...p }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title={`Welcome back, ${sponsor.name.split(" ")[0]}`}
        subtitle="Your generosity in one place — see your impact, revisit students, and manage giving."
      />

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Given" value={sponsor.totalGiven} prefix="$" compact icon={<WalletIcon size={18} />} tone="gold" />
        <StatTile label="Students Sponsored" value={sponsor.studentsSponsored} icon={<UsersIcon size={18} />} tone="accent" />
        <StatTile label="Active Recurring" value={sponsor.activeRecurring} icon={<RepeatIcon size={18} />} tone="success" />
        <StatTile label="Monthly Commitment" value={sponsor.monthlyCommitment} prefix="$" icon={<HeartHandIcon size={18} />} tone="navy" hint={`≈ ${formatCurrency(sponsor.monthlyCommitment * 12)} / year`} />
      </div>

      {/* Impact snapshot */}
      <div className="mb-8 overflow-hidden rounded-card bg-navy text-white shadow-card">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-xl">
            <p className="text-caption font-semibold uppercase tracking-wide text-gold-light">Your Impact</p>
            <h2 className="mt-2 font-display text-h2">
              You&apos;ve helped {sponsor.studentsSponsored} religious students stay in formation.
            </h2>
            <p className="mt-2 text-body text-white/70">
              Every gift is traceable to a specific need. Download a personalized impact report for your records or tax purposes.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="shrink-0"
            onClick={() => toast("Your impact report (PDF) is being generated and will download shortly.", "success")}
          >
            <DownloadIcon size={18} /> Download Impact Report
          </Button>
        </div>
      </div>

      {/* My Students */}
      <section className="mb-10">
        <SectionHeader
          title="My Students"
          subtitle="The seminarians and novices you're walking with."
          action={
            <Link href="/students">
              <Button variant="secondary" size="sm">
                Find more <ArrowRightIcon size={15} />
              </Button>
            </Link>
          }
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myStudents.map((s) => {
            const active = s.bills.filter((b) => b.status !== "Archived");
            const raised = active.reduce((sum, b) => sum + b.raised, 0);
            const total = active.reduce((sum, b) => sum + b.total, 0);
            const p = pct(raised, total);
            return (
              <div key={s.id} className="flex flex-col rounded-card bg-white p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} src={s.photo} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-h3 text-navy">{s.name}</p>
                    <Badge tone="gold">{s.formationStage}</Badge>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-caption text-muted">{s.congregation}</p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-caption">
                    <span className="text-muted">Overall funded</span>
                    <span className="font-semibold text-navy">{p}%</span>
                  </div>
                  <ProgressBar value={p} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/students/${s.slug}`} className="flex-1">
                    <Button variant="primary" size="sm" fullWidth>
                      <HeartHandIcon size={15} /> Give Again
                    </Button>
                  </Link>
                  <Link href={`/students/${s.slug}`}>
                    <Button variant="ghost" size="sm" aria-label={`View ${s.name}'s profile`}>
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Giving History */}
      <section>
        <SectionHeader title="Giving History" subtitle="Every gift you've made, fully traceable." />
        <PaymentHistoryTable rows={rows} perspective="sent" />
      </section>
    </div>
  );
}
