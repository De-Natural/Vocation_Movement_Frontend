"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmailOtpForm } from "@/components/auth/EmailOtpForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircleIcon, AlertIcon } from "@/components/ui/icons";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  // Code entry: which email the code was sent to (?email= pre-fills it).
  const [codeEmail, setCodeEmail] = useState<string | null>(searchParams.get("email"));
  const [codeSent, setCodeSent] = useState(false);

  // Tokens are single-use: verify each one exactly once, even when React
  // re-runs the effect (Strict Mode remount, or a new `toast` identity).
  const verifiedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token || verifiedToken.current === token) return;
    verifiedToken.current = token;

    async function verify() {
      setStatus("verifying");
      try {
        await apiClient.auth.verifyEmail(token!);
        setStatus("success");
        toast("Email verified successfully!", "success");
      } catch (err: unknown) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "This verification link is invalid or has expired."
        );
      }
    }

    verify();
  }, [token, toast]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    try {
      await apiClient.auth.resendVerification(resendEmail.trim());
      toast("If that account still needs verifying, a new code is on its way.", "success");
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : "Failed to resend verification email.",
        "error"
      );
    } finally {
      setIsResending(false);
    }
  }

  // 1. Verifying State
  if (status === "verifying") {
    return (
      <AuthShell
        title="Verifying Email"
        subtitle="Please wait while we confirm your email address..."
      >
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="text-caption text-muted">Communicating with the server...</p>
        </div>
      </AuthShell>
    );
  }

  // 2. Success State
  if (status === "success") {
    return (
      <AuthShell
        title="Email Verified!"
        subtitle="Your account is now activated and ready to use."
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircleIcon size={36} />
          </div>
          <p className="text-body text-navy/80">
            Thank you for verifying your email. You can now proceed to sign in to your dashboard.
          </p>
          <Link href="/signin" className="block">
            <Button variant="primary" fullWidth size="lg">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  // 3. Error State (invalid or expired token)
  if (status === "error") {
    return (
      <AuthShell
        title="Verification Failed"
        subtitle="We could not verify your email address."
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-card bg-alert-soft p-4 text-alert">
            <AlertIcon size={24} className="shrink-0" />
            <p className="text-caption">{errorMessage}</p>
          </div>

          <form onSubmit={handleResend} className="space-y-4">
            <p className="text-caption font-semibold text-navy">
              Get a new verification code:
            </p>
            <Input
              type="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
            />
            <Button loading={isResending}
              type="submit"
              variant="secondary"
              fullWidth
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/signin"
              className="text-caption font-semibold text-accent hover:underline"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  // 4. Code entry: verify with the 6-digit code we email.
  if (codeEmail) {
    return (
      <AuthShell title="Verify your email" subtitle="Enter the code we sent to your inbox.">
        <EmailOtpForm
          email={codeEmail}
          startCooldown={codeSent}
          onVerified={() => setStatus("success")}
        />
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setCodeEmail(null)}
            className="text-caption font-semibold text-accent hover:underline"
          >
            Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  // 5. Idle State: ask for the email, then send a code.
  return (
    <AuthShell
      title="Verify your email"
      subtitle="We'll send a 6-digit code to your email address."
    >
      <div className="space-y-6">
        <form
          onSubmit={async (e) => {
            await handleResend(e);
            if (resendEmail.trim()) {
              setCodeSent(true);
              setCodeEmail(resendEmail.trim());
            }
          }}
          className="space-y-4 rounded-card bg-warm/50 p-5"
        >
          <Input
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            required
          />
          <Button loading={isResending}
            type="submit"
            variant="primary"
            fullWidth
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Send me a code"}
          </Button>
          <button
            type="button"
            onClick={() => resendEmail.trim() && (setCodeSent(false), setCodeEmail(resendEmail.trim()))}
            className="block w-full text-center text-caption font-semibold text-accent hover:underline"
          >
            I already have a code
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/signin"
            className="text-caption font-semibold text-accent hover:underline"
          >
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

