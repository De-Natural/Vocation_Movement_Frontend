"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Logo } from "./Navbar";
import { Avatar } from "@/components/ui/Avatar";
import {
  GridIcon,
  WalletIcon,
  MessageIcon,
  ChartIcon,
  HeartHandIcon,
  RepeatIcon,
  ShieldIcon,
  FileIcon,
  SettingsIcon,
  UsersIcon,
  PercentIcon,
  LogOutIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import type { UserRole } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navByRole: Record<UserRole, NavItem[]> = {
  student: [
    { href: "/dashboard/student", label: "Dashboard", icon: <GridIcon size={20} /> },
    { href: "/dashboard/student/bills", label: "Bill Board", icon: <WalletIcon size={20} /> },
    { href: "/dashboard/student/payments", label: "Payments", icon: <ChartIcon size={20} /> },
    { href: "/dashboard/student/messages", label: "Messages", icon: <MessageIcon size={20} /> },
  ],
  sponsor: [
    { href: "/dashboard/sponsor", label: "Dashboard", icon: <GridIcon size={20} /> },
    { href: "/students", label: "Browse", icon: <HeartHandIcon size={20} /> },
    { href: "/dashboard/sponsor/recurring", label: "Recurring", icon: <RepeatIcon size={20} /> },
    { href: "/dashboard/sponsor/messages", label: "Messages", icon: <MessageIcon size={20} /> },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: <GridIcon size={20} /> },
    { href: "/dashboard/admin/verifications", label: "Verifications", icon: <ShieldIcon size={20} /> },
    { href: "/dashboard/admin/transactions", label: "Transactions", icon: <WalletIcon size={20} /> },
    { href: "/dashboard/admin/inquiries", label: "Inquiries", icon: <MessageIcon size={20} /> },
    { href: "/dashboard/admin/reports", label: "Reports", icon: <FileIcon size={20} /> },
    { href: "/dashboard/admin/settings", label: "Settings", icon: <SettingsIcon size={20} /> },
  ],
  // Super Admin: every admin destination plus the SA-only oversight pages
  // (Manage Admins, Users, Activity Log, Commission). Oversight items come
  // first so they survive the mobile bottom-nav cap (items.slice(0, 5)).
  superadmin: [
    { href: "/dashboard/superadmin", label: "Overview", icon: <GridIcon size={20} /> },
    { href: "/dashboard/superadmin/admins", label: "Manage Admins", icon: <ShieldIcon size={20} /> },
    { href: "/dashboard/superadmin/users", label: "Users", icon: <UsersIcon size={20} /> },
    { href: "/dashboard/superadmin/activity", label: "Activity Log", icon: <ChartIcon size={20} /> },
    { href: "/dashboard/superadmin/commission", label: "Commission", icon: <PercentIcon size={20} /> },
    { href: "/dashboard/superadmin/verifications", label: "Verifications", icon: <ShieldIcon size={20} /> },
    { href: "/dashboard/superadmin/transactions", label: "Transactions", icon: <WalletIcon size={20} /> },
    { href: "/dashboard/superadmin/inquiries", label: "Inquiries", icon: <MessageIcon size={20} /> },
    { href: "/dashboard/superadmin/reports", label: "Reports", icon: <FileIcon size={20} /> },
    { href: "/dashboard/superadmin/settings", label: "Settings", icon: <SettingsIcon size={20} /> },
  ],
};

const roleLabels: Record<UserRole, string> = {
  student: "Religious Student",
  sponsor: "Sponsor",
  admin: "Administrator",
  superadmin: "Super Administrator",
};

export function DashboardShell({
  role,
  userName,
  userPhoto,
  children,
}: {
  role: UserRole;
  /** Defaults to the signed-in user's name / photo from the session. */
  userName?: string;
  userPhoto?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useSession((s) => s.clearSession);
  const sessionName = useSession((s) => s.name);
  const sessionPhoto = useSession((s) => s.photo);
  const status = useSession((s) => s.status);
  const setProfile = useSession((s) => s.setProfile);

  // Sign-in doesn't return the photo — load it once from /me.
  useEffect(() => {
    if (status !== "authenticated" || sessionPhoto !== undefined) return;
    apiClient.auth
      .me()
      .then((me) => setProfile({ name: me.name, photo: me.photo ?? null }))
      .catch(() => setProfile({ photo: null }));
  }, [status, sessionPhoto, setProfile]);

  const displayName = userName ?? sessionName ?? "";
  const displayPhoto = userPhoto ?? sessionPhoto ?? undefined;
  const items = navByRole[role];

  // Revoke the refresh token server-side (also clears the vm_refresh/vm_role
  // cookies), then drop the in-memory session even if the call failed.
  async function signOut() {
    try {
      await apiClient.auth.logout();
    } catch {
      // Network/server error: still sign out locally.
    }
    clearSession();
    router.push("/");
  }

  const isActive = (href: string) =>
    pathname === href || (href !== `/dashboard/${role}` && pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-cream">
      {/* Desktop / tablet sidebar (PRD §6) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-inputborder/30 bg-white md:flex lg:w-64">
        <div className="flex h-16 items-center border-b border-inputborder/30 px-6">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-input px-3 py-2.5 text-body font-medium transition-colors",
                isActive(item.href)
                  ? "bg-gold/12 text-gold-dark"
                  : "text-navy/70 hover:bg-warm hover:text-navy"
              )}
            >
              <span className="lg:inline">{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
              <span className="lg:hidden">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-inputborder/30 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={displayName} src={displayPhoto} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-caption font-semibold text-navy">{displayName}</p>
              <p className="truncate text-label text-muted">{roleLabels[role]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-2 rounded-input px-3 py-2 text-caption text-muted transition-colors hover:bg-warm hover:text-alert"
          >
            <LogOutIcon size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-inputborder/30 bg-cream/85 px-4 backdrop-blur-md md:px-8">
          <div className="md:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-caption text-muted sm:inline">{roleLabels[role]}</span>
            <Avatar name={displayName} src={displayPhoto} size="sm" />
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 md:px-8 md:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav (PRD §6 — sidebar becomes bottom nav) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-inputborder/40 bg-white/95 py-2 backdrop-blur-md md:hidden">
        {items.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-input px-3 py-1.5 text-label",
              isActive(item.href) ? "text-gold-dark" : "text-muted"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
