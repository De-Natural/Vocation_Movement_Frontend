"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { StudentCard } from "@/components/domain/StudentCard";
import {
  HeartHandIcon,
  BookIcon,
  UsersIcon,
  ShieldIcon,
  ArrowRightIcon,
  SparkleIcon,
} from "@/components/ui/icons";
import {
  featuredStudents,
  platformStats,
  testimonials,
  heroImage,
} from "@/lib/mock-data";

/* ── Hero (PRD §4.1) ── */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Interior of a chapel with warm light"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/80 to-navy/60" />
      </div>

      <div className="page-container relative py-24 md:py-36">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="mb-5 inline-flex items-center gap-2 rounded-pill bg-white/10 px-4 py-1.5 text-caption font-semibold text-gold ring-1 ring-gold/30">
            <SparkleIcon size={14} /> Apostolate of the Most Precious Blood of Jesus Christ
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Sponsor a Vocation.<br />
            <span className="text-gold">Change a Life.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/80">
            Walk alongside seminarians and novices as they answer God&apos;s call.
            Fund their formation directly — every gift traceable, every bill transparent,
            every student treated with dignity.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register?role=sponsor">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                <HeartHandIcon size={18} /> I am a Sponsor
              </Button>
            </Link>
            <Link href="/register?role=student">
              <Button
                size="lg"
                className="w-full border-[1.5px] border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto rounded-pill"
              >
                I am a Religious Student
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── How It Works (PRD §4.1) ── */
const steps = [
  {
    icon: <BookIcon size={26} />,
    title: "Religious Creates a Profile",
    text: "Seminarians and novices share their story and list their real formation needs — school fees, books, medical care, and more.",
  },
  {
    icon: <HeartHandIcon size={26} />,
    title: "Sponsors Browse & Give",
    text: "Sponsors discover students, choose a specific bill to fund, and give — openly or anonymously — in their preferred currency.",
  },
  {
    icon: <ShieldIcon size={26} />,
    title: "Every Payment is Tracked",
    text: "The platform records each contribution transparently, so both students and sponsors can trace every gift end to end.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="page-container py-section">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-h1 text-navy">How It Works</h2>
        <p className="mt-3 text-body text-muted">
          Three simple steps connect generosity with genuine need.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative rounded-card bg-white p-8 text-center shadow-card"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold/12 text-gold-dark">
              {s.icon}
            </div>
            <span className="absolute right-6 top-6 font-display text-h1 text-warm">
              {i + 1}
            </span>
            <h3 className="font-display text-h3 text-navy">{s.title}</h3>
            <p className="mt-3 text-body text-muted">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── Featured Students (PRD §4.1 — masonry of 6) ── */
export function FeaturedStudents() {
  return (
    <section className="bg-warm/50 py-section">
      <div className="page-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-h1 text-navy">Meet Some of Our Students</h2>
            <p className="mt-3 max-w-xl text-body text-muted">
              Each one is answering a call. Your generosity keeps them on the path.
            </p>
          </div>
          <Link href="/students">
            <Button variant="secondary">
              View All Students <ArrowRightIcon size={16} />
            </Button>
          </Link>
        </div>

        <div className="mt-10 masonry columns-1 sm:columns-2 lg:columns-3">
          {featuredStudents.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Impact Numbers (PRD §4.1 — animated counters) ── */
export function ImpactNumbers() {
  const stats = [
    { label: "Students Supported", value: platformStats.studentsSupported, prefix: "", suffix: "" },
    { label: "Total Funds Raised", value: platformStats.fundsRaised, prefix: "$", suffix: "", compact: true },
    { label: "Generous Sponsors", value: platformStats.sponsors, prefix: "", suffix: "" },
    { label: "Active Sponsorships", value: platformStats.activeSponsorships, prefix: "", suffix: "" },
  ];

  return (
    <section className="bg-navy py-section text-white">
      <div className="page-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-display text-h1 text-white">Our Impact Together</h2>
          <p className="mt-3 text-body text-cream/70">
            What generosity has made possible across the movement.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-extrabold text-gold md:text-5xl">
                <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} compact={s.compact} />
              </div>
              <p className="mt-2 text-caption uppercase tracking-widest text-cream/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials (PRD §4.1) ── */
export function Testimonials() {
  return (
    <section className="page-container py-section">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h2 className="font-display text-h1 text-navy">Voices of Gratitude</h2>
        <p className="mt-3 text-body text-muted">
          From those whose formation you have helped make possible.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="flex flex-col rounded-card bg-white p-7 shadow-card"
          >
            <div className="mb-4 text-gold">
              <svg width={32} height={32} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.5 7c-2.5 0-4.5 2-4.5 4.5S7 16 9.5 16c.3 0 .5 0 .8-.1-.6 1.4-2 2.4-3.8 2.6v2c3.9-.3 7-3.6 7-7.5V11.5C13.5 9 11.5 7 9.5 7zm9 0c-2.5 0-4.5 2-4.5 4.5S16 16 18.5 16c.3 0 .5 0 .8-.1-.6 1.4-2 2.4-3.8 2.6v2c3.9-.3 7-3.6 7-7.5V11.5C22.5 9 20.5 7 18.5 7z" />
              </svg>
            </div>
            <blockquote className="flex-1 text-body italic text-navy/90">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 border-t border-inputborder/40 pt-5">
              <div className="relative h-11 w-11 overflow-hidden rounded-full">
                <Image src={t.photo} alt={`Photo of ${t.name}`} fill sizes="44px" className="object-cover" />
              </div>
              <div>
                <p className="text-caption font-semibold text-navy">{t.name}</p>
                <p className="text-label text-muted">{t.congregation}</p>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

/* ── Closing CTA + About anchor ── */
export function ClosingCTA() {
  return (
    <section id="about" className="page-container pb-section">
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-gold to-gold-dark px-8 py-14 text-center text-white md:py-20">
        <div className="relative mx-auto max-w-2xl">
          <UsersIcon size={40} className="mx-auto mb-5 opacity-90" />
          <h2 className="font-display text-h1 text-white">Begin Your Journey of Generosity</h2>
          <p className="mt-4 text-body text-white/90">
            Whether you are called to give or called to serve, there is a place for you
            in the Vocation Movement. Join a community built on transparency, dignity, and faith.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register?role=sponsor">
              <Button size="lg" className="w-full bg-white text-gold-dark hover:bg-cream sm:w-auto rounded-pill">
                Become a Sponsor
              </Button>
            </Link>
            <Link href="/register?role=student">
              <Button size="lg" className="w-full border-[1.5px] border-white/60 bg-transparent text-white hover:bg-white/10 sm:w-auto rounded-pill">
                Register as a Student
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
