"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { publicApi } from "@/lib/public-api";
import { useToast } from "@/components/ui/Toast";

/** Pages that stay reachable while maintenance mode is on (sign-in: the Super-Admin needs it). */
const OPEN_PATHS = ["/maintenance", "/signin"];
/** How often an open tab re-checks, so people already on the site are moved off it too. */
const RECHECK_MS = 20_000;

/**
 * While the Super-Admin has maintenance mode on, everyone else (visitors,
 * students, sponsors and admins) is signed out and sent to /maintenance.
 * Checks on every page change, every 20 s and whenever the tab regains focus,
 * so someone sitting on a page is moved off it within seconds. The backend
 * refuses their requests and has already ended their sessions; this makes the
 * browser follow. The Super-Admin keeps working with a reminder banner.
 */
export function MaintenanceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const role = useSession((s) => s.role);
  const clearSession = useSession((s) => s.clearSession);
  // Wait for the session to load, so a Super-Admin is never bounced on page load.
  const ready = useSession((s) => s.isInitialized);
  const superAdmin = role === "superadmin";
  const [on, setOn] = useState(false);
  const { toast } = useToast();
  const signingOut = useRef(false);

  const check = useCallback(async () => {
    let value: boolean;
    try {
      value = (await publicApi.settings()).maintenanceMode;
    } catch {
      return; // Backend unreachable: never lock people out on a guess.
    }
    setOn(value);
    if (!value || superAdmin || !ready) return;

    // Signed in (student, sponsor or admin): end the session here too.
    if (role && !signingOut.current) {
      signingOut.current = true;
      toast("The site is now under maintenance. You have been signed out.", "info");
      await apiClient.auth.logout().catch(() => undefined); // clears the session cookies
      clearSession();
      signingOut.current = false;
    }
    const open = OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!open) router.replace("/maintenance");
  }, [pathname, role, superAdmin, ready, clearSession, router, toast]);

  useEffect(() => {
    void check();
    const timer = setInterval(() => void check(), RECHECK_MS);
    const onFocus = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [check]);

  return (
    <>
      {children}
      {on && superAdmin && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-amber px-4 py-2 text-caption font-semibold text-navy shadow-card"
        >
          Maintenance mode is on. The site is offline for everyone except you.
        </div>
      )}
    </>
  );
}
