# Vocation Movement — Architecture & Backend Guide

> **Audience:** This document is written for **both human developers and AI coding agents**.
> It describes what the app *is*, how the frontend is structured, and — most importantly —
> **every place that currently uses mock data and needs a real backend**.
>
> **Status today:** The frontend is feature-complete UI-wise, cleanly typed, and ready for a
> backend. But **there is no backend of any kind yet.** All data comes from a static mock file
> (`src/lib/mock-data.ts`), "auth" is a client-side store, and every write action (payments,
> uploads, verification, registration) is simulated with a toast and local React state. The one
> exception is the contact form, which persists to `localStorage` only.

---

## 1. What the platform is

**Vocation Movement** is a funding platform for religious students (seminarians, novices,
postulants). Sponsors browse verified students, pick a specific need ("bill"), and fund it —
one-time or as a recurring monthly gift. Admins verify student profiles, oversee all activity,
and manage the platform.

There are **three user roles**:

| Role | Can register? | How they get in | Lands on |
|---|---|---|---|
| **Student** | ✅ Yes (self sign-up) | Register → pending admin verification → sign in | `/dashboard/student` |
| **Sponsor** | ✅ Yes (self sign-up) | Register → email verify → sign in | `/dashboard/sponsor` |
| **Admin** | ❌ **No self sign-up** | **Credentials are created in the backend** (provisioned by staff). Admin only **logs in**, and is routed straight to the admin dashboard. | `/dashboard/admin` |

> **Key access rule (per product requirement):** Students and Sponsors create their own
> accounts on the platform. **Admins do NOT register through the UI** — their credentials are
> seeded/created directly in the backend. The sign-in page already reflects this: it has a role
> tab for Admin (login only), while the registration flow only offers Student and Sponsor.
> See `src/components/auth/RegisterFlow.tsx` (`type Role = "student" | "sponsor"`).

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | **Next.js 14.2** (App Router, `src/app/*`) |
| Language | **TypeScript** (`strict: true`, path alias `@/*` → `./src/*`) |
| UI | **React 18** |
| Styling | **Tailwind CSS 3.4** (custom navy/gold/cream theme) + `clsx` + `tailwind-merge` via `cn()` |
| Client state | **Zustand 5** (session store + inquiries store) |
| Server state | **@tanstack/react-query 5** — provider is mounted but **currently unused** (this is the intended seam for real API calls) |
| Animation | **framer-motion** |
| Forms | **None** — hand-rolled with `useState` + manual validation |
| Auth lib | **None** (mocked) |
| Payment lib | **None** (simulated) |
| Fonts | Playfair Display, DM Sans, JetBrains Mono (`next/font/google`) |
| Images | `next/image`, remote pattern limited to `images.unsplash.com` |

**Dev scripts:** `npm run dev` · `npm run build` · `npm run start` · `npm run lint`.
No `.env` files exist yet — a real backend will introduce them.

---

## 3. Directory structure

```
src/
├── app/                                # Next.js App Router — every folder = a route
│   ├── layout.tsx                      # Root layout (fonts, metadata, <Providers>)
│   ├── page.tsx                        # "/"  Landing page
│   ├── globals.css
│   │
│   ├── signin/page.tsx                 # "/signin"    Login for ALL 3 roles
│   ├── register/page.tsx               # "/register"  Signup — Student & Sponsor ONLY
│   │
│   ├── about|mission|contact|privacy|terms/   # Marketing + legal pages
│   │
│   ├── students/
│   │   ├── page.tsx                    # "/students"         Browse/search verified students
│   │   └── [slug]/page.tsx             # "/students/[slug]"  Public profile + donate widget
│   │
│   └── dashboard/
│       ├── student/                    # layout + home, bills, payments, messages
│       ├── sponsor/                    # layout + home, recurring, messages
│       └── admin/                      # layout + overview, verifications, transactions,
│                                       #   inquiries, reports, settings
│
├── components/
│   ├── ui/         # Design-system primitives (Button, Card, ProgressBar, ProgressRing,
│   │               #   Avatar, Modal, Toast, Skeleton, Input/Select/Toggle, icons, …)
│   ├── domain/     # Business logic (StudentCard, BillCard, ContributionPanel,
│   │               #   BillFormModal, PaymentHistoryTable, MessagesView, StatusBadges)
│   ├── layout/     # Navbar, Footer, MarketingShell, DashboardShell (role-based nav)
│   ├── auth/       # AuthShell, RegisterFlow (multi-step wizard)
│   ├── marketing/  # ContactForm
│   ├── landing/    # sections.tsx (Hero, HowItWorks, FeaturedStudents, ImpactNumbers, …)
│   ├── dashboard/  # widgets.tsx (StatTile, SectionHeader, PageTitle)
│   └── providers/  # Providers.tsx (React Query + Toast providers)
│
└── lib/
    ├── types.ts            # ⭐ Canonical data model (Student, Bill, Contribution, Sponsor, …)
    ├── mock-data.ts        # ⭐ ALL seed data — replace with real API/DB
    ├── store.ts            # Zustand mock session (role + name, in-memory only)
    ├── inquiries-store.ts  # Zustand + localStorage contact inbox (only real persistence)
    ├── format.ts           # Currency/date formatters + pct() & progressTier() funding math
    └── utils.ts            # cn() Tailwind class merger
```

---

## 4. Route map

### Public / marketing
| Route | Purpose | Backend needed |
|---|---|---|
| `/` | Landing page (hero, featured students, impact numbers, testimonials) | Featured students + platform stats from API |
| `/about`, `/mission` | Story & mission (static) | None |
| `/privacy`, `/terms` | Legal (static) | None |
| `/contact` | Contact form → writes to inquiries store | **Persist inquiry server-side + notify staff** |
| `/students` | Browse/search **verified** students, filter & sort | Students search/query API |
| `/students/[slug]` | Public student profile + **donation widget** | Student fetch + **payment processing** |

### Auth
| Route | Purpose | Backend needed |
|---|---|---|
| `/signin` | Login for Student / Sponsor / **Admin** | **Authenticate credentials, issue session, forgot-password** |
| `/register` | Signup — **Student & Sponsor only** | **Create account, upload files, email verify, queue for verification** |

### Student dashboard (`/dashboard/student/*`)
| Route | Purpose | Backend needed |
|---|---|---|
| `/dashboard/student` | Home: KPIs, bills overview ring, pending bills, recent payments, profile-completion | Aggregated funding + activity data |
| `/dashboard/student/bills` | Bill Board — create/edit/archive bills | **Bills CRUD** |
| `/dashboard/student/payments` | Received payment history | Received-contributions query |
| `/dashboard/student/messages` | Thank-you messages inbox/threads | **Messaging + attachments** |

### Sponsor dashboard (`/dashboard/sponsor/*`)
| Route | Purpose | Backend needed |
|---|---|---|
| `/dashboard/sponsor` | Home: giving KPIs, "My Students", giving history, impact report | Aggregated giving + PDF report |
| `/dashboard/sponsor/recurring` | Manage recurring gifts (pause/resume/cancel) | **Recurring subscriptions** |
| `/dashboard/sponsor/messages` | Messages from students | **Messaging** |

### Admin dashboard (`/dashboard/admin/*`)
| Route | Purpose | Backend needed |
|---|---|---|
| `/dashboard/admin` | Overview: platform KPIs, verification queue, overdue bills, recent inquiries | Real platform metrics |
| `/dashboard/admin/verifications` | **Approve / reject / suspend / request-info** on student profiles | **Verification workflow + doc access + email** |
| `/dashboard/admin/transactions` | Global transaction feed + filters + CSV export | Transactions query/pagination |
| `/dashboard/admin/inquiries` | Contact-form inbox (read/reply/delete) | **Inquiries API** |
| `/dashboard/admin/reports` | Funding reports by congregation + PDF export | Report generation |
| `/dashboard/admin/settings` | Platform config (fees, currency, toggles) | Persist settings |

---

## 5. Data model (`src/lib/types.ts`)

This file is the **source of truth for the backend schema**. Each interface maps to a table.

**Enums / unions**
- `UserRole` = `"student" | "sponsor" | "admin"`
- `FormationStage` = `"Seminarian" | "Novice" | "Postulant"`
- `BillCategory` = `"School Fees" | "Clothing" | "Feeding" | "Books" | "Medical" | "Miscellaneous"`
- `BillStatus` = `"Active" | "Fully Funded" | "Overdue" | "Archived"`
- `PaymentStatus` = `"Confirmed" | "Pending" | "Failed"`
- `VerificationStatus` = `"Pending Verification" | "Verified" | "Rejected" | "Suspended"`

**Core entities** (→ suggested tables)

| Interface | Key fields | Notes for backend |
|---|---|---|
| `Student` | `id, slug, name, photo, formationStage, congregation, school, country, location, dateOfBirth?, gender?, yearOfFormation?, expectedYear?, biography, verification, createdAt, bills[], sponsorCount, profileCompletion` | `photo` = uploaded profile image URL. `verification` gates public visibility. `sponsorCount` & `profileCompletion` are derived. |
| `Sponsor` | `id, name, email, country, currency, anonymousByDefault, totalGiven, studentsSponsored, activeRecurring, monthlyCommitment` | Last four are **derived aggregates**. |
| `Bill` | `id, studentId, name, category, total, raised, dueDate, description?, status, contributions[]` | **`raised` must be computed server-side** from confirmed contributions. `status` computed from `raised`/`total` and `dueDate` vs server time. |
| `Contribution` | `id, billId, donorName, anonymous, amount, date, transactionId, status, recurring?` | `transactionId` & `status` come from the **payment gateway**, not synthesized. |
| `RecurringSponsorship` | `id, studentId, studentName, studentPhoto, amount, billName, active, nextDate` | Maps to a gateway subscription + a scheduler for `nextDate`. |
| `ThankYouMessage` | `id, studentId, studentName, studentPhoto, sponsorName, anonymousDonor, subject, body, date, read, photoAttachment?, replies[]` | `sponsorName` may be `"Anonymous (via Admin)"` — platform proxies messages to hide donor identity. |
| `MessageReply` | `id, from: "student"|"sponsor", body, date` | Nested under a message thread. |
| `ContactInquiry` | `id, name, email, phone, message, date, read` | Defined in `inquiries-store.ts` (not `types.ts`). |
| `PlatformStats` | `studentsSupported, fundsRaised, sponsors, activeSponsorships` | **Aggregation endpoint**, not a stored row. |

> There is **no `Admin` entity** in the types — admin is only a `UserRole` string. The backend
> needs a users/accounts table keyed by role, with admin accounts created out-of-band.

---

## 6. State management (current)

- **`src/lib/store.ts` — `useSession` (Zustand, in-memory).** Holds `role` + `name`. This is the
  entire "auth." Set by the sign-in page and register flow. **Not persisted** → a refresh loses
  the session. There is **no route protection** — any dashboard URL is reachable directly.
  → **Replace with real auth** (see §7.1).

- **`src/lib/inquiries-store.ts` — `useInquiries` (Zustand + `persist` → `localStorage`).** The
  **only cross-page persistence in the app.** The `/contact` form writes here; the admin
  inquiries page reads it. Works only within one browser. → **Replace with an inquiries API.**

- **React Query** is provisioned in `src/components/providers/Providers.tsx` but has **zero
  `useQuery`/`useMutation` calls**. This is the intended integration point for the backend.

---

## 7. Backend requirements (the important part)

Everything below is currently **mocked or local-only**. This section is organized by the
capabilities you asked to prioritize: **auth, payment/progress tracking, all activity across the
three roles, account verification, and profile-image upload.**

### 7.1 Authentication & accounts

**Current:** `signin/page.tsx` logs anyone in as the selected role with no validation;
`RegisterFlow.tsx` discards all entered data and just routes to a dashboard. Session is
in-memory; sign-out doesn't even clear it (the link just navigates to `/`).

**Needed:**
- Account creation for **Student** and **Sponsor** only (email + password, hashed).
- **Admin accounts are provisioned in the backend** (seed script / admin CLI / DB). No admin
  self-registration endpoint. Admin login uses the same `/signin` screen and is routed to
  `/dashboard/admin`.
- Login → issue session (JWT or httpOnly cookie) carrying `userId` + `role`.
- **Role-based route protection** — guard `/dashboard/student|sponsor|admin/*` (middleware or
  layout-level checks). Today there is none.
- Email verification for sponsors (`RegisterFlow` step "Verify Email" is a demo no-op).
- Forgot-password flow (link is currently dead).
- Wire the current `useSession` store to read from the real session, or replace it.

**Suggested endpoints:** `POST /auth/register` (student|sponsor), `POST /auth/login`,
`POST /auth/logout`, `GET /auth/me`, `POST /auth/verify-email`, `POST /auth/forgot-password`.

### 7.2 Profile & profile-image upload

**Current:** Profile photos are external Unsplash URLs. The registration "Profile Setup" step
shows **decorative dropzones** for a profile photo and an admission letter — but there is **no
`<input type="file">`, no upload handler, and no storage** anywhere in the app (verified by
repo-wide search). There are also **no profile-edit pages** for any role.

**Needed:**
- **File/object storage** (e.g. S3 / Cloudinary) for:
  - Student & sponsor **profile images** — must upload on registration/profile edit and
    **reflect on the dashboard/account pages** (`Avatar` already renders `student.photo` /
    initials; just needs a real URL).
  - Student **verification documents** (admission letter, recommendation, formation ID).
  - **Message photo attachments** (thank-you messages).
- Real file inputs + upload handlers wired into `RegisterFlow.tsx` and `MessagesView.tsx`.
- Consider adding **profile-edit pages** (none exist today) so users can update their photo/info.

**Suggested endpoints:** `POST /uploads` (returns a stored URL), `PATCH /students/:id`,
`PATCH /sponsors/:id`.

### 7.3 Payments, funding & the progress bars

This is the heart of the app. Progress bars/rings everywhere are driven by
`pct(raised, total)` and colored by `progressTier(percent)` (both in `src/lib/format.ts`).
Their accuracy depends entirely on `bill.raised` being **real and server-computed**.

**Current:** `ContributionPanel.tsx` simulates the whole flow — a hardcoded test card
(`4242 4242 4242 4242`), payment methods labelled "Card (Stripe)" / "Paystack", and a
`confirm()` that only fires a toast + success modal. **No charge happens and `raised` is never
updated**, so progress bars don't move.

**Needed:**
- **Payment gateway integration — Stripe and Paystack** (multi-currency: USD/NGN/GHS/EUR).
- **Webhooks** to record the transaction, set `Contribution.status` (Confirmed/Pending/Failed),
  create the `Contribution` row, and **increment `Bill.raised`**.
- **`Bill.raised` and `Bill.status` computed server-side** from confirmed contributions and
  server time (mock uses a frozen "now" date of `2026-08-18` for overdue logic).
- On successful payment, the progress bar/ring updates flow automatically because they read
  `raised`/`total`. Use React Query to refetch or optimistically update after a charge.
- Handle anonymity (`Contribution.anonymous`, donor shown as "Anonymous").
- **Apply the platform fee** on each charge — see the dedicated note below.

**Suggested endpoints:** `POST /contributions` (initiate payment → gateway),
`POST /webhooks/stripe`, `POST /webhooks/paystack`, `GET /bills/:id`,
`GET /students/:id/payments` (received), `GET /sponsors/:id/payments` (sent).

#### Platform fee (%) and its effect on the progress bar

The admin sets a single **platform fee (%)** in `admin/settings/page.tsx`
(`platformFee`, `min=0 max=100`, hint *"0% keeps giving free"*). It's the percentage the
Apostolate retains from each gift to cover payment-processing/operating costs. `0` = the
platform takes nothing and 100% of every gift reaches the student.

**Current:** purely mock — it's local `useState("0")` and **Save** only fires a toast. It does
not persist and does not affect any payment or progress bar yet.

**Decision to make when wiring payments** — who bears the fee, on a gift of `G` at fee `f`:

| Model | Sponsor is charged | Platform keeps | Student receives (→ added to `raised`) |
|---|---|---|---|
| **A — deducted from gift** (typical for donation platforms) | `G` | `G × f` | `G × (1 − f)` |
| **B — added on top** (sponsor covers the fee) | `G × (1 + f)` | `G × f` | `G` (full) |

**Interaction with the funding goal / progress bar (the key point):** the progress bar is
`pct(bill.raised, bill.total)`, so **whatever amount you add to `bill.raised` is what moves the
bar.** Recommended: the bar should reflect what the **student actually receives**, i.e. the
**net** amount.

- Under **Model A**, a `$100` gift at `2%` advances the bar by **$98**, not $100.
- Under **Model B**, it advances by the full **$100** (the sponsor paid the $2 on top).

So the split must happen **before** updating `raised`: record the gross gift and the fee on the
`Contribution` (consider adding `feeAmount` / `netAmount` fields), then increment `bill.raised`
by the **net** amount. Do this server-side in the payment webhook so the numbers are
authoritative. The `Contribution.amount` shown to donors is typically the gross gift; the fee is
disclosed separately on the receipt (the "Email receipts" setting).

### 7.4 Recurring sponsorships

**Current:** `sponsor/recurring/page.tsx` pause/resume/cancel mutate local state only.

**Needed:** Create gateway **subscriptions**; a **scheduler/cron** to charge on `nextDate`;
pause/resume/cancel that call the provider; keep `Sponsor.activeRecurring` /
`monthlyCommitment` in sync.

**Suggested endpoints:** `POST /recurring`, `GET /sponsors/:id/recurring`,
`PATCH /recurring/:id` (pause/resume), `DELETE /recurring/:id`.

### 7.5 Account verification (admin)

**Current:** `admin/verifications/page.tsx` seeds a roster from mock students; approve / reject /
suspend / request-info mutate local `useState` + toast. Supporting-document chips are fake and
just toast "(demo)".

**Needed:**
- Persist `VerificationStatus` transitions with an **audit trail** (who, when, reason).
- **Serve the real uploaded documents** (from §7.2) for admin review.
- **Email the student** the decision/reason (the reason textarea is described as "emailed to
  the student").
- Newly registered students enter the queue as `Pending Verification`; approval flips them to
  `Verified`, which is what makes them appear on the public `/students` list
  (`students/page.tsx` filters to `verification === "Verified"`).

**Suggested endpoints:** `GET /admin/verifications?status=`,
`PATCH /admin/students/:id/verification` (with `status` + `reason`).

### 7.6 Messaging (thank-you notes)

**Current:** `MessagesView.tsx` send/reply update local state only; "attach photo" is
non-functional; toasts say "will be notified by email."

**Needed:** Persist messages & replies; **email notifications**; photo attachment upload;
**admin-proxied anonymity** (donor identity hidden, shown as "Anonymous (via Admin)").

**Suggested endpoints:** `GET /messages?role=`, `POST /messages`, `POST /messages/:id/replies`,
`PATCH /messages/:id/read`.

### 7.7 Contact inquiries

**Current:** `/contact` → `ContactForm.tsx` → `useInquiries` (**localStorage**) →
`/dashboard/admin/inquiries`. Works only in one browser; reply is a `mailto:` link.

**Needed:** Server-side inquiries table; `POST /inquiries` from the public form; admin
`GET/PATCH(read)/DELETE`; ideally an **email notification** to staff on new inquiry.

### 7.8 Activity tracking & dashboards (Admin / Student / Sponsor)

You asked for a backend that tracks **"all the activities happening in the app"** across all
three roles. The dashboards already render these views from mock data — they need live data and,
ideally, an **activity/audit log**:

- **Student dashboard:** funds received, active sponsors, unread messages, per-bill progress,
  profile completion.
- **Sponsor dashboard:** total given, students sponsored, active recurring, monthly commitment,
  giving history, per-student progress.
- **Admin dashboard/overview:** total students, pending-verification count, funds raised,
  unread inquiries, verification queue, overdue bills, recent inquiries, global transaction feed.

**Needed:**
- **Aggregation/reporting endpoints** for each dashboard's KPIs (replaces hardcoded
  `platformStats` and inline client-side reductions).
- An **activity/event log** (contributions, verifications, registrations, bill changes, messages,
  logins) to power feeds, audit, and the admin overview.
- Consider **real-time updates** (WebSocket/SSE) or React Query polling so progress bars and
  feeds reflect activity as it happens.

**Suggested endpoints:** `GET /stats/platform`, `GET /students/:id/dashboard`,
`GET /sponsors/:id/dashboard`, `GET /admin/overview`, `GET /admin/transactions?filters`,
`GET /activity?scope=`.

### 7.9 Reports, exports & settings

- **Reports/PDF:** sponsor "Download Impact Report" and admin report PDFs are toast-only.
  Admin **transactions CSV export works client-side** already. → Add server-side PDF/report
  generation over real data.
- **Platform settings:** `admin/settings/page.tsx` (auto-approve, maintenance mode, min gift,
  platform fee %, default currency, org name, support email) is local state only. → Persist a
  settings/config table; some settings affect backend behavior — **auto-approve** skips the
  verification queue (§7.5), **minimum gift** validates the donation amount, and **platform fee**
  splits each charge and changes how much reaches the student's `raised`/progress bar
  (see the "Platform fee" note in §7.3).

---

## 8. Backend build order (suggested)

1. **Auth + accounts** (§7.1) — students/sponsors register, admin seeded, sessions + route guards.
2. **File uploads** (§7.2) — profile images + verification documents (unblocks registration & verification).
3. **Students, bills CRUD** — core entities + the browse/profile reads.
4. **Verification workflow** (§7.5) — makes students public.
5. **Payments + webhooks** (§7.3) — real `raised` values → progress bars come alive.
6. **Recurring** (§7.4), **messaging** (§7.6), **inquiries** (§7.7).
7. **Dashboards/aggregation + activity log** (§7.8), **reports & settings** (§7.9).

---

## 9. Notes for AI agents working in this repo

- **Data flows through `src/lib`.** To connect a backend, replace reads from `mock-data.ts` with
  React Query calls; the provider is already mounted in `providers/Providers.tsx`.
- **Types are canonical.** Match `src/lib/types.ts` when shaping API responses; changing a type
  ripples through many components.
- **Funding math lives in `src/lib/format.ts`** — `pct()` and `progressTier()`. Don't re-implement;
  feed them real `raised`/`total`.
- **Presentational vs. connected:** `ui/` components are prop-driven and backend-agnostic.
  `domain/` components (`ContributionPanel`, `BillCard`, `MessagesView`, `PaymentHistoryTable`,
  `BillFormModal`) are the ones whose callbacks (`onFund`, `onSave`, send/reply) must be wired to
  APIs.
- **Auth is `useSession` in `store.ts`** today — treat it as a placeholder; real auth should
  populate/replace it and add route guards.
- **Only the inquiries store persists** (localStorage). Everything else resets on refresh.
- **Access rule to preserve:** never add an admin self-registration path — admin accounts come
  from the backend; the UI only logs admins in.
- **File uploads don't exist yet** — there is no `<input type="file">` anywhere. Add real inputs
  when building §7.2.

---

*Generated as a structural + backend-readiness map of the Vocation Movement frontend. Update this
file as real API integration lands so it stays the single source of truth for the system.*
