"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Name and photo come from the signed-in session.
  return <DashboardShell role="superadmin">{children}</DashboardShell>;
}
