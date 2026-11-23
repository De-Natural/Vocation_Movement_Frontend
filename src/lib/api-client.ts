import { useSession } from "./store";
import type { UserRole } from "./types";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

/** Backend error envelope: { success: false, error: { code, message, statusCode, details? } } */
interface ErrorEnvelope {
  success: false;
  error?: { code?: string; message?: string; statusCode?: number; details?: unknown };
  message?: string;
}

export class ApiError extends Error {
  status: number;
  /** Machine-readable backend code, e.g. INVALID_CREDENTIALS, ROLE_MISMATCH. */
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.code = code;
  }
}

function parseError(body: unknown, fallback: string): { message: string; code?: string } {
  if (typeof body === "object" && body !== null) {
    const env = body as ErrorEnvelope;
    const message = env.error?.message || env.message;
    if (message) return { message, code: env.error?.code };
  }
  return { message: fallback };
}

/** Body of POST /api/auth/register (backend registerSchema). */
export interface RegisterPayload {
  email: string;
  password: string;
  role: "student" | "sponsor";
  fullName: string;
  country?: string;
  /** Required for students, with congregation and school. */
  formationStage?: "Seminarian" | "Novice" | "Postulant";
  congregation?: string;
  school?: string;
}

/** Pagination info the backend attaches to list responses (`meta`). */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  /** Return `{ data, meta }` instead of just `data` (for paginated lists). */
  withMeta?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
  /** Return the raw body as a Blob (file downloads: PDF, CSV). */
  blob?: boolean;
}

// Empty by default: requests go to same-origin /api/*, which next.config.mjs
// proxies to the backend (BACKEND_URL). Only set NEXT_PUBLIC_API_URL to bypass
// the proxy and call the API cross-origin.
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Core HTTP client adhering to backend specifications:
 * - credentials: 'include' (automatic vm_refresh cookie transmission)
 * - RS256 Authorization: Bearer <accessToken> in-memory injection
 * - 401 interceptor with silent refresh and request replay queue
 * - Standard { success, data, message } envelope unwrapping
 */
export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, withMeta = false, blob = false, params, headers: customHeaders, ...customConfig } = options;

  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes("?") ? "&" : "?") + qs;
    }
  }

  const headers = new Headers(customHeaders);

  // Set Content-Type to JSON if body is a plain object/string and not FormData
  if (
    customConfig.body &&
    !(customConfig.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Inject in-memory access token
  const token = useSession.getState().accessToken;
  if (token && !skipAuth && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Fetch with credentials included for cookie transmission
  const config: RequestInit = {
    ...customConfig,
    headers,
    credentials: "include",
  };

  try {
    const response = await fetch(url, config);

    // 401 Unauthorized handling & request replay queue
    const isAuthEndpoint =
      endpoint.includes("/api/auth/login") ||
      endpoint.includes("/api/auth/refresh") ||
      endpoint.includes("/api/auth/logout");

    if (response.status === 401 && !skipAuth && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request until silent refresh finishes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          headers.set("Authorization", `Bearer ${newToken}`);
          return request<T>(endpoint, { ...options, headers });
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(
          `${API_BASE_URL}/api/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!refreshResponse.ok) {
          throw new Error("Refresh token expired or invalid");
        }

        const refreshData = await refreshResponse.json();
        const newAccessToken: string =
          refreshData?.data?.accessToken || refreshData?.accessToken;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh");
        }

        useSession.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        // Replay original failed request
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        return request<T>(endpoint, { ...options, headers });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useSession.getState().clearSession();

        // Redirect to signin if running in browser
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/signin?redirect=${encodeURIComponent(currentPath)}`;
        }

        throw new ApiError("Session expired. Please sign in again.", 401);
      } finally {
        isRefreshing = false;
      }
    }

    // File download: hand back the bytes untouched.
    if (blob && response.ok) {
      return (await response.blob()) as T;
    }

    // Parse response
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const responseData = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const { message, code } = parseError(
        responseData,
        response.statusText || "Request failed"
      );
      if (code === "MAINTENANCE_MODE") goToMaintenancePage();
      throw new ApiError(message, response.status, responseData, code);
    }

    // Unwrap standard envelope { success: true, data: ... }
    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "success" in responseData &&
      "data" in responseData
    ) {
      const envelope = responseData as ApiResponse<T>;
      if (!envelope.success) {
        throw new ApiError(envelope.message || "Operation failed", response.status, envelope);
      }
      if (withMeta) {
        return { data: envelope.data, meta: (responseData as { meta?: unknown }).meta } as T;
      }
      return envelope.data;
    }

    return responseData as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Network error occurred",
      0
    );
  }
}

/**
 * The backend answers 503 MAINTENANCE_MODE to everyone but the Super-Admin while the
 * Super-Admin has maintenance mode on: send the visitor to the notice page.
 * (Sign-in stays put so the error message shows there.)
 */
function goToMaintenancePage() {
  if (typeof window === "undefined") return;
  // Maintenance ends every session except the Super-Admin's (the backend
  // already revoked it): forget it here too.
  if (useSession.getState().role !== "superadmin") useSession.getState().clearSession();
  const path = window.location.pathname;
  if (path.startsWith("/maintenance") || path.startsWith("/signin")) return;
  window.location.href = "/maintenance";
}

/** Pre-configured HTTP methods */
export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "DELETE" }),

  /** GET a paginated list, keeping the envelope's `meta`. */
  getPage: <T, M = PaginationMeta>(url: string, options?: RequestOptions) =>
    request<{ data: T; meta?: M }>(url, { ...options, method: "GET", withMeta: true }),

  /** Standard auth endpoint calls matching the backend guide */
  auth: {
    /** `role` is the sign-in tab; the backend rejects a mismatch (ROLE_MISMATCH). */
    login: (credentials: { email: string; password: string; role?: "student" | "sponsor" | "admin" }) =>
      apiClient.post<{ accessToken: string; role: UserRole; userId: string; name?: string }>(
        "/api/auth/login",
        credentials,
        { skipAuth: true }
      ),

    register: (payload: RegisterPayload) =>
      apiClient.post<{ userId: string; role: UserRole }>(
        "/api/auth/register",
        payload,
        { skipAuth: true }
      ),

    /** New access token plus the session profile (same fields as /me). */
    refresh: () =>
      apiClient.post<{
        accessToken: string;
        userId?: string;
        role?: UserRole;
        name?: string;
        email?: string;
        photo?: string;
        isVerified?: boolean;
      }>(
        "/api/auth/refresh",
        {},
        { skipAuth: true }
      ),

    me: () =>
      apiClient.get<{
        userId: string;
        role: UserRole;
        name: string;
        email: string;
        photo?: string;
      }>("/api/auth/me"),

    logout: () =>
      apiClient.post<{ message?: string }>("/api/auth/logout", {}, { skipAuth: true }),

    verifyEmail: (token: string) =>
      apiClient.get<{ verified: boolean }>(
        `/api/auth/verify-email/${encodeURIComponent(token)}`,
        { skipAuth: true }
      ),

    resendVerification: (email: string) =>
      apiClient.post<{ sent: boolean }>(
        "/api/auth/resend-verification",
        { email },
        { skipAuth: true }
      ),

    /** The 6-digit code from the sign-up email. */
    verifyEmailOtp: (email: string, code: string) =>
      apiClient.post<{ verified: boolean }>(
        "/api/auth/verify-email-otp",
        { email, code },
        { skipAuth: true }
      ),

    forgotPassword: (email: string) =>
      apiClient.post<{ message?: string }>(
        "/api/auth/forgot-password",
        { email },
        { skipAuth: true }
      ),

    resetPassword: (payload: { token: string; password: string }) =>
      apiClient.post<{ message?: string }>(
        "/api/auth/reset-password",
        payload,
        { skipAuth: true }
      ),
  },
};

