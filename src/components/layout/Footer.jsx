/* Footer */
import { Link } from "react-router-dom";
import { Clock, MapPin, Phone } from "lucide-react";

import { useCurrency } from "@/store/context/CurrencyContext";
import { useFacets, useNavigation, usePageCopy, useSettings } from "@/store/tanstackStore/queries/site";
import { fill, shopTokens } from "@/utils/fill";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import { openCookieSettings } from "@/store/consent/consent";
import { whatsappLink } from "@/utils/whatsapp";
import NewsletterForm from "@/components/storefront/NewsletterForm";
import Logo from "./navbar/Logo";

/**
 * On the light background the client prefers (white, one hairline above). The newsletter leads, large
 * and plain; then the logo with its social buttons, the shop and help links,
 * and the showroom with an icon per line; legal links sit in the bottom bar
 * (they were a column of their own, and repeated Delivery and Returns from
 * Help).
 */
export default function Footer() {
  const { data: settings } = useSettings();
  const { data: facets } = useFacets();
  const { data: nav } = useNavigation();
  const { data: copy } = usePageCopy("footer");
  const { money } = useCurrency();
  const tokens = shopTokens(settings, money);
  // Help and Legal both list Delivery and Returns; show them once, under Help. Account is in the header.
  const help = nav?.help.filter((l) => l.href !== "/account") ?? [];
  const legal = nav?.legal.filter((l) => !help.some((h) => h.href === l.href)) ?? [];

  return (
    <footer className="ftr ftr--light">
      <div className="wrap">
        {/* Newsletter: the words large on the left, the form on the right */}
        <section className="ftr__join" aria-labelledby="ftr-news-title">
          <div>
            <p className="ftr__eyebrow">Members first</p>
            <h2 id="ftr-news-title" className="ftr__headline">{copy?.newsTitle}</h2>
            <p className="ftr__lede">{copy?.newsText}</p>
          </div>
          <NewsletterForm source="footer" cta={copy?.newsCta} />
        </section>

        <div className="ftr__grid">
          {/* Brand */}
          <div className="ftr__brand">
            <Logo size="lg" className="mb-[16px]" />
            {settings && <p className="ftr__blurb">{settings.blurb} {copy?.blurbSuffix}</p>}
            {/* Social: the shop's real accounts, as round icon buttons side by side */}
            {settings && (
              <ul className="ftr__social" aria-label="Follow QVFITS">
                {settings.instagram && <li><a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${settings.instagramHandle ?? ""}`}><InstagramIcon className="h-[18px] w-[18px]" /></a></li>}
                {settings.tiktok && <li><a href={settings.tiktok} target="_blank" rel="noopener noreferrer" aria-label={`TikTok ${settings.tiktokHandle ?? ""}`}><TikTokIcon className="h-[18px] w-[18px]" /></a></li>}
                {settings.whatsapp && <li><a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us"><WhatsAppIcon className="h-[18px] w-[18px]" /></a></li>}
              </ul>
            )}
          </div>

          {/* Shop */}
          <nav aria-label="Shop">
            <h2 className="ftr__title">Shop</h2>
            <ul>
              {facets?.categoryList.map((c) => (
                <li key={c.id}><Link to={`/shop/${c.slug}`}>{c.name}</Link></li>
              ))}
              <li><Link to="/shop/kits">Shop the kit</Link></li>
            </ul>
          </nav>

          {/* Help */}
          <nav aria-label="Help">
            <h2 className="ftr__title">Help</h2>
            <ul>
              {help.map((l) => <li key={l.href}><Link to={l.href}>{l.title}</Link></li>)}
            </ul>
          </nav>

          {/* Visit: an icon for each line, so the showroom reads at a glance */}
          {settings && (
            <div>
              <h2 className="ftr__title">Visit us</h2>
              <ul className="ftr__visit">
                <li><MapPin aria-hidden="true" /><a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer">{settings.address}{settings.addressNote && <span className="ftr__note">{settings.addressNote}</span>}</a></li>
                <li><Clock aria-hidden="true" /><span>Opens {settings.opensAt}</span></li>
                <li><Phone aria-hidden="true" /><a href={`tel:${settings.phone.replace(/\s/g, "")}`}>{settings.phone}</a></li>
                <li><WhatsAppIcon className="ftr__vi" /><a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp us</a></li>
              </ul>
            </div>
          )}
        </div>

        {/* Bottom bar: copyright and the legal links, then the tagline */}
        <div className="ftr__bot">
          <span>{fill(copy?.copyright, tokens)}</span>
          <nav aria-label="Legal" className="ftr__legal">
            {legal.map((l) => <Link key={l.href} to={l.href}>{l.title}</Link>)}
            <button type="button" className="ftr__cookie" onClick={openCookieSettings}>Cookie settings</button>
          </nav>
          <span>{copy?.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
