/* Vee: Outfit Replies */
import type { Product } from "../../types";
import { anyInStock } from "@/utils/stockLevel";
import { who, type VeeContext } from "./context";
import { chips, cards, outfitBlock, text, ugx, type Block } from "./helpers";
import { findBudget, findCategory, findColors, findMovement, has } from "./language";
import { buildOutfits, type OutfitAsk } from "./outfit";
import { say } from "./voice";

/** Sizes people give about themselves: "I'm a M", "size L", "I wear small". */
const SIZE_WORDS: Record<string, string> = { xs: "XS", s: "S", m: "M", l: "L", xl: "XL", small: "S", medium: "M", large: "L" };

/** Whatever she says about herself is kept, so she is not asked twice. */
export function remember(t: string, ctx: VeeContext): boolean {
  const { session } = ctx;
  const size = t.match(/\b(?:size|i'?m an?|i am an?|i wear(?: an?)?|i take(?: an?)?|my size is)\s+(xs|s|m|l|xl|small|medium|large)\b/i);
  if (size) session.size = SIZE_WORDS[size[1].toLowerCase()];
  const budget = findBudget(t);
  if (budget) session.budget = budget;
  const colors = findColors(t, ctx.swatches);
  if (colors.length) session.colors = colors;
  return Boolean(size);
}

/** Words that mean "change the last outfit": bolder, calmer, cheaper, a colour, a budget, another activity. */
const BOLDER = ["bolder", "louder", "more colour", "more color", "stand out", "statement", "pop"];
const CALMER = ["calmer", "safer", "subtle", "quiet", "neutral", "plain", "simpler", "understated"];
const CHEAPER = ["cheaper", "less expensive", "lower price", "save", "affordable"];

/** A short follow-up on the last outfit ("in black", "under 150k", "bolder"), or null if it is something else. */
export function refinement(t: string, ctx: VeeContext): OutfitAsk | null {
  const last = ctx.session.lastAsk;
  // A new piece or category named ("sprots bra in olive") is a fresh search, not a tweak of the last outfit.
  if (!last || t.split(/\s+/).length > 8 || findCategory(t)) return null;
  const colors = findColors(t, ctx.swatches);
  const budget = findBudget(t);
  const movement = findMovement(t);
  const bolder = has(t, BOLDER);
  const calmer = has(t, CALMER);
  const cheaper = has(t, CHEAPER);
  if (!colors.length && !budget && !movement && !bolder && !calmer && !cheaper) return null;
  return {
    subject: movement ? null : undefined,
    subjectId: movement ? null : last.subjectId,
    movement: movement ?? last.movement,
    budget: budget ?? (cheaper && last.total ? Math.round(last.total * 0.8) : last.budget),
    colors: colors.length ? colors : last.colors,
    prefer: bolder ? "contrast" : calmer ? "neutral" : last.prefer,
  } as OutfitAsk & { subjectId?: string | null };
}

/** Kits first, then custom mixes, with a line on why each works and one tap to add it all. */
export function outfitReply(ctx: VeeContext, ask: OutfitAsk & { subjectId?: string | null }): Block[] {
  const { session } = ctx;
  const subject = ask.subject ?? ctx.products.find((p) => p.id === ask.subjectId) ?? null;
  const full: OutfitAsk = { ...ask, subject };
  const { kits, custom } = buildOutfits(ctx, full);
  const total = [...kits, ...custom][0]?.total;
  session.lastAsk = { subjectId: subject?.id ?? null, movement: ask.movement ?? null, budget: ask.budget ?? null, colors: ask.colors ?? [], prefer: ask.prefer ?? null, total };

  if (!kits.length && !custom.length) {
    const colName = ask.colors?.[0];
    return [
      text(
        colName
          ? `I couldn't find a full in-stock outfit in ${colName} right now${who(ctx)}. You can try another colour, or browse individual ${colName} pieces in the shop.`
          : `${say(ctx, "none")}${ask.budget ? ` Try a budget above ${ugx(ask.budget)}, or another colour.` : ""}`
      ),
      chips(colName && colName.toLowerCase() !== "black" ? "In Black" : "In White", "Another colour", "For the gym", "Talk to a human"),
    ];
  }

  const out: Block[] = [];
  const colName = ask.colors?.[0];
  if (kits.length) {
    out.push(text(say(ctx, "kitIntro")), ...kits.map(outfitBlock));
    if (custom.length) out.push(text(say(ctx, "customIntro")));
  } else {
    const intro = colName
      ? `Here's what I've styled in ${colName} for you${who(ctx)}:`
      : `${say(ctx, "outfitIntro")}${subject ? ` (built around the ${subject.name})` : ""}`;
    out.push(text(intro));
  }
  // Asked for bolder or calmer but the colour rules allow nothing further that way: say so, rather than repeat the same looks silently.
  const leaning = ask.prefer === "contrast" ? ["contrast", "pop"] : ask.prefer === "neutral" ? ["neutral", "tonal"] : null;
  if (leaning && custom.length && !custom.some((o) => leaning.includes(o.kind))) {
    out.push(text(ask.prefer === "contrast" ? "That is as bold as these colours go without clashing, so these are my boldest safe picks." : "These are already the calmest that are in stock."));
  }
  out.push(...custom.map(outfitBlock));
  // Her size makes every piece shown one she can actually buy; ask once if she has not said.
  if (!session.size) out.push(text(`I have shown what is in stock${who(ctx)}. Tell me your size ("I'm a M") and I will only show pieces in it.`));

  const chipOptions: string[] = [];
  if (colName && colName.toLowerCase() !== "black") chipOptions.push("In Black");
  if (colName && colName.toLowerCase() !== "white") chipOptions.push("In White");
  chipOptions.push("Something bolder", "For the gym", ask.budget ? "Cheaper" : "Under 200k");
  out.push(chips(...chipOptions.slice(0, 4)));
  return out;
}

/** She asked for a set, not an outfit: show the Sets in stock, and say how a set differs from a kit. */
export function setsReply(ctx: VeeContext): Block[] {
  const sets = ctx.products.filter((p) => p.category === "Sets" && p.type !== "kit" && anyInStock(p)).slice(0, 3);
  if (!sets.length) return [text("There are no sets in stock right now. I can still build you a matching outfit from separate pieces."), chips("Build me an outfit")];
  return [
    text(`A set is one piece with the top and bottom made to match, so there is nothing to coordinate${who(ctx)}. A kit is several separate pieces bundled at a lower price.`),
    cards(sets),
    chips("Build me an outfit", "Show me kits", "Under 200k"),
  ];
}

/** Used when she wants an outfit but gave nothing to build it on: ask the one thing needed. */
export function askActivity(ctx: VeeContext): Block[] {
  ctx.session.pendingOutfit = true;
  return [text(say(ctx, "askActivity")), chips("Gym", "Running", "Pilates and yoga", "Swimming")];
}

export type { Product };
