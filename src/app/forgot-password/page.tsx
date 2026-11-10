"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircleIcon, AlertIcon } from "@/components/ui/icons";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.auth.forgotPassword(email.trim());
      setSubmitted(true);
      toast("Password reset instructions sent to your email.", "success");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not send reset link. Please check your email and try again.";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter the email associated with your account and we will send you a reset link."
    >
      {submitted ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircleIcon size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-h3 text-navy">Check Your Email</h2>
            <p className="text-body text-navy/80">
              We&apos;ve sent password reset instructions to{" "}
              <span className="font-semibold text-navy">{email}</span>.
            </p>
          </div>
          <p className="text-caption text-muted">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="font-semibold text-accent hover:underline"
            >
              try another email
            </button>
            .
          </p>
          <div className="pt-2">
            <Link href="/signin">
              <Button variant="secondary" fullWidth size="lg">
                ← Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-3 rounded-card bg-alert-soft p-4 text-alert">
              <AlertIcon size={20} className="shrink-0" />
              <p className="text-caption">{error}</p>
            </div>
          )}

          <Input
            label="Email address"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="We will send a secure one-time reset link."
          />

          <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading}>
            {loading ? "Sending link..." : "Send Reset Link"}
          </Button>

          <p className="text-center text-caption text-muted">
            Remembered your password?{" "}
            <Link href="/signin" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

