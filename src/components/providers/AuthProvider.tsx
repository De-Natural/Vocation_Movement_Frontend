"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/store";
import { apiClient } from "@/lib/api-client";

/**
 * App Bootstrap component:
 * Performs silent session hydration on startup by calling POST /api/auth/refresh.
 * If the user has a valid 7-day vm_refresh cookie, their access token and profile
 * are restored seamlessly into memory without requiring a re-login.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useSession((s) => s.setSession);
  const clearSession = useSession((s) => s.clearSession);
  const setStatus = useSession((s) => s.setStatus);
  const isInitialized = useSession((s) => s.isInitialized);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // If already initialized in-memory, no need to re-run
      if (isInitialized) return;

      setStatus("loading");

      try {
        // Attempt silent refresh using the vm_refresh httpOnly cookie
        const refreshData = await apiClient.auth.refresh();
        const accessToken = refreshData.accessToken;

        if (!accessToken) {
          throw new Error("No access token returned");
        }

        // Set access token first so the subsequent /me request has it
        useSession.getState().setAccessToken(accessToken);

        // Fetch user profile
        const me = await apiClient.auth.me();

        if (isMounted) {
          setSession({
            accessToken,
            role: me.role,
            userId: me.userId,
            name: me.name,
            email: me.email,
          });
        }
      } catch {
        // User is not signed in or cookie expired — graceful unauthenticated state
        if (isMounted) {
          clearSession();
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [setSession, clearSession, setStatus, isInitialized]);

  return <>{children}</>;
}

