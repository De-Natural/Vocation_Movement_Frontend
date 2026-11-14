import { apiClient } from "./api-client";
import type { Bill, BillCategory, Contribution, Student, ThankYouMessage } from "./types";

/** GET /api/religious/me/dashboard */
export interface StudentDashboard {
  student: Student;
  kpis: {
    totalRaised: number;
    totalNeeded: number;
    overviewPct: number;
    sponsorCount: number;
    anonymousSponsors: number;
    unreadMessages: number;
    profileCompletion: number;
  };
  pendingBills: Bill[];
  recentPayments: Contribution[];
}

export interface BillInput {
  name: string;
  category: BillCategory;
  total: number;
  dueDate: string;
  description?: string;
}

export const studentApi = {
  dashboard: () => apiClient.get<StudentDashboard>("/api/religious/me/dashboard"),
  payments: () => apiClient.get<Contribution[]>("/api/religious/me/payments"),

  createBill: (bill: BillInput) => apiClient.post<Bill>("/api/bills", bill),
  updateBill: (id: string, bill: Partial<BillInput>) => apiClient.put<Bill>(`/api/bills/${id}`, bill),
  archiveBill: (id: string) => apiClient.patch<Bill>(`/api/bills/${id}/archive`),
};

/** Thank-you threads — shared by the student and sponsor inboxes. */
export const messagesApi = {
  list: () => apiClient.get<ThankYouMessage[]>("/api/messages"),
  /** Student → sponsor thank-you, addressed by the gift's payment id. */
  send: (body: { paymentId: string; subject?: string; body: string }) =>
    apiClient.post<ThankYouMessage>("/api/messages", body),
  reply: (id: string, body: string) => apiClient.post<ThankYouMessage>(`/api/messages/${id}/replies`, { body }),
  markRead: (id: string) => apiClient.patch(`/api/messages/${id}/read`),
};
