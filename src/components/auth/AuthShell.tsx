import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";
import { Logo } from "@/components/layout/Navbar";
import { heroImage } from "@/lib/mock-data";

/** Split-screen auth shell — imagery left, form right (PRD §4.2). */
export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-screen bg-cream">
      {/* Imagery panel */}
      <div className="relative hidden w-2/5 flex-col justify-between overflow-hidden bg-navy p-10 lg:flex">
        <Image src={heroImage} alt="" fill sizes="40vw" className="object-cover opacity-30" />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative">
          <blockquote className="font-display text-h2 leading-relaxed text-white">
            &ldquo;The harvest is plentiful, but the labourers are few.&rdquo;
          </blockquote>
          <p className="mt-3 text-body text-cream/70">— Matthew 9:37</p>
        </div>
        <div className="relative text-caption text-cream/50">
          Apostolate of the Most Precious Blood of Jesus Christ
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="font-display text-h1 text-navy">{title}</h1>
              {subtitle && <p className="mt-2 text-body text-muted">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
        <div className="p-6 text-center text-caption text-muted">
          <Link href="/" className="hover:text-gold">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

/** Horizontal step indicator for multi-step registration. */
export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-progress transition-colors ${
              i <= current ? "bg-gold" : "bg-warm"
            }`}
          />
        ))}
      </div>
      <p className="mt-3 text-caption font-semibold text-muted">
        Step {current + 1} of {steps.length} — <span className="text-navy">{steps[current]}</span>
      </p>
    </div>
  );
}
