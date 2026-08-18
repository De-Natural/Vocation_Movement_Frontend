"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthShell, StepIndicator } from "./AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Toggle, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  HeartHandIcon,
  BookIcon,
  UploadIcon,
  CheckCircleIcon,
  PlusIcon,
  XIcon,
  ArrowRightIcon,
} from "@/components/ui/icons";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/lib/store";
import { formatCurrency } from "@/lib/format";
import type { BillCategory, UserRole } from "@/lib/types";

type Role = "student" | "sponsor";

const BILL_CATEGORIES: BillCategory[] = [
  "School Fees",
  "Clothing",
  "Feeding",
  "Books",
  "Medical",
  "Miscellaneous",
];

/* ── Role chooser ── */
function RoleChooser({ onPick }: { onPick: (r: Role) => void }) {
  const cards: { role: Role; icon: React.ReactNode; title: string; text: string }[] = [
    {
      role: "sponsor",
      icon: <HeartHandIcon size={28} />,
      title: "I am a Sponsor",
      text: "Browse religious students, fund specific bills, and walk with them in their formation.",
    },
    {
      role: "student",
      icon: <BookIcon size={28} />,
      title: "I am a Religious Student",
      text: "Create your profile, list your formation needs, and receive support from generous sponsors.",
    },
  ];
  return (
    <div className="space-y-4">
      {cards.map((c) => (
        <button
          key={c.role}
          onClick={() => onPick(c.role)}
          className="group flex w-full items-center gap-4 rounded-card border-[1.5px] border-inputborder bg-white p-5 text-left transition-all hover:border-gold hover:shadow-card"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/12 text-gold-dark transition-colors group-hover:bg-gold group-hover:text-white">
            {c.icon}
          </span>
          <span className="flex-1">
            <span className="block font-display text-h3 text-navy">{c.title}</span>
            <span className="mt-0.5 block text-caption text-muted">{c.text}</span>
          </span>
          <ArrowRightIcon size={20} className="text-muted group-hover:text-gold" />
        </button>
      ))}
      <p className="pt-2 text-center text-caption text-muted">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

const STUDENT_STEPS = ["Personal Info", "Formation Details", "Profile Setup", "Bill Setup", "Review & Submit"];
const SPONSOR_STEPS = ["Account Info", "Giving Preferences", "Verify Email"];

interface DraftBill {
  name: string;
  category: BillCategory;
  total: string;
  dueDate: string;
}

export function RegisterFlow() {
  const params = useSearchParams();
  const initialRole = params.get("role") as Role | null;
  const [role, setRole] = useState<Role | null>(
    initialRole === "student" || initialRole === "sponsor" ? initialRole : null
  );
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { toast } = useToast();
  const setSessionRole = useSession((s) => s.setRole);

  // Student draft bills
  const [bills, setBills] = useState<DraftBill[]>([
    { name: "School Fees — Session 2026", category: "School Fees", total: "1200", dueDate: "2026-10-15" },
  ]);
  const [bio, setBio] = useState("");

  const steps = role === "student" ? STUDENT_STEPS : SPONSOR_STEPS;

  if (!role) {
    return (
      <AuthShell title="Join the Movement" subtitle="Choose how you would like to take part.">
        <RoleChooser
          onPick={(r) => {
            setRole(r);
            setStep(0);
          }}
        />
      </AuthShell>
    );
  }

  const isLast = step === steps.length - 1;

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };
  const back = () => (step === 0 ? setRole(null) : setStep((s) => s - 1));

  function finish() {
    const roleName: UserRole = role === "student" ? "student" : "sponsor";
    if (role === "student") {
      toast("Profile submitted! It is now pending admin verification.", "success");
      setSessionRole(roleName, "Brother Emeka Okonkwo");
      router.push("/dashboard/student");
    } else {
      toast("Welcome! Your sponsor account is now active.", "success");
      setSessionRole(roleName, "Mrs. Onyeka Adeleke");
      router.push("/dashboard/sponsor");
    }
  }

  const addBill = () =>
    setBills((b) => [...b, { name: "", category: "School Fees", total: "", dueDate: "" }]);
  const removeBill = (i: number) => setBills((b) => b.filter((_, idx) => idx !== i));
  const updateBill = (i: number, patch: Partial<DraftBill>) =>
    setBills((b) => b.map((bill, idx) => (idx === i ? { ...bill, ...patch } : bill)));

  return (
    <AuthShell
      title={role === "student" ? "Religious Student Registration" : "Sponsor Registration"}
      subtitle={role === "student" ? "Share your story so sponsors can walk with you." : "Set up your account to start giving."}
    >
      <StepIndicator steps={steps} current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* ── STUDENT FLOW ── */}
          {role === "student" && step === 0 && (
            <>
              <Input label="Full name" name="name" required placeholder="Br. Emeka Okonkwo" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date of birth" name="dob" type="date" required />
                <Select label="Gender" name="gender" required placeholder="Select" options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]} />
              </div>
              <Input label="Nationality" name="nationality" required placeholder="Nigerian" />
              <Input label="Phone number" name="phone" type="tel" required placeholder="+234 800 000 0000" />
              <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
              <Input label="Password" name="password" type="password" required hint="At least 8 characters." />
            </>
          )}

          {role === "student" && step === 1 && (
            <>
              <Select label="Formation stage" name="stage" required placeholder="Select stage" options={[
                { value: "Seminarian", label: "Seminarian" },
                { value: "Novice", label: "Novice" },
                { value: "Postulant", label: "Postulant" },
              ]} />
              <Input label="Congregation name" name="congregation" required placeholder="Missionaries of the Precious Blood" />
              <Input label="School / Seminary name" name="school" required placeholder="St. Joseph Major Seminary" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Year of formation" name="year" required placeholder="Year 2" />
                <Input label="Expected ordination / profession year" name="expected" required placeholder="2028" />
              </div>
            </>
          )}

          {role === "student" && step === 2 && (
            <>
              <div>
                <Label>Profile photo</Label>
                <div className="flex items-center justify-center rounded-input border-[1.5px] border-dashed border-inputborder bg-white py-8 text-center">
                  <div className="text-muted">
                    <UploadIcon size={28} className="mx-auto mb-2 text-gold" />
                    <p className="text-caption font-semibold text-navy">Upload a photo</p>
                    <p className="text-label">PNG or JPG, up to 5MB</p>
                  </div>
                </div>
              </div>
              <Textarea
                label="Biography"
                name="bio"
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell sponsors about your calling, your journey, and your hopes…"
                hint={`Minimum 100 characters. ${bio.length}/100`}
                rows={5}
              />
              <div>
                <Label required>School admission letter</Label>
                <div className="flex items-center justify-center rounded-input border-[1.5px] border-dashed border-inputborder bg-white py-6 text-center">
                  <div className="text-muted">
                    <UploadIcon size={24} className="mx-auto mb-2 text-gold" />
                    <p className="text-caption font-semibold text-navy">Upload PDF or image</p>
                    <p className="text-label">For admin verification</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {role === "student" && step === 3 && (
            <>
              <p className="text-caption text-muted">
                Add the bills you need help with. You can add more later from your Bill Board.
              </p>
              {bills.map((bill, i) => (
                <div key={i} className="rounded-card border border-inputborder/50 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-caption font-semibold text-navy">Bill {i + 1}</span>
                    {bills.length > 1 && (
                      <button onClick={() => removeBill(i)} className="text-muted hover:text-alert" aria-label="Remove bill">
                        <XIcon size={16} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Input label="Bill name" value={bill.name} onChange={(e) => updateBill(i, { name: e.target.value })} placeholder="School Fees — Session 2026" />
                    <div className="grid grid-cols-2 gap-3">
                      <Select label="Category" value={bill.category} onChange={(e) => updateBill(i, { category: e.target.value as BillCategory })} options={BILL_CATEGORIES.map((c) => ({ value: c, label: c }))} />
                      <Input label="Total amount" type="number" value={bill.total} onChange={(e) => updateBill(i, { total: e.target.value })} placeholder="1200" />
                    </div>
                    <Input label="Due date" type="date" value={bill.dueDate} onChange={(e) => updateBill(i, { dueDate: e.target.value })} />
                  </div>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={addBill} className="w-full">
                <PlusIcon size={16} /> Add another bill
              </Button>
            </>
          )}

          {role === "student" && step === 4 && (
            <div className="space-y-4">
              <div className="rounded-card bg-warm/60 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Badge tone="amber">Pending Verification</Badge>
                </div>
                <p className="text-body text-navy">
                  Your profile will be reviewed by an administrator before it goes live.
                  You&apos;ll be notified once approved.
                </p>
              </div>
              <div className="rounded-card border border-inputborder/50 bg-white p-5">
                <h3 className="mb-3 font-display text-h3 text-navy">Bills to be listed</h3>
                <ul className="space-y-2">
                  {bills.map((b, i) => (
                    <li key={i} className="flex justify-between text-caption">
                      <span className="text-muted">{b.name || `Bill ${i + 1}`}</span>
                      <span className="font-semibold text-navy">
                        {b.total ? formatCurrency(Number(b.total)) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── SPONSOR FLOW ── */}
          {role === "sponsor" && step === 0 && (
            <>
              <Input label="Full name" name="name" required placeholder="Mrs. Onyeka Adeleke" />
              <Input label="Email" name="email" type="email" required placeholder="you@example.com" />
              <Input label="Phone" name="phone" type="tel" required placeholder="+234 800 000 0000" />
              <Input label="Country" name="country" required placeholder="Nigeria" />
              <Input label="Password" name="password" type="password" required hint="At least 8 characters." />
            </>
          )}

          {role === "sponsor" && step === 1 && (
            <>
              <div className="rounded-card border border-inputborder/50 bg-white p-4">
                <Toggle checked={true} onChange={() => {}} label="Give anonymously by default" />
                <p className="mt-2 text-caption text-muted">
                  You can change this for any individual gift.
                </p>
              </div>
              <Select label="Preferred currency" name="currency" required options={[
                { value: "USD", label: "USD — US Dollar" },
                { value: "NGN", label: "NGN — Nigerian Naira" },
                { value: "GHS", label: "GHS — Ghanaian Cedi" },
                { value: "EUR", label: "EUR — Euro" },
              ]} />
              <Input label="Preferred congregation (optional)" name="congregation" placeholder="Any congregation" hint="Filter students by congregation. Leave blank to see all." />
            </>
          )}

          {role === "sponsor" && step === 2 && (
            <div className="rounded-card bg-success-soft p-6 text-center">
              <CheckCircleIcon size={40} className="mx-auto mb-3 text-success" />
              <h3 className="font-display text-h3 text-navy">Verify your email</h3>
              <p className="mt-2 text-caption text-muted">
                We&apos;ve sent a verification link to your inbox. Click it to activate your account.
                For this demo, continue below.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex gap-3">
        <Button variant="secondary" onClick={back} className="flex-1">
          {step === 0 ? "Change role" : "Back"}
        </Button>
        <Button variant="primary" onClick={next} className="flex-1">
          {isLast ? (role === "student" ? "Submit for Review" : "Finish") : "Continue"}
        </Button>
      </div>
    </AuthShell>
  );
}
