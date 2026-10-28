import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, Prose } from "@/components/layout/MarketingShell";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Terms of Service — Vocation Movement Platform",
  description:
    "The terms and conditions that govern the use of the Vocation Movement Platform by students, sponsors, and visitors.",
};

export default function TermsPage() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your use of the Vocation Movement Platform. Please read them carefully before using the platform."
    >
      <Prose>
        <p className="text-caption text-muted">Last updated: 18 August 2026</p>

        <h2 className="pt-2 font-display text-h2 text-navy">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Vocation Movement Platform, you agree to be bound by these Terms of Service. If
          you do not agree with any part of these terms, please do not use the platform.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">2. Who We Are</h2>
        <p>
          The platform is operated by the Apostolate of the Most Precious Blood of Jesus Christ to connect
          religious students with sponsors who wish to support their vocation, transparently and with dignity.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">3. Accounts</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>You are responsible for keeping your account details accurate and your password secure.</li>
          <li>You must provide truthful information when creating a profile or making a contribution.</li>
          <li>Student profiles are subject to verification before being made available to sponsors.</li>
        </ul>

        <h2 className="pt-2 font-display text-h2 text-navy">4. Contributions</h2>
        <p>
          Contributions made through the platform are intended to support the stated needs of religious students.
          We strive to direct every contribution transparently to its intended purpose. Contributions are
          generally non-refundable except where required by law or in the case of a clear processing error.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Use the platform for any unlawful, fraudulent, or harmful purpose.</li>
          <li>Misrepresent your identity or impersonate another person or organisation.</li>
          <li>Attempt to disrupt, damage, or gain unauthorised access to the platform.</li>
          <li>Use another person&rsquo;s information without their consent.</li>
        </ul>

        <h2 className="pt-2 font-display text-h2 text-navy">6. Content and Conduct</h2>
        <p>
          Students and sponsors are expected to communicate respectfully and in keeping with the values of the
          Apostolate. We reserve the right to remove content or suspend accounts that violate these terms or harm
          the community.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">7. Limitation of Liability</h2>
        <p>
          The platform is provided on an &ldquo;as is&rdquo; basis. To the fullest extent permitted by law, we are
          not liable for any indirect or consequential loss arising from your use of the platform.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">8. Changes to These Terms</h2>
        <p>
          We may update these terms from time to time. When we do, we will revise the &ldquo;last updated&rdquo;
          date above. Continued use of the platform after changes take effect means you accept the revised terms.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">9. Contact Us</h2>
        <p>
          If you have any questions about these Terms of Service, please reach out through our contact page.
        </p>

        <div className="flex flex-wrap gap-3 border-t border-inputborder/50 pt-8">
          <Link href="/contact">
            <Button variant="primary">Contact Us</Button>
          </Link>
          <Link href="/privacy">
            <Button variant="secondary">Privacy Policy</Button>
          </Link>
        </div>
      </Prose>
    </MarketingShell>
  );
}
