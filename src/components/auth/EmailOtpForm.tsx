"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { apiClient } from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/use-api";

const RESEND_SECONDS = 60; // matches the backend's resend cooldown

/**
 * "Enter the 6-digit code we emailed you." Used at the end of sign-up and
 * on /verify-email. Calls `onVerified` once the code is accepted.
 */
export function EmailOtpForm({
  email,
  onVerified,
  startCooldown = true,
}: {
  email: string;
  onVerified: () => void;
  /** The sign-up flow just sent a code, so resend starts disabled. */
  startCooldown?: boolean;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(startCooldown ? RESEND_SECONDS : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(e?: React.FormEvent) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      await apiClient.auth.verifyEmailOtp(email, code);
      toast("Email verified. Welcome!", "success");
      onVerified();
    } catch (err) {
      setError(apiErrorMessage(err, "That code didn't work."));
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    try {
      await apiClient.auth.resendVerification(email);
      setCooldown(RESEND_SECONDS);
      setCode("");
      toast("A new code is on its way. Check your inbox and spam folder.", "success");
    } catch (err) {
      toast(apiErrorMessage(err, "Couldn't send a new code."), "error");
    }
  }

  return (
    <form onSubmit={verify} className="space-y-5" noValidate>
      <p className="text-body text-muted">
        We sent a 6-digit code to <span className="font-semibold text-navy">{email}</span>. Enter it below to verify your
        email address.
      </p>
      <Input
        label="Verification code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
          if (error) setError(null);
        }}
        error={error ?? undefined}
        className="text-center text-h3 tracking-[0.5em]"
        autoFocus
      />
      <Button type="submit" variant="primary" fullWidth size="lg" loading={verifying} disabled={code.length !== 6}>
        Verify email
      </Button>
      <p className="text-center text-caption text-muted">
        Didn&apos;t get it?{" "}
        {cooldown > 0 ? (
          <span>You can request a new code in {cooldown}s.</span>
        ) : (
          <button type="button" onClick={() => void resend()} className="font-semibold text-accent hover:underline">
            Send a new code
          </button>
        )}
      </p>
    </form>
  );
}
