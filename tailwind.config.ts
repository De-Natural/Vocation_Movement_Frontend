import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PRD 2.1 Colour Palette
        navy: {
          DEFAULT: "#0B1437", // Deep Navy — primary backgrounds, headers, footers
          soft: "#16204d",
        },
        gold: {
          DEFAULT: "#C9972B", // Sacred Gold — CTAs, highlights, progress bars, accents
          light: "#E0B84E",
          dark: "#A87D1F",
        },
        cream: {
          DEFAULT: "#FDFAF4", // Cream White — page backgrounds, card surfaces
        },
        warm: {
          DEFAULT: "#F0EBE1", // Warm Section — section containers, alternating rows
        },
        accent: {
          DEFAULT: "#1A3A6B", // Accent Blue — secondary headings, links, icons
        },
        muted: {
          DEFAULT: "#6B6B6B", // Muted Grey — body text secondary, timestamps, hints
        },
        success: {
          DEFAULT: "#1A7A4A", // Success Green — payment confirmed, verified badges
          soft: "#E3F1EA",
        },
        alert: {
          DEFAULT: "#C0392B", // Alert Red — errors, overdue bills, warnings
          soft: "#F7E4E1",
        },
        amber: {
          DEFAULT: "#D98E04", // amber tier for progress + pending
          soft: "#FBEFD6",
        },
        inputborder: "#D4C5A9", // Input border per PRD 2.4
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dmsans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        // PRD 2.2 Scale
        h1: ["36px", { lineHeight: "1.15", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.25", fontWeight: "700" }],
        h3: ["18px", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.6" }],
        caption: ["12px", { lineHeight: "1.4" }],
        label: ["11px", { lineHeight: "1.3", fontWeight: "600" }],
      },
      borderRadius: {
        card: "16px", // PRD 2.4 Cards
        input: "10px", // Inputs
        pill: "50px", // Button CTAs
        modal: "20px", // Modals
        progress: "100px", // Progress bars
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.08)", // PRD 2.4 Cards
        cardhover: "0 12px 40px rgba(11,20,55,0.14)",
        modal: "0 24px 64px rgba(0,0,0,0.28)",
      },
      maxWidth: {
        page: "1280px", // PRD 2.3 Page max-width
      },
      spacing: {
        section: "64px", // PRD 2.3 Section vertical gap
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "toast-in": "toast-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
