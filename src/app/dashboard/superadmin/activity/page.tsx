"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageTitle } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityFeed } from "@/components/domain/ActivityFeed";
import { ChartIcon } from "@/components/ui/icons";
import { superAdminApi } from "@/lib/superadmin-api";
import { useApi } from "@/lib/use-api";

const PER_PAGE = 30;

function ActivityLog() {
  const router = useRouter();
  const params = useSearchParams();
  const actorId = params.get("actor") ?? "";
  const [page, setPage] = useState({ actor: actorId, n: 1 });
  const current = page.actor === actorId ? page.n : 1;

  const { data: staff } = useApi(() => superAdminApi.admins());
  const { data, error, loading, reload } = useApi(
    () => superAdminApi.activity({ actorId: actorId || undefined, page: current, perPage: PER_PAGE }),
    [actorId, current]
  );
  const entries = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="Activity Log"
        subtitle="Every action taken by staff — verifications, suspensions, settings changes and admin management — with the reason given."
      />

      <div className="mb-4 max-w-xs">
        <Select
          label="Staff member"
          value={actorId}
          onChange={(e) =>
            router.replace(e.target.value ? `/dashboard/superadmin/activity?actor=${e.target.value}` : "/dashboard/superadmin/activity")
          }
          options={[
            { value: "", label: "All staff" },
            ...(staff ?? []).map((s) => ({ value: s.id, label: `${s.name}${s.tier === "superadmin" ? " (Super-Admin)" : ""}` })),
          ]}
        />
      </div>

      <div className="rounded-card bg-white px-5 shadow-card">
        {loading ? (
          <div className="space-y-3 py-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-input bg-warm/60" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<ChartIcon size={28} />}
            title="Couldn't load the activity log"
            description={error}
            action={<Button variant="secondary" onClick={() => void reload()}>Try again</Button>}
          />
        ) : (
          <ActivityFeed entries={entries} empty={actorId ? "This staff member hasn't taken any actions yet." : undefined} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="secondary" size="sm" disabled={current <= 1 || loading} onClick={() => setPage({ actor: actorId, n: current - 1 })}>
            Newer
          </Button>
          <span className="text-caption text-muted">Page {current} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={current >= totalPages || loading} onClick={() => setPage({ actor: actorId, n: current + 1 })}>
            Older
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-4xl animate-pulse rounded-card bg-white/60 shadow-card" />}>
      <ActivityLog />
    </Suspense>
  );
}
