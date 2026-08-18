"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { XIcon } from "./icons";
import { Button } from "./Button";

/**
 * Modal (PRD §2.4 — 20px radius, blur(8px) backdrop; §5 — always has close X).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop: blur(8px) rgba(0,0,0,0.4) */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative w-full ${widths[size]} rounded-modal bg-cream shadow-modal`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-inputborder/40 p-6">
              {title && (
                <h2 className="font-display text-h2 text-navy">{title}</h2>
              )}
              <Button
                variant="icon"
                size="sm"
                onClick={onClose}
                aria-label="Close dialog"
                className="ml-auto shrink-0"
              >
                <XIcon />
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
            {footer && (
              <div className="flex justify-end gap-3 border-t border-inputborder/40 p-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
