import { create } from "zustand";
import type { UserRole } from "./types";

export interface UserSession {
  userId: string;
  role: UserRole;
  name: string;
  email?: string;
  accessToken: string;
}

interface SessionState {
  role: UserRole | null;
  name: string | null;
  userId: string | null;
  email: string | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  isInitialized: boolean;

  /** Update full authenticated session */
  setSession: (session: {
    accessToken: string;
    role: UserRole;
    userId: string;
    name?: string;
    email?: string;
  }) => void;

  /** Update access token (e.g. after silent refresh) */
  setAccessToken: (accessToken: string) => void;

  /** Set session loading state */
  setStatus: (status: "idle" | "loading" | "authenticated" | "unauthenticated") => void;

  /** Mark initialization complete */
  setInitialized: (initialized: boolean) => void;

  /** Clear session data in memory */
  clearSession: () => void;

  /** Backward-compatible helpers used throughout the frontend */
  setRole: (role: UserRole, name?: string) => void;
  signOut: () => void;
}

/**
 * In-memory session store.
 * The access token lives strictly in memory (per dual-token security architecture)
 * and is refreshed silently via httpOnly cookie on startup / expiration.
 */
export const useSession = create<SessionState>((set) => ({
  role: null,
  name: null,
  userId: null,
  email: null,
  accessToken: null,
  status: "idle",
  isInitialized: false,

  setSession: ({ accessToken, role, userId, name, email }) =>
    set({
      accessToken,
      role,
      userId,
      name: name ?? null,
      email: email ?? null,
      status: "authenticated",
      isInitialized: true,
    }),

  setAccessToken: (accessToken) =>
    set({
      accessToken,
      status: "authenticated",
    }),

  setStatus: (status) => set({ status }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  clearSession: () =>
    set({
      role: null,
      name: null,
      userId: null,
      email: null,
      accessToken: null,
      status: "unauthenticated",
      isInitialized: true,
    }),

  // Backward compatibility for existing components
  setRole: (role, name) =>
    set((state) => ({
      ...state,
      role,
      name: name ?? state.name,
      status: "authenticated",
    })),

  signOut: () =>
    set({
      role: null,
      name: null,
      userId: null,
      email: null,
      accessToken: null,
      status: "unauthenticated",
      isInitialized: true,
    }),
}));
