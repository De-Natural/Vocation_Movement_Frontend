import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

// PRD §2.4 — pill radius for primary CTAs, 8px for secondary.
const base =
  "inline-flex items-center justify-center gap-2 font-sans font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "rounded-pill bg-gold text-white shadow-sm hover:bg-gold-dark hover:shadow-md active:scale-[0.98]",
  secondary:
    "rounded-lg border-[1.5px] border-navy/25 bg-transparent text-navy hover:bg-navy/5 active:scale-[0.98]",
  ghost:
    "rounded-lg bg-transparent text-navy hover:bg-navy/5 active:scale-[0.98]",
  danger:
    "rounded-pill bg-alert text-white hover:brightness-95 active:scale-[0.98]",
  icon: "rounded-full bg-transparent text-navy hover:bg-navy/5 active:scale-95 aspect-square",
};

const sizes: Record<Size, string> = {
  sm: "text-caption px-4 py-2",
  md: "text-body px-6 py-2.5",
  lg: "text-body px-8 py-3.5",
};

const iconSizes: Record<Size, string> = {
  sm: "p-1.5",
  md: "p-2.5",
  lg: "p-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          variant === "icon" ? iconSizes[size] : sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
