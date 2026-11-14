"use client";

import { usePathname } from "next/navigation";
import { useSession } from "./store";

/**
 * Base path of the staff dashboard the current page is rendered in. The
 * admin pages are shared with the super-admin dashboard, so their links must
 * stay inside whichever one the user is using.
 */
export function useStaffBase(): "/dashboard/superadmin" | "/dashboard/admin" {
  const pathname = usePathname();
  return pathname?.startsWith("/dashboard/superadmin") ? "/dashboard/superadmin" : "/dashboard/admin";
}

/** True when the signed-in user is the Super-Admin. */
export function useIsSuperAdmin(): boolean {
  return useSession((s) => s.role) === "superadmin";
}
