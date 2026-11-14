import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge Route Guard:
 * Intercepts incoming requests before components render.
 *
 * The backend sets two cookies on login/refresh (via the same-origin /api proxy):
 *  - `vm_refresh` — the real credential, scoped to /api/auth, so pages never see it.
 *  - `vm_role`    — a session hint scoped to "/", carrying only the role.
 * This guard reads `vm_role`. It is a UX redirect, not a security boundary:
 * every API call is still authorised by the backend with the access token.
 */
const DASHBOARD_ROLES = ["student", "sponsor", "admin", "superadmin"] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("vm_role")?.value || null;

  // 1. Guard all dashboard routes: redirect unauthenticated users to /signin
  if (pathname.startsWith("/dashboard") && !role) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (!role) return NextResponse.next();

  // An unknown value would otherwise produce /dashboard/<garbage> redirect loops.
  const home = (DASHBOARD_ROLES as readonly string[]).includes(role)
    ? `/dashboard/${role}`
    : "/signin";

  // 2. Role-specific protection
  if (pathname.startsWith("/dashboard/student") && role !== "student") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (pathname.startsWith("/dashboard/sponsor") && role !== "sponsor") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Admin area (accessible by admin and superadmin)
  if (pathname.startsWith("/dashboard/admin") && role !== "admin" && role !== "superadmin") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Super Admin area (strictly superadmin)
  if (pathname.startsWith("/dashboard/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
