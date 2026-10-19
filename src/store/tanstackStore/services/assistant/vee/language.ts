/* Vee: Language (from Quivogue js/assistant.js) */
import type { Product } from "../../types";

/** What a shopper's words point at: category, activity, colours, budget, piece, measurements. */

const CATEGORY_WORDS: Record<string, string[]> = {
  Sets: ["set", "sets", "co-ord", "coord", "matching", "two piece", "two-piece", "twinset"],
  Bras: ["bra", "bras", "bralette", "crop top", "sports bra", "top", "tops"],
  Bottoms: ["legging", "leggings", "tights", "short", "shorts", "bike short", "jogger", "joggers", "pant", "pants", "trouser", "trousers", "bottoms", "flare"],
  Skorts: ["skort", "skorts", "skirt", "golf", "tennis", "court", "course"],
  Swim: ["swim", "swimsuit", "swimwear", "bikini", "one piece", "one-piece", "costume", "beach", "pool"],
  Lounge: ["lounge", "loungewear", "hoodie", "sweat", "sweats", "pyjama", "pajama", "comfy", "travel"],
};

// Movements, not occasions: people shop activewear by what they do in it.
const MOVEMENT_WORDS: Record<string, string[]> = {
  gym: ["gym", "lift", "lifting", "weights", "squat", "squats", "train", "training", "workout", "strength"],
  run: ["run", "running", "runner", "jog", "jogging", "cardio", "marathon", "treadmill"],
  yoga: ["yoga", "pilates", "stretch", "stretching", "reformer", "barre", "flexibility"],
  "golf-tennis": ["golf", "tennis", "padel", "court", "course", "racket", "racquet", "nine holes"],
  swim: ["swim", "swimming", "pool", "beach", "holiday", "vacation", "island", "laps"],
  lounge: ["lounge", "lounging", "rest", "rest day", "travel", "flight", "sofa", "home", "chill", "recovery"],
  everyday: ["everyday", "every day", "day to day", "errands", "school run", "casual", "daily", "weekend"],
};

const COLOR_ALIASES: Record<string, string> = {
  green: "Teal", emerald: "Teal", "dark green": "Forest", beige: "Sand", nude: "Sand", tan: "Mocha", brown: "Mocha",
  yellow: "Butter", grey: "Slate", gray: "Slate", khaki: "Olive", "off white": "Ivory", neutral: "Sand",
  monochrome: "Black",
};

export const has = (t: string, arr: string[]) => arr.some((w) => t.includes(w));

/** Bare words: without stripping punctuation, "leggings?" never matches. */
export const words = (t: string) => t.toLowerCase().replace(/[^\w\s-]/g, " ").split(/\s+/).filter(Boolean);

export function findCategory(t: string) {
  return Object.entries(CATEGORY_WORDS).find(([, w]) => has(t, w))?.[0] ?? null;
}

export function findMovement(t: string) {
  return Object.entries(MOVEMENT_WORDS).find(([, w]) => has(t, w))?.[0] ?? null;
}

export function findColors(t: string, swatchNames: string[]) {
  const map: Record<string, string> = { ...COLOR_ALIASES };
  for (const c of swatchNames) map[c.toLowerCase()] = c;
  const out: string[] = [];
  for (const [word, color] of Object.entries(map)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(t) && !out.includes(color)) out.push(color);
  }
  return out;
}

/** "under 200k", "below 150,000", "less than 300000", "max 250k". */
export function findBudget(t: string) {
  const m = t.match(/(?:under|below|less than|max|maximum|up to|budget of|budget)\s*(?:ugx|shs?)?\s*([\d,.]+)\s*(k|m)?/i);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/[,\s]/g, ""));
  if (Number.isNaN(n)) return null;
  if (m[2]?.toLowerCase() === "k") n *= 1000;
  if (m[2]?.toLowerCase() === "m") n *= 1000000;
  if (n < 1000) n *= 1000; // "under 200" almost certainly means 200k here
  return n;
}

/** The piece whose distinctive name words appear most. */
export function findProduct(t: string, products: Product[]) {
  let best: Product | null = null;
  let bestScore = 0;
  for (const p of products) {
    const nameWords = p.name.toLowerCase().replace(/[^a-z\s-]/g, "").split(/[\s-]+/).filter((w) => w.length > 2 && !["the", "and"].includes(w));
    let score = 0;
    for (const w of nameWords) if (t.includes(w)) score += w.length > 4 ? 2 : 1;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 3 ? best : null;
}

export function findMeasurements(t: string) {
  const grab = (labels: string[]) => {
    for (const l of labels) {
      const m = t.match(new RegExp(`${l}\\D{0,12}?(\\d{2,3}(?:\\.\\d)?)`, "i")) || t.match(new RegExp(`(\\d{2,3}(?:\\.\\d)?)\\s*(?:cm|inch|in|")?\\s*${l}`, "i"));
      if (m) return parseFloat(m[1]);
    }
    return null;
  };
  return { bust: grab(["bust", "chest", "boobs"]), waist: grab(["waist"]), hip: grab(["hips?", "bum"]) };
}
