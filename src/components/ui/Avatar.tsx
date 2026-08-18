import Image from "next/image";
import { cn } from "@/lib/utils";
import { ShieldIcon } from "./icons";

// PRD §5 Avatar — with photo, initials fallback, anonymous (shield). Sizes sm/md/lg.
type Size = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, { box: string; text: string; px: number }> = {
  xs: { box: "h-7 w-7", text: "text-[10px]", px: 28 },
  sm: { box: "h-9 w-9", text: "text-caption", px: 36 },
  md: { box: "h-12 w-12", text: "text-body", px: 48 },
  lg: { box: "h-16 w-16", text: "text-h3", px: 64 },
  xl: { box: "h-24 w-24", text: "text-h2", px: 96 },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => !/^(brother|sister|fr\.?|mr\.?|mrs\.?|the)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  anonymous = false,
  className,
  ring = false,
}: {
  name?: string;
  src?: string;
  size?: Size;
  anonymous?: boolean;
  className?: string;
  ring?: boolean;
}) {
  const s = sizeMap[size];
  const ringCls = ring ? "ring-2 ring-white shadow-sm" : "";

  if (anonymous) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-navy/10 text-navy",
          s.box,
          ringCls,
          className
        )}
        title="Anonymous"
        aria-label="Anonymous donor"
      >
        <ShieldIcon size={s.px * 0.5} />
      </div>
    );
  }

  if (src) {
    return (
      <div className={cn("relative overflow-hidden rounded-full bg-warm", s.box, ringCls, className)}>
        <Image
          src={src}
          alt={name ? `Photo of ${name}` : "Profile photo"}
          fill
          sizes={`${s.px}px`}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gold/20 font-semibold text-gold-dark",
        s.box,
        s.text,
        ringCls,
        className
      )}
      aria-label={name}
    >
      {name ? initials(name) : "?"}
    </div>
  );
}

/** Overlapping avatar stack (PRD §4.3 Active Sponsors). */
export function AvatarStack({
  items,
  extra,
  size = "sm",
}: {
  items: Array<{ name?: string; src?: string; anonymous?: boolean }>;
  extra?: number;
  size?: Size;
}) {
  return (
    <div className="flex items-center">
      <div className="flex -space-x-3">
        {items.map((it, i) => (
          <Avatar key={i} {...it} size={size} ring />
        ))}
      </div>
      {extra && extra > 0 ? (
        <span className="ml-2 text-caption font-semibold text-muted">
          +{extra} more
        </span>
      ) : null}
    </div>
  );
}
