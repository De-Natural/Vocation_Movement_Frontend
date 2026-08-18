"use client";

import { PageTitle, SectionHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { DownloadIcon, FileIcon, ChartIcon } from "@/components/ui/icons";
import { students, platformStats } from "@/lib/mock-data";
import { formatCurrency, pct } from "@/lib/format";

interface CongregationReport {
  name: string;
  students: number;
  raised: number;
  needed: number;
}

// Aggregate funding by congregation.
const reports: CongregationReport[] = Object.values(
  students.reduce<Record<string, CongregationReport>>((acc, s) => {
    const active = s.bills.filter((b) => b.status !== "Archived");
    const raised = active.reduce((sum, b) => sum + b.raised, 0);
    const needed = active.reduce((sum, b) => sum + b.total, 0);
    if (!acc[s.congregation]) {
      acc[s.congregation] = { name: s.congregation, students: 0, raised: 0, needed: 0 };
    }
    acc[s.congregation].students += 1;
    acc[s.congregation].raised += raised;
    acc[s.congregation].needed += needed;
    return acc;
  }, {})
).sort((a, b) => b.raised - a.raised);

export default function ReportsPage() {
  const { toast } = useToast();

  function download(label: string) {
    toast(`Generating “${label}” (PDF). It will download shortly.`, "success");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Reports"
        subtitle="Congregation and platform-wide funding reports, exportable for records and audits."
      />

      {/* Platform report cards */}
      <SectionHeader title="Platform Reports" />
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Monthly Funding Summary", desc: "All contributions for the current month, by category." },
          { title: "Annual Impact Report", desc: "Year-to-date giving, students supported, outcomes." },
          { title: "Anonymous Giving Ledger", desc: "Admin-only reconciliation of anonymous gifts." },
        ].map((r) => (
          <div key={r.title} className="flex flex-col rounded-card bg-white p-5 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-input bg-accent/10 text-accent">
              <FileIcon size={22} />
            </span>
            <h3 className="mt-3 font-display text-h3 text-navy">{r.title}</h3>
            <p className="mt-1 flex-1 text-caption text-muted">{r.desc}</p>
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => download(r.title)}>
              <DownloadIcon size={15} /> Download PDF
            </Button>
          </div>
        ))}
      </div>

      {/* Congregation breakdown */}
      <SectionHeader
        title="By Congregation"
        subtitle="Funding progress across each religious congregation."
        action={
          <Button variant="primary" size="sm" onClick={() => download("Congregation Report (All)")}>
            <DownloadIcon size={15} /> Export all
          </Button>
        }
      />
      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <div className="divide-y divide-inputborder/40">
          {reports.map((r) => {
            const p = pct(r.raised, r.needed);
            return (
              <div key={r.name} className="p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/12 text-gold-dark">
                      <ChartIcon size={18} />
                    </span>
                    <div>
                      <p className="font-display text-h3 text-navy">{r.name}</p>
                      <p className="text-label text-muted">{r.students} student{r.students !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-navy">
                      {formatCurrency(r.raised)} <span className="text-caption font-normal text-muted">of {formatCurrency(r.needed)}</span>
                    </p>
                    <p className="text-label text-muted">{p}% funded</p>
                  </div>
                </div>
                <ProgressBar value={p} />
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-caption text-muted">
        Platform total: <span className="font-semibold text-navy">{formatCurrency(platformStats.fundsRaised)}</span> raised
        across {platformStats.studentsSupported} students.
      </p>
    </div>
  );
}
