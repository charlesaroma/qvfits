/* Vee: Outfit Builder */
import type { Product } from "../../types";
import { productSizes } from "@/utils/stockLevel";
import type { VeeContext } from "./context";
import { outfitColour, toneOf, type Mood, type Tone } from "./colour";

/** One piece of an outfit in the colour and size it would be bought in. */
export interface OutfitPiece {
  product: Product;
  colorId: string;
  color: string;
  size: string;
}

export interface Outfit {
  /** What kind of outfit: a curated kit, or a colour mood for a custom mix. */
  kind: "kit" | Mood;
  title: string;
  /** One line on why it works. */
  reason: string;
  pieces: OutfitPiece[];
  total: number;
  /** A kit's saving against buying the pieces one by one. */
  saves?: number;
  kitId?: string;
  score: number;
}

export interface OutfitAsk {
  /** A piece to build around (she is looking at it, or named it). */
  subject?: Product | null;
  /** A movement id: gym, run, yoga, golf-tennis, swim, lounge, everyday. */
  movement?: string | null;
  budget?: number | null;
  /** Colour names she asked for; outfits lead with these when she did. */
  colors?: string[];
  /** "Bolder" or "calmer": the mood to lean towards. */
  prefer?: Mood | null;
  /** The colour of the piece she already owns, when she is building around it. */
  baseColor?: string | null;
}

// The categories that complete a piece. Each inner list is a slot: any one category in it will do.
const PARTNERS: Record<string, string[][]> = {
  Bras: [["Bottoms", "Skorts"]],
  Bottoms: [["Bras"]],
  Skorts: [["Bras"]],
  Sets: [["Lounge"]],
  Swim: [["Lounge"]],
  Lounge: [["Bottoms"], ["Bras"]],
};
// With no piece in hand, an activity decides the slots: a top and a bottom, or the swim and lounge pair.
const BY_MOVEMENT: Record<string, string[][]> = {
  swim: [["Swim"], ["Lounge"]],
  lounge: [["Lounge"], ["Lounge"]],
};
const TOP_BOTTOM: string[][] = [["Bras"], ["Bottoms", "Skorts"]];

/** The colourways of a piece that can really be sold, in her size when she gave one. */
export function colourways(p: Product, size?: string | null) {
  const seen = new Map<string, { colorId: string; color: string; size: string }>();
  // Without her size, the most common one that is in stock stands in (M first), instead of always XS.
  const order = (s: string) => { const i = ["M", "S", "L", "XS", "XL"].indexOf(s); return i < 0 ? 9 : i; };
  const variants = [...(p.variants ?? [])].sort((a, b) => order(a.size) - order(b.size));
  for (const v of variants) {
    if (v.stock <= 0 || (size && v.size !== size)) continue;
    if (seen.has(v.colorId)) continue;
    const color = p.colors[p.colorIds.indexOf(v.colorId)];
    if (color) seen.set(v.colorId, { colorId: v.colorId, color, size: v.size });
  }
  if (seen.size || p.variants?.length) return [...seen.values()];
  // Older rows without variants: any size in stock, the first colour.
  const sz = size && p.stock[size] > 0 ? size : productSizes(p).find((s) => p.stock[s] > 0);
  return sz && p.colorIds[0] ? [{ colorId: p.colorIds[0], color: p.colors[0], size: sz }] : [];
}

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`;

function tonesOf(pieces: OutfitPiece[], tone: (id: string) => Tone | undefined) {
  const out: Tone[] = [];
  for (const pc of pieces) {
    const t = tone(pc.colorId);
    if (!t) return null;
    out.push(t);
  }
  return out;
}

const MOOD_TITLE: Record<Mood, string> = { tonal: "Tonal", neutral: "All neutral", pop: "One pop of colour", contrast: "Bold contrast" };

/**
 * Curated kits that suit the ask: they hold the piece she is looking at, or
 * most of them share her activity. Kits are the team's own picks, so their
 * colours are trusted; they only need to be in stock in her size and in budget.
 */
export function kitOutfits(ctx: VeeContext, ask: OutfitAsk): Outfit[] {
  const size = ctx.session.size;
  const wanted = (ask.colors ?? []).map((c) => c.toLowerCase());
  const out: Outfit[] = [];
  for (const look of ctx.looks) {
    const pieces = look.items.map((id) => ctx.products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p));
    if (pieces.length < 2) continue;
    const fits = (ask.subject && pieces.some((p) => p.id === ask.subject!.id)) || (ask.movement && pieces.filter((p) => p.termIds.includes(ask.movement!)).length >= 2);
    if (!fits || (ask.budget && look.price > ask.budget)) continue;
    const chosen: OutfitPiece[] = [];
    for (const p of pieces) {
      const ways = colourways(p, size);
      if (wanted.length) {
        const match = ways.find((w) => wanted.includes(w.color.toLowerCase()));
        if (match) {
          chosen.push({ product: p, ...match });
          continue;
        }
      }
      const way = ways[0];
      if (!way) break;
      chosen.push({ product: p, ...way });
    }
    if (chosen.length !== pieces.length) continue;
    if (wanted.length && !chosen.some((pc) => wanted.includes(pc.color.toLowerCase()))) continue;
    out.push({ kind: "kit", title: look.title, reason: look.note, pieces: chosen, total: look.price, saves: Math.max(0, look.separate - look.price), kitId: look.id, score: 100 });
  }
  return out.slice(0, 1);
}

/**
 * Custom outfits from any in-stock pieces. For every combination of
 * colourways the colour engine decides if it works; the best of each mood
 * (tonal, neutral, one pop, contrast) is kept, up to three, so she sees real
 * choices, not three near-copies.
 */
export function customOutfits(ctx: VeeContext, ask: OutfitAsk, limit = 3): Outfit[] {
  const size = ctx.session.size;
  const tones = new Map(ctx.palette.map((s) => [s.id, toneOf(s)]));
  const toneFor = (id: string) => tones.get(id);
  const rules = ctx.settings.assistant?.pairing;
  const subject = ask.subject ?? null;
  const slots = subject ? PARTNERS[subject.category] ?? TOP_BOTTOM : (ask.movement && BY_MOVEMENT[ask.movement]) || TOP_BOTTOM;

  // Candidates per slot: in stock, of the right category, preferring her activity, bestsellers first.
  const mov = ask.movement ?? subject?.termIds.find((t) => ctx.movements.some((m) => m.id === t)) ?? null;
  const wanted = (ask.colors ?? []).map((c) => c.toLowerCase());

  const lists = slots.map((cats) => {
    let pool = ctx.products.filter((p) => p.type !== "kit" && cats.includes(p.category) && p.id !== subject?.id && colourways(p, size).length);
    const inMove = mov ? pool.filter((p) => p.termIds.includes(mov)) : [];
    if (inMove.length) pool = inMove;

    // When a specific colour is wanted, prioritize pieces available in that colour
    if (wanted.length) {
      pool.sort((a, b) => {
        const aHas = colourways(a, size).some((w) => wanted.includes(w.color.toLowerCase()));
        const bHas = colourways(b, size).some((w) => wanted.includes(w.color.toLowerCase()));
        if (aHas !== bHas) return aHas ? -1 : 1;
        return Number(b.isBestseller) - Number(a.isBestseller) || a.price - b.price;
      });
    } else {
      pool.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || a.price - b.price);
    }

    return pool
      .slice(0, 8)
      .flatMap((p) => {
        const ways = colourways(p, size);
        if (wanted.length) {
          ways.sort((a, b) => {
            const aW = wanted.includes(a.color.toLowerCase());
            const bW = wanted.includes(b.color.toLowerCase());
            return aW === bW ? 0 : aW ? -1 : 1;
          });
        }
        return ways.map((w) => ({ product: p, ...w }));
      });
  });
  if (lists.some((l) => !l.length)) return [];

  let ways = subject ? colourways(subject, size) : [];
  // Building around something she owns in a named colour: only that colourway, when we make it.
  if (subject && ask.baseColor) ways = ways.filter((w) => w.color.toLowerCase() === ask.baseColor!.toLowerCase()).length ? ways.filter((w) => w.color.toLowerCase() === ask.baseColor!.toLowerCase()) : ways;
  const bases: OutfitPiece[][] = subject ? ways.map((w) => [{ product: subject, ...w }]) : [[]];
  if (subject && !bases.length) return [];

  const found: Outfit[] = [];
  const walk = (i: number, so: OutfitPiece[]) => {
    if (i === lists.length) {
      const names = new Set(so.map((p) => p.product.id));
      if (names.size !== so.length) return;
      const tn = tonesOf(so, toneFor);
      if (!tn) return;
      const total = so.reduce((n, p) => n + p.product.price, 0);
      if (ask.budget && total > ask.budget) return;
      const c = outfitColour(tn, rules);
      if (!c.ok) return;

      const countWanted = wanted.length ? so.filter((p) => wanted.includes(p.color.toLowerCase())).length : 0;
      const allWanted = wanted.length > 0 && countWanted === so.length;
      const anyWanted = countWanted > 0;

      // When a shopper explicitly asks for a colour (e.g. black, white):
      // - Head-to-toe match gets highest priority (+35)
      // - Partial match gets a solid boost (+15)
      // - Non-matching outfits are heavily penalized (-25) so they don't drown out the requested colour
      const askedBonus = allWanted ? 35 : anyWanted ? 15 : wanted.length ? -25 : 0;
      const inMove = mov ? so.filter((p) => p.product.termIds.includes(mov)).length * 0.4 : 0;
      const sellers = so.filter((p) => p.product.isBestseller).length * 0.3;
      const leaning = ask.prefer && (c.mood === ask.prefer || (ask.prefer === "neutral" && c.mood === "tonal") || (ask.prefer === "contrast" && c.mood === "pop")) ? 2 : 0;

      let title = MOOD_TITLE[c.mood];
      let reason = c.reason;
      if (allWanted && ask.colors?.[0]) {
        title = `All ${ask.colors[0]}`;
        reason = `Head to toe ${ask.colors[0].toLowerCase()} · Timeless, sleek and versatile`;
      } else if (anyWanted && ask.colors?.[0] && c.mood === "contrast") {
        title = `${ask.colors[0]} Contrast`;
      }

      found.push({ kind: c.mood, title, reason, pieces: so, total, score: c.score * 10 + askedBonus + inMove + sellers + leaning });
      return;
    }
    for (const cand of lists[i]) walk(i + 1, [...so, cand]);
  };
  for (const base of bases) walk(0, base);

  // One of each mood, best first; then top up with the next best if moods are missing.
  found.sort((a, b) => b.score - a.score);
  const picked: Outfit[] = [];
  const used = new Set<string>();
  const sig = (o: Outfit) => o.pieces.map((p) => `${p.product.id}:${p.colorId}`).join("|");
  const share = (o: Outfit) => o.pieces.map((p) => p.product.id).join("|");

  if (wanted.length) {
    // When a colour is requested, prioritize the top outfits that feature the requested colour
    for (const o of found) {
      if (picked.length >= limit) break;
      if (!picked.some((p) => sig(p) === sig(o)) && !used.has(share(o))) {
        picked.push(o);
        used.add(share(o));
      }
    }
  } else {
    for (const mood of ["pop", "tonal", "neutral", "contrast"] as Mood[]) {
      const best = found.find((o) => o.kind === mood && !used.has(share(o)));
      if (best && picked.length < limit) { picked.push(best); used.add(share(best)); }
    }
    for (const o of found) {
      if (picked.length >= limit) break;
      if (!picked.some((p) => sig(p) === sig(o)) && !used.has(share(o))) { picked.push(o); used.add(share(o)); }
    }
  }
  return picked.sort((a, b) => b.score - a.score);
}

/** Kits first, then the custom mixes. */
export function buildOutfits(ctx: VeeContext, ask: OutfitAsk) {
  const kits = kitOutfits(ctx, ask);
  const custom = customOutfits(ctx, ask, kits.length ? 2 : 3);
  return { kits, custom };
}

export const outfitLine = (o: Outfit) => (o.saves ? `${ugx(o.total)}, saving ${ugx(o.saves)} as a kit` : ugx(o.total));
