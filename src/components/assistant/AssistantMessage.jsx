/* Assistant Message */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import OutfitCard from "@/components/storefront/OutfitCard";
import Photo from "@/components/storefront/Photo";
import { useCurrency } from "@/store/context/CurrencyContext";
import { anyInStock } from "@/utils/stockLevel";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { whatsappLink } from "@/utils/whatsapp";
import { useSettings } from "@/store/tanstackStore/queries/site";

/**
 * One turn of the chat. Vee's replies are blocks: paragraphs, product cards,
 * WhatsApp contact buttons and links, never raw HTML. `onLeave` closes the panel
 * when a link is followed.
 */
export default function AssistantMessage({ message, onLeave, onAsk, isLast }) {
  const { money } = useCurrency();
  const { data: settings } = useSettings();
  if (message.from === "me") return <div className="msg msg--me">{message.text}</div>;

  return message.blocks.map((b, i) => {
    if (b.type === "text") {
      return <div key={i} className="msg msg--bot">{b.paras.map((p) => <p key={p}>{p}</p>)}</div>;
    }
    if (b.type === "cards" && b.products.length) {
      return (
        <div key={i} className="asst-cards">
          {b.products.map((p) => (
            <Link key={p.id} className="asst-card" to={`/product/${p.slug}`} onClick={onLeave}>
              <div className="asst-card__media"><Photo photo={p.photos[0]} label={p.name} /></div>
              <div>
                <strong>{p.name}</strong>
                <small>{p.category}{anyInStock(p) ? "" : " · sold out"}</small>
                <div className="price">{money(p.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      );
    }
    if (b.type === "outfit") return <OutfitCard key={i} outfit={b.outfit} onLeave={onLeave} />;
    if (b.type === "chips") {
      // Quick replies: tapping one sends it as the shopper's next message. Only the newest set is live.
      if (!isLast) return null;
      return (
        <div key={i} className="asst__quick" role="group" aria-label="Quick replies">
          {b.options.map((c) => <button key={c} type="button" onClick={() => onAsk(c)}>{c}</button>)}
        </div>
      );
    }
    if (b.type === "whatsapp") {
      const waNumber = b.phone || settings?.whatsapp || "256758981959";
      const href = whatsappLink(waNumber, b.message || "Hi QVfits team, I was chatting with Vee and would like to speak to a person.");
      return (
        <div key={i} className="asst-wa-wrap my-1.5">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="asst-wa-card"
            onClick={onLeave}
            aria-label={`${b.label}. Opens WhatsApp in a new tab.`}
          >
            <div className="asst-wa-card__icon" aria-hidden="true">
              <WhatsAppIcon className="h-5 w-5" />
            </div>
            <div className="asst-wa-card__content">
              <strong>{b.label}</strong>
              <small>{b.note || "Typically replies in minutes · WhatsApp"}</small>
            </div>
            <ArrowRight className="asst-wa-card__arrow h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      );
    }
    if (b.type === "link") {
      const inner = <>{b.label} <ArrowRight className="h-[15px] w-[15px]" aria-hidden="true" /></>;
      return (
        <p key={i} className="msg msg--bot">
          {b.external ? (
            <a className="link-arrow" href={b.to} target="_blank" rel="noopener noreferrer">{inner}</a>
          ) : (
            <Link className="link-arrow" to={b.to} onClick={onLeave}>{inner}</Link>
          )}
        </p>
      );
    }
    return null;
  });
}
