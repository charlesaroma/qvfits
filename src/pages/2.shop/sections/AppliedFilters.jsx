/* Applied Filters */
import { X } from "lucide-react";

import { useCurrency } from "@/store/context/CurrencyContext";
import { LABELS } from "@/utils/shopTargets";

/**
 * What is narrowing the grid right now, as removable chips above it, with
 * "Clear all". The sort shows on its own button, so it isn't a chip.
 * Hidden when nothing is applied.
 */
export default function AppliedFilters({ filters, facets }) {
  const { state, toggle, update, clear, active } = filters;
  const { money } = useCurrency();
  if (!active) return null;

  const catName = (id) => facets?.categoryList.find((c) => c.id === id)?.name ?? id;
  const termName = (id) => facets?.terms.find((t) => t.id === id)?.name ?? id;
  // An Edit is called what the admin named its item (New, Best sellers, Kits).
  const labelName = (l) => facets?.terms.find((t) => t.target?.label === l)?.name ?? (l === "sale" ? "On sale" : LABELS[l]?.name ?? l);
  const price =
    state.minPrice && state.maxPrice ? `${money(state.minPrice)} to ${money(state.maxPrice)}`
      : state.minPrice ? `From ${money(state.minPrice)}`
      : state.maxPrice ? `Up to ${money(state.maxPrice)}`
      : null;
  const chips = [
    ...state.cats.map((v) => ({ key: `c-${v}`, label: catName(v), off: () => toggle("cats", v) })),
    ...state.terms.map((v) => ({ key: `t-${v}`, label: termName(v), off: () => toggle("terms", v) })),
    ...state.labels.map((v) => ({ key: `l-${v}`, label: labelName(v), off: () => toggle("labels", v) })),
    ...state.sizes.map((v) => ({ key: `s-${v}`, label: `Size ${v}`, off: () => toggle("sizes", v) })),
    ...state.colors.map((v) => ({ key: `co-${v}`, label: v, off: () => toggle("colors", v) })),
    price && { key: "price", label: price, off: () => update({ minPrice: null, maxPrice: null }) },
    state.inStock && { key: "stock", label: "In stock", off: () => update({ inStock: false }) },
    state.query && { key: "q", label: `“${state.query}”`, off: () => update({ q: "" }) },
  ].filter(Boolean);

  return (
    <div className="applied" aria-label="Applied filters">
      {chips.map((c) => (
        <button key={c.key} type="button" className="applied__chip" onClick={c.off} aria-label={`Remove ${c.label}`}>
          {c.label}
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ))}
      <button type="button" className="link-arrow min-h-9 text-sm" onClick={clear}>Clear all</button>
    </div>
  );
}
