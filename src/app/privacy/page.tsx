import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, Prose } from "@/components/layout/MarketingShell";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Privacy Policy — Vocation Movement Platform",
  description:
    "How the Vocation Movement Platform collects, uses, and protects the personal information of students, sponsors, and visitors.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We are committed to protecting the privacy and dignity of every student, sponsor, and visitor who uses the Vocation Movement Platform."
    >
      <Prose>
        <p className="text-caption text-muted">Last updated: 18 August 2026</p>

        <h2 className="pt-2 font-display text-h2 text-navy">1. Introduction</h2>
        <p>
          The Vocation Movement Platform (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is operated by the
          Apostolate of the Most Precious Blood of Jesus Christ. This policy explains what information we collect,
          why we collect it, and how we keep it safe. By using the platform you agree to the practices described
          here.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">2. Information We Collect</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Account details</strong> &mdash; such as your name, email address, phone number, and role
            (student, sponsor, or administrator).
          </li>
          <li>
            <strong>Profile information</strong> &mdash; for students, this may include your congregation, vocation
            details, and the needs you wish to share.
          </li>
          <li>
            <strong>Contact enquiries</strong> &mdash; the name, email, phone number, and message you submit through
            our contact form.
          </li>
          <li>
            <strong>Giving activity</strong> &mdash; records of contributions made through the platform, kept for
            transparency and reporting.
          </li>
        </ul>

        <h2 className="pt-2 font-display text-h2 text-navy">3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Connect students with sponsors and facilitate contributions.</li>
          <li>Verify student profiles and safeguard the integrity of the platform.</li>
          <li>Respond to your enquiries and provide support.</li>
          <li>Send important updates about your account or contributions.</li>
        </ul>

        <h2 className="pt-2 font-display text-h2 text-navy">4. How We Protect Your Information</h2>
        <p>
          We apply appropriate technical and organisational measures to protect your personal information against
          unauthorised access, loss, or misuse. Sensitive giving details are handled with the confidentiality and
          respect owed to every member of our community.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">5. Sharing of Information</h2>
        <p>
          We do not sell your personal information. We share information only as needed to operate the platform
          (for example, showing a sponsor which student they support), to comply with the law, or with your
          consent. Sponsors may choose to give anonymously, and we honour that choice.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">6. Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal information at any time. To make
          a request, please contact us using the form on our contact page.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">7. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. When we do, we will revise the &ldquo;last updated&rdquo;
          date above. Continued use of the platform after changes take effect means you accept the revised policy.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">8. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or how we handle your information, please reach out
          through our contact page.
        </p>

        <div className="flex flex-wrap gap-3 border-t border-inputborder/50 pt-8">
          <Link href="/contact">
            <Button variant="primary">Contact Us</Button>
          </Link>
          <Link href="/terms">
            <Button variant="secondary">Terms of Service</Button>
          </Link>
        </div>
      </Prose>
    </MarketingShell>
  );
}
