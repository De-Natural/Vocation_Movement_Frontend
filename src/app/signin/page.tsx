"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const roles: { value: UserRole; label: string; name: string; dest: string }[] = [
  { value: "student", label: "Student", name: "Brother Emeka Okonkwo", dest: "/dashboard/student" },
  { value: "sponsor", label: "Sponsor", name: "Mrs. Onyeka Adeleke", dest: "/dashboard/sponsor" },
  { value: "admin", label: "Admin", name: "Fr. Administrator", dest: "/dashboard/admin" },
];

export default function SignInPage() {
  const [role, setRole] = useState<UserRole>("sponsor");
  const router = useRouter();
  const { toast } = useToast();
  const setSessionRole = useSession((s) => s.setRole);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = roles.find((x) => x.value === role)!;
    setSessionRole(r.value, r.name);
    toast(`Welcome back, ${r.name.split(" ").slice(-1)[0]}!`, "success");
    router.push(r.dest);
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

        <Input label="Email" name="email" type="email" required placeholder="you@example.com" defaultValue="demo@vocation.org" />
        <Input label="Password" name="password" type="password" required defaultValue="password" />

        <div className="flex items-center justify-between text-caption">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" className="h-4 w-4 rounded border-inputborder text-gold focus:ring-gold" />
            Remember me
          </label>
          <Link href="#" className="font-semibold text-accent hover:underline">Forgot password?</Link>
        </div>

        <Button type="submit" variant="primary" fullWidth size="lg">Sign In</Button>

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
