"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircleIcon, AlertIcon, InfoIcon, XIcon } from "./icons";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const config: Record<
  ToastType,
  { icon: ReactNode; bar: string; text: string }
> = {
  success: { icon: <CheckCircleIcon size={20} />, bar: "bg-success", text: "text-success" },
  error: { icon: <AlertIcon size={20} />, bar: "bg-alert", text: "text-alert" },
  info: { icon: <InfoIcon size={20} />, bar: "bg-accent", text: "text-accent" },
  warning: { icon: <AlertIcon size={20} />, bar: "bg-amber", text: "text-amber" },
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++counter;
      setToasts((t) => [...t, { id, type, message }]);
      // PRD §5 — auto-dismiss after 4s.
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-3"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const c = config[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.9 }}
                transition={{ type: "spring", damping: 24, stiffness: 320 }}
                className="flex items-start gap-3 overflow-hidden rounded-card bg-white p-4 shadow-cardhover"
              >
                <div className={cn("mt-0.5", c.text)}>{c.icon}</div>
                <p className="flex-1 text-body text-navy">{t.message}</p>
                <button
                  onClick={() => remove(t.id)}
                  className="text-muted hover:text-navy"
                  aria-label="Dismiss notification"
                >
                  <XIcon size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
