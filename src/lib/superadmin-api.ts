import { apiClient } from "./api-client";
import type { Admin, VerificationStatus } from "./types";

/** A staff account (GET /api/superadmin/admins). */
export interface StaffMember extends Admin {
  actionsCount: number;
}

/** A student or sponsor account (GET /api/superadmin/users). */
export interface PlatformUser {
  id: string;
  profileId?: string;
  slug?: string;
  role: "student" | "sponsor";
  name: string;
  email: string;
  emailVerified: boolean;
  status: "Active" | "Suspended";
  verification?: VerificationStatus;
  createdAt: string;
  lastActive?: string;
  /** Student: total raised. Sponsor: total given. */
  amount: number;
}

export type AuditAction =
  | "VERIFY_PROFILE"
  | "REJECT_PROFILE"
  | "REQUEST_INFO"
  | "SUSPEND_USER"
  | "UNSUSPEND_USER"
  | "UPDATE_SETTINGS"
  | "DELETE_INQUIRY"
  | "CREATE_ADMIN"
  | "DELETE_ADMIN";

/** One audit-log entry (GET /api/superadmin/activity). */
export interface AuditEntry {
  id: string;
  action: AuditAction;
  actorId: string | null;
  actorName: string;
  targetUserId: string | null;
  targetName: string | null;
  reason: string | null;
  createdAt: string;
}

/** GET /api/superadmin/overview */
export interface SuperAdminOverview {
  counts: {
    superAdmins: number;
    admins: number;
    students: number;
    sponsors: number;
    suspendedAdmins: number;
    suspendedStudents: number;
    suspendedSponsors: number;
  };
  verification: Partial<Record<VerificationStatus, number>>;
  fundsRaised: number;
  staffActionsLast30Days: number;
  recentActivity: AuditEntry[];
}

export interface UsersQuery {
  role?: "student" | "sponsor" | "all";
  status?: "active" | "suspended" | "all";
  search?: string;
  page?: number;
  perPage?: number;
}

const withReason = (reason: string) => ({ reason });

export const superAdminApi = {
  overview: () => apiClient.get<SuperAdminOverview>("/api/superadmin/overview"),

  admins: () => apiClient.get<StaffMember[]>("/api/superadmin/admins"),
  createAdmin: (body: { name: string; email: string; password: string }) =>
    apiClient.post<StaffMember>("/api/superadmin/admins", body),
  suspendAdmin: (id: string, reason: string) =>
    apiClient.patch(`/api/superadmin/admins/${id}/suspend`, withReason(reason)),
  reactivateAdmin: (id: string, reason: string) =>
    apiClient.patch(`/api/superadmin/admins/${id}/reactivate`, withReason(reason)),
  deleteAdmin: (id: string, reason: string) =>
    apiClient.delete(`/api/superadmin/admins/${id}`, { body: JSON.stringify(withReason(reason)) }),

  users: (query: UsersQuery) =>
    apiClient.getPage<PlatformUser[]>("/api/superadmin/users", { params: { ...query } }),
  reactivateUser: (id: string, reason: string) =>
    apiClient.patch(`/api/superadmin/users/${id}/reactivate`, withReason(reason)),
  /** Suspend a student or sponsor (shared admin endpoint). */
  suspendUser: (id: string, reason: string) => apiClient.post(`/api/admin/suspend/${id}`, withReason(reason)),

  activity: (query: { actorId?: string; page?: number; perPage?: number } = {}) =>
    apiClient.getPage<AuditEntry[]>("/api/superadmin/activity", { params: { ...query } }),
};

/** Human wording for audit actions. */
export const AUDIT_LABELS: Record<AuditAction, string> = {
  VERIFY_PROFILE: "verified the profile of",
  REJECT_PROFILE: "rejected the profile of",
  REQUEST_INFO: "requested more information from",
  SUSPEND_USER: "suspended",
  UNSUSPEND_USER: "reactivated",
  UPDATE_SETTINGS: "updated platform settings",
  DELETE_INQUIRY: "deleted a contact inquiry",
  CREATE_ADMIN: "created the admin account for",
  DELETE_ADMIN: "deleted the admin account of",
};
