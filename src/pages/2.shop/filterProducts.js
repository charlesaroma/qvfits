/* Filter And Sort (from Quivogue shop.html filtered()) */
import { matchesSearch } from "@/utils/search";
import { matchesTarget } from "@/utils/shopTargets";
import { anyInStock, inStock, productSizes, saleOf } from "@/utils/stockLevel";

// Featured: kits first when asked for, then pinned and best selling, then
// new arrivals, then the rest by name.
const rank = (p) => (p.kind === "kit" ? 4 : p.pinnedBestseller ? 3 : p.isBestseller ? 2 : p.isNew ? 1 : 0);
const shown = (p, sale) => saleOf(p, sale)?.now ?? p.price;
const SORTERS = {
  featured: (a, b) => rank(b) - rank(a) || b.unitsSold - a.unitsSold || a.name.localeCompare(b.name),
  bestselling: (a, b) => b.unitsSold - a.unitsSold || a.name.localeCompare(b.name),
  new: (a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name),
  low: (a, b, sale) => shown(a, sale) - shown(b, sale),
  high: (a, b, sale) => shown(b, sale) - shown(a, sale),
};

// Edits that pick pieces (Kits picks the kits).
const PIECE_LABELS = {
  new: (p) => p.isNew,
  bestseller: (p) => p.isBestseller,
  sale: (p, sale) => Boolean(saleOf(p, sale)),
};

/** One piece against the category, Shop by groups, colour and size picks. */
function pieceFits(p, state, sale, lookup) {
  if (!matchesTarget(p, { categories: state.cats, terms: state.terms }, { sale, lookup })) return false;
  if (state.colors.length && !state.colors.some((c) => p.colors.includes(c))) return false;
  if (state.sizes.length) {
    const sizes = productSizes(p);
    if (!state.sizes.some((s) => sizes.includes(s) && (!state.inStock || inStock(p, s)))) return false;
  }
  return true;
}

/**
 * The catalogue (and the live kits) in, the grid out. Within a group the
 * choices are OR (Sets or Bras; New or Kits), across groups AND (Sets
 * in size M). A kit fits a group when one of its pieces does, is priced at
 * the kit price, and is in stock when every piece is.
 */
export function filterProducts(products, state, sale, lookup, kits = []) {
  const q = state.query;
  const wantKits = state.labels.includes("kits");
  const pieceLabels = state.labels.filter((l) => PIECE_LABELS[l]);
  // Kits alone means kits only; otherwise pieces come too.
  const wantPieces = !wantKits || pieceLabels.length > 0;
  const priceOk = (price) => (state.minPrice == null || price >= state.minPrice) && (state.maxPrice == null || price <= state.maxPrice);

  const pieces = wantPieces
    ? products.filter((p) => {
        if (q && !matchesSearch([p.name, p.category, p.blurb, p.fabric, ...p.colors, ...(p.details ?? [])].join(" "), q)) return false;
        if (pieceLabels.length && !pieceLabels.some((l) => PIECE_LABELS[l](p, sale))) return false;
        if (!priceOk(shown(p, sale))) return false;
        if (state.inStock && !anyInStock(p)) return false;
        return pieceFits(p, state, sale, lookup);
      })
    : [];

  const kitList = wantKits
    ? kits.filter((k) => {
        if (q && !matchesSearch([k.name, ...k.pieces.map((p) => p.name)].join(" "), q)) return false;
        if (!priceOk(k.price)) return false;
        if (!k.pieces.length || (state.inStock && !k.pieces.every(anyInStock))) return false;
        // Each group the shopper narrowed by must be met by at least one piece.
        if (state.cats.length && !k.pieces.some((p) => state.cats.includes(p.categoryId))) return false;
        if (state.terms.length && !k.pieces.some((p) => matchesTarget(p, { terms: state.terms }, { sale, lookup }))) return false;
        if (state.colors.length && !k.pieces.some((p) => state.colors.some((c) => p.colors.includes(c)))) return false;
        if (state.sizes.length && !k.pieces.some((p) => state.sizes.some((s) => inStock(p, s)))) return false;
        return true;
      })
    : [];

  const sorter = SORTERS[state.sort] ?? SORTERS.featured;
  return [...kitList, ...pieces].sort((a, b) => sorter(a, b, sale));
}

/**
 * How many items one option would show if ticked, counting every other
 * filter as it is (so a count never lies about what's behind it). For terms,
 * only the option's own group is swapped; other groups keep their picks.
 */
export function optionCount(products, state, sale, lookup, kits, key, value, groupTerms = []) {
  const next =
    key === "terms"
      ? { ...state, terms: [...state.terms.filter((t) => !groupTerms.includes(t)), value] }
      : { ...state, [key]: [value] };
  return filterProducts(products, next, sale, lookup, kits).length;
}

/** The price range across the pieces and kits, rounded out to the slider's steps. */
export function priceBounds(items, sale, step = 5000) {
  const prices = items.map((p) => shown(p, sale));
  if (!prices.length) return { min: 0, max: 0 };
  return { min: Math.floor(Math.min(...prices) / step) * step, max: Math.ceil(Math.max(...prices) / step) * step };
}
