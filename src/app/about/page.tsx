import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingShell, Prose } from "@/components/layout/MarketingShell";
import { Button } from "@/components/ui/Button";
import logo from "@/assest/images/Agonizing Jesus logo.jpg";

export const metadata: Metadata = {
  title: "About the Apostolate — Vocation Movement Platform",
  description:
    "The story of the Apostolate of the Most Precious Blood of Jesus Christ — a call to console and adore, received by Rev. Barnabas in July 1995.",
};

export default function AboutPage() {
  return (
    <MarketingShell
      eyebrow="About the Apostolate"
      title="A Call to Console and Adore"
      intro="The Apostolate of the Most Precious Blood of Jesus Christ was born of a call received by Rev. Barnabas in July 1995 — an appeal to console the Agonizing Jesus Christ and to adore His Precious Blood."
    >
      <Prose>
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-navy/5 shadow-card">
            <Image src={logo} alt="Agonizing Jesus — Apostolate emblem" width={96} height={96} className="h-full w-full object-cover" />
          </span>
          <p className="mt-4 max-w-md text-caption italic text-muted">
            &ldquo;Precious Blood of Jesus Christ, save us and the whole world.&rdquo;
          </p>
        </div>

        <h2 className="font-display text-h2 text-navy">The First Day — 5th of July, 1995</h2>
        <p>
          On the 5th of July, 1995, at about 3.00pm, the Agonizing Jesus Christ called and appealed to me in
          these words: <em>&ldquo;Barnabas console Me, adore my Precious Blood.&rdquo;</em> The voice was so
          gentle and pleading; I turned and could not see who was calling me. The voice continued,
          <em> &ldquo;Barnabas, console Me, adore My Precious Blood; I am the Agonizing Jesus Christ.&rdquo;</em>
          He kept silent for a moment.
        </p>
        <p>
          I noticed that there was a sudden calmness and quiet in the room in which I was. It seemed to me that
          there was no movement of any object in the world, that one could even hear the sound of a dropped pin.
          In this silent moment, I heard the voice of a choir, which sang the song of the Precious Blood and
          prayed in these words: <em>&ldquo;Precious Blood of Jesus Christ; save us and the whole world.&rdquo;</em>
          In the end, the voice said, <em>&ldquo;I bless you My son.&rdquo;</em> Immediately the whole episode
          passed.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">The Second Day — 6th of July, 1995</h2>
        <p>
          On the 6th of July, 1995, I had the same encounter as the previous day. It was the same hour of 3.00pm.
          As I was looking at the crucifix hanging on the wall, suddenly, cloud came down and covered it. In the
          cloud, appeared the Agonizing Jesus Christ hanging on the cross, bleeding. His Head was crowned with
          thorns. The Sacred Heart appeared at the position of His Heart, which issued Divine Rays.
        </p>
        <blockquote className="border-l-4 border-gold bg-warm/50 px-5 py-4 text-navy">
          <p className="italic">
            &ldquo;Barnabas, I am Jesus Christ who died on the Cross of Calvary to save the world. I am the One
            Who laid my Body to be scourged that men might be free. I bore all the shame they deserved. With my
            Blood I purchased them, yet My people did not know me. I am still the One, Who is suffering the agony
            due to their sins. Barnabas, console Me, and adore My Precious Blood. I am the Agonizing Jesus Christ,
            Who loves you much; have mercy on Me, I bless you, My son.&rdquo;
          </p>
        </blockquote>
        <p>
          Immediately, the whole scene passed. During these two incidents, I was unable to utter a word while
          they lasted, but pondered in my heart what all that could mean.
        </p>

        <h2 className="pt-2 font-display text-h2 text-navy">The Third Day — 7th of July, 1995</h2>
        <p>
          On the third day, that is, 7th of July 1995 and at the same hour, the Agonizing Jesus Christ appeared,
          with His Face bathed with Blood and calmly said:
        </p>
        <blockquote className="border-l-4 border-gold bg-warm/50 px-5 py-4 text-navy">
          <p className="italic">
            &ldquo;Barnabas why is it that you cannot answer My Appeal of Love? Have mercy on Me. I am the
            Agonizing Jesus Christ, Who you and the world crucify every second and minute of the day with your
            sins. I called you to adore My Precious Blood. If you answer My Call of Love to adore My Precious
            Blood, I will choose you as My instrument to save you and your people, who will return to Me. Through
            My Precious Blood, I will renew the face of the earth. There shall be done on earth the Will of My
            Father as it is done in Heaven. Your eyes will see the Reign of Peace in the World.&rdquo;
          </p>
        </blockquote>
        <p>
          He kept silent for a while. It was then that I answered, <em>&lsquo;Agonizing Jesus Christ, I am
          willing to do Your Will. I love You; I love You&hellip;&rsquo;</em> As I said these words my heart
          melted and I wept with a heart full of sorrow. In the end, the Agonizing Jesus Christ said:
          <em> &ldquo;Remain in My Peace, I bless you, My son.&rdquo;</em> Then He vanished and the episode ended.
        </p>

        <p className="text-caption text-muted">— Rev. Barnabas</p>

        <div className="flex flex-wrap gap-3 border-t border-inputborder/50 pt-8">
          <Link href="/mission">
            <Button variant="primary">Read our Mission</Button>
          </Link>
          <Link href="/students">
            <Button variant="secondary">Support a Vocation</Button>
          </Link>
        </div>
      </Prose>
    </MarketingShell>
  );
}
