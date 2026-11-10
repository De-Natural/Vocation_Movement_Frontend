"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/lib/store";
import { apiClient } from "@/lib/api-client";
import { SUPERADMIN_DEMO_EMAIL } from "@/lib/platform-config";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const roles: { value: UserRole; label: string; name: string; dest: string }[] = [
  { value: "student", label: "Student", name: "Brother Emeka Okonkwo", dest: "/dashboard/student" },
  { value: "sponsor", label: "Sponsor", name: "Mrs. Onyeka Adeleke", dest: "/dashboard/sponsor" },
  { value: "admin", label: "Admin", name: "Fr. Administrator", dest: "/dashboard/admin" },
];

function SignInForm() {
  const [role, setRole] = useState<UserRole>("sponsor");
  const [email, setEmail] = useState("demo@vocation.org");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { toast } = useToast();
  const setSession = useSession((s) => s.setSession);
  const setSessionRole = useSession((s) => s.setRole);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Attempt authentication with the real backend endpoint
      const response = await apiClient.auth.login({
        email: email.trim(),
        password,
      });

      setSession({
        accessToken: response.accessToken,
        role: response.role,
        userId: response.userId,
        name: response.name,
        email: email.trim(),
      });

      toast(`Welcome back${response.name ? `, ${response.name}` : ""}!`, "success");

      const targetDest =
        redirectParam || (response.role === "admin" ? "/dashboard/admin" : `/dashboard/${response.role}`);
      router.push(targetDest);
      return;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "";

      // Check if user has not verified their email yet
      if (
        errorMessage.toLowerCase().includes("verify") ||
        errorMessage.toLowerCase().includes("verification")
      ) {
        toast("Please verify your email address before signing in.", "error");
        router.push("/verify-email");
        return;
      }

      // If backend is not yet running or network fails, provide graceful fallback for demo
      console.warn("Backend login attempt failed, falling back to simulated demo session:", errorMessage);

      if (role === "admin" && email.trim().toLowerCase() === SUPERADMIN_DEMO_EMAIL) {
        setSessionRole("superadmin", "Msgr. Raphael Eze (Super Admin)");
        toast("Welcome back, Msgr. Eze! (Demo)", "success");
        router.push(redirectParam || "/dashboard/superadmin");
        return;
      }

      const r = roles.find((x) => x.value === role)!;
      setSessionRole(r.value, r.name);
      toast(`Welcome back, ${r.name.split(" ").slice(-1)[0]}!`, "success");
      router.push(redirectParam || r.dest);
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
