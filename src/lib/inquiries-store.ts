import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string; // ISO
  read: boolean;
}

interface InquiriesState {
  inquiries: ContactInquiry[];
  add: (data: Omit<ContactInquiry, "id" | "date" | "read">) => void;
  markRead: (id: string) => void;
  remove: (id: string) => void;
}

/**
 * Contact form submissions (PRD contact flow). Persisted to localStorage so a
 * message submitted on /contact is visible to the admin dashboard in the same
 * browser — a stand-in for a real backend inbox in this demo.
 */
export const useInquiries = create<InquiriesState>()(
  persist(
    (set) => ({
      inquiries: [],
      add: (data) =>
        set((state) => ({
          inquiries: [
            {
              ...data,
              id: `inq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              date: new Date().toISOString(),
              read: false,
            },
            ...state.inquiries,
          ],
        })),
      markRead: (id) =>
        set((state) => ({
          inquiries: state.inquiries.map((i) => (i.id === id ? { ...i, read: true } : i)),
        })),
      remove: (id) =>
        set((state) => ({
          inquiries: state.inquiries.filter((i) => i.id !== id),
        })),
    }),
    { name: "vocation-inquiries" }
  )
);
