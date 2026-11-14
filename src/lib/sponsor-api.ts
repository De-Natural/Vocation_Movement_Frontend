import { apiClient } from "./api-client";
import type { PaymentStatus, RecurringSponsorship, Sponsor, Student } from "./types";

/** Row of GET /api/sponsors/me/payments (a gift, split per bill). */
export interface SentPaymentRow {
  id: string;
  billId: string;
  studentId: string;
  studentName: string;
  studentPhoto: string;
  billName: string;
  donorName: string;
  anonymous: boolean;
  amount: number;
  date: string;
  transactionId: string;
  status: PaymentStatus;
  recurring: boolean;
}

/** GET /api/sponsors/me/dashboard */
export interface SponsorDashboard {
  sponsor: Sponsor;
  kpis: Pick<Sponsor, "totalGiven" | "studentsSponsored" | "activeRecurring" | "monthlyCommitment">;
  myStudents: Student[];
  recentPayments: SentPaymentRow[];
}

/** Response of POST /api/payments/intent and /api/payments/recurring. */
export interface PaymentStart {
  paymentId: string;
  sponsorshipId?: string;
  gateway: string;
  clientSecret: string;
  amount?: number;
  currency?: string;
  /** "stub" = test mode (confirm self-completes); "live" = real gateway. */
  providerMode: "stub" | "live";
}

export interface GiftInput {
  billId: string;
  amount: number;
  anonymous: boolean;
  method: "card" | "paystack";
}

export const paymentsApi = {
  /** One-time gift: creates a PENDING payment for the bill. */
  intent: (gift: GiftInput) => apiClient.post<PaymentStart>("/api/payments/intent", gift),
  /** Monthly sponsorship + its first PENDING payment. */
  recurring: (gift: GiftInput) => apiClient.post<PaymentStart>("/api/payments/recurring", gift),
  /**
   * Stub (test) mode: completes the payment with the outcome of the test card
   * ("decline" = 4000 0000 0000 0002). Live mode: reports its current status.
   */
  confirm: (paymentId: string, simulate: "success" | "decline" = "success") =>
    apiClient.post<{ paymentId: string; status: PaymentStatus }>("/api/payments/confirm", { paymentId, simulate }),
  receipt: (paymentId: string) => apiClient.get<PaymentReceipt>(`/api/payments/${paymentId}/receipt`),
};

/** GET /api/payments/:id/receipt */
export interface PaymentReceipt {
  id: string;
  transactionId: string;
  date: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  recurring: boolean;
  donorName: string;
  anonymous: boolean;
  studentName: string;
  congregation: string;
  items: { billName: string; amount: number }[];
  organizationName: string;
}

export const sponsorApi = {
  me: () => apiClient.get<Sponsor>("/api/sponsors/me"),
  dashboard: () => apiClient.get<SponsorDashboard>("/api/sponsors/me/dashboard"),
  /** Full giving history (backend caps perPage at 100). */
  payments: (page = 1) =>
    apiClient.getPage<SentPaymentRow[]>("/api/sponsors/me/payments", { params: { page, perPage: 100 } }),

  recurring: () => apiClient.get<RecurringSponsorship[]>("/api/sponsors/me/recurring"),
  pauseRecurring: (id: string) => apiClient.patch<RecurringSponsorship>(`/api/sponsors/me/recurring/${id}/pause`),
  resumeRecurring: (id: string) => apiClient.patch<RecurringSponsorship>(`/api/sponsors/me/recurring/${id}/resume`),
  cancelRecurring: (id: string) => apiClient.delete(`/api/sponsors/me/recurring/${id}`),
};
