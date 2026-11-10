/**
 * Platform-wide configuration constants — single source of truth.
 *
 * These values are surfaced in several places (Terms of Service, the Super
 * Admin commission page, the student registration consent copy) and, once a
 * backend exists, should be served from it. Keeping them here keeps every
 * mention of the commission rate in agreement. See ARCHITECTURE.md §7.3.
 */

/**
 * Fixed platform commission: the percentage deducted from every gift to fund
 * app maintenance and operations. Disclosed in the Terms of Service that
 * students must agree to at sign-up. Only a Super Admin may change this.
 */
export const PLATFORM_COMMISSION_PCT = 10;

/**
 * Demo-only credential used to simulate Super Admin routing on the frontend.
 *
 * The login UI shows a single "Admin" tab; typing this email there routes to
 * the Super Admin dashboard. In production the backend recognises the tier
 * from the authenticated account and returns it in the login response — the
 * frontend must not hard-code who is a Super Admin. See ARCHITECTURE.md §7.1.
 */
export const SUPERADMIN_DEMO_EMAIL = "superadmin@vocation.org";
