import { create } from "zustand";
import type { UserRole } from "./types";

interface SessionState {
  role: UserRole | null;
  name: string | null;
  setRole: (role: UserRole, name?: string) => void;
  signOut: () => void;
}

/** Lightweight client session store (mock auth for the demo). */
export const useSession = create<SessionState>((set) => ({
  role: null,
  name: null,
  setRole: (role, name) => set({ role, name: name ?? null }),
  signOut: () => set({ role: null, name: null }),
}));
