"use client";

import Link from "next/link";
import { StatTile, PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityFeed } from "@/components/domain/ActivityFeed";
import { ArrowRightIcon, ShieldIcon, UsersIcon, WalletIcon, HeartHandIcon, ChartIcon } from "@/components/ui/icons";
import { superAdminApi } from "@/lib/superadmin-api";
import { useApi } from "@/lib/use-api";

export default function SuperAdminOverviewPage() {
  const { data, error, loading, reload } = useApi(() => superAdminApi.overview());

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-card bg-white/60 shadow-card" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-card bg-white/60 shadow-card" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <EmptyState
        icon={<ShieldIcon size={28} />}
        title="Couldn't load the platform overview"
        description={error ?? "Please try again."}
        action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
      />
    );
  }

  const { counts, verification } = data;
  const pending = verification["Pending Verification"] ?? 0;
  const staff = counts.admins + counts.superAdmins;

  const breakdown: { label: string; value: number; tone: "success" | "gold" | "alert" | "neutral" }[] = [
    { label: "Verified", value: verification["Verified"] ?? 0, tone: "success" },
    { label: "Pending", value: pending, tone: "gold" },
    { label: "Rejected", value: verification["Rejected"] ?? 0, tone: "alert" },
    { label: "Suspended", value: verification["Suspended"] ?? 0, tone: "neutral" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Super-Admin Overview"
        subtitle="Everything happening on the platform — staff, students, sponsors and money — in one place."
      />

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Staff"
          value={staff}
          icon={<ShieldIcon size={18} />}
          tone="navy"
          hint={`${counts.admins} admin${counts.admins !== 1 ? "s" : ""}${counts.suspendedAdmins ? ` · ${counts.suspendedAdmins} suspended` : ""}`}
        />
        <StatTile
          label="Students"
          value={counts.students}
          icon={<UsersIcon size={18} />}
          tone="accent"
          hint={pending ? `${pending} awaiting review` : "None awaiting review"}
        />
        <StatTile
          label="Sponsors"
          value={counts.sponsors}
          icon={<HeartHandIcon size={18} />}
          tone="success"
          hint={counts.suspendedSponsors ? `${counts.suspendedSponsors} suspended` : undefined}
        />
        <StatTile label="Funds Raised" value={data.fundsRaised} prefix="₦" compact icon={<WalletIcon size={18} />} tone="gold" />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Student verification breakdown */}
        <section className="rounded-card bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-h3 text-navy">Student Profiles</h2>
            <Badge tone={pending ? "gold" : "success"}>{pending} pending</Badge>
          </div>
          <ul className="space-y-3">
            {breakdown.map((b) => (
              <li key={b.label} className="flex items-center justify-between text-caption">
                <span className="text-muted">{b.label}</span>
                <Badge tone={b.tone}>{b.value}</Badge>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/superadmin/verifications" className="mt-5 block">
            <Button variant="secondary" size="sm" fullWidth>
              Review queue <ArrowRightIcon size={15} />
            </Button>
          </Link>
        </section>

        {/* Recent staff activity */}
        <section className="rounded-card bg-white p-6 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-h3 text-navy">Recent Staff Activity</h2>
            <Badge tone="navy">{data.staffActionsLast30Days} in 30 days</Badge>
          </div>
          <ActivityFeed entries={data.recentActivity} />
          <Link href="/dashboard/superadmin/activity" className="mt-4 block">
            <Button variant="secondary" size="sm" fullWidth>
              Full activity log <ArrowRightIcon size={15} />
            </Button>
          </Link>
        </section>
      </div>

      {/* Oversight shortcuts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/dashboard/superadmin/admins", icon: <ShieldIcon size={22} />, title: "Manage Admins", desc: "Create, suspend or delete admin accounts." },
          { href: "/dashboard/superadmin/users", icon: <UsersIcon size={22} />, title: "Users", desc: "Every student and sponsor account." },
          { href: "/dashboard/superadmin/activity", icon: <ChartIcon size={22} />, title: "Activity Log", desc: "Who did what, and why." },
          { href: "/dashboard/superadmin/commission", icon: <WalletIcon size={22} />, title: "Commission", desc: "The platform fee on every gift." },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="group rounded-card bg-white p-5 shadow-card transition-shadow hover:shadow-cardhover">
            <span className="flex h-11 w-11 items-center justify-center rounded-input bg-gold/12 text-gold-dark">{c.icon}</span>
            <h3 className="mt-3 font-display text-h3 text-navy">{c.title}</h3>
            <p className="mt-1 text-caption text-muted">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
