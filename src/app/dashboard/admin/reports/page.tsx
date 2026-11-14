"use client";

import { useState } from "react";
import { PageTitle, SectionHeader } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { DownloadIcon, FileIcon, ChartIcon } from "@/components/ui/icons";
import { adminApi, type ReportKind } from "@/lib/admin-api";
import { useApi, apiErrorMessage } from "@/lib/use-api";
import { mediaUrl } from "@/lib/media";
import { formatCurrency, formatDate, pct } from "@/lib/format";

const thisMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export default function ReportsPage() {
  const { toast } = useToast();
  const { data, error, loading, reload } = useApi(() => adminApi.reports());
  const { data: overview } = useApi(() => adminApi.overview());
  const [busy, setBusy] = useState<string | null>(null);

  const congregations = [...(data?.byCongregation ?? [])].sort((a, b) => b.raised - a.raised);
  const generated = data?.generated ?? [];

  async function generate(key: string, body: { kind: ReportKind; congregation?: string; month?: string }) {
    setBusy(key);
    try {
      const report = await adminApi.generateReport(body);
      toast(`“${report.title}” generated.`, "success");
      window.open(mediaUrl(report.url), "_blank", "noopener,noreferrer");
      void reload();
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't generate the report."), "error");
    } finally {
      setBusy(null);
    }
  }

  const PLATFORM_REPORTS: { key: string; title: string; desc: string; body: { kind: ReportKind; month?: string } }[] = [
    {
      key: "monthly",
      title: "Monthly Funding Summary",
      desc: "All contributions for the current month.",
      body: { kind: "monthly", month: thisMonth() },
    },
    {
      key: "platform",
      title: "Platform Report",
      desc: "Platform-wide giving and students supported.",
      body: { kind: "platform" },
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Reports"
        subtitle="Congregation and platform-wide funding reports, exportable for records and audits."
      />

      {/* Platform report cards */}
      <SectionHeader title="Platform Reports" />
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {PLATFORM_REPORTS.map((r) => (
          <div key={r.key} className="flex flex-col rounded-card bg-white p-5 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-input bg-accent/10 text-accent">
              <FileIcon size={22} />
            </span>
            <h3 className="mt-3 font-display text-h3 text-navy">{r.title}</h3>
            <p className="mt-1 flex-1 text-caption text-muted">{r.desc}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              disabled={!!busy}
              onClick={() => void generate(r.key, r.body)}
            >
              <DownloadIcon size={15} /> {busy === r.key ? "Generating…" : "Generate PDF"}
            </Button>
          </div>
        ))}
      </div>

      {/* Congregation breakdown */}
      <SectionHeader title="By Congregation" subtitle="Funding progress across each religious congregation." />
      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-white/60 shadow-card" />
      ) : error ? (
        <EmptyState
          icon={<ChartIcon size={28} />}
          title="Couldn't load reports"
          description={error}
          action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
        />
      ) : congregations.length === 0 ? (
        <EmptyState
          icon={<ChartIcon size={28} />}
          title="No congregations yet"
          description="Funding by congregation appears once students register."
        />
      ) : (
        <div className="overflow-hidden rounded-card bg-white shadow-card">
          <div className="divide-y divide-inputborder/40">
            {congregations.map((r) => {
              const p = pct(r.raised, r.needed);
              const key = `cong:${r.congregation}`;
              return (
                <div key={r.congregation} className="p-5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/12 text-gold-dark">
                        <ChartIcon size={18} />
                      </span>
                      <div>
                        <p className="font-display text-h3 text-navy">{r.congregation}</p>
                        <p className="text-label text-muted">{r.students} student{r.students !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-navy">
                          {formatCurrency(r.raised)} <span className="text-caption font-normal text-muted">of {formatCurrency(r.needed)}</span>
                        </p>
                        <p className="text-label text-muted">{p}% funded</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!!busy}
                        onClick={() => void generate(key, { kind: "congregation", congregation: r.congregation })}
                        aria-label={`Generate report for ${r.congregation}`}
                      >
                        <DownloadIcon size={15} /> {busy === key ? "…" : "PDF"}
                      </Button>
                    </div>
                  </div>
                  <ProgressBar value={p} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {overview && (
        <p className="mt-4 text-center text-caption text-muted">
          Platform total: <span className="font-semibold text-navy">{formatCurrency(overview.kpis.fundsRaised)}</span> raised
          across {overview.kpis.studentsSupported} student{overview.kpis.studentsSupported !== 1 ? "s" : ""}.
        </p>
      )}

      {/* Previously generated */}
      {generated.length > 0 && (
        <>
          <div className="mt-10" />
          <SectionHeader title="Recently Generated" />
          <div className="divide-y divide-inputborder/40 overflow-hidden rounded-card bg-white shadow-card">
            {generated.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-caption font-semibold text-navy">{g.title}</p>
                  <p className="text-label text-muted">{formatDate(g.createdAt)}</p>
                </div>
                {g.url && (
                  <a
                    href={mediaUrl(g.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-caption font-semibold text-accent hover:underline"
                  >
                    <DownloadIcon size={14} /> Download
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
