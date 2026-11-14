"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Name and photo come from the signed-in session.
  return <DashboardShell role="student">{children}</DashboardShell>;
}
