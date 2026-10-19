/* Shop Header */
import { Link } from "react-router-dom";

import { useSeo } from "@/seo/useSeo";
import { usePageCopy } from "@/store/tanstackStore/queries/site";
import { fill } from "@/utils/fill";
import { targetHref, targetLabel } from "@/utils/shopTargets";

// Breadcrumb, eyebrow, the page's one h1 and its lede. The title follows the
// address: a search, a part of the shop (Bras, Pilates, Bras for running),
// or the New / Best sellers / Sale views. One category or one term on its
// own uses the description written for it in the admin.
export default function ShopHeader({ state, lookup }) {
  const { data: copy } = usePageCopy("shop");
  const t = copy?.titles ?? {};
  const scope = { categories: state.cats, terms: state.terms };
  const scoped = Boolean(lookup && (state.cats.length || state.terms.length));
  const only =
    state.cats.length + state.terms.length === 1
      ? lookup?.categories.find((c) => c.id === state.cats[0]) ?? lookup?.terms.find((t) => t.id === state.terms[0])
      : null;

  // One Edit on its own names the page (New, The sale, Shop the kit).
  const alone = state.labels.length === 1 ? state.labels[0] : null;
  const LABEL_TITLE = { new: t.New, bestseller: t.Bestseller, sale: t.sale, kits: copy?.kits.title };
  const title = state.query
    ? fill(t.search, { query: state.query })
    : scoped
      ? targetLabel({ ...scope, label: alone ?? undefined }, lookup)
      : (alone && LABEL_TITLE[alone]) || t.all || "";
  // An Edit on its own (New, Best sellers, The sale) has its own label and line, not the whole range's.
  const view = alone && !scoped && !state.query ? copy?.views?.[alone] : null;
  const lede = alone === "kits" && !scoped ? copy?.kits.lede : only?.description || view?.lede || copy?.lede;
  useSeo({ title, description: only?.description || copy?.seo });

  // Home / Shop / Bras / Running: each step links to the wider view.
  const crumbs = [];
  if (scoped && state.cats.length && state.terms.length) {
    crumbs.push({ label: targetLabel({ categories: state.cats }, lookup), to: targetHref({ categories: state.cats }, lookup) });
  }

  return (
    <>
      <p className="crumbs">
        <Link to="/">Home</Link> / {scoped || state.labels.length || state.query ? <Link to="/shop">Shop</Link> : "Shop"}
        {crumbs.map((c) => (
          <span key={c.to}> / <Link to={c.to}>{c.label}</Link></span>
        ))}
        {(scoped || (alone && !state.query)) && <> / {title}</>}
      </p>
      <div className="section-head">
        <span className="kicker">{scoped ? "Shop" : alone === "kits" ? copy?.kits.kicker : view?.kicker ?? copy?.kicker}</span>
        <h1 id="shopTitle">{title}</h1>
        <p className="lede">{lede}</p>
      </div>
    </>
  );
}
