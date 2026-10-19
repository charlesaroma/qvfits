/* Newsletter */
import { Bell, Gift, Sparkles } from "lucide-react";

import Reveal from "@/components/motion/Reveal";
import Photo from "@/components/storefront/Photo";
import NewsletterForm from "@/components/storefront/NewsletterForm";

const PERK_ICON = { sparkles: Sparkles, bell: Bell, gift: Gift };

/**
 * The reason to join, on a light card: what a subscriber gets, the
 * form as a pill, and two of the shop's own photos beside it. Joining
 * is double opt-in: the address is on the list once the emailed link is
 * opened (NewsletterForm). The words are in src/data/home.json; `photos`
 * are the campaign and a hero shot.
 */
export default function Newsletter({ copy, photos = [] }) {
  if (!copy) return null;

  return (
    <section className="section section--tight" id="newsletter">
      <div className="wrap">
        <Reveal className="nl">
          {/* Words, perks and the form */}
          <div className="nl__copy">
            <span className="nl__kicker">{copy.kicker}</span>
            <h2 className="nl__title">{copy.title}</h2>
            <p className="nl__text">{copy.text}</p>
            <ul className="nl__perks">
              {copy.perks?.map((p) => {
                const Icon = PERK_ICON[p.icon] ?? Sparkles;
                return (
                  <li key={p.title}>
                    <span className="nl__perk-icon"><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
                    <span><strong>{p.title}</strong> {p.text}</span>
                  </li>
                );
              })}
            </ul>
            <NewsletterForm source="home" formId="newsForm" placeholder={copy.placeholder} cta={copy.cta} />
          </div>

          {/* Two shots, overlapping and tilted, from the shop's own shoot */}
          <div className="nl__art" aria-hidden="true">
            <div className="nl__shot nl__shot--a">{photos[0] && <Photo photo={photos[0]} label="" className="absolute inset-0 h-full rounded-none" />}</div>
            <div className="nl__shot nl__shot--b">{photos[1] && <Photo photo={photos[1]} label="" className="absolute inset-0 h-full rounded-none" />}</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
