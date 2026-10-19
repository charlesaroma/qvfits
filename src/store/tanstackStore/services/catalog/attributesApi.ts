/* Catalog Attributes Service */
import { ApiError } from "../api/mock";
import { adminCrud, byPosition } from "../store/adminCrud";
import { createCollection, createDocument } from "../store/collectionStore";
import type { Category, Color, FilterConfig, ProductRecord, ShopGroup, SizeOption, Term } from "../types";
import { RESERVED_SLUGS, linksIn, slugify } from "@/utils/shopTargets";
import categorySeed from "@/data/categories.json";
import colorSeed from "@/data/colors.json";
import filterSeed from "@/data/filters.json";
import groupSeed from "@/data/shop-groups.json";
import sizeSeed from "@/data/sizes.json";
import termSeed from "@/data/terms.json";

/**
 * The building blocks a product is described with, all editable in the
 * admin under Catalog:
 *   shop groups  the storefront's "Shop by" groups: Category, Movement,
 *                Edits, and any the admin adds (Categories page)
 *   categories   the Category group's items; a product has one
 *   terms        the items of every other group: tags that products carry
 *                (Running, High support) or edits that open a view (New)
 *   colours, sizes, and how the shop's filter sidebar is laid out
 */
export const categories = createCollection<Category>("categories", categorySeed as Category[], { idPrefix: "cat" });
export const colors = createCollection<Color>("colors", colorSeed as Color[], { idPrefix: "col" });
export const sizes = createCollection<SizeOption>("sizes", sizeSeed as SizeOption[], { idPrefix: "size" });
export const groups = createCollection<ShopGroup>("shop-groups", groupSeed as ShopGroup[], { idPrefix: "grp" });
export const terms = createCollection<Term>("terms", termSeed as unknown as Term[], { idPrefix: "term" });
export const filterConfig = createDocument<FilterConfig>("filters", filterSeed as FilterConfig);

// Set by productsApi, so a delete can check whether anything still uses a row
// without this file importing the products table (which imports this one).
let productRows: () => ProductRecord[] = () => [];
export function registerProducts(rows: () => ProductRecord[]) {
  productRows = rows;
}
export const allProductRows = () => productRows();

// The documents that hold links (the menu, the home page, offers) register
// here, so a category or term a link still shows cannot be deleted.
const linkSources: { name: string; get: () => unknown }[] = [];
export function registerLinkSource(name: string, get: () => unknown) {
  linkSources.push({ name, get });
}

function linkedFrom(kind: "categories" | "terms", id: string) {
  for (const source of linkSources) {
    const links: { target: Record<string, string[] | undefined>; where: string }[] = linksIn(source.get());
    const hit = links.find((l) => l.target[kind]?.includes(id));
    if (hit) return `${source.name}${hit.where ? ` (${hit.where})` : ""}`;
  }
  return null;
}

function inLinks(kind: "categories" | "terms", id: string, name: string) {
  const where = linkedFrom(kind, id);
  if (where) throw new ApiError(`${name} is linked from ${where}. Change that link first.`, 409);
}

function inUse(count: number, what: string) {
  if (count) throw new ApiError(`${count} ${count === 1 ? "product uses" : "products use"} this ${what}. Move or edit them first.`, 409);
}

/** New rows get a readable id from their name and go to the end of the list. */
function withIdAndPosition<T extends { id: string; position: number }>(name: (d: Partial<T>) => string | undefined) {
  return (data: Partial<T>, existing: T | null, all: T[]): Partial<T> => {
    if (existing) return data;
    const base = slugify(name(data) ?? "") || "item";
    let id = base;
    for (let n = 2; all.some((r) => r.id === id); n++) id = `${base}-${n}`;
    return { ...data, id, position: data.position ?? all.length };
  };
}

/**
 * The web address, always made from the name (nobody types one). It is
 * unique among `all` (its own table, or a term's own group) and never a shop
 * word (new, bestsellers, sale): a clash gets a number ("swim-2"). `taken`
 * adds slugs used elsewhere, since a category and a group both sit right
 * after /shop. A renamed row gets a new address and keeps the old one in
 * previousSlugs, so shared links redirect. Saving anything but the name
 * leaves the address alone.
 */
function withSlug<T extends { id: string; slug: string; previousSlugs?: string[] }>(data: Partial<T>, existing: T | null, all: T[], name?: string, taken: { slug: string; previousSlugs?: string[] }[] = []): Partial<T> {
  const renamed = !existing || (data as { name?: string }).name === undefined ? !existing : (data as { name?: string }).name !== (existing as unknown as { name: string }).name;
  if (!renamed) return { ...data, slug: existing!.slug, previousSlugs: existing!.previousSlugs ?? [] };
  const base = slugify(name ?? "");
  if (!base) return data;
  const used = (s: string) =>
    RESERVED_SLUGS.has(s) ||
    taken.some((r) => r.slug === s || r.previousSlugs?.includes(s)) ||
    all.some((r) => r.id !== existing?.id && (r.slug === s || r.previousSlugs?.includes(s)));
  let slug = base;
  for (let n = 2; used(slug); n++) slug = `${base}-${n}`;
  const previous = existing && existing.slug !== slug ? [...new Set([...(existing.previousSlugs ?? []), existing.slug])].filter((s) => s !== slug) : existing?.previousSlugs;
  return { ...data, slug, ...(previous ? { previousSlugs: previous } : {}) };
}

export const categoriesCrud = adminCrud(categories, {
  module: "categories",
  noun: "category",
  label: (c) => c.name,
  prepare: (data, existing, all) => {
    const next = withSlug<Category>(withIdAndPosition<Category>((d) => d.name)(data, existing, all), existing, all, data.name, groups.list());
    return { parentId: null, active: true, description: "", previousSlugs: [], image: null, ...(existing ?? {}), ...next };
  },
  beforeRemove: (c) => {
    inUse(productRows().filter((p) => p.categoryId === c.id).length, "category");
    inLinks("categories", c.id, c.name);
  },
});

export const colorsCrud = adminCrud(colors, {
  module: "categories",
  noun: "colour",
  label: (c) => c.name,
  prepare: withIdAndPosition<Color>((d) => d.name),
  beforeRemove: (c) => inUse(productRows().filter((p) => p.colorIds.includes(c.id)).length, "colour"),
});

export const sizesCrud = adminCrud(sizes, {
  module: "size-guide",
  noun: "size",
  label: (s) => s.label,
  prepare: withIdAndPosition<SizeOption>((d) => d.label),
  beforeRemove: (s) => inUse(productRows().filter((p) => p.variants.some((v) => v.size === s.label)).length, "size"),
});

/**
 * The "Shop by" groups. Category is the one system group: it can be renamed
 * and moved but not deleted or doubled. A group goes only once it is empty.
 */
export const groupsCrud = adminCrud(groups, {
  module: "categories",
  noun: "group",
  label: (g) => g.name,
  prepare: (data, existing, all) => {
    if (!existing && data.kind === "category") throw new ApiError("There is already a Category group. Add a Tags or Edits group instead.", 409);
    if (existing && data.kind && data.kind !== existing.kind) throw new ApiError("A group's kind is set when it is made.", 409);
    const next = withSlug<ShopGroup>(withIdAndPosition<ShopGroup>((d) => d.name)(data, existing, all), existing, all, data.name, categories.list());
    return { kind: "tags" as const, inMenu: true, inFilters: true, active: true, previousSlugs: [], ...(existing ?? {}), ...next };
  },
  beforeRemove: (g) => {
    if (g.kind === "category") throw new ApiError("Category is the shop's own group. Rename it if you like, but it stays.", 409);
    const n = terms.list().filter((t) => t.groupId === g.id).length;
    if (n) throw new ApiError(`${g.name} still has ${n} ${n === 1 ? "item" : "items"}. Delete or move them first.`, 409);
  },
});

/** Items of tags and edits groups. A slug is unique within its own group. */
export const termsCrud = adminCrud(terms, {
  module: "categories",
  noun: "item",
  label: (t) => t.name,
  prepare: (data, existing, all) => {
    const groupId = existing?.groupId ?? data.groupId;
    const group = groupId ? groups.get(groupId) : null;
    if (!group || group.kind === "category") throw new ApiError("Pick the group this item belongs to.", 422);
    const siblings = all.filter((t) => t.groupId === groupId);
    const next = withSlug<Term>(withIdAndPosition<Term>((d) => d.name)(data, existing, all), existing, siblings, data.name);
    if (!existing) next.position = data.position ?? siblings.length;
    return { groupId, active: true, description: "", previousSlugs: [], image: null, ...(existing ?? {}), ...next };
  },
  beforeRemove: (t) => {
    inUse(productRows().filter((p) => p.termIds.includes(t.id)).length, groups.get(t.groupId)?.name.toLowerCase() ?? "item");
    inLinks("terms", t.id, t.name);
  },
});

/* Lookups the products view and the facets use */

export const sortedCategories = () => byPosition(categories.list());
export const sortedColors = () => byPosition(colors.list());
export const sortedSizes = () => byPosition(sizes.list());
export const sortedGroups = () => byPosition(groups.list());
export const sortedTerms = () => byPosition(terms.list());

/** Live groups, categories, terms and pieces, for building link addresses (utils/shopTargets). */
export function linkLookup() {
  const liveGroups = sortedGroups().filter((g) => g.active);
  const live = new Set(liveGroups.map((g) => g.id));
  return {
    groups: liveGroups,
    categories: sortedCategories().filter((c) => c.active),
    terms: sortedTerms().filter((t) => t.active && live.has(t.groupId)),
    products: productRows().filter((p) => p.status === "active").map(({ id, slug, name }) => ({ id, slug, name })),
  };
}
