import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

// PRD §2.4 — Cards: 16px radius, soft shadow, cream surface.
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { hover?: boolean }>(
  ({ className, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card bg-white shadow-card border border-black/[0.04]",
        hover && "transition-all duration-300 hover:shadow-cardhover hover:-translate-y-1",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  // PRD §2.3 — card padding 24px.
  return <div className={cn("p-6", className)} {...props} />;
}
