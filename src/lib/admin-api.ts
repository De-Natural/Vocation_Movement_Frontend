import { apiClient } from "./api-client";
import type { ContactInquiry, PaymentStatus, Student, VerificationStatus } from "./types";

/** Row of GET /api/admin/transactions (admin audit view: real donor names). */
export interface TransactionRow {
  id: string;
  date: string;
  donorName: string;
  anonymous: boolean;
  studentName: string;
  congregation: string;
  billName: string;
  amount: number;
  currency: string;
  /** Naira value at the locked exchange rate (null: no rate for its currency yet). */
  nairaAmount?: number | null;
  transactionId: string;
  status: PaymentStatus;
  recurring: boolean;
}

export interface TransactionFilters {
  congregation?: string;
  donorType?: "all" | "named" | "anonymous";
  status?: PaymentStatus;
  minAmount?: number;
  maxAmount?: number;
  from?: string; // YYYY-MM-DD
  to?: string;
  page?: number;
  perPage?: number;
}

/** GET /api/admin/reports */
export interface AdminReports {
  byCongregation: { congregation: string; students: number; raised: number; needed: number }[];
  generated: { id: string; kind: string; title: string; fileUrl: string; url?: string; createdAt: string }[];
}

export type ReportKind = "congregation" | "platform" | "monthly";

/** GET/PATCH /api/admin/settings (money in major units). */
export interface PlatformSettings {
  organizationName: string;
  supportEmail: string;
  defaultCurrency: string;
  platformFeePercent: number;
  minGift: number;
  autoApprove: boolean;
  maintenanceMode: boolean;
  anonymousDefault: boolean;
  emailReceipts: boolean;
  /** Shown on the maintenance page and emailed to everyone when maintenance is switched on. */
  maintenanceMessage: string;
  /** The Super-Admin's overrides: naira per 1 unit (empty = use the live rate). */
  payoutFxRates: Record<string, number>;
  /** Today's live rates (refreshed daily by the server), read-only. */
  liveFx?: { rates: Record<string, number>; updatedAt: string; fetchedAt: string; source: string } | null;
  /** Only in the save response when maintenance was just switched on. */
  maintenance?: { sessionsEnded: number; emailsQueued: number };
}

/** A verification document as returned by GET /api/admin/verifications. */
export interface AdminDocument {
  id: string;
  label: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
}

/** Student row in the admin verification queue (serializeStudent + admin extras). */
export interface AdminStudent extends Student {
  userId: string;
  email: string;
  documents: AdminDocument[];
}

/** GET /api/admin/kpis */
export interface AdminOverview {
  kpis: {
    studentsSupported: number;
    pendingVerification: number;
    fundsRaised: number;
    unreadInquiries: number;
    sponsors: number;
    activeSponsorships: number;
  };
  verificationQueue: { id: string; name: string; photo: string; congregation: string; createdAt: string }[];
  overdueBills: { id: string; billName: string; studentName: string; studentPhoto: string; dueDate: string; gap: number }[];
  recentInquiries: { id: string; name: string; message: string; date: string; read?: boolean }[];
}

export const adminApi = {
  overview: () => apiClient.get<AdminOverview>("/api/admin/kpis"),

  verifications: (status: VerificationStatus | "all" = "all") =>
    apiClient.get<AdminStudent[]>("/api/admin/verifications", { params: { status } }),

  verify: (profileId: string) => apiClient.post(`/api/admin/verify/${profileId}`),
  reject: (profileId: string, reason: string) =>
    apiClient.post(`/api/admin/reject/${profileId}`, { reason }),
  requestInfo: (profileId: string, reason: string) =>
    apiClient.post(`/api/admin/request-info/${profileId}`, { reason }),
  suspend: (userId: string, reason: string) =>
    apiClient.post(`/api/admin/suspend/${userId}`, { reason }),

  inquiries: () => apiClient.get<ContactInquiry[]>("/api/inquiries"),
  markInquiryRead: (id: string) => apiClient.patch(`/api/inquiries/${id}/read`),
  deleteInquiry: (id: string) => apiClient.delete(`/api/inquiries/${id}`),

  transactions: (filters: TransactionFilters) =>
    apiClient.getPage<{ transactions: TransactionRow[]; totalAmount: number }>("/api/admin/transactions", {
      params: { ...filters },
    }),
  /** CSV of every row matching the filters (not just the current page). */
  transactionsCsv: (filters: TransactionFilters) =>
    apiClient.get<Blob>("/api/admin/transactions/export", { params: { ...filters }, blob: true }),

  settings: () => apiClient.get<PlatformSettings>("/api/admin/settings"),
  updateSettings: (body: Partial<PlatformSettings>) =>
    apiClient.patch<PlatformSettings>("/api/admin/settings", body),

  reports: () => apiClient.get<AdminReports>("/api/admin/reports"),
  generateReport: (body: { kind: ReportKind; congregation?: string; month?: string }) =>
    apiClient.post<{ id: string; title: string; url: string; createdAt: string }>("/api/admin/reports", body),
};
