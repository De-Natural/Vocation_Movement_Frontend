"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircleIcon, AlertIcon } from "@/components/ui/icons";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing or invalid. Please request a new link.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await apiClient.auth.resetPassword({ token, password });
      setSuccess(true);
      toast("Password reset successfully!", "success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to reset password. The link may have expired.";
      setError(msg);
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create New Password"
      subtitle="Your new password must be at least 8 characters long."
    >
      {success ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircleIcon size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-h3 text-navy">Password Updated!</h2>
            <p className="text-body text-navy/80">
              Your password has been changed. You can now sign in with your new credentials.
            </p>
          </div>
          <Link href="/signin" className="block pt-2">
            <Button variant="primary" fullWidth size="lg">
              Sign In Now
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {!token && (
            <div className="flex items-center gap-3 rounded-card bg-alert-soft p-4 text-alert">
              <AlertIcon size={20} className="shrink-0" />
              <p className="text-caption">
                No reset token found in the URL. Please use the link sent to your email.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-card bg-alert-soft p-4 text-alert">
              <AlertIcon size={20} className="shrink-0" />
              <p className="text-caption">{error}</p>
            </div>
          )}

          <Input
            label="New password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 8 characters."
          />

          <Input
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={loading || !token}
          >
            {loading ? "Updating password..." : "Reset Password"}
          </Button>

          <p className="text-center text-caption text-muted">
            <Link href="/forgot-password" className="font-semibold text-accent hover:underline">
              Request a new reset link
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

