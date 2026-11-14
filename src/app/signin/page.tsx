"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/lib/store";
import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type SignInRole = "student" | "sponsor" | "admin";

const roles: { value: SignInRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "sponsor", label: "Sponsor" },
  { value: "admin", label: "Admin" },
];

/** Only follow same-site relative redirects (blocks //evil.com open redirects). */
function safeRedirect(path: string | null): string | null {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
}

function SignInForm() {
  const [role, setRole] = useState<SignInRole>("sponsor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = safeRedirect(searchParams.get("redirect"));
  const { toast } = useToast();
  const setSession = useSession((s) => s.setSession);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.auth.login({
        email: email.trim(),
        password,
        role,
      });

      setSession({
        accessToken: response.accessToken,
        role: response.role,
        userId: response.userId,
        name: response.name,
        email: email.trim(),
      });

      toast(`Welcome back${response.name ? `, ${response.name}` : ""}!`, "success");

      router.push(redirectParam || `/dashboard/${response.role}`);
      return;
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 0) {
        toast("Can't reach the server. Please check your connection and try again.", "error");
      } else {
        toast(err instanceof Error && err.message ? err.message : "Sign in failed.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to continue your journey.">
      <form onSubmit={submit} className="space-y-5">
        {/* Role selector — each role signs into its own space (PRD §3) */}
        <div>
          <p className="mb-1.5 text-caption font-semibold text-navy">I am signing in as</p>
          <div className="grid grid-cols-3 gap-2" role="tablist">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={role === r.value}
                onClick={() => setRole(r.value)}
                className={cn(
                  "rounded-input border-[1.5px] py-2.5 text-caption font-semibold transition-colors",
                  role === r.value
                    ? "border-gold bg-gold/10 text-gold-dark"
                    : "border-inputborder bg-white text-muted hover:border-gold/50"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-caption">
          <label className="flex items-center gap-2 text-muted">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-inputborder text-gold focus:ring-gold"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="font-semibold text-accent hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </Button>

        <p className="text-center text-caption text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
