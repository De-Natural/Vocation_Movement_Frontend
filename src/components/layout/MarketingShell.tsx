import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Shared shell for static/marketing content pages (About, Mission, Contact,
 * Privacy, Terms) — Navbar, a navy hero header, then page content, then Footer.
 */
export function MarketingShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        {/* Hero header */}
        <section className="bg-navy text-cream">
          <div className="page-container py-16 md:py-20">
            {eyebrow && (
              <p className="mb-3 text-label uppercase tracking-widest text-gold">{eyebrow}</p>
            )}
            <h1 className="max-w-3xl font-display text-h1 leading-tight text-cream">{title}</h1>
            {intro && <p className="mt-4 max-w-2xl text-body text-cream/75">{intro}</p>}
          </div>
        </section>

        {/* Content */}
        <div className="page-container py-12 md:py-16">{children}</div>
      </main>
      <Footer />
    </>
  );
}

/** A readable prose container for long-form text. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-3xl space-y-5 text-body leading-relaxed text-navy/85">{children}</div>;
}
