"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { sponsor } from "@/lib/mock-data";

export default function SponsorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell role="sponsor" userName={sponsor.name}>
      {children}
    </DashboardShell>
  );
}
