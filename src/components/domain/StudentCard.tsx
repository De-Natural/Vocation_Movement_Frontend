"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Student } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { HeartHandIcon, UsersIcon } from "@/components/ui/icons";
import { formatCurrency, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";

/** Student photo, or an initials tile when none has been uploaded. */
function StudentPhoto({ student, sizes, className }: { student: Student; sizes: string; className?: string }) {
  const src = mediaUrl(student.photo);
  if (!src) {
    const initials = student.name
      .split(/s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
    return (
      <div className="flex h-full w-full items-center justify-center bg-gold/15 font-display text-h2 text-gold-dark">
        {initials}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={`Photo of ${student.name}, ${student.formationStage}`}
      fill
      sizes={sizes}
      // Uploaded files are proxied from the backend; skip the optimizer for them.
      unoptimized={src.startsWith("/storage/")}
      className={cn("object-cover", className)}
    />
  );
}

function mostUrgentBill(student: Student) {
  const active = student.bills.filter((b) => b.status !== "Fully Funded" && b.status !== "Archived");
  // May be undefined when the student has no bills yet.
  if (active.length === 0) return student.bills.find((b) => b.status !== "Archived");
  // Most urgent = lowest % funded, tiebreak soonest due.
  return [...active].sort((a, b) => {
    const pa = pct(a.raised, a.total);
    const pb = pct(b.raised, b.total);
    if (pa !== pb) return pa - pb;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];
}

const stageTone: Record<string, "gold" | "accent" | "navy"> = {
  Seminarian: "accent",
  Novice: "gold",
  Postulant: "navy",
};

/**
 * Student Card (PRD §5) — variants: browse (masonry), compact (list), featured (hero).
 * Always shows a progress bar (PRD §5 note).
 */
export function StudentCard({
  student,
  variant = "browse",
  showSponsor = true,
}: {
  student: Student;
  variant?: "browse" | "compact" | "featured";
  showSponsor?: boolean;
}) {
  const bill = mostUrgentBill(student);
  const percent = bill ? pct(bill.raised, bill.total) : 0;
  const href = `/students/${student.slug}`;

  if (variant === "compact") {
    return (
      <Link href={href} className="block">
        <div className="flex items-center gap-4 rounded-card bg-white p-3 shadow-card transition-shadow hover:shadow-cardhover">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-input">
            <StudentPhoto student={student} sizes="64px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-h3 text-navy">{student.name}</p>
            <p className="truncate text-caption text-muted">{student.congregation}</p>
            <ProgressBar value={percent} height="sm" className="mt-2" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className={cn(
        "group overflow-hidden rounded-card bg-white shadow-card transition-all duration-300 hover:shadow-cardhover hover:-translate-y-1",
        variant === "featured" && "ring-1 ring-gold/20"
      )}
    >
      <Link href={href} className="block">
        <div className={cn("relative w-full overflow-hidden", variant === "featured" ? "aspect-[4/5]" : "aspect-[3/4]")}>
          <StudentPhoto
            student={student}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy/70 to-transparent" />
          <div className="absolute left-3 top-3">
            <Badge tone={stageTone[student.formationStage]}>{student.formationStage}</Badge>
          </div>
          <div className="absolute inset-x-3 bottom-3">
            <h3 className="font-display text-h3 font-bold text-white drop-shadow">{student.name}</h3>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <p className="text-caption text-muted">{student.congregation}</p>
        <p className="mb-3 truncate text-caption text-muted">{student.school}</p>

        {bill ? (
          <>
            <div className="mb-1 flex items-center justify-between text-caption">
              <span className="font-semibold text-navy">{bill.name}</span>
              <span className="text-muted">{percent}%</span>
            </div>
            <ProgressBar value={percent} height="sm" />
            <div className="mb-4 mt-1.5 flex items-center justify-between text-caption text-muted">
              <span>
                <span className="font-semibold text-navy">{formatCurrency(bill.raised)}</span> raised
              </span>
              <span>of {formatCurrency(bill.total)}</span>
            </div>
          </>
        ) : (
          <p className="mb-4 text-caption text-muted">No bills listed yet.</p>
        )}

        {showSponsor && (
          <div className="mb-3 flex items-center gap-1.5 text-caption text-muted">
            <UsersIcon size={14} />
            <span>{student.sponsorCount} sponsoring</span>
          </div>
        )}

        <Link href={href}>
          <Button variant="primary" size="sm" fullWidth>
            <HeartHandIcon size={16} />
            Sponsor Now
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
