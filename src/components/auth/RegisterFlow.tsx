"use client";

import { useEffect, useRef, useState } from "react";
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
import { apiClient, ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { publicApi } from "@/lib/public-api";
import type { BillCategory } from "@/lib/types";

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

/* ── File upload ── */
// Must match the backend's UploadsService rules (photos / documents buckets).
const PHOTO_RULE = {
  accept: "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp",
  mimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxBytes: 5 * 1024 * 1024,
  hint: "PNG, JPG, JPEG or WEBP, up to 5MB",
};
const DOCUMENT_RULE = {
  accept: "application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp",
  mimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
  maxBytes: 20 * 1024 * 1024,
  hint: "PDF, PNG, JPG, JPEG or WEBP, up to 20MB",
};
type UploadRule = typeof PHOTO_RULE;

/** Returns an error message, or null if the file passes the rule. */
function checkFile(file: File, rule: UploadRule): string | null {
  if (!rule.mimeTypes.includes(file.type)) return `Unsupported file type. Allowed: ${rule.hint}.`;
  if (file.size > rule.maxBytes) return `File is too large. Allowed: ${rule.hint}.`;
  return null;
}

function formatBytes(n: number) {
  return n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function FileDropzone({
  label,
  required,
  title,
  rule,
  file,
  onChange,
  onError,
  preview,
}: {
  label: string;
  required?: boolean;
  title: string;
  rule: UploadRule;
  file: File | null;
  onChange: (f: File | null) => void;
  onError: (msg: string) => void;
  /** Show an image thumbnail of the selected file. */
  preview?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!preview || !file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, preview]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const error = checkFile(f, rule);
    if (error) onError(error);
    else onChange(f);
  };

  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept={rule.accept}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-input border-[1.5px] border-inputborder bg-white p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Selected file preview" className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-input bg-gold/12 text-label font-semibold text-gold-dark">
              {file.type === "application/pdf" ? "PDF" : "IMG"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption font-semibold text-navy">{file.name}</p>
            <p className="text-label text-muted">{formatBytes(file.size)}</p>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-caption font-semibold text-accent hover:underline">
            Change
          </button>
          <button type="button" onClick={() => onChange(null)} aria-label="Remove file" className="text-muted hover:text-navy">
            <XIcon size={18} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`flex w-full items-center justify-center rounded-input border-[1.5px] border-dashed bg-white py-7 text-center transition-colors hover:border-gold ${
            dragging ? "border-gold bg-gold/5" : "border-inputborder"
          }`}
        >
          <span className="text-muted">
            <UploadIcon size={26} className="mx-auto mb-2 text-gold" />
            <span className="block text-caption font-semibold text-navy">{title}</span>
            <span className="block text-label">Click or drag a file here · {rule.hint}</span>
          </span>
        </button>
      )}
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

type Stage = "Seminarian" | "Novice" | "Postulant" | "Sister";
type Currency = "USD" | "NGN" | "GHS" | "EUR" | "GBP";

/** Everything the multi-step form collects; kept in state so values survive step changes. */
interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  // student
  dob: string;
  gender: string;
  stage: Stage | "";
  congregation: string;
  school: string;
  yearOfFormation: string;
  expectedYear: string;
  // sponsor
  currency: Currency;
  anonymous: boolean;
}

const EMPTY_FORM: RegisterForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  country: "",
  dob: "",
  gender: "",
  stage: "",
  congregation: "",
  school: "",
  yearOfFormation: "",
  expectedYear: "",
  currency: "USD",
  anonymous: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIO_MIN = 100;
const BIO_MAX = 5000; // backend upsertReligiousProfileSchema limit

/** First number in a label like "Year 2" (the backend parses it the same way). */
const firstNumber = (s: string) => {
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : NaN;
};

/** Mirrors the backend schemas so users get errors before the last step. */
function validateStep(role: Role, step: number, f: RegisterForm, bio = ""): string | null {
  if (step === 0) {
    if (f.fullName.trim().length < 2) return "Please enter your full name.";
    if (!EMAIL_RE.test(f.email.trim())) return "Please enter a valid email address.";
    if (f.password.length < 8) return "Password must be at least 8 characters.";
  }
  if (role === "student" && step === 1) {
    if (!f.stage) return "Please select your formation stage.";
    if (f.congregation.trim().length < 2) return "Please enter your congregation name.";
    if (f.school.trim().length < 2) return "Please enter your school or seminary name.";
    const year = firstNumber(f.yearOfFormation);
    if (!(year >= 1 && year <= 15)) return "Please enter your year of formation, e.g. Year 2.";
    const expected = Number(f.expectedYear.trim());
    const thisYear = new Date().getFullYear();
    if (!/^\d{4}$/.test(f.expectedYear.trim()) || expected < thisYear || expected > thisYear + 20)
      return `Please enter a valid expected ordination / profession year (${thisYear}–${thisYear + 20}).`;
  }
  if (role === "student" && step === 2) {
    const len = bio.trim().length;
    if (len < BIO_MIN) return `Your biography must be at least ${BIO_MIN} characters (currently ${len}).`;
    if (len > BIO_MAX) return `Your biography must be at most ${BIO_MAX} characters.`;
  }
  return null;
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
  const setSession = useSession((s) => s.setSession);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const field =
    (key: keyof RegisterForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // Student draft bills
  const [bills, setBills] = useState<DraftBill[]>([
    { name: "", category: "School Fees", total: "", dueDate: "" },
  ]);
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [admissionLetter, setAdmissionLetter] = useState<File | null>(null);

  // Sponsors start with the platform's "anonymous by default" setting.
  useEffect(() => {
    publicApi
      .settings()
      .then((s) => setForm((f) => ({ ...f, anonymous: s.anonymousDefault })))
      .catch(() => undefined);
  }, []);

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
    const error =
      validateStep(role, step, form, bio) ??
      (role === "student" && step === 2 && !admissionLetter
        ? "Please upload your school admission letter."
        : null);
    if (error) {
      toast(error, "error");
      return;
    }
    if (isLast) {
      void finish(role);
    } else {
      setStep((s) => s + 1);
    }
  };
  const back = () => (step === 0 ? setRole(null) : setStep((s) => s - 1));

  /**
   * 1. POST /api/auth/register (creates user + profile, sends verification email)
   * 2. POST /api/auth/login    (sets the session cookies)
   * 3. Save the extras the register endpoint doesn't take: student profile
   *    details + draft bills, or sponsor giving preferences.
   */
  async function finish(r: Role) {
    if (submitting) return;
    setSubmitting(true);
    const email = form.email.trim();

    try {
      await apiClient.auth.register({
        email,
        password: form.password,
        role: r,
        fullName: form.fullName.trim(),
        country: form.country.trim() || undefined,
        ...(r === "student"
          ? {
              formationStage: form.stage as Stage,
              congregation: form.congregation.trim(),
              school: form.school.trim(),
            }
          : {}),
      });
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 0
          ? "Can't reach the server. Please try again."
          : err instanceof Error
            ? err.message
            : "Registration failed.";
      toast(message, "error");
      // Account details (email/password) live on step 0 — send the user back there.
      if (err instanceof ApiError && (err.code === "EMAIL_TAKEN" || err.status === 400)) setStep(0);
      setSubmitting(false);
      return;
    }

    try {
      const session = await apiClient.auth.login({ email, password: form.password, role: r });
      setSession({ ...session, email, name: session.name ?? form.fullName.trim() });

      const extras: Promise<unknown>[] = [];
      if (r === "student") {
        const profile: Record<string, string> = {};
        if (bio.trim()) profile.biography = bio.trim();
        if (form.phone.trim()) profile.phoneNumber = form.phone.trim();
        if (form.dob) profile.dateOfBirth = form.dob;
        if (form.gender) profile.gender = form.gender;
        if (form.yearOfFormation.trim()) profile.yearOfFormation = form.yearOfFormation.trim();
        if (form.expectedYear.trim()) profile.expectedYear = form.expectedYear.trim();
        if (Object.keys(profile).length) extras.push(apiClient.patch("/api/religious/profile", profile));

        // Uploads need the session cookies, so they run after login.
        if (photo) {
          const fd = new FormData();
          fd.append("file", photo);
          extras.push(apiClient.post("/api/religious/photo", fd));
        }
        if (admissionLetter) {
          const fd = new FormData();
          fd.append("file", admissionLetter);
          fd.append("label", "Admission Letter");
          extras.push(apiClient.post("/api/religious/documents", fd));
        }

        bills
          .filter((b) => b.name.trim().length >= 2 && Number(b.total) > 0 && b.dueDate)
          .forEach((b) =>
            extras.push(
              apiClient.post("/api/bills", {
                name: b.name.trim(),
                category: b.category,
                total: Number(b.total),
                dueDate: b.dueDate,
              })
            )
          );
      } else {
        extras.push(
          apiClient.patch("/api/sponsors/profile", {
            currency: form.currency,
            anonymousByDefault: form.anonymous,
          })
        );
      }

      const results = await Promise.allSettled(extras);
      if (results.some((x) => x.status === "rejected")) {
        toast("Account created, but some details didn't save. You can update them from your dashboard.", "error");
      } else {
        toast(
          r === "student"
            ? "Profile submitted! It is now pending admin verification. Check your email to verify your address."
            : "Welcome! Check your email to verify your address.",
          "success"
        );
      }
      router.push(`/dashboard/${session.role}`);
    } catch {
      // Account exists but auto sign-in failed — let them sign in manually.
      toast("Account created. Please verify your email, then sign in.", "success");
      router.push("/verify-email");
    } finally {
      setSubmitting(false);
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
              <Input label="Full name" name="name" required placeholder="Br. Emeka Okonkwo" value={form.fullName} onChange={field("fullName")} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date of birth" name="dob" type="date" required value={form.dob} onChange={field("dob")} />
                <Select label="Gender" name="gender" required placeholder="Select" value={form.gender} onChange={field("gender")} options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]} />
              </div>
              <Input label="Country" name="country" required placeholder="Nigeria" value={form.country} onChange={field("country")} />
              <Input label="Phone number" name="phone" type="tel" required placeholder="+234 800 000 0000" value={form.phone} onChange={field("phone")} />
              <Input label="Email" name="email" type="email" required placeholder="you@example.com" value={form.email} onChange={field("email")} />
              <Input label="Password" name="password" type="password" required hint="At least 8 characters." value={form.password} onChange={field("password")} />
            </>
          )}

          {role === "student" && step === 1 && (
            <>
              <Select label="Formation stage" name="stage" required placeholder="Select stage" value={form.stage} onChange={field("stage")} options={[
                { value: "Seminarian", label: "Seminarian" },
                { value: "Novice", label: "Novice" },
                { value: "Postulant", label: "Postulant" },
              ]} />
              <Input label="Congregation name" name="congregation" required placeholder="Missionaries of the Precious Blood" value={form.congregation} onChange={field("congregation")} />
              <Input label="School / Seminary name" name="school" required placeholder="St. Joseph Major Seminary" value={form.school} onChange={field("school")} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Year of formation" name="year" required placeholder="Year 2" value={form.yearOfFormation} onChange={field("yearOfFormation")} />
                <Input label="Expected ordination / profession year" name="expected" type="number" inputMode="numeric" required placeholder="2028" value={form.expectedYear} onChange={field("expectedYear")} />
              </div>
            </>
          )}

          {role === "student" && step === 2 && (
            <>
              <FileDropzone
                label="Profile photo"
                title="Upload a photo"
                rule={PHOTO_RULE}
                file={photo}
                onChange={setPhoto}
                onError={(m) => toast(m, "error")}
                preview
              />
              <Textarea
                label="Biography"
                name="bio"
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell sponsors about your calling, your journey, and your hopes…"
                maxLength={BIO_MAX}
                hint={
                  bio.trim().length >= BIO_MIN
                    ? `✓ ${bio.trim().length} characters`
                    : `Minimum ${BIO_MIN} characters. ${bio.trim().length}/${BIO_MIN}`
                }
                rows={5}
              />
              <FileDropzone
                label="School admission letter (for admin verification)"
                required
                title="Upload PDF or image"
                rule={DOCUMENT_RULE}
                file={admissionLetter}
                onChange={setAdmissionLetter}
                onError={(m) => toast(m, "error")}
              />
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
              <Input label="Full name" name="name" required placeholder="Mrs. Onyeka Adeleke" value={form.fullName} onChange={field("fullName")} />
              <Input label="Email" name="email" type="email" required placeholder="you@example.com" value={form.email} onChange={field("email")} />
              <Input label="Phone" name="phone" type="tel" required placeholder="+234 800 000 0000" value={form.phone} onChange={field("phone")} />
              <Input label="Country" name="country" required placeholder="Nigeria" value={form.country} onChange={field("country")} />
              <Input label="Password" name="password" type="password" required hint="At least 8 characters." value={form.password} onChange={field("password")} />
            </>
          )}

          {role === "sponsor" && step === 1 && (
            <>
              <div className="rounded-card border border-inputborder/50 bg-white p-4">
                <Toggle
                  checked={form.anonymous}
                  onChange={(v: boolean) => setForm((f) => ({ ...f, anonymous: v }))}
                  label="Give anonymously by default"
                />
                <p className="mt-2 text-caption text-muted">
                  You can change this for any individual gift.
                </p>
              </div>
              <Select label="Preferred currency" name="currency" required value={form.currency} onChange={field("currency")} options={[
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
                When you click Finish we&apos;ll create your account and email you a verification
                link. Click it to confirm your address.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex gap-3">
        <Button variant="secondary" onClick={back} className="flex-1">
          {step === 0 ? "Change role" : "Back"}
        </Button>
        <Button variant="primary" onClick={next} className="flex-1" disabled={submitting}>
          {submitting ? "Submitting…" : isLast ? (role === "student" ? "Submit for Review" : "Finish") : "Continue"}
        </Button>
      </div>
    </AuthShell>
  );
}
