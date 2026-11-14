"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Name and photo come from the signed-in session.
  return <DashboardShell role="admin">{children}</DashboardShell>;
}
