"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AvatarStack } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { BillCard } from "@/components/domain/BillCard";
import { ContributionPanel } from "@/components/domain/ContributionPanel";
import { VerificationBadge } from "@/components/domain/StatusBadges";
import {
  BookIcon,
  ShieldIcon,
  UsersIcon,
  ShareIcon,
  CopyIcon,
  HeartHandIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { getStudentBySlug } from "@/lib/mock-data";
import { formatCurrency, pct } from "@/lib/format";
import type { Bill } from "@/lib/types";

const BIO_LIMIT = 300;

export default function StudentProfilePage({ params }: { params: { slug: string } }) {
  const student = getStudentBySlug(params.slug);
  const [selectedBillId, setSelectedBillId] = useState<string | undefined>();
  const [bioExpanded, setBioExpanded] = useState(false);
  const { toast } = useToast();

  const activeBills = useMemo(
    () => student?.bills.filter((b) => b.status !== "Archived") ?? [],
    [student]
  );

  if (!student) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-cream">
          <div className="page-container py-24">
            <EmptyState
              title="Student not found"
              description="This profile may have been removed or the link is incorrect."
              action={
                <Link href="/students">
                  <Button variant="primary">Browse students</Button>
                </Link>
              }
            />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const firstName = student.name.split(" ")[1] ?? student.name.split(" ")[0];
  const totalNeeded = activeBills.reduce((s, b) => s + b.total, 0);
  const totalRaised = activeBills.reduce((s, b) => s + b.raised, 0);
  const overallPct = pct(totalRaised, totalNeeded);
  const remaining = Math.max(0, totalNeeded - totalRaised);

  const bioLong = student.biography.length > BIO_LIMIT;
  const bioText =
    bioLong && !bioExpanded ? student.biography.slice(0, BIO_LIMIT).trimEnd() + "…" : student.biography;

  function fundBill(bill: Bill) {
    setSelectedBillId(bill.id);
    document.getElementById("contribute")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: `Sponsor ${student!.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Profile link copied to clipboard.", "success");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Profile link copied to clipboard.", "success");
    } catch {
      toast("Could not copy link.", "error");
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream pb-28 lg:pb-0">
        {/* Hero */}
        <section className="border-b border-inputborder/30 bg-warm/40">
          <div className="page-container py-10">
            <Link
              href="/students"
              className="mb-6 inline-flex items-center gap-1.5 text-caption font-semibold text-accent hover:underline"
            >
              <ArrowRightIcon size={14} className="rotate-180" /> Back to Browse
            </Link>

            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Photo */}
              <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-card shadow-card md:h-48 md:w-48">
                <Image
                  src={student.photo}
                  alt={`Photo of ${student.name}, ${student.formationStage}`}
                  fill
                  sizes="(max-width: 768px) 160px, 192px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Identity */}
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="gold">{student.formationStage}</Badge>
                  <VerificationBadge status={student.verification} />
                </div>
                <h1 className="font-display text-h1 leading-tight text-navy">{student.name}</h1>

                <div className="mt-3 space-y-1.5 text-caption text-muted">
                  <p className="flex items-center gap-2">
                    <ShieldIcon size={15} className="text-gold-dark" /> {student.congregation}
                  </p>
                  <p className="flex items-center gap-2">
                    <BookIcon size={15} className="text-gold-dark" /> {student.school}
                  </p>
                  <p className="flex items-center gap-2">
                    <UsersIcon size={15} className="text-gold-dark" /> {student.location}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-2 text-caption text-navy">
                    <UsersIcon size={16} className="text-gold" />
                    <span className="font-semibold">{student.sponsorCount} people</span> are sponsoring {firstName}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={share}>
                      <ShareIcon size={15} /> Share
                    </Button>
                    <Button variant="ghost" size="sm" onClick={copyLink} aria-label="Copy profile link">
                      <CopyIcon size={15} /> Copy link
                    </Button>
                  </div>
                </div>

                {/* Overall funding summary */}
                <div className="mt-5 max-w-md rounded-card bg-white p-4 shadow-card">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="font-display text-h2 text-navy">{formatCurrency(totalRaised)}</span>
                      <span className="text-caption text-muted"> raised of {formatCurrency(totalNeeded)}</span>
                    </div>
                    <span className="text-caption font-semibold text-navy">{overallPct}%</span>
                  </div>
                  <p className="mt-1 text-caption text-muted">
                    {remaining > 0 ? (
                      <><span className="font-semibold text-navy">{formatCurrency(remaining)}</span> still needed across {activeBills.length} bills</>
                    ) : (
                      <span className="font-semibold text-success">Fully funded — thank you!</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <div className="page-container py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left: biography + bill board */}
            <div className="min-w-0 space-y-10">
              {/* Biography */}
              <section>
                <h2 className="mb-3 font-display text-h2 text-navy">About {firstName}</h2>
                <p className="whitespace-pre-line text-body leading-relaxed text-navy/85">{bioText}</p>
                {bioLong && (
                  <button
                    onClick={() => setBioExpanded((e) => !e)}
                    className="mt-2 text-caption font-semibold text-accent hover:underline"
                    aria-expanded={bioExpanded}
                  >
                    {bioExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </section>

              {/* Bill Board (read-only, click to fund) */}
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-h2 text-navy">Bills &amp; Needs</h2>
                  <span className="text-caption text-muted">{activeBills.length} bills</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {activeBills.map((bill) => (
                    <BillCard key={bill.id} bill={bill} onFund={fundBill} />
                  ))}
                </div>
              </section>
            </div>

            {/* Right: contribution panel (sticky on desktop) */}
            <aside id="contribute" className="lg:sticky lg:top-24 lg:self-start">
              <ContributionPanel
                student={student}
                selectedBillId={selectedBillId}
                onSelectBill={setSelectedBillId}
              />

              {/* Sponsor faces */}
              {student.sponsorCount > 0 && (
                <div className="mt-4 flex items-center gap-3 rounded-card bg-white p-4 shadow-card">
                  <AvatarStack
                    items={[
                      { name: "Onyeka A." },
                      { name: "Chukwuma O." },
                      { anonymous: true },
                      { name: "Grace Foundation" },
                    ]}
                    extra={Math.max(0, student.sponsorCount - 4)}
                    size="sm"
                  />
                  <p className="text-caption text-muted">
                    Join <span className="font-semibold text-navy">{student.sponsorCount}</span> sponsors walking with {firstName}.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA (PRD §4.8 / §6) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-inputborder/50 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-caption font-semibold text-navy">
              {remaining > 0 ? `${formatCurrency(remaining)} still needed` : "Fully funded"}
            </p>
            <p className="text-label text-muted">Support {firstName}&apos;s formation</p>
          </div>
          <Button
            variant="primary"
            onClick={() => document.getElementById("contribute")?.scrollIntoView({ behavior: "smooth" })}
          >
            <HeartHandIcon size={16} /> Sponsor
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
}
