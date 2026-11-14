"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { StudentCard } from "@/components/domain/StudentCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import { SearchIcon, XIcon, MenuIcon } from "@/components/ui/icons";
import { publicApi, type BrowseQuery } from "@/lib/public-api";
import { useApi } from "@/lib/use-api";
import { cn } from "@/lib/utils";
import type { BillCategory, FormationStage, Student } from "@/lib/types";

const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean))).sort();

// Must match the backend's formationStage / billCategory enums.
const FORMATION_STAGES: FormationStage[] = ["Seminarian", "Novice", "Postulant"];
const BILL_TYPES: BillCategory[] = ["School Fees", "Medical", "Books", "Clothing", "Feeding", "Miscellaneous"];
const PER_PAGE = 24;

type SortKey = "urgent" | "newest" | "alpha" | "sponsored";

export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [congregation, setCongregation] = useState("all");
  const [stage, setStage] = useState("all");
  const [school, setSchool] = useState("all");
  const [country, setCountry] = useState("all");
  const [billType, setBillType] = useState("all");
  const [hideFunded, setHideFunded] = useState(false);
  const [sort, setSort] = useState<SortKey>("urgent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [results, setResults] = useState<Student[]>([]);

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query: BrowseQuery = {
    search: debouncedSearch || undefined,
    congregation: congregation === "all" ? undefined : congregation,
    stage: stage === "all" ? undefined : (stage as FormationStage),
    school: school === "all" ? undefined : school,
    country: country === "all" ? undefined : country,
    billType: billType === "all" ? undefined : (billType as BillCategory),
    hideFunded: hideFunded || undefined,
    sort,
  };
  const queryKey = JSON.stringify(query);

  // The page number belongs to one filter set: a new filter set starts at page 1.
  const [paging, setPaging] = useState({ key: queryKey, page: 1 });
  const page = paging.key === queryKey ? paging.page : 1;
  const loadMore = () => setPaging({ key: queryKey, page: page + 1 });

  // Filtering, sorting and pagination are done by the API (verified students only).
  const { data, error, loading, reload } = useApi(
    () => publicApi.students({ ...query, page, perPage: PER_PAGE }),
    [queryKey, page]
  );
  useEffect(() => {
    if (!data) return;
    const p = data.meta?.page ?? 1;
    setResults((prev) => (p === 1 ? data.data : [...prev, ...data.data]));
  }, [data]);

  const total = data?.meta?.total ?? results.length;
  const hasMore = !!data?.meta && page < data.meta.totalPages;

  // Filter options come from the verified roster (first 100 profiles).
  const { data: facetSource } = useApi(() => publicApi.students({ perPage: 100, sort: "alpha" }));
  const roster = facetSource?.data ?? [];
  const congregations = uniq(roster.map((s) => s.congregation));
  const schools = uniq(roster.map((s) => s.school));
  const countries = uniq(roster.map((s) => s.country));

  const firstLoad = loading && page === 1;

  function clearFilters() {
    setSearch("");
    setCongregation("all");
    setStage("all");
    setSchool("all");
    setCountry("all");
    setBillType("all");
    setHideFunded(false);
    setSort("urgent");
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
                  {firstLoad ? "Loading students…" : `${total} student${total !== 1 ? "s" : ""} found`}
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

              {firstLoad ? (
                <SkeletonGrid count={8} />
              ) : error && results.length === 0 ? (
                <EmptyState
                  title="Couldn't load students"
                  description={error}
                  action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
                />
              ) : results.length === 0 ? (
                <EmptyState
                  title="No students match your filters"
                  description="Try broadening your search or clearing some filters to see more students."
                  action={<Button variant="primary" onClick={clearFilters}>Clear filters</Button>}
                />
              ) : (
                <>
                  <div className="masonry columns-1 sm:columns-2 xl:columns-3">
                    {results.map((s) => (
                      <StudentCard key={s.id} student={s} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <Button variant="secondary" onClick={loadMore} disabled={loading}>
                        {loading ? "Loading…" : "Load more students"}
                      </Button>
                    </div>
                  )}
                </>
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
              Show {total} student{total !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
