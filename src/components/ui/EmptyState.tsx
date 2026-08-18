import { type ReactNode } from "react";
import { SearchIcon } from "./icons";

// PRD §5 Empty State — always has a CTA.
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-inputborder bg-white/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warm text-gold">
        {icon || <SearchIcon size={28} />}
      </div>
      <h3 className="font-display text-h3 text-navy">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-body text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
