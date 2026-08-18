"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { currentStudent } from "@/lib/mock-data";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell role="student" userName={currentStudent.name} userPhoto={currentStudent.photo}>
      {children}
    </DashboardShell>
  );
}
