"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell role="admin" userName="Sister Perpetua (Admin)">
      {children}
    </DashboardShell>
  );
}
