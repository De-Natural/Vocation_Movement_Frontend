import { apiClient } from "./api-client";
import type { BillCategory, FormationStage, PlatformStats, Student } from "./types";

/** Query params of GET /api/religious (backend listReligiousQuerySchema). */
export interface BrowseQuery {
  search?: string;
  congregation?: string;
  stage?: FormationStage;
  school?: string;
  country?: string;
  billType?: BillCategory;
  hideFunded?: boolean;
  sort?: "urgent" | "newest" | "alpha" | "sponsored";
  page?: number;
  perPage?: number;
}

/** GET /api/settings/public: readable by anyone, even during maintenance. */
export interface PublicSettings {
  organizationName: string;
  supportEmail: string;
  currency: string;
  maintenanceMode: boolean;
  /** The Super-Admin's maintenance notice (null = default wording). */
  maintenanceMessage?: string | null;
  minGift: number;
  anonymousDefault: boolean;
  platformFeePercent: number;
}

/** Public (unauthenticated) reads. */
export const publicApi = {
  /** Verified, non-suspended students only. */
  students: (query: BrowseQuery = {}) =>
    apiClient.getPage<Student[]>("/api/religious", { params: { ...query }, skipAuth: true }),
  /** Public profile by id or slug (verified only — 404 otherwise). */
  student: (idOrSlug: string) =>
    apiClient.get<Student>(`/api/religious/${encodeURIComponent(idOrSlug)}`, { skipAuth: true }),
  settings: () => apiClient.get<PublicSettings>("/api/settings/public", { skipAuth: true }),
  stats: () => apiClient.get<PlatformStats>("/api/stats/platform", { skipAuth: true }),
};
