/** Domain types for the Vocation Movement Platform. */

export type UserRole = "student" | "sponsor" | "admin" | "superadmin";

/**
 * Admin accounts are provisioned from the backend (never self-registered).
 * A "superadmin" tier has every admin power plus oversight of all admins and
 * exclusive control of the platform commission. See ARCHITECTURE.md §1 / §7.1.
 */
export type AdminStatus = "Active" | "Suspended";

export interface Admin {
  id: string;
  name: string;
  email: string;
  tier: "admin" | "superadmin";
  status: AdminStatus;
  createdAt: string; // ISO
  lastActive?: string; // ISO
}

export type FormationStage = "Seminarian" | "Novice" | "Postulant";

export type BillCategory =
  | "School Fees"
  | "Clothing"
  | "Feeding"
  | "Books"
  | "Medical"
  | "Miscellaneous";

export type BillStatus = "Active" | "Fully Funded" | "Overdue" | "Archived";

export type PaymentStatus = "Confirmed" | "Pending" | "Failed";

export type VerificationStatus =
  | "Pending Verification"
  | "Verified"
  | "Rejected"
  | "Suspended";

export interface Contribution {
  id: string;
  billId: string;
  donorName: string; // "Anonymous" when anonymous
  anonymous: boolean;
  amount: number;
  date: string; // ISO
  transactionId: string;
  status: PaymentStatus;
  recurring?: boolean;
}

export interface Bill {
  id: string;
  studentId: string;
  name: string;
  category: BillCategory;
  total: number;
  raised: number;
  dueDate: string; // ISO
  description?: string;
  status: BillStatus;
  contributions: Contribution[];
}

export interface Student {
  id: string;
  slug: string;
  name: string;
  photo: string;
  formationStage: FormationStage;
  congregation: string;
  school: string;
  country: string;
  location: string;
  dateOfBirth?: string;
  gender?: string;
  yearOfFormation?: string;
  expectedYear?: string;
  biography: string;
  verification: VerificationStatus;
  createdAt: string;
  bills: Bill[];
  sponsorCount: number;
  profileCompletion: number; // 0-100
}

export interface Sponsor {
  id: string;
  name: string;
  email: string;
  country: string;
  currency: string;
  anonymousByDefault: boolean;
  totalGiven: number;
  studentsSponsored: number;
  activeRecurring: number;
  monthlyCommitment: number;
}

export interface RecurringSponsorship {
  id: string;
  studentId: string;
  studentName: string;
  studentPhoto: string;
  amount: number;
  billName: string;
  active: boolean;
  nextDate: string;
}

export interface MessageReply {
  id: string;
  from: "student" | "sponsor";
  body: string;
  date: string;
}

export interface ThankYouMessage {
  id: string;
  studentId: string;
  studentName: string;
  studentPhoto: string;
  sponsorName: string; // may be "Anonymous (via Admin)"
  anonymousDonor: boolean;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  photoAttachment?: string;
  replies: MessageReply[];
}

export interface PlatformStats {
  studentsSupported: number;
  fundsRaised: number;
  sponsors: number;
  activeSponsorships: number;
}
