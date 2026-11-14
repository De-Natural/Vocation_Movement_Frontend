"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "./AuthProvider";
import { MaintenanceGate } from "./MaintenanceGate";

/** Client-side app providers: React Query cache + Auth hydration + Toast notifications. */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ToastProvider>
          <MaintenanceGate>{children}</MaintenanceGate>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
