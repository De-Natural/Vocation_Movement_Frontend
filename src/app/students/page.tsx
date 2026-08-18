"use client";

import { useMemo, useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StudentCard } from "@/components/domain/StudentCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { SearchIcon, XIcon, MenuIcon } from "@/components/ui/icons";
import { students } from "@/lib/mock-data";
import { pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Student } from "@/lib/types";

const uniq = (arr: string[]) => Array.from(new Set(arr));

const FORMATION_STAGES = ["Seminarian", "Novice", "Postulant"];
const BILL_TYPES = ["School Fees", "Medical", "Books", "Clothing", "Feeding"];

function urgency(s: Student) {
  const active = s.bills.filter((b) => b.status !== "Fully Funded" && b.status !== "Archived");
  if (!active.length) return 100;
  return Math.min(...active.map((b) => pct(b.raised, b.total)));
}

type SortKey = "urgent" | "newest" | "alpha" | "sponsored";

export default function BrowsePage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [congregation, setCongregation] = useState("all");
  const [stage, setStage] = useState("all");
  const [school, setSchool] = useState("all");
  const [country, setCountry] = useState("all");
  const [billType, setBillType] = useState("all");
  const [hideFunded, setHideFunded] = useState(false);
  const [sort, setSort] = useState<SortKey>("urgent");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Skeleton loading (PRD §4.7)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const congregations = useMemo(() => uniq(students.map((s) => s.congregation)), []);
  const schools = useMemo(() => uniq(students.map((s) => s.school)), []);
  const countries = useMemo(() => uniq(students.map((s) => s.country)), []);

  const results = useMemo(() => {
    let list = students.filter((s) => s.verification === "Verified");

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.congregation.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q)
      );
    }
    if (congregation !== "all") list = list.filter((s) => s.congregation === congregation);
    if (stage !== "all") list = list.filter((s) => s.formationStage === stage);
    if (school !== "all") list = list.filter((s) => s.school === school);
    if (country !== "all") list = list.filter((s) => s.country === country);
    if (billType !== "all")
      list = list.filter((s) => s.bills.some((b) => b.category === billType && b.status !== "Fully Funded"));
    if (hideFunded) list = list.filter((s) => urgency(s) < 100);

    switch (sort) {
      case "urgent":
        list = [...list].sort((a, b) => urgency(a) - urgency(b));
        break;
      case "newest":
        list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "alpha":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "sponsored":
        list = [...list].sort((a, b) => b.sponsorCount - a.sponsorCount);
        break;
    }
    return list;
  }, [search, congregation, stage, school, country, billType, hideFunded, sort]);

  function clearFilters() {
    setSearch("");
    setCongregation("all");
    setStage("all");
    setSchool("all");
    setCountry("all");
    setBillType("all");
    setHideFunded(false);
  }

  const filterControls = (
    <div className="space-y-5">
      <Select label="Congregation" value={congregation} onChange={(e) => setCongregation(e.target.value)}
        options={[{ value: "all", label: "All congregations" }, ...congregations.map((c) => ({ value: c, label: c }))]} />
      <Select label="Formation stage" value={stage} onChange={(e) => setStage(e.target.value)}
        options={[{ value: "all", label: "All stages" }, ...FORMATION_STAGES.map((s) => ({ value: s, label: s }))]} />
      <Select label="School / Seminary" value={school} onChange={(e) => setSchool(e.target.value)}
        options={[{ value: "all", label: "All schools" }, ...schools.map((s) => ({ value: s, label: s }))]} />
      <Select label="Country" value={country} onChange={(e) => setCountry(e.target.value)}
        options={[{ value: "all", label: "All countries" }, ...countries.map((c) => ({ value: c, label: c }))]} />
      <Select label="Bill type" value={billType} onChange={(e) => setBillType(e.target.value)}
        options={[{ value: "all", label: "Any bill type" }, ...BILL_TYPES.map((b) => ({ value: b, label: b }))]} />

      <label className="flex items-center gap-2 text-caption text-navy">
        <input type="checkbox" checked={hideFunded} onChange={(e) => setHideFunded(e.target.checked)}
          className="h-4 w-4 rounded border-inputborder text-gold focus:ring-gold" />
        Hide fully funded students
      </label>

      <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
        Clear all filters
      </Button>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        {/* Header */}
        <div className="border-b border-inputborder/30 bg-warm/50">
          <div className="page-container py-10">
            <h1 className="font-display text-h1 text-navy">Browse Religious Students</h1>
            <p className="mt-2 max-w-2xl text-body text-muted">
              Discover seminarians and novices seeking support. Choose a student, fund a specific need,
              and walk with them on their journey.
            </p>

            {/* Search bar */}
            <div className="mt-6 flex max-w-xl items-center gap-2 rounded-pill border-[1.5px] border-inputborder bg-white px-4 py-2.5 focus-within:border-gold">
              <SearchIcon size={18} className="text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, congregation, or school…"
                className="flex-1 bg-transparent text-body text-navy placeholder:text-muted/60 focus:outline-none"
                aria-label="Search students"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search">
                  <XIcon size={16} className="text-muted" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="page-container py-8">
          <div className="flex gap-8">
            {/* Filter sidebar (desktop) */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 rounded-card bg-white p-6 shadow-card">
                <h2 className="mb-4 font-display text-h3 text-navy">Filters</h2>
                {filterControls}
              </div>
            </aside>

            {/* Results */}
            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-caption text-muted">
                  {loading ? "Loading students…" : `${results.length} student${results.length !== 1 ? "s" : ""} found`}
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
                    <MenuIcon size={16} /> Filters
                  </Button>
                  <div className="w-48">
                    <Select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      options={[
                        { value: "urgent", label: "Most Urgent" },
                        { value: "newest", label: "Newest Profiles" },
                        { value: "alpha", label: "Alphabetical" },
                        { value: "sponsored", label: "Most Sponsored" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <SkeletonGrid count={8} />
              ) : results.length === 0 ? (
                <EmptyState
                  title="No students match your filters"
                  description="Try broadening your search or clearing some filters to see more students."
                  action={<Button variant="primary" onClick={clearFilters}>Clear filters</Button>}
                />
              ) : (
                <div className="masonry columns-1 sm:columns-2 xl:columns-3">
                  {results.map((s) => (
                    <StudentCard key={s.id} student={s} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Filter bottom sheet (mobile, PRD §6) */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className={cn("absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-modal bg-cream p-6")}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-h2 text-navy">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <XIcon />
              </button>
            </div>
            {filterControls}
            <Button variant="primary" fullWidth className="mt-6" onClick={() => setFiltersOpen(false)}>
              Show {results.length} students
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
