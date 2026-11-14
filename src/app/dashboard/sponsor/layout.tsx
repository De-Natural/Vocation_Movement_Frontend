"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function SponsorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Name and photo come from the signed-in session.
  return <DashboardShell role="sponsor">{children}</DashboardShell>;
}
