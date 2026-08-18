"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { MenuIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import VocationIcon from "@/assest/images/Agonizing Jesus logo.jpg";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gold">
        <Image
          src={VocationIcon}
          alt="Vocation Movement logo"
          width={36}
          height={36}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      <span className={cn("font-display text-h3 font-bold leading-none", light ? "text-white" : "text-navy")}>
        Vocation<span className="text-gold">Movement</span>
      </span>
    </Link>
  );
}

const navLinks = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/students", label: "Browse Students" },
  { href: "/#about", label: "About" },
];

// PRD §4.1 Navbar — Logo left, nav links centre, Sign In + Get Started right.
export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-inputborder/30 bg-cream/85 backdrop-blur-md">
      <nav className="page-container flex h-16 items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-body font-medium text-navy/80 transition-colors hover:text-gold"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/signin">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-inputborder/30 bg-cream md:hidden">
          <div className="page-container flex flex-col gap-1 py-4">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-input px-3 py-2.5 text-body font-medium text-navy hover:bg-warm"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/signin" onClick={() => setOpen(false)}>
                <Button variant="secondary" size="sm" fullWidth>Sign In</Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button variant="primary" size="sm" fullWidth>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
