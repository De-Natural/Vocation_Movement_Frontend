"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CheckCircleIcon, MessageIcon } from "@/components/ui/icons";
import { useInquiries } from "@/lib/inquiries-store";

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const EMPTY: FormState = { name: "", email: "", phone: "", message: "" };

type Errors = Partial<Record<keyof FormState, string>>;

function validate(values: FormState): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!values.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.phone.trim()) errors.phone = "Please enter a phone number.";
  if (!values.message.trim()) errors.message = "Please tell us how we can help.";
  return errors;
}

export function ContactForm() {
  const add = useInquiries((s) => s.add);
  const [values, setValues] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    add({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      message: values.message.trim(),
    });
    setValues(EMPTY);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-card bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircleIcon size={32} />
        </span>
        <h2 className="mt-5 font-display text-h2 text-navy">Message received</h2>
        <p className="mt-2 text-body text-muted">
          Thank you for reaching out. Your message has been sent to our team and we will respond to you as soon
          as we can.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => setSubmitted(false)}>
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-5">
      {/* Context column */}
      <div className="md:col-span-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-input bg-gold/12 text-gold-dark">
          <MessageIcon size={24} />
        </span>
        <h2 className="mt-4 font-display text-h2 text-navy">We&rsquo;d love to hear from you</h2>
        <p className="mt-3 text-body text-muted">
          Whether you have a question about supporting a vocation, need help with your account, or want to learn
          more about the Apostolate, send us a note and our team will get back to you.
        </p>
        <ul className="mt-6 space-y-2 text-caption text-muted">
          <li>&bull; General enquiries &amp; support</li>
          <li>&bull; Questions about sponsorship</li>
          <li>&bull; Partnership &amp; congregation onboarding</li>
        </ul>
      </div>

      {/* Form column */}
      <form onSubmit={handleSubmit} noValidate className="rounded-card bg-white p-6 shadow-card md:col-span-3">
        <div className="space-y-4">
          <Input
            label="Full name"
            name="name"
            required
            placeholder="Jane Doe"
            value={values.name}
            onChange={set("name")}
            error={errors.name}
          />
          <Input
            label="Email address"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            value={values.email}
            onChange={set("email")}
            error={errors.email}
          />
          <Input
            label="Phone number"
            name="phone"
            type="tel"
            required
            placeholder="+234 800 000 0000"
            value={values.phone}
            onChange={set("phone")}
            error={errors.phone}
          />
          <Textarea
            label="How can we help?"
            name="message"
            required
            rows={5}
            placeholder="Write your message or query here…"
            value={values.message}
            onChange={set("message")}
            error={errors.message}
          />
        </div>
        <Button type="submit" fullWidth className="mt-6">
          Send message
        </Button>
        <p className="mt-3 text-center text-label text-muted">
          Your details are sent to our team so we can respond to your enquiry.
        </p>
      </form>
    </div>
  );
}
