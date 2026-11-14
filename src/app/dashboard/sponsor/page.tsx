"use client";

import Link from "next/link";
import { StatTile, SectionHeader, PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PaymentHistoryTable, type PaymentRow } from "@/components/domain/PaymentHistoryTable";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  WalletIcon,
  UsersIcon,
  RepeatIcon,
  HeartHandIcon,
  DownloadIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { sponsorApi } from "@/lib/sponsor-api";
import { useApi } from "@/lib/use-api";
import { formatCurrency, pct } from "@/lib/format";

export default function SponsorDashboardPage() {
  const { data, error, loading, reload } = useApi(() => sponsorApi.dashboard());
  // Full giving history for the table (the dashboard only carries the latest 5).
  const { data: history, loading: historyLoading } = useApi(() => sponsorApi.payments());

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-card bg-white/60 shadow-card" />
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

  const { sponsor, kpis, myStudents } = data;
  const rows: PaymentRow[] = (history?.data ?? data.recentPayments).map((p) => ({ ...p }));
  const firstName = sponsor.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        subtitle="Your generosity in one place — see your impact, revisit students, and manage giving."
      />

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Given" value={kpis.totalGiven} prefix="$" compact icon={<WalletIcon size={18} />} tone="gold" />
        <StatTile label="Students Sponsored" value={kpis.studentsSponsored} icon={<UsersIcon size={18} />} tone="accent" />
        <StatTile label="Active Recurring" value={kpis.activeRecurring} icon={<RepeatIcon size={18} />} tone="success" />
        <StatTile label="Monthly Commitment" value={kpis.monthlyCommitment} prefix="$" icon={<HeartHandIcon size={18} />} tone="navy" hint={`≈ ${formatCurrency(kpis.monthlyCommitment * 12)} / year`} />
      </div>

      {/* Impact snapshot */}
      <div className="mb-8 overflow-hidden rounded-card bg-navy text-white shadow-card">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-xl">
            <p className="text-caption font-semibold uppercase tracking-wide text-gold-light">Your Impact</p>
            <h2 className="mt-2 font-display text-h2">
              {kpis.studentsSponsored > 0
                ? <>You&apos;ve helped {kpis.studentsSponsored} religious student{kpis.studentsSponsored !== 1 ? "s" : ""} stay in formation.</>
                : <>Your first gift can keep a religious student in formation.</>}
            </h2>
            <p className="mt-2 text-body text-white/70">
              Every gift is traceable to a specific need. Export your full giving history as CSV for your records or tax purposes.
            </p>
          </div>
          {kpis.studentsSponsored > 0 ? (
            <a href="#giving-history" className="shrink-0">
              <Button variant="primary" size="lg">
                <DownloadIcon size={18} /> Export Giving History
              </Button>
            </a>
          ) : (
            <Link href="/students" className="shrink-0">
              <Button variant="primary" size="lg">
                <HeartHandIcon size={18} /> Find a student
              </Button>
            </Link>
          )}
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
        {myStudents.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={28} />}
            title="No students yet"
            description="Students you give to will appear here so you can follow their journey."
            action={<Link href="/students"><Button variant="primary">Browse students</Button></Link>}
          />
        ) : (
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
        )}
      </section>

      {/* Giving History */}
      <section id="giving-history" className="scroll-mt-24">
        <SectionHeader title="Giving History" subtitle="Every gift you've made, fully traceable." />
        {historyLoading ? (
          <div className="h-48 animate-pulse rounded-card bg-white/60 shadow-card" />
        ) : (
          <PaymentHistoryTable rows={rows} perspective="sent" />
        )}
      </section>
    </div>
  );
}
