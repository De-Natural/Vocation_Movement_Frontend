import type { Metadata } from "next";
import { MarketingShell } from "@/components/layout/MarketingShell";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Vocation Movement Platform",
  description:
    "Get in touch with the Vocation Movement Platform team. Send us your name, email, phone number, and query and we will respond as soon as we can.",
};

export default function ContactPage() {
  return (
    <MarketingShell
      eyebrow="Contact"
      title="Get in touch"
      intro="Have a question or need support? Fill in the form below and your message will reach our team directly."
    >
      <ContactForm />
    </MarketingShell>
  );
}
