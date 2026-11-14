"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/store";
import { publicApi } from "@/lib/public-api";

/** Pages that stay reachable while maintenance mode is on. */
const OPEN_PATHS = ["/maintenance", "/signin", "/dashboard/admin", "/dashboard/superadmin"];
const RECHECK_MS = 30_000;

let cached: { on: boolean; at: number } | null = null;

async function maintenanceOn(): Promise<boolean> {
  if (cached && Date.now() - cached.at < RECHECK_MS) return cached.on;
  try {
    const s = await publicApi.settings();
    cached = { on: s.maintenanceMode, at: Date.now() };
  } catch {
    // Backend unreachable: never lock people out on a guess.
    cached = { on: false, at: Date.now() };
  }
  return cached.on;
}

/**
 * Sends visitors, students and sponsors to /maintenance while the Super-Admin
 * has maintenance mode on (the backend refuses their requests anyway). Staff
 * keep working and see a small reminder that the site is offline.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const role = useSession((s) => s.role);
  const staff = role === "admin" || role === "superadmin";
  const [on, setOn] = useState(false);

  useEffect(() => {
    let alive = true;
    void maintenanceOn().then((value) => {
      if (!alive) return;
      setOn(value);
      const open = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
      if (value && !staff && !open) router.replace("/maintenance");
    });
    return () => {
      alive = false;
    };
  }, [pathname, staff, router]);

  return (
    <>
      {children}
      {on && staff && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber px-4 py-2 text-caption font-semibold text-navy shadow-card"
        >
          Maintenance mode is on. The site is offline for everyone except staff.
        </div>
      )}
    </>
  );
}
