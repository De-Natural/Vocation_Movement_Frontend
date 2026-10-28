import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell, Prose } from "@/components/layout/MarketingShell";
import { Button } from "@/components/ui/Button";
import { HeartHandIcon, ShieldIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Our Mission — Vocation Movement Platform",
  description:
    "We propagate devotion to the Most Precious Blood of Jesus Christ, promoting the dignity of human value and saving life, and we live the spirituality of the Cross.",
};

export default function MissionPage() {
  return (
    <MarketingShell
      eyebrow="Our Mission"
      title="Returning all to the Father"
      intro="We propagate the Devotion to the Most Precious Blood of our Lord Jesus Christ in the world — with the intention of achieving the wish of Christ: returning all men and women to the Father."
    >
      <Prose>
        {/* Two pillars */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-card bg-white p-6 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-input bg-gold/12 text-gold-dark">
              <HeartHandIcon size={22} />
            </span>
            <h2 className="mt-3 font-display text-h3 text-navy">Mission</h2>
            <p className="mt-2 text-caption text-muted">
              We propagate the Devotion to the Most Precious Blood of our Lord Jesus Christ in the world with the
              intention of achieving the wish of Christ returning all men and women to the Father as a way of
              promoting the dignity of human value and saving life.
            </p>
          </div>
          <div className="rounded-card bg-white p-6 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-input bg-accent/10 text-accent">
              <ShieldIcon size={22} />
            </span>
            <h2 className="mt-3 font-display text-h3 text-navy">Preaching / Living the Cross</h2>
            <p className="mt-2 text-caption text-muted">
              We live the spirituality of the Cross. Our gazes are centered on the One who is pierced on the
              Cross, and we see in Him the need to carry our own crosses every day of our lives in imitation of Him.
            </p>
          </div>
        </div>

        <h2 className="pt-4 font-display text-h2 text-navy">Living the Spirituality of the Cross</h2>
        <p>
          We live the spirituality of the Cross. Our gazes are centered on the One who is pierced on the Cross.
          We see in Him the need to carry our own crosses every day of our lives in imitation of Him. We equally
          assist in carrying all the rejected crosses the world had abandoned.
        </p>
        <p>
          We see these crosses as petals of the rose of perfect purity scattered all over the world. We do these
          by surrendering to every cross; seeing them as coming from God.
        </p>

        <blockquote className="border-l-4 border-gold bg-warm/50 px-5 py-4 text-navy">
          <p className="italic">
            &ldquo;Through My Precious Blood, I will renew the face of the earth. There shall be done on earth the
            Will of My Father as it is done in Heaven.&rdquo;
          </p>
        </blockquote>

        <div className="flex flex-wrap gap-3 border-t border-inputborder/50 pt-8">
          <Link href="/students">
            <Button variant="primary">Support a Vocation</Button>
          </Link>
          <Link href="/about">
            <Button variant="secondary">About the Apostolate</Button>
          </Link>
        </div>
      </Prose>
    </MarketingShell>
  );
}
