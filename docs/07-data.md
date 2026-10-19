# 07: Data

**Rule:** everything the shop shows lives as JSON in `src/data/`, one file per entity, shaped like the API's tables. Services read the JSON as seeds (`03-data-layer.md`); screens never import it. The admin edits the same rows, and with mocks on those edits persist in the browser under `qvfits:store:v7:<key>`.

Ids are strings. Relations are ids, never names: a product has a `categoryId` and `colorIds`, not "Sets" and "Ivory". Services expand ids into names on the way out, so a renamed colour is renamed everywhere at once.

## Files

| File | Holds | Edited in the admin under |
|---|---|---|
| `products.json` | The catalogue: single pieces and kits. See below | Catalog, Products (Products and Stock tabs). **Piece or Kit** is chosen at the top of a new product. A piece has colours, sizes and stock; a set (Sets category) is just a piece sold as a matching pair. A kit bundles two to six saved pieces under one price. The "More about the piece" panel (fit, fabric, care, details) is optional and folded for a new product, because the product page reads it when present |
| `categories.json` | `{ id, name, slug, previousSlugs, parentId, image, description, position, active }`; each has a shop page `/shop/<slug>` | Catalog, Categories |
| `colors.json` | `{ id, name, hex, position }`, the swatches | Catalog, Categories (Colours tab) |
| `sizes.json` | `{ id, label, group, position }` | Catalog, Sizes and size guide |
| `shop-groups.json` | The storefront's "Shop by" groups: `{ id, name, slug, previousSlugs, kind: "category" \| "tags" \| "edits", position, inMenu, inFilters, active }`. Seeded Category, Movement, Edits; any can be added | Catalog, Categories (Shop by) |
| `terms.json` | Items of every group but Category: `{ id, groupId, name, slug, previousSlugs, image, description, target?, position, active }`. A tags item (Running) is carried by products and has a page `/shop/<group>/<slug>`; an edits item (New) holds the `target` it opens | same |
| `filters.json` | The shop's two controls above the grid. `facets: [{ id, label, visible, position }]`, the Filter drawer's sections in order; `id` is `category`, `size`, `color`, `price` or `group:<groupId>` (a tags group such as Movement, or the Edits group, whose New, Best sellers, Sale and Kits items become choices); a group joins when its `inFilters` is on. `sort: { default, options: [{ id, label, visible, position }] }`, the Sort menu; `id` is `featured`, `bestselling`, `new`, `low` or `high` | Catalog, Categories (Filter and sort tab) |
| `reviews.json` | `{ id, productId, name, text, stars, status, createdAt }`; only `approved` show. Written by staff for now | Catalog, Products (Reviews tab) |
| `size-chart.json` | `{ size, uk, us, eu, bust: [from, to], waist, hip }` in cm | Catalog, Sizes and size guide |
| `photos.json` | Generated: photo id → `[width, height, [webp widths]]` for `public/photos` | Not edited by hand |
| `home.json` | **Static, in code.** Hero slides, the two rails' words (their pieces are worked out), movement tiles, campaign, reels, newsletter box. Links are targets | Not edited in the dashboard |
| `offers.json` | Sale switch, promo bar lines, deal cards, the sign-up sticker | Marketing, Offers and banners |
| `pages.json` | **Static, in code.** Headings, text and buttons of every other page, by page, and the footer's newsletter band | Not edited in the dashboard |
| `navigation.json` | **Static, in code.** The fixed pages only: About in the top bar, the Help and Legal links (`{ title, target }`). The Shop menu, the top bar's other links and the popular searches are built from the groups, never stored | Catalog, Categories (Menu tab) switches what joins them |
| `faq.json` | **Static, in code.** `{ id, q, a, group, position }`. Vee reads it too | Not edited in the dashboard |
| `settings.json` (its `assistant` holds Vee's name, greeting, suggestion buttons, `tone` and the team's `pairing` colour rules) | Shop details, contact, socials, free delivery threshold, low stock level, exchange window, currencies, Vee (`assistant`: on/off, name, greeting, starter questions), `bestsellerCount`, `unpaidHoldHours`, `shopGrid` (products per row by screen) | Admin, Settings |
| `shipping-zones.json` | `{ id, name, description, fee, freeOver, etaDays, collect, active, position }` | Settings, Delivery |
| `payment-methods.json` | `{ id, label, short, instructions, active, position }` | Settings, Payments |
| `orders.json` | Demo orders for the charts and reports (about 38 across mid-August to mid-October 2026, with payments, returns and five demo accounts): placeholders, cleared when the backend takes over. Orders with `lines` (a line added from a kit keeps its `kitId`), totals, `kitSaving`, `source` (web, showroom, whatsapp), `paymentStatus` (unpaid, part_paid, paid, refunded), `history` (timeline), staff `notes` | Sales, Orders |
| `transactions.json` | Payments and refunds, each tied to an order; recorded only from the order or the refund flow | Sales, Transactions |
| `returns.json` | Return and exchange requests, from the account, `/track-order` or staff, with the `refunded` amount | Sales, Orders (Returns and refunds tab) |
| `customers.json` | Accounts (mock passwords only), addresses, wishlist, `bag` and `recentlyViewed` (so they follow the shopper), `emailConfirmedAt`, staff notes and tags | Sales, Customers |
| `discounts.json` | Codes. See below | Marketing, Discount codes |
| `subscribers.json` | `{ email, name?, customerId?, status: pending \| subscribed \| unsubscribed, source, consentText, consentedAt, confirmedAt, unsubscribedAt, token, welcomeSentAt }` | Marketing, Newsletter |
| `campaigns.json` | `{ title, subject, heading, body, productIds (up to 4), cta, status: draft \| scheduled \| sent, sendAt, sentAt, recipients }` | Marketing, Newsletter (Campaigns) |
| `newsletter.json` | One document: the consent words and the welcome email (on, code, subject, heading, body) | Marketing, Newsletter (Welcome email) |
| `messages.json` | Contact form messages | Sales, Messages |
| `vee-questions` | What shoppers asked Vee and whether she answered (text and time only; newest 200). Written by the assistant, starts empty | Marketing, Vee (Questions tab) |
| `staff.json`, `roles.json`, `permissions.json` | Team, roles and the modules a role can be given | Admin, Team and roles |
| `activity.json` | The audit log, written by every admin save (starts empty, keeps 500) | Admin, Activity log |

## Where data lives

The same split as belioras: what the shop owner edits comes from the backend; what changes only with the code ships in the bundle.

| From the backend (tables and documents, read only through `services/`, edited in the admin) | Static (ships with the code) |
|---|---|
| Products (pieces and kits), shop groups, categories, terms, colours, sizes, size chart, reviews, stock movements | `photos.json`, generated from `public/photos` |
| Orders, returns, transactions, customers, discount codes, the email outbox | `permissions.json`, the admin's module list (each module is code) |
| Offers, home page, page copy, header/help/legal links, FAQ, messages, subscribers, campaigns, newsletter settings | Legal page text, `pages/9.legal/content` |
| Settings, delivery zones, payment methods, staff, roles, activity log | Order and return statuses, `utils/orderStatus.js` |
| | Shop words in `utils/shopTargets.js`: the New / Best sellers / Sale / Kits labels, the fixed pages a link may open, reserved slugs |
| | The three group kinds the code understands: category, tags, edits (the groups themselves are data) |

Never stored, always derived on read:

- The Shop mega menu (from the groups) and every link's `href` (from its target and the live slugs).
- Product views: names for ids, stock per size, `badge`, units sold over 90 days, `isBestseller` (pinned, or in the top `bestsellerCount` by units from paid orders), a kit's stock and saving.
- The home rails: New releases are the newest `isNew` pieces; Best sellers are pinned pieces, then by units sold.
- Discount use counts (from orders; a cancelled or refunded order hands its use back), and every report row.

Kept only in the shopper's browser: the cookie choice (`qvfits:consent`, with version and date), the grid size (`qvfits:shop:grid`), and a guest's bag, saved pieces and recently viewed list.

## A product

```
{ id, slug, name, status: "draft" | "active" | "archived", type: "piece" | "kit",
  kitItems: productId[] (kits only, 2 to 6 pieces), isNew, pinnedBestseller,
  categoryId, price, compareAtPrice, salePercent,
  colorIds, termIds, blurb, details[], fit, fitNote, fabric, care,
  variants: [{ id, sku, colorId, size, stock }],
  photos: [{ id, url?, width, height, widths, colorId? }],
  seo: { title, description }, createdAt, updatedAt }
```

- **Stock is per colour and size** (a variant). The storefront view also carries `stock` per size, summed across colours, and the product page narrows it to the colour picked (`utils/stockLevel.js`, `forColor`).
- Placing an order holds its stock; cancelling, an unpaid order running out of time (`unpaidHoldHours`), or receiving a return puts it back. Every change is a stock movement (`stock-movements`: product, colour, size, change, reason, order ref), listed under Products, Stock.
- Only `active` products reach the shop. Drafts and archived pieces stay in the admin; staff can preview a draft at `/product/<slug>?preview`.
- Before a product can be added, the catalogue needs a category, a colour and a size. To publish, a piece needs a name, price, photo, category and stock; a kit needs 2 or more live pieces. A piece inside a kit can't be unpublished or deleted.
- A **kit** has no variants of its own: it is in stock when every piece is. Its `price` is the kit price; checkout prices a complete set from the bag at that price and shows the difference as Kit saving.
- **New arrival** (`isNew`) is on by default for a new product. **Best sellers** come from sales plus `pinnedBestseller`.
- `salePercent` shows only while the sale is switched on in Offers.

## A discount code

```
{ id, code, description, type: "percent" | "fixed" | "free_shipping", value,
  minSpend, startsAt, endsAt, usageLimit, perCustomerLimit, onSaleItems,
  appliesTo: { scope: "all" | "categories" | "products", ids[] }, active }
```

Checkout prices a code on the service (`sales/discountsApi.ts`, `applyDiscount`) and says why one does not apply: off, not started, expired, used up, already used by this shopper, under the minimum spend, or nothing in the bag it covers. Uses are counted from orders, matched by account or phone. A code skips sale-priced pieces unless `onSaleItems` is on, and never takes the goods below 0 (delivery is charged apart). The bag is requoted on every change, and a code that stops applying is dropped with its reason.

## Roles and permissions

`permissions.json` lists the admin modules; each can allow `view`, `edit` and `delete`. Orders add two money actions, `refund` and `payment` (record a payment, mark paid, Record a sale), owner and manager by default. Reports is view only. A role is a map of module → actions. A person has a role plus their own `overrides`, module by module. The sidebar, every admin route (`PermissionGate`) and every admin service (`assertCan`) check the same map, so a hidden page is refused at its address and by the API as well. The shop always keeps one active owner.

| Role | Can |
|---|---|
| Owner | Everything |
| Manager | Everything except the team; reads settings, money and the log |
| Showroom staff | Orders, stock, returns and messages; reads the rest; no team, settings, money or log |

## Copy with live values

Text in `pages.json` may carry tokens that fill in from Settings when the page renders (`utils/fill.js`): `{freeShipping}`, `{zones}`, `{kampala}`, `{upcountry}`, `{address}`, `{opensAt}`, `{phone}`, `{exchangeDays}`, `{brand}`, `{year}`. A fee change therefore never leaves a stale number in a paragraph.

## No dashes

No em or en dashes anywhere: copy, data, comments or docs (client request). Use a comma, colon or full stop, and "to" for ranges ("XS to XXL"). `npm run lint` runs `scripts/check-dashes.mjs` and fails on any it finds under `src/`.

## What is real and what is a placeholder

Carried over from the old `shop.js` notes. Confirm the placeholders with the shop before launch.

**Real, sourced from the brand:**

- The name QV fits (QVFITS), the handles @quivogue and @quivoguefits.
- The showroom: THE CUBE, G17, Kisementi, Kampala. WhatsApp orders on +256 758 981 959; email qvfits@gmail.com.
- What they make: premium seamless and seam-fit activewear, swim and lounge wear.
- The golf and tennis skort range: sizes XS to XL, with an inbuilt pant.
- Three pieces seen in the brand's own posts: the Seamless Long-Sleeve Set, the Golf and Tennis Skort Dress and the Ribbed Lounge Set.
- The three reviews, quoted word for word as the shop supplied them.
- Hero, campaign, movement, kit and feed photography in `public/photos`: the brand's own.

**Placeholders, to replace:**

- Every price. No prices are published anywhere public.
- Stock counts and size runs (other than XS to XL above). Seed stock is split evenly across colours.
- Delivery fees, the free delivery threshold, the exchange window (7 days) and opening time (10 AM).
- Most product names and descriptions.
- Best sellers: worked out from the seed orders and the pins, not real sales data until the shop trades.
- Every offer in `offers.json` (the 20% deal, the 10% sign-up sticker, the "Up to 50% off" slide). Each is a live promise next to the real WhatsApp number: switch it off the day it ends.
- Product photos: Unsplash placeholders until the shop's photography arrives (the admin can upload replacements).
- Exchange rates in `settings.json`, dated in `ratesUpdated`.

## Static content and the dashboard

The dashboard edits what changes as the shop trades: products, stock, orders, discounts, offers, the newsletter and the mega menu. Words and layout are the site's code: `home.json`, `pages.json`, `faq.json`, `navigation.json`. A backend never serves them.

- **No typed slugs or addresses anywhere.** Slugs come from names (a rename keeps the old address redirecting; a product's address freezes once it has been live). Links are targets (`utils/shopTargets.js`), resolved to addresses on read. A link to something deleted drops out; `npm run lint` runs `scripts/check-data.mjs`, which fails if a target in the static JSON names something that does not exist.
- **Menus are built, not stored:** the Shop menu from the groups, the top bar from the categories and Edits items marked "in the top bar", the popular searches from the categories and Movement items.
