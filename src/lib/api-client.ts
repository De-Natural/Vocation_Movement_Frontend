import { useSession } from "./store";
import type { UserRole } from "./types";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
  const { skipAuth = false, params, headers: customHeaders, ...customConfig } = options;

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

    // Parse response
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const responseData = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof responseData === "object" && responseData !== null
          ? (responseData as { message?: string }).message
          : null) ||
        response.statusText ||
        "Request failed";
      throw new ApiError(errorMessage, response.status, responseData);
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

  /** Standard auth endpoint calls matching the backend guide */
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post<{ accessToken: string; role: UserRole; userId: string; name?: string }>(
        "/api/auth/login",
        credentials,
        { skipAuth: true }
      ),

    register: (payload: unknown) =>
      apiClient.post<{ message?: string; userId?: string }>(
        "/api/auth/register",
        payload,
        { skipAuth: true }
      ),

    refresh: () =>
      apiClient.post<{ accessToken: string }>(
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
      apiClient.post<{ message?: string }>(
        "/api/auth/verify-email",
        { token },
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

