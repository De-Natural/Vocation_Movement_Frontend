import { apiClient } from "./api-client";

export type WithdrawalStatus = "awaiting_otp" | "processing" | "paid" | "failed" | "cancelled";

export interface Withdrawal {
  id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  bankName: string;
  accountNumber: string; // masked, e.g. ******1234
  accountName: string;
  reference: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
}

/** GET /api/withdrawals/me */
export interface WithdrawalSummary {
  currency: string; // "NGN"
  available: number;
  /** Foreign-currency gifts converted at the Super-Admin's payout rate (included in `available`). */
  converted: { currency: string; amount: number; rate: number; naira: number }[];
  /** Currencies with no payout rate yet: shown, not withdrawable. */
  otherBalances: { currency: string; amount: number }[];
  phone: { number: string | null; verified: boolean };
  account: { bankName: string; accountNumber: string; accountName: string } | null;
  limits: { min: number; max: number; dailyMax: number };
  liveTransfers: boolean;
  /** Test mode: SMS codes are shown on screen (no SMS service connected). */
  testCodes?: boolean;
  withdrawals: Withdrawal[];
}

export interface Bank {
  code: string;
  name: string;
}

export const withdrawalsApi = {
  summary: () => apiClient.get<WithdrawalSummary>("/api/withdrawals/me"),

  sendPhoneCode: (phone: string) =>
    apiClient.post<{ sentTo: string; alreadyVerified: boolean; testCode?: string }>("/api/withdrawals/phone/send-otp", { phone }),
  verifyPhone: (code: string) => apiClient.post<{ number: string; verified: boolean }>("/api/withdrawals/phone/verify", { code }),

  banks: () => apiClient.get<Bank[]>("/api/withdrawals/banks"),
  resolveAccount: (bankCode: string, accountNumber: string) =>
    apiClient.post<{ bankName: string; accountNumber: string; accountName: string }>("/api/withdrawals/account/resolve", {
      bankCode,
      accountNumber,
    }),
  requestAccount: (bankCode: string, accountNumber: string) =>
    apiClient.post<{ sentTo: string; bankName: string; accountName: string; testCode?: string }>("/api/withdrawals/account", {
      bankCode,
      accountNumber,
    }),
  confirmAccount: (code: string) =>
    apiClient.post<{ bankName: string; accountNumber: string; accountName: string }>("/api/withdrawals/account/confirm", { code }),

  start: (amount: number) =>
    apiClient.post<{ withdrawal: Withdrawal; sentTo: string; testCode?: string }>("/api/withdrawals", { amount }),
  confirm: (id: string, code: string) => apiClient.post<Withdrawal>(`/api/withdrawals/${id}/confirm`, { code }),

  /** Admin: every withdrawal. */
  adminList: (params: { page?: number; status?: string } = {}) =>
    apiClient.get<{
      items: (Withdrawal & { studentName: string; studentSlug: string })[];
      totals: Record<string, { count: number; amount: number }>;
      liveTransfers: boolean;
    }>("/api/withdrawals/admin", { params }),
};
