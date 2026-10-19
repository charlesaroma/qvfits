/* Vee: Helpers */
import type { Product } from "../../types";
import type { Outfit } from "./outfit";
import { inStock, productSizes } from "@/utils/stockLevel";
import { formatIn } from "@/utils/formatCurrency";

export type Block =
  | { type: "text"; paras: string[] }
  | { type: "cards"; products: Product[] }
  | { type: "link"; label: string; to: string; external?: boolean }
  | { type: "outfit"; outfit: Outfit }
  | { type: "chips"; options: string[] }
  | { type: "whatsapp"; label: string; note?: string; message?: string; phone?: string };

export const text = (...paras: string[]): Block => ({ type: "text", paras: paras.filter(Boolean) });
export const cards = (products: Product[]): Block => ({ type: "cards", products });
export const outfitBlock = (outfit: Outfit): Block => ({ type: "outfit", outfit });
export const chips = (...options: string[]): Block => ({ type: "chips", options: options.filter(Boolean).slice(0, 4) });
export const link = (label: string, to: string, external = false): Block => ({ type: "link", label, to, external });
export const whatsappBlock = (label = "Chat with Admin on WhatsApp", note?: string, message?: string, phone?: string): Block => ({
  type: "whatsapp",
  label,
  note,
  message,
  phone,
});

/** Vee quotes prices in shillings: the shop settles in UGX. */
export const ugx = (n: number) => formatIn({ code: "UGX", perUGX: 1, decimals: 0, display: "code" }, n);

export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Never "every size": only the sizes carried, and what is gone said plainly. */
export function stockLine(p: Product) {
  const sizes = productSizes(p);
  const avail = sizes.filter((s) => inStock(p, s));
  if (!avail.length) return "It's fully sold out right now. I won't pretend otherwise.";
  if (avail.length === sizes.length) return `We have it in ${avail.join(", ")}.`;
  return `In stock: ${avail.join(", ")}. Sold out: ${sizes.filter((s) => !inStock(p, s)).join(", ")}.`;
}

/** Did they name a size we simply don't carry for this piece? */
export function sizeGapLine(p: Product, t: string) {
  const m = t.match(/\b(xs|s|m|l|xl)\b/i);
  if (!m) return "";
  const asked = m[1].toUpperCase();
  const sizes = productSizes(p);
  if (sizes.includes(asked)) return inStock(p, asked) ? ` Yes, ${asked} is in.` : ` ${asked} is sold out at the moment.`;
  return ` We don't carry this one in ${asked} at all, only ${sizes.join(", ")}.`;
}
