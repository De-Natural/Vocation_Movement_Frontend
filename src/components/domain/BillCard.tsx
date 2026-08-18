"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Bill } from "@/lib/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  CategoryIcon,
  DotsIcon,
  ChevronDownIcon,
  CalendarIcon,
  HeartHandIcon,
} from "@/components/ui/icons";
import { BillStatusBadge } from "./StatusBadges";
import { formatCurrency, formatDate, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Bill Card (PRD §4.4 / §5) — category icon, amounts, due date, progress,
 * status badge, three-dot menu, expandable contributor list.
 */
export function BillCard({
  bill,
  editable = false,
  onEdit,
  onArchive,
  onFund,
}: {
  bill: Bill;
  editable?: boolean;
  onEdit?: (bill: Bill) => void;
  onArchive?: (bill: Bill) => void;
  onFund?: (bill: Bill) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const percent = pct(bill.raised, bill.total);
  const remaining = Math.max(0, bill.total - bill.raised);

  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-input bg-gold/12 text-gold-dark">
              <CategoryIcon category={bill.category} size={22} />
            </div>
            <div>
              <h3 className="font-display text-h3 leading-tight text-navy">{bill.name}</h3>
              <p className="text-caption text-muted">{bill.category}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BillStatusBadge status={bill.status} />
            {editable && (
              <div className="relative">
                <Button
                  variant="icon"
                  size="sm"
                  aria-label="Bill options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <DotsIcon size={18} />
                </Button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div
                      role="menu"
                      className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-input border border-inputborder/50 bg-white py-1 shadow-cardhover"
                    >
                      <button
                        role="menuitem"
                        className="block w-full px-4 py-2 text-left text-caption text-navy hover:bg-warm"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit?.(bill);
                        }}
                      >
                        Edit bill
                      </button>
                      <button
                        role="menuitem"
                        className="block w-full px-4 py-2 text-left text-caption text-alert hover:bg-alert-soft"
                        onClick={() => {
                          setMenuOpen(false);
                          onArchive?.(bill);
                        }}
                      >
                        Archive bill
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {bill.description && (
          <p className="mb-4 text-caption text-muted">{bill.description}</p>
        )}

        <div className="mb-2 flex items-end justify-between">
          <div>
            <span className="font-display text-h2 text-navy">{formatCurrency(bill.raised)}</span>
            <span className="text-caption text-muted"> raised of {formatCurrency(bill.total)}</span>
          </div>
          <span className="text-caption font-semibold text-navy">{percent}%</span>
        </div>
        <ProgressBar value={percent} />

        <div className="mt-3 flex items-center justify-between text-caption text-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon size={14} /> Due {formatDate(bill.dueDate)}
          </span>
          <span>
            {remaining > 0 ? (
              <><span className="font-semibold text-navy">{formatCurrency(remaining)}</span> to go</>
            ) : (
              <span className="font-semibold text-success">Complete</span>
            )}
          </span>
        </div>

        {onFund && bill.status !== "Fully Funded" && (
          <Button variant="primary" size="sm" fullWidth className="mt-4" onClick={() => onFund(bill)}>
            <HeartHandIcon size={16} /> Fund this bill
          </Button>
        )}

        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex w-full items-center justify-center gap-1 text-caption font-semibold text-accent hover:underline"
          aria-expanded={expanded}
        >
          {bill.contributions.length} contribution{bill.contributions.length !== 1 && "s"}
          <ChevronDownIcon size={14} className={cn("transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-inputborder/40 bg-warm/40"
          >
            <div className="divide-y divide-inputborder/40 px-5">
              {bill.contributions.length === 0 && (
                <p className="py-4 text-center text-caption text-muted">
                  No contributions yet — be the first to give.
                </p>
              )}
              {bill.contributions.map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-3">
                  <Avatar name={c.donorName} anonymous={c.anonymous} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-caption font-semibold text-navy">{c.donorName}</p>
                    <p className="text-caption text-muted">{formatDate(c.date)}</p>
                  </div>
                  <span className="font-semibold text-success">{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
