/* Cart Panel */
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

import EmptyState from "@/components/ui/EmptyState";
import { useCart } from "@/store/context/CartContext";
import { useCurrency } from "@/store/context/CurrencyContext";
import { useOffers, useProductsByIds, useSettings, useStyleWith } from "@/store/tanstackStore/queries/site";
import { saleOf } from "@/utils/stockLevel";
import OutfitCard from "./OutfitCard";
import Photo from "./Photo";

// The bag in the drawer. Totals here are a preview; checkout prices the bag
// again on the server side before anything is ordered.
export default function CartPanel() {
  const { lines, remove } = useCart();
  const { money } = useCurrency();
  const { data: products = [] } = useProductsByIds(lines.map((l) => l.productId));
  const { data: settings } = useSettings();
  const { data: offers } = useOffers();
  // "Complete the look" is built around the newest piece in the bag; asked for before any early return, as hooks must be.
  const lastId = lines[lines.length - 1]?.productId;
  const { data: looks = [] } = useStyleWith(lastId);

  if (!lines.length) {
    return (
      <>
        <div className="drawer__body">
          <EmptyState icon={ShoppingBag}>Your bag is empty. Let&apos;s fix that.</EmptyState>
        </div>
        <div className="drawer__foot">
          <Link className="btn btn--primary btn--block" to="/shop/new">Shop new</Link>
        </div>
      </>
    );
  }

  // The live sale price when an offer covers the piece, else the list price.
  const priceOf = (p) => saleOf(p, offers?.sale)?.now ?? p.price;
  // Skip lines whose product is still loading or no longer in the catalogue.
  const rows = lines.map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) })).filter((r) => r.product);
  const subtotal = rows.reduce((sum, r) => sum + priceOf(r.product) * r.line.qty, 0);
  // Hidden (0) until settings load, so the nudge never shows a wrong threshold.
  const left = settings ? settings.freeShippingOver - subtotal : 0;

  return (
    <>
      <div className="drawer__body">
        {rows.map(({ line, product: p }) => (
          <div key={`${p.id}-${line.size}-${line.color}`} className="mini-row">
            <Link className="mini-row__media" to={`/product/${p.slug}`}><Photo photo={p.photos[0]} label={p.name} /></Link>
            <div>
              <strong>{p.name}</strong>
              <small>{line.color} · {line.size} · ×{line.qty}</small>
            </div>
            <div className="text-right">
              <div className="text-[.86rem] font-semibold">{money(priceOf(p) * line.qty)}</div>
              <button type="button" className="remove" onClick={() => remove(line)}>Remove</button>
            </div>
          </div>
        ))}
        {/* Complete The Look: one outfit around what is in the bag, adding only what is missing */}
        {(() => {
          const inBag = lines.map((l) => l.productId);
          const next = looks.find((o) => o.pieces.some((pc) => !inBag.includes(pc.product.id)));
          if (!next || new Set(inBag).size > 2) return null;
          return (
            <div className="mt-5 px-[22px] pb-4">
              <p className="m-0 mb-2 text-[.72rem] font-semibold uppercase tracking-[0.14em] text-ink-4">Complete the look</p>
              <OutfitCard outfit={next} skip={inBag} />
            </div>
          );
        })()}
      </div>
      <div className="drawer__foot">
        {/* Free Delivery Nudge */}
        {left > 0 ? (
          <p className="mb-2.5 text-[.82rem] text-ink-3">{money(left)} away from free delivery</p>
        ) : (
          <p className="mb-2.5 text-[.82rem] font-semibold text-success">Free delivery unlocked</p>
        )}
        <div className="sum-row sum-row--total" style={{ margin: "0 0 14px", border: 0, padding: 0 }}>
          <span>Subtotal</span><span>{money(subtotal)}</span>
        </div>
        {/* Checkout starts from the full bag page, where sizes and quantities can still change. */}
        <Link className="btn btn--primary btn--block" to="/cart">Checkout</Link>
      </div>
    </>
  );
}
