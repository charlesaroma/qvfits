/* Domain Types */

/**
 * The contract with qvfits-api (docs/05-backend-integration.md). Mocks return
 * exactly these shapes, so a service moves to HTTP without a screen changing.
 * The seeds in src/data/*.json are stored rows; services return views that
 * expand ids into names where a screen needs them. All money is UGX, as whole
 * shillings.
 */

import type { Id } from "./api/types";

export type { Id };

/* Attributes: managed under Catalog, read by the shop filters */

export interface Category {
  id: Id;
  name: string;
  slug: string;
  parentId: Id | null;
  /** A photo id in /photos, or an uploaded photo, for the category tile. */
  image?: string | Photo | null;
  description: string;
  position: number;
  active: boolean;
  /** Also a link in the top bar, after Shop. */
  inHeader?: boolean;
  /** Slugs this category used to have; old shop links redirect to the current one. */
  previousSlugs: string[];
}

export interface Color {
  id: Id;
  name: string;
  hex: string;
  position: number;
}

export interface SizeOption {
  id: Id;
  label: string;
  group: "apparel" | "shoe" | (string & {});
  position: number;
}

/**
 * One "Shop by" group on the storefront: Category, Movement, Edits, or one the
 * admin adds (Fit, Support). The kind decides what its items are:
 *   category  the categories table; a product has exactly one (categoryId)
 *   tags      terms that products carry any number of (termIds)
 *   edits     terms that are curated views (New, Size guide), each a target
 */
export type GroupKind = "category" | "tags" | "edits";

export interface ShopGroup {
  id: Id;
  name: string;
  /** The URL part, /shop/<group>/<term>. */
  slug: string;
  previousSlugs: string[];
  kind: GroupKind;
  position: number;
  /** A column in the Shop mega menu. */
  inMenu: boolean;
  /** A chip group in the shop's filter sidebar (tags groups only). */
  inFilters: boolean;
  active: boolean;
}

/** An item in a tags or edits group: Running, High support, New. */
export interface Term {
  id: Id;
  groupId: Id;
  name: string;
  /** The URL part, unique within its group. */
  slug: string;
  /** Slugs it used to have; old shop links redirect to the current one. */
  previousSlugs: string[];
  /** A photo id in /photos, or an uploaded photo, for tiles and its shop page. */
  image?: string | Photo | null;
  description: string;
  /** Edits only: what the item opens. */
  target?: Target;
  position: number;
  active: boolean;
  /** Edits only: also a link in the top bar, after Shop. */
  inHeader?: boolean;
}

/** Built-in filters, plus one per tags group: `group:<groupId>`. */
export type FacetId = "category" | "size" | "color" | "price" | `group:${string}`;

export type SortId = "featured" | "bestselling" | "new" | "low" | "high";

/** The shop's Filter drawer sections and its Sort menu, both set in Catalog, Categories. */
export interface FilterConfig {
  facets: { id: FacetId; label: string; visible: boolean; position: number }[];
  sort: { default: SortId; options: { id: SortId; label: string; visible: boolean; position: number }[] };
}

/**
 * What a link shows (see utils/shopTargets): part of the shop, one piece or
 * a fixed page. Stored links keep the target; reads add the `href`.
 */
export interface Target {
  categories?: Id[];
  /** Terms from any tags groups: OR within a group, AND across groups. */
  terms?: Id[];
  label?: "new" | "bestseller" | "sale";
  product?: Id;
  page?: string;
}

/** A stored link: a target, or for WhatsApp and outside addresses a plain href. */
export interface Linked {
  target?: Target;
  href?: string | null;
}

/** Why a size's stock changed. Staff pick the first four; the rest happen on their own. */
export type StockReason = "restock" | "sale" | "damaged" | "correction" | "return" | "order" | "cancel";

/** One change to one size of one colour, with who made it and why. */
export interface StockMovement {
  id: Id;
  at: string;
  productId: Id;
  productName: string;
  color: string;
  size: string;
  from: number;
  to: number;
  reason: StockReason;
  /** The order or return it came from: QV-XXXXXX. */
  ref?: string;
  by: string;
}

/* Catalog */

export type Size = "XS" | "S" | "M" | "L" | "XL" | (string & {});
export type Badge = "New" | "Bestseller" | (string & {});
export type ProductStatus = "draft" | "active" | "archived";

/**
 * One photo. Local: its id in /photos and the WebP widths on disk. Remote:
 * `url` on an image CDN that resizes on request (Unsplash today, Spaces once
 * the API lands); `widths` are the sizes to ask it for.
 */
export interface Photo {
  id: string;
  url?: string;
  width: number;
  height: number;
  widths: number[];
  /** The colourway this photo shows, if any. */
  colorId?: Id | null;
}

/** One sellable unit: a colour in a size, with its own SKU and stock. */
export interface Variant {
  id: Id;
  sku: string;
  colorId: Id;
  size: Size;
  stock: number;
}

/** A product as stored (src/data/products.json and the API's table). */
export interface ProductRecord {
  id: Id;
  /** The URL part, /product/:slug. Made from the name; frozen once the piece has been live. */
  slug: string;
  /** Set when the piece first goes live, so its address never changes after that. */
  slugLocked?: boolean;
  name: string;
  status: ProductStatus;
  categoryId: Id;
  price: number;
  compareAtPrice?: number | null;
  salePercent?: number | null;
  /** A single piece, or a kit: pieces sold together at a kit price. */
  type: "piece" | "kit";
  /** Kit only: the pieces in it, in order. */
  kitItems: Id[];
  /** Shown on /shop/new and the home New releases rail. */
  isNew: boolean;
  /** Always counted a best seller, on top of the ones sales pick. */
  pinnedBestseller: boolean;
  colorIds: Id[];
  /** Terms from tags groups (Movement, Fit…). */
  termIds: Id[];
  blurb: string;
  details: string[];
  fit?: "small" | "true" | "large" | "relaxed" | null;
  fitNote?: string;
  fabric?: string;
  care?: string;
  variants: Variant[];
  photos: Photo[];
  seo: { title: string; description: string };
  createdAt: string;
  updatedAt: string;
}

/**
 * A product as screens read it: the record plus names for its ids, and stock
 * per size summed across colours, so the shop never joins tables itself.
 */
export interface Product extends ProductRecord {
  /** Pinned, or among the top sellers by units sold in the last 90 days. */
  isBestseller: boolean;
  /** Units sold in paid orders in the last 90 days. */
  unitsSold: number;
  /** The card label: Bestseller, then New, then none. */
  badge: Badge | null;
  category: string;
  /** The category's URL part, for /shop/:slug links. */
  categorySlug: string;
  colors: string[];
  /** Units on hand per size, across every colour. 0 = sold out in that size. */
  stock: Record<Size, number>;
}

export interface ProductFilters {
  categoryId?: Id;
  size?: Size;
  color?: string;
  /** Term ids, comma separated. */
  term?: string;
  badge?: string;
  sale?: boolean;
  inStock?: boolean;
  maxPrice?: number;
  q?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "new";
}

export type ReviewStatus = "pending" | "approved" | "hidden";

export interface Review {
  id: Id;
  productId: Id | null;
  name: string;
  text: string;
  stars: number;
  status: ReviewStatus;
  createdAt: string;
  badge?: string;
}

export interface SizeRow {
  size: Size;
  [measure: string]: string | number | number[];
}

/* Shop settings and content */

export interface Currency {
  code: string;
  label: string;
  /** How much of this currency one shilling buys. */
  perUGX: number;
  decimals: number;
  display?: "code" | "symbol" | "narrowSymbol";
}

export interface ShopSettings {
  brand: string;
  wordmark: string;
  tagline: string;
  blurb: string;
  address: string;
  addressNote?: string;
  mapsUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagram: string;
  instagramHandle: string;
  tiktok?: string;
  tiktokHandle?: string;
  opensAt: string;
  currency: "UGX";
  /** Free delivery from this subtotal, unless a zone sets its own. */
  freeShippingOver: number;
  /** Days after delivery an unworn piece can be exchanged. */
  exchangeDays: number;
  /** A size at or under this many units counts as low stock. */
  lowStockAt: number;
  /** How many top sellers (by units sold, last 90 days) count as best sellers, on top of pinned ones. */
  bestsellerCount: number;
  /** Hours an unpaid order holds its stock before it cancels itself. */
  unpaidHoldHours: number;
  /** Products per row on the shop page by default; shoppers can change it. */
  shopGrid: { phone: 1 | 2; tablet: 2 | 3; desktop: 3 | 4 };
  ratesUpdated: string;
  currencies: Currency[];
  assistant: {
    endpoint: string | null;
    enabled: boolean;
    whatsappHandover?: boolean;
    name: string;
    greeting: string;
    chips: string[];
    /** How much personality she shows: playful (most wit), balanced, or straight (none). */
    tone?: "playful" | "balanced" | "straight";
    /** Colour pairs the team has ruled on, which beat her colour rules. Colour ids. */
    pairing?: { good: [string, string][]; avoid: [string, string][] };
  };
  /** Read only, on reads: the active delivery zones, so every page that shows a fee has them. */
  zones?: ShippingZone[];
}

export interface ShippingZone {
  id: Id;
  name: string;
  description: string;
  fee: number;
  /** Free delivery from this subtotal; null uses the shop-wide threshold. */
  freeOver: number | null;
  /** Collected from the showroom, so no address is needed. */
  collect: boolean;
  etaDays: string;
  active: boolean;
  position: number;
}

export interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  short: string;
  instructions: string;
  active: boolean;
  position: number;
}

/** A question a shopper put to Vee, and whether she found an answer. */
export interface VeeQuestion {
  id: Id;
  text: string;
  answered: boolean;
  createdAt: string;
}

export interface FaqItem {
  id: Id;
  q: string;
  a: string;
  group: string;
  position: number;
}

/* Cart and orders */

export interface CartLine {
  productId: Id;
  size: Size;
  color: string;
  qty: number;
  /** Added as part of this kit, so the kit's price applies when the whole set is in the bag. */
  kitId?: Id;
}

/** A shipping zone id: kampala, upcountry, pickup, or one the admin adds. */
export type DeliveryRegion = string;
export type PaymentMethod = "mtn" | "airtel" | "card" | "cash" | "whatsapp" | (string & {});

export type OrderStatus =
  | "pending"
  | "paid"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "exchanged"
  | "refunded";

export type PaymentStatus = "unpaid" | "part_paid" | "paid" | "partially_refunded" | "refunded";

export interface OrderLine extends CartLine {
  name: string;
  price: number;
  colorId?: Id;
}

export interface OrderEvent {
  status: OrderStatus;
  at: string;
  by: string;
  note?: string;
}

export interface OrderNote {
  id: Id;
  text: string;
  by: string;
  at: string;
}

export interface Order {
  id: Id;
  /** What the customer quotes: QV-XXXXXX. */
  ref: string;
  customerId?: Id;
  name: string;
  phone: string;
  email?: string;
  region: DeliveryRegion;
  address?: string;
  note?: string;
  lines: OrderLine[];
  subtotal: number;
  delivery: number;
  discount: number;
  discountCode?: string;
  /** What complete kits in the order saved against their pieces' own prices. */
  kitSaving?: number;
  total: number;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  history: OrderEvent[];
  notes: OrderNote[];
  /** Entered by staff for a WhatsApp or showroom sale. */
  /** Where it came from: the shop, or a sale staff recorded in the showroom or on WhatsApp ("manual" is older records). */
  source?: "web" | "showroom" | "whatsapp" | "manual";
  createdAt: string;
}

export interface CheckoutInput {
  name: string;
  phone: string;
  email?: string;
  region: DeliveryRegion;
  address?: string;
  note?: string;
  payment: PaymentMethod;
  lines: CartLine[];
  discountCode?: string;
  /** What complete kits in the order saved against their pieces' own prices. */
  kitSaving?: number;
}

export type TransactionType = "payment" | "refund";
export type TransactionStatus = "pending" | "succeeded" | "failed";

export interface Transaction {
  id: Id;
  orderId: Id;
  orderRef: string;
  type: TransactionType;
  method: PaymentMethod;
  amount: number;
  status: TransactionStatus;
  /** The gateway's or mobile money reference. */
  reference: string;
  note?: string;
  createdAt: string;
}

export type ReturnStatus = "requested" | "approved" | "rejected" | "received" | "refunded" | "exchanged";

export interface ReturnRequest {
  id: Id;
  orderId: Id;
  orderRef: string;
  customerId?: Id;
  name: string;
  lines: { productId: Id; name: string; size: Size; color: string; qty: number; price: number }[];
  reason: string;
  resolution: "refund" | "exchange";
  status: ReturnStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/* People */

export interface Address {
  id: Id;
  label: string;
  region: DeliveryRegion;
  address: string;
  phone: string;
}

export interface Customer {
  id: Id;
  name: string;
  email: string;
  phone?: string;
  addresses: Address[];
  wishlist: Id[];
  /** The bag, so it follows the shopper to another device (gap F6). */
  bag?: CartLine[];
  /** Product ids, newest first: what they looked at lately. */
  recentlyViewed?: Id[];
  notes?: string;
  tags?: string[];
  /** When they opened the confirmation link in their sign-up email. */
  emailConfirmedAt?: string | null;
  createdAt: string;
}

/** view, edit and delete for every module; refund and payment only on orders, since they move money. */
export type PermissionAction = "view" | "edit" | "delete" | "refund" | "payment";

/** One admin module the permission matrix covers. */
export interface PermissionModule {
  id: string;
  label: string;
  actions: PermissionAction[];
}

export type PermissionMap = Record<string, PermissionAction[]>;

export interface Role {
  id: Id;
  name: string;
  description: string;
  /** Owner, Manager and Staff ship with the shop and cannot be deleted. */
  system: boolean;
  permissions: PermissionMap;
}

export type AdminRole = "owner" | "manager" | "staff" | (string & {});

export interface StaffMember {
  id: Id;
  name: string;
  email: string;
  roleId: AdminRole;
  /** Per-person changes on top of the role, module by module. */
  overrides: PermissionMap;
  status: "active" | "invited" | "suspended";
  lastSeenAt: string | null;
  createdAt: string;
}

/** The signed-in admin, with the permissions their role and overrides give. */
export interface AdminUser {
  id: Id;
  name: string;
  email: string;
  role: AdminRole;
  permissions: PermissionMap;
}

export interface ActivityEntry {
  id: Id;
  actorId: Id | null;
  actorName: string;
  module: string;
  action: "create" | "update" | "delete" | (string & {});
  entityId: Id | null;
  summary: string;
  at: string;
}

/* Marketing */

export type SubscriberStatus = "pending" | "subscribed" | "unsubscribed";
export type SubscriberSource = "footer" | "home" | "checkout" | "account" | "resubscribe";

/**
 * One address on the newsletter, with the consent that put it there (double
 * opt-in: pending until the emailed link is opened). Unsubscribing keeps the
 * record so the address isn't mailed again; erasing removes it entirely.
 */
export interface Subscriber {
  id: Id;
  email: string;
  name?: string;
  customerId?: Id;
  status: SubscriberStatus;
  source: SubscriberSource;
  /** The words they agreed to, as shown when they signed up. */
  consentText: string;
  consentedAt: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  /** In the confirm and unsubscribe links. */
  token: string;
  /** When the welcome code went out; only ever once per address. */
  welcomeSentAt: string | null;
  createdAt: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sent";

/** A newsletter email: written in the admin, scheduled or sent to confirmed subscribers only. */
export interface Campaign {
  id: Id;
  subject: string;
  previewText: string;
  heading: string;
  body: string;
  /** Up to four pieces shown as cards in the email. */
  productIds: Id[];
  cta: Linked & { label: string };
  status: CampaignStatus;
  sendAt: string | null;
  sentAt: string | null;
  recipients: number;
  createdAt: string;
  updatedAt: string;
}

/** The newsletter's own settings: the consent wording and the welcome email. */
export interface NewsletterSettings {
  consentText: string;
  welcome: { enabled: boolean; code: string; subject: string; heading: string; body: string };
}

/**
 * An email the shop would send. Honest seam: with no email service
 * connected yet, it lands in this outbox (Newsletter, Outbox) instead, and
 * the shop's dev build offers the link in it so the flow can be tried.
 */
export interface OutboxEmail {
  id: Id;
  to: string;
  kind: "newsletter-confirm" | "newsletter-welcome" | "campaign" | "order-update" | "password-reset" | "account-confirm" | "low-stock";
  subject: string;
  body: string;
  /** The one link that matters (confirm, unsubscribe, reset), for the demo. */
  link?: string;
  /** The order it belongs to, for order updates. */
  ref?: string;
  createdAt: string;
}

export type DiscountType = "percent" | "fixed" | "free_shipping";

export interface Discount {
  id: Id;
  code: string;
  description: string;
  type: DiscountType;
  /** Percent off, or shillings off for a fixed code; ignored for free shipping. */
  value: number;
  minSpend: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  /** Worked out from orders on every read (cancelled and refunded ones hand their use back); never trusted from storage. */
  usedCount: number;
  appliesTo: { scope: "all" | "categories" | "products"; ids: Id[] };
  /** Whether it also takes money off pieces already on sale (off: no stacking with the sale). */
  onSaleItems: boolean;
  active: boolean;
  createdAt: string;
}

export interface ContactMessage {
  id: Id;
  name: string;
  phone?: string;
  email?: string;
  topic?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
}
