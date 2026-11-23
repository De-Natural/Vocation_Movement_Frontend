"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { publicApi } from "@/lib/public-api";

const CHECK_EVERY_MS = 30_000;

/** Shown to everyone but the Super-Admin while maintenance mode is on. */
export default function MaintenancePage() {
  const router = useRouter();
  const [supportEmail, setSupportEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    try {
      const s = await publicApi.settings();
      setSupportEmail(s.supportEmail);
      setMessage(s.maintenanceMessage?.trim() || null);
      if (!s.maintenanceMode) router.replace("/");
    } catch {
      // Backend unreachable: stay here and try again later.
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void check();
    const t = setInterval(() => void check(), CHECK_EVERY_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-lg rounded-card bg-white p-8 text-center shadow-card">
        <p className="text-label font-semibold uppercase tracking-wide text-gold-dark">Scheduled maintenance</p>
        <h1 className="mt-2 font-display text-h2 text-navy">We&apos;ll be back shortly</h1>
        {message && (
          <p className="mt-4 whitespace-pre-line rounded-input bg-warm/60 p-4 text-left text-body text-navy">{message}</p>
        )}
        <p className="mt-3 text-body text-muted">
          Vocation Movement is being updated. Gifts, profiles and messages are safe and nothing is lost while we work.
          You have been signed out; please sign in again once we&apos;re back. This page reloads on its own when the
          site is available.
        </p>
        {supportEmail && (
          <p className="mt-3 text-caption text-muted">
            Questions? Write to{" "}
            <a href={`mailto:${supportEmail}`} className="font-semibold text-accent hover:underline">
              {supportEmail}
            </a>
            .
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button loading={checking} variant="primary" onClick={() => void check()} disabled={checking}>
            {checking ? "Checking…" : "Check again"}
          </Button>
          <Link href="/signin?role=admin" className="self-center text-caption font-semibold text-muted hover:text-navy">
            Super-Admin sign-in
          </Link>
        </div>
      </div>
    </main>
  );
}
