import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge Route Guard:
 * Intercepts incoming requests before components render.
 * Protects dashboard routes by checking for the backend's `vm_refresh` cookie.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve auth cookies
  const refreshToken = request.cookies.get("vm_refresh")?.value;
  const roleCookie = request.cookies.get("vm_role")?.value;

  // Attempt to decode role from JWT payload if cookie is present
  let tokenRole: string | null = roleCookie || null;
  if (!tokenRole && refreshToken) {
    try {
      const parts = refreshToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64").toString("utf-8")
        );
        tokenRole = payload.role || null;
      }
    } catch {
      // In case refreshToken is opaque, tokenRole stays null and client checks /api/auth/me
    }
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");

  // 1. Guard all dashboard routes: redirect unauthenticated users to /signin
  if (isDashboardRoute && !refreshToken) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Role-specific protection (if role is determinable from token/cookie)
  if (tokenRole) {
    // Student area
    if (pathname.startsWith("/dashboard/student") && tokenRole !== "student") {
      return NextResponse.redirect(new URL(`/dashboard/${tokenRole}`, request.url));
    }

    // Sponsor area
    if (pathname.startsWith("/dashboard/sponsor") && tokenRole !== "sponsor") {
      return NextResponse.redirect(new URL(`/dashboard/${tokenRole}`, request.url));
    }

    // Admin area (accessible by admin and superadmin)
    if (
      pathname.startsWith("/dashboard/admin") &&
      tokenRole !== "admin" &&
      tokenRole !== "superadmin"
    ) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // Super Admin area (strictly superadmin)
    if (pathname.startsWith("/dashboard/superadmin") && tokenRole !== "superadmin") {
      return NextResponse.redirect(
        new URL(tokenRole === "admin" ? "/dashboard/admin" : "/signin", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/signin",
    "/register",
  ],
};

