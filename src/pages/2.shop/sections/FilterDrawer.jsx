/* Filter Drawer */
import FilterChips from "@/components/ui/FilterChips";
import FilterSheet, { FilterSection } from "@/components/ui/FilterSheet";
import { LABELS } from "@/utils/shopTargets";
import { optionCount } from "../filterProducts";
import PriceRange from "./PriceRange";

// The sections shown when the admin's layout doesn't name them yet.
const DEFAULT_ORDER = ["category", "group:*", "size", "color", "price"];

/**
 * Every filter in one drawer: from the left on a laptop, a bottom sheet on
 * a phone. It follows the Shop menu: Category, then each "Shop by" group
 * (Movement, and Edits: New, Best sellers, On sale, Kits), then size,
 * colour and price. Sections fold, follow the admin's order (Catalog,
 * Categories, Filter and sort), and every option says how many it would
 * show. Sorting has its own menu beside the Filter button.
 */
export default function FilterDrawer({ open, onClose, filters, products, kits, facets, bounds, count, sale }) {
  const { state, toggle, update, clear, lookup } = filters;
  const n = (key, value, groupTerms) => optionCount(products, state, sale, lookup, kits, key, value, groupTerms);
  const groupsShown = (facets?.groups ?? []).filter((g) => g.inFilters && g.active !== false);

  // Only what is in the shop right now, in the admin's order.
  const inShop = new Set(products.map((p) => p.categoryId));
  const onRail = new Set(products.flatMap((p) => Object.keys(p.stock)));
  const usedColors = new Set(products.flatMap((p) => p.colors));

  const sections = {
    size: {
      options: (facets?.sizes ?? []).filter((s) => onRail.has(s)).map((s) => ({ value: s, label: s, count: n("sizes", s) })),
      picked: state.sizes,
      onToggle: (v) => toggle("sizes", v),
    },
    color: {
      options: (facets?.colors ?? []).filter((c) => usedColors.has(c.name)).map((c) => ({ value: c.name, label: c.name, swatch: c.swatch, count: n("colors", c.name) })),
      picked: state.colors,
      onToggle: (v) => toggle("colors", v),
    },
    price: { custom: true, picked: state.minPrice || state.maxPrice ? [1] : [] },
  };
  for (const g of groupsShown) {
    const id = g.kind === "category" ? "category" : `group:${g.id}`;
    if (g.kind === "category") {
      sections[id] = {
        title: g.name,
        options: (facets?.categoryList ?? []).filter((c) => inShop.has(c.id)).map((c) => ({ value: c.id, label: c.name, count: n("cats", c.id) })),
        picked: state.cats,
        onToggle: (v) => toggle("cats", v),
      };
    } else if (g.kind === "edits") {
      // The group's items that pick a part of the shop (New, Best sellers,
      // Kits); page links like the size guide aren't filters. On sale joins
      // while the sale runs.
      const items = (facets?.terms ?? []).filter((t) => t.groupId === g.id && LABELS[t.target?.label]).map((t) => ({ value: t.target.label, label: t.name }));
      if (sale?.live && !items.some((o) => o.value === "sale")) items.push({ value: "sale", label: "On sale" });
      sections[id] = {
        title: g.name,
        // Kits needs a live kit, On sale a reduced piece; otherwise they aren't offered.
        options: items
          .map((o) => ({ ...o, count: n("labels", o.value) }))
          .filter((o) => !["kits", "sale"].includes(o.value) || o.count > 0 || state.labels.includes(o.value)),
        picked: state.labels,
        onToggle: (v) => toggle("labels", v),
      };
    } else {
      const ids = (facets?.terms ?? []).filter((t) => t.groupId === g.id).map((t) => t.id);
      sections[id] = {
        title: g.name,
        options: (facets?.terms ?? []).filter((t) => t.groupId === g.id).map((t) => ({ value: t.id, label: t.name, count: n("terms", t.id, ids) })),
        picked: state.terms.filter((t) => ids.includes(t)),
        onToggle: (v) => toggle("terms", v),
      };
    }
  }

  // The admin's layout first; any section it doesn't list yet follows in the default order.
  const laid = [...(facets?.filters.facets ?? [])].sort((a, b) => a.position - b.position);
  const ids = Object.keys(sections);
  const missing = DEFAULT_ORDER.flatMap((d) => (d === "group:*" ? ids.filter((i) => i.startsWith("group:")) : [d])).filter((id) => ids.includes(id) && !laid.some((f) => f.id === id));
  const order = [...laid, ...missing.map((id) => ({ id, visible: true }))]
    .filter((f) => f.visible && sections[f.id] && (sections[f.id].custom || sections[f.id].options.length));

  return (
    <FilterSheet open={open} onClose={onClose} id="shop-filters" title="Filter" count={count} onClear={clear}>
      {order.map((f) => {
        const s = sections[f.id];
        const title = s.title ?? f.label;
        return (
          <FilterSection key={f.id} title={title} picked={s.picked.length}>
            {f.id === "price" ? (
              <PriceRange
                key={`${state.minPrice}-${state.maxPrice}-${bounds.min}-${bounds.max}`}
                min={bounds.min}
                max={bounds.max}
                value={[state.minPrice, state.maxPrice]}
                onChange={([minPrice, maxPrice]) => update({ minPrice, maxPrice })}
              />
            ) : (
              <FilterChips title={title} options={s.options} selected={s.picked} onToggle={s.onToggle} />
            )}
          </FilterSection>
        );
      })}

      <div className="pt-4">
        <label className="check-row">
          <input type="checkbox" checked={state.inStock} onChange={(e) => update({ inStock: e.target.checked })} />
          In stock only
        </label>
      </div>
    </FilterSheet>
  );
}
