"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
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

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function verify() {
      setStatus("verifying");
      try {
        await apiClient.auth.verifyEmail(token!);
        if (isMounted) {
          setStatus("success");
          toast("Email verified successfully!", "success");
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "This verification link is invalid or has expired."
          );
        }
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, toast]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail) return;

    setIsResending(true);
    try {
      await apiClient.post("/api/auth/resend-verification", { email: resendEmail });
      toast("A new verification link has been sent to your email.", "success");
      setResendEmail("");
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
              Request a new verification link:
            </p>
            <Input
              type="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
            />
            <Button
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

  // 4. Idle State (User landed without token, e.g., right after signup)
  return (
    <AuthShell
      title="Check Your Inbox"
      subtitle="We sent a verification link to your email address."
    >
      <div className="space-y-6">
        <p className="text-body text-navy/80">
          Please click the link inside the confirmation email to complete your registration
          and activate your account.
        </p>

        <form onSubmit={handleResend} className="space-y-4 rounded-card bg-warm/50 p-5">
          <p className="text-caption font-semibold text-navy">Didn&apos;t receive the email?</p>
          <Input
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            required
          />
          <Button
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

