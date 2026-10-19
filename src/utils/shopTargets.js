/* Shop Targets */
import { saleOf } from "./stockLevel";

/**
 * What a link shows, kept apart from its address (after belioras menuTargets).
 * Every menu link, home tile, slide button and deal stores a target; its
 * address is built from the live slugs when it is read, so renaming a
 * category, group or term never breaks a link.
 *
 *   {}                                              the whole shop
 *   { categories: ["bras"] }                        /shop/bras
 *   { terms: ["run"] }                              /shop/movement/running
 *   { categories: ["bras"], terms: ["run"] }        /shop/bras/movement/running
 *   { terms: ["run", "high"] }  (two groups)        /shop/movement/running/fit/high-support
 *   { label: "new" }                                /shop/new
 *   { categories: ["sets"], label: "new" }          /shop/sets?show=new
 *   { product: "prd_x" }                            /product/<slug>
 *   { page: "/about" }                              a fixed page
 *
 * Terms come from the admin's "Shop by" groups (Movement, Fit…); each group
 * has a slug, and its terms follow it. Several in one group join with "+":
 * /shop/movement/swim+lounge. Within a group a product needs any of them,
 * across groups all of them. The shop resolves the same grammar back
 * (resolveShopPath) and filters with the same function (matchesTarget).
 *
 * `lookup` is { categories, groups, terms, products? }, each with slugs.
 */

export const LABELS = {
  new: { name: "New", slug: "new", badge: "New" },
  bestseller: { name: "Best sellers", slug: "bestsellers", badge: "Bestseller" },
  sale: { name: "Sale", slug: "sale" },
  kits: { name: "Shop the kit", slug: "kits" },
};

/** Fixed pages a link may open, in the order the link picker lists them. */
export const PAGES = [
  { path: "/", name: "Home" },
  { path: "/shop", name: "Shop everything" },
  { path: "/about", name: "About" },
  { path: "/size-guide", name: "Size guide" },
  { path: "/contact", name: "Contact and FAQ" },
  { path: "/track-order", name: "Track an order" },
  { path: "/account", name: "Your account" },
  { path: "/delivery", name: "Delivery" },
  { path: "/returns", name: "Exchanges and returns" },
  { path: "/privacy", name: "Privacy policy" },
  { path: "/terms", name: "Terms of sale" },
];

/** First segments the shop keeps for itself, so no category or group may take them. */
export const RESERVED_SLUGS = new Set(Object.values(LABELS).map((l) => l.slug));

const JOIN = "+";
const byId = (list = [], id) => list.find((x) => x.id === id);
const andList = (words) => (words.length > 1 ? `${words.slice(0, -1).join(", ")} and ${words.at(-1)}` : words[0] ?? "");

/** A URL segment from a name. */
export function slugify(name) {
  return String(name ?? "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const isShopTarget = (t) => Boolean(t) && !t.product && !t.page;

/** Term ids bucketed by their group, in the groups' order. Unknown terms share one bucket. */
function byGroup(termIds = [], lookup = {}) {
  const buckets = new Map();
  for (const id of termIds) {
    const groupId = byId(lookup.terms, id)?.groupId ?? "";
    buckets.set(groupId, [...(buckets.get(groupId) ?? []), id]);
  }
  const order = (gid) => byId(lookup.groups, gid)?.position ?? 99;
  return [...buckets.entries()].sort(([a], [b]) => order(a) - order(b));
}

/** Whether a product belongs to a shop target. `sale` is the live sale settings. */
export function matchesTarget(product, target = {}, { sale, lookup } = {}) {
  if (!product || !isShopTarget(target)) return false;
  if (target.categories?.length && !target.categories.includes(product.categoryId)) return false;
  for (const [, ids] of byGroup(target.terms, lookup)) {
    if (!ids.some((id) => product.termIds?.includes(id))) return false;
  }
  if (target.label === "sale") return Boolean(saleOf(product, sale));
  if (target.label === "new") return Boolean(product.isNew);
  if (target.label === "bestseller") return Boolean(product.isBestseller);
  if (target.label === "kits") return product.type === "kit";
  return true;
}

/** The address of a target, from the live slugs in `lookup`. */
export function targetHref(target, lookup = {}) {
  if (!target) return "/";
  if (target.page) return target.page;
  if (target.product) {
    const p = byId(lookup.products, target.product);
    return p ? `/product/${p.slug}` : "/shop";
  }
  const slugs = (list, ids = []) => ids.map((id) => byId(list, id)?.slug).filter(Boolean).join(JOIN);
  const cats = slugs(lookup.categories, target.categories);
  const pairs = byGroup(target.terms, lookup)
    .map(([gid, ids]) => [byId(lookup.groups, gid)?.slug, slugs(lookup.terms, ids)])
    .filter(([g, t]) => g && t)
    .map(([g, t]) => `/${g}/${t}`)
    .join("");
  let path = "/shop";
  if (cats) path += `/${cats}`;
  path += pairs;
  const label = LABELS[target.label];
  if (!label) return path;
  if (!cats && !pairs) return `${path}/${label.slug}`;
  return `${path}?show=${target.label}`;
}

/**
 * The target a shop address shows, from the part after /shop. Returns
 * `{ target }`, `{ target, redirect }` when an old slug was used (so shared
 * links keep working after a rename), or null when nothing matches.
 */
export function resolveShopPath(splat, lookup = {}) {
  const segs = String(splat ?? "").split("/").filter(Boolean);
  if (!segs.length) return { target: {} };
  if (segs.length === 1) {
    const label = Object.entries(LABELS).find(([, l]) => l.slug === segs[0]);
    if (label) return { target: { label: label[0] } };
  }

  let moved = false;
  const find = (list = [], slug) => {
    const hit = list.find((x) => x.slug === slug);
    if (hit) return hit;
    const old = list.find((x) => x.previousSlugs?.includes(slug));
    if (old) moved = true;
    return old;
  };
  const take = (list, part) => part.split(JOIN).map((slug) => find(list, slug));
  const groups = (lookup.groups ?? []).filter((g) => g.kind === "tags");
  const isGroup = (slug) => groups.some((g) => g.slug === slug || g.previousSlugs?.includes(slug));

  let i = 0;
  let cats = [];
  if (!isGroup(segs[0])) {
    cats = take(lookup.categories, segs[0]);
    i = 1;
  }
  const terms = [];
  for (; i < segs.length; i += 2) {
    const group = find(groups, segs[i]);
    if (!group || !segs[i + 1]) return null;
    terms.push(...take((lookup.terms ?? []).filter((t) => t.groupId === group.id), segs[i + 1]));
  }
  if ([...cats, ...terms].some((x) => !x)) return null;

  const target = {};
  if (cats.length) target.categories = cats.map((c) => c.id);
  if (terms.length) target.terms = terms.map((t) => t.id);
  return moved ? { target, redirect: targetHref(target, lookup) } : { target };
}

/** What a target is called, for a page title, a breadcrumb or a link's default text. */
export function targetLabel(target, lookup = {}) {
  if (!target) return "";
  if (target.page) return PAGES.find((p) => p.path === target.page)?.name ?? target.page;
  if (target.product) return byId(lookup.products, target.product)?.name ?? "A piece";
  const names = (list, ids = []) => ids.map((id) => byId(list, id)?.name).filter(Boolean);
  const cats = andList(names(lookup.categories, target.categories));
  const terms = andList(names(lookup.terms, target.terms));
  const label = LABELS[target.label]?.name;
  const base = cats && terms ? `${cats} for ${terms}` : cats || terms;
  if (!base) return label ?? "Shop everything";
  return label ? `${base}, ${label.toLowerCase()}` : base;
}

/** Whether everything a target names still exists (and is live), so a menu can drop dead links. */
export function targetExists(target, lookup = {}) {
  if (!target) return false;
  if (target.page) return PAGES.some((p) => p.path === target.page);
  if (target.product) return Boolean(byId(lookup.products, target.product));
  if (target.label && !LABELS[target.label]) return false;
  return (target.categories ?? []).every((id) => byId(lookup.categories, id)) && (target.terms ?? []).every((id) => byId(lookup.terms, id));
}

/**
 * The Shop mega menu, built from the "Shop by" groups rather than stored: one
 * column per group shown in the menu, in order, with its live items. A
 * category or tags item opens its shop page; an edit opens its own target.
 * The service (getNavigation) and the admin's preview both use this.
 */
export function shopMenuColumns(lookup = {}) {
  return (lookup.groups ?? [])
    .filter((g) => g.inMenu)
    .map((g) => {
      const links =
        g.kind === "category"
          ? (lookup.categories ?? []).map((c) => ({ id: c.id, title: c.name, href: targetHref({ categories: [c.id] }, lookup) }))
          : (lookup.terms ?? [])
              .filter((t) => t.groupId === g.id && (g.kind !== "edits" || targetExists(t.target ?? {}, lookup)))
              .map((t) => ({ id: t.id, title: t.name, href: targetHref(g.kind === "edits" ? t.target ?? {} : { terms: [t.id] }, lookup) }));
      return { id: g.id, title: g.name, links };
    })
    .filter((c) => c.links.length);
}

/**
 * The top bar after Shop, built from the catalogue and never typed: the
 * Edits items and the categories marked "in the top bar", live ones only,
 * in the order of the groups. Pass the page's own fixed links (About) to
 * add after them.
 */
export function topBarLinks(lookup = {}, fixed = []) {
  const groups = (lookup.groups ?? []).filter((g) => g.active !== false && g.kind === "edits");
  const edits = groups.flatMap((g) => (lookup.terms ?? []).filter((t) => t.groupId === g.id && t.active && t.inHeader).map((t) => ({ title: t.name, target: t.target ?? {} })));
  const cats = (lookup.categories ?? []).filter((c) => c.active && c.inHeader).map((c) => ({ title: c.name, target: { categories: [c.id] } }));
  return [...edits, ...cats, ...fixed].filter((l) => targetExists(l.target, lookup));
}

/**
 * Every stored link inside a document, with where it sits, for "is this
 * category still used?" checks. A link is any object carrying `target`.
 */
export function linksIn(value, where = []) {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((v) => linksIn(v, where));
  const here = value.title ?? value.label ?? value.name ?? value.cta;
  const path = here ? [...where, here] : where;
  const own = value.target && typeof value.target === "object" ? [{ target: value.target, where: path.join(" › ") }] : [];
  return [...own, ...Object.entries(value).filter(([k]) => k !== "target").flatMap(([, v]) => linksIn(v, path))];
}

/**
 * A view of a document with `href` filled in on every link that has a target.
 * Links with only an href (WhatsApp, an outside address) keep it as stored.
 */
export function withHrefs(value, lookup) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => withHrefs(v, lookup));
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = k === "target" ? v : withHrefs(v, lookup);
  if (value.target && typeof value.target === "object") out.href = targetHref(value.target, lookup);
  return out;
}

/** The stored form of a document: an href computed from a target is dropped, since the target is the truth. */
export function withoutHrefs(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(withoutHrefs);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === "href" && value.target) continue;
    out[k] = k === "target" ? v : withoutHrefs(v);
  }
  return out;
}
