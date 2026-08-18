"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

/**
 * Count-up number animation (PRD §4.1 Impact Numbers, §4.3 Total Funds Received).
 * Animates from 0 to `value` when scrolled into view.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 1.6,
  decimals = 0,
  compact = false,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  compact?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate(v) {
        if (compact) {
          setDisplay(
            new Intl.NumberFormat("en-US", {
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(v)
          );
        } else {
          setDisplay(
            new Intl.NumberFormat("en-US", {
              maximumFractionDigits: decimals,
              minimumFractionDigits: decimals,
            }).format(v)
          );
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, decimals, compact]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
