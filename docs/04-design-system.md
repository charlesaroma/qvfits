# 04: Design System

**Rule:** QVFITS keeps Quivogue's brand (colours, logo, content) and dresses it as athletic luxury: big full-bleed photography, a modern sans with character, calm chrome and motion with intent. **The colours never change.** Type, spacing, radii, surfaces, layout and motion may.

## How it is wired

`src/index.css` imports Tailwind, then three stylesheets into Tailwind's `components` layer, in this order (a utility class still beats all three):

| File | Holds |
|---|---|
| `styles/quivogue.css` | Quivogue's `css/style.css`, whole and unchanged. The base layer and **the source of every colour token** (`:root`) |
| `styles/theme.css` | The premium layer: fonts, radii, easing, headings, labels, buttons, the header states, surfaces, forms, skeletons, the marquee band, the full-bleed hero, the bento, the campaign, the product page |
| `styles/chrome.css` | Logo sizes, the header grid, the mega menu, the search overlay, the phone menu (account, shortcuts, currency, WhatsApp), the signed-in account dropdown, the shop's applied-filter chips, filter sheet and Show more, the product carousel, the newsletter card, the dark footer, the pill inputs and the pill search and sort controls |

After them, `index.css` keeps the `@theme inline` token map (`bg-brand-500`, `text-ink-3`, `rounded-r-lg` …) and a few QVFITS rules: `.input`, `.btn--danger`, the five-column footer, the slider fix in the filter sidebar, and the TV zoom.

Ported markup keeps Quivogue's class names (`.card`, `.hdr`, `.drawer` …), so the premium look comes mostly from restyling them in `theme.css`. New UI (forms, dashboards) uses utilities on the tokens.

## Colour (Quivogue's, kept)

| Group | Tokens | Use |
|---|---|---|
| Brand | `brand-50` … `brand-600`, `brand-grad` | Magenta to purple, from the logo. `brand-grad` on primary buttons and the promo bar |
| Secondary | `teal-100`, `teal-500` | Golf and tennis |
| Warm neutrals | `sand-*`, `cream`, `cream-2`, `beige`, `white` | Surfaces |
| Ink | `ink`, `ink-2`, `ink-3`, `ink-4` | Text. On `cream`: 15.6, 9.3, 6.05 and 4.64 to 1. **`ink-4` is the lightest text allowed** |
| Lines | `line`, `line-2` | Borders and rules |
| Accents | `gold` (never text), `star`, `success`, `warn` | Badges, ratings, states |

Shadows and photo scrims are tinted with the ink hue, `rgba(23, 33, 31, …)`, never black or pink. A design skill that suggests a new palette is a proposal for the client, not a change.

## Type

- **Display:** Satoshi 500/700/900 (Fontshare). Headings h1 to h4, letter-spacing −0.035em, `text-wrap: balance`.
- **Body and UI:** Geist 400/500/600 (Google Fonts). Paragraphs `text-wrap: pretty`.
- Prices and totals use `tabular-nums`.
- Labels (`.kicker`) are small and letter-spaced, with **no rule or dash before them** (client request). The old `.kicker::before` line is gone for good.
- No em or en dashes in any copy either; `npm run lint` checks (`07-data.md`).
- The fonts load in `index.html` with `display=swap`, with Anton for the wordmark.

## Shape, surfaces, buttons

- Radii (`theme.css`): `r-sm` 4px (images), `r-md` 10, `r-lg` 14, `r-xl` 20 (large panels). **Buttons, text inputs, dropdowns, search and sort are pills everywhere**, storefront and admin alike (`chrome.css`, "pill inputs"). A multi-line box cannot be a pill, so a textarea takes the `r-xl` corner. Checkboxes, radios, file and range inputs keep their own shape.
- Product cards are Quivogue's, unchanged (client's choice): white rounded card that lifts on hover, the label as a pill under the photo, category, name, swatches, price and the gradient Add button.
- A 3% grain sits over the page (`body::after`, pointer-events none).
- `.btn` is 50px tall (`.btn--lg` for heroes, `.btn--light` on photos), presses to `scale(.98)`. `.link-arrow` is the tertiary style, with an animated underline.
- Easing everywhere is `--ease: cubic-bezier(0.16, 1, 0.3, 1)`, 200 to 500ms.
- Loading uses skeletons that match the layout, not spinners (`components/ui/Skeleton.jsx`: `Skeleton`, `SkeletonGrid`; `components/ui/PageLoader.jsx` picks a whole-screen shape by `variant`: page, product, text, form, list, admin, or logo for the sign-in check). No library is needed: it is one CSS shimmer (`.skel`, which also stills for reduced motion).
- **Icons:** Lucide for interface icons. Lucide has no brand marks, so Instagram, TikTok and WhatsApp come from Simple Icons through Iconify (`@iconify/react` with `@iconify-icons/simple-icons`, bundled, no network request) in `components/ui/BrandIcons.jsx`.

## Logo

The brand is **Quivogue (QVFITS)**: one brand, one name, never described as two. Qui for quality, Vogue for fashionable.

**Spacing (client rule):** in sentences, page titles, alt text and descriptions, write **QVFITS** as one word, never "QV FITS". The spaced **QV FITS** belongs to the logo artwork only and is kept exactly as the client supplied it; never close it up or retype it.

**The format (client rule, as on the original Quivogue site):** on the left, the supplied artwork (the wave mark with QVFITS under it and EST. 2023 beneath). On the right, **QVFITS** large in Anton with the brand gradient, and **QUIVOGUE** small beneath it in the body font, in `ink-3`, its letters spread to exactly the width of QVFITS. The block sits centred on the artwork.

```
   ~~~~       QVFITS
  ~~~~~~      Q U I V O G U E
  QVFITS
 EST. 2023
```

**In the app** always use `components/layout/navbar/Logo.jsx`, never a bare `<img>`. It draws the artwork (`qvfits-logo-stacked.svg`) and sets QVFITS and QUIVOGUE as live text, so the words stay sharp and readable at header size. QUIVOGUE is one `<span>` per letter in a `justify-content: space-between` row, which is what makes it exactly as wide as QVFITS in any font. Styles: `styles/chrome.css`, logo block (overriding the base rules in `quivogue.css`).

| Use | Artwork height | QVFITS | QUIVOGUE |
|---|---|---|---|
| `<Logo />` header and phone menu | 52px | 1.5rem | .66rem |
| below 1024px | 44px | 1.2rem | .56rem |
| `<Logo size="lg" />` footer, customer sign-in | 76px | 1.9rem | .78rem |
| `<Logo to="/admin" />` admin sidebar | 52px | 1.5rem | .66rem |

| File in `public/logo/` | Use |
|---|---|
| `qvfits-logo.*` | The same lockup as one image, for places that cannot run the component: the printed invoice, emails, social, print. Cream and white grounds |
| `qvfits-logo-on-black.*` | The same for black grounds (QVFITS white, QUIVOGUE light grey). `og-image.png` is built from it |
| `qvfits-logo-white.*` | The same, all white, for purple and photography |
| `qvfits-logo-stacked.*`, `-stacked-white.*` | The supplied artwork alone: what `Logo.jsx` draws; also square spaces such as profile pictures |
| `qvfits-icon.*` | The wave mark alone: favicon, app icons, page loader, admin sign-in card |

**Never:** retype or respace the QV FITS under the mark (it is the client's original artwork, spacing included), put QUIVOGUE above QVFITS or in another colour or face, set QVFITS with a space, or recolour, stretch or rotate the artwork. The image files are regenerated from the original artwork with outlined text (no fonts needed); ask Raijin Tech Hub for new versions rather than editing them by hand.

## Navbar

`components/layout/navbar/`:

| Part | Behaviour |
|---|---|
| `PromoBar` (in `layout/`) | One line on the brand gradient, fixed 36px, cross-fades every 4.5s, pauses on hover and focus |
| `index.jsx` | Laptop and desktop (1024px up): logo, centred links (Shop ▾, then the header links from `data/navigation.json`), icons. Phone and tablet: menu button, centred logo, search and bag. Always solid; hides on scroll down, returns on scroll up |
| `MegaMenu` + `megaMenu/` | Opens on hover (90ms intent delay, 180ms grace on leave) or on click/Enter; Escape closes and returns focus to Shop. Columns from the catalogue facets plus a featured campaign tile. It ends after the columns: delivery and showroom details are not repeated here (the top bar and footer carry them). A column has no height cap yet, so a very long list needs a "See all" link and a scroll limit |
| `SearchOverlay` + `searchOverlay/` | Sheet from the top. Opened by the icon or the `/` key. Popular searches and new pieces before typing, live results while typing, Enter goes to `/shop?q=` |
| `AccountButton` | The person icon. Signed out it links to sign in. Signed in it opens a menu (name, the account pages, Sign out), closing on outside click, Escape or choosing an item. Its page list is `utils/accountMenuItems.js`, shared with the account sidebar |
| `MobileMenu` + `mobileMenu/` | **Below 1024px only.** Full-height sheet from the left. Order: the shop's links first (Shop opens in place as icon-led groups of pills), then the account block (welcome and Sign in or Create account, or the signed-in card; slim Saved and Track order pills), then at the foot a currency dropdown and the WhatsApp row. Help pages are not repeated here (they are in the footer). The phone header is menu, centred logo, search and bag; currency moves into the menu. Closes itself if the window grows past 1024px |

Every overlay (menu, search, bag drawer, filter sheet) calls `useOverlayFlag(open)`: it locks the page scroll and sets `body[data-overlay]`, which hides Vee and the sticker. Closed overlays are `inert`. A "Skip to content" link is the first tab stop on every storefront page.

## Motion

`components/motion/` on `motion/react`. Components use the slim `m.*` elements; `AppProviders` wraps the app in `LazyMotion` (strict), which loads the animation engine in its own chunk (`motionFeatures.js`) after first paint. **Never import `motion.*`**: strict mode throws.

| Tier | Where | How |
|---|---|---|
| Subtle, everywhere | Section and card reveals, hovers, menus | `Reveal`, `RevealGroup` + `RevealItem` (fade up 16px, staggered), CSS transitions on `--ease` |
| The hero | The home slideshow | The original's dip to black between slides and a slow push-in on each picture (CSS, `quivogue.css`) |

Only `transform` and `opacity` animate. `MotionConfig reducedMotion="user"` and the slideshow's own check keep everything still for reduced motion.

## Home page

**Back to the original Quivogue home page** (client request), in its order: hero slideshow (inside the page width, rounded, copy centred over the picture, dots below) · Press (when switched on) · New releases (four cards and a button) · Best sellers (four cards) · Shop by movement (four tiles) · Campaign · Shop the feed · Newsletter (the brand-gradient card with perks, a pill form and two tilted photos). New releases and Best sellers are a **carousel** of the same Quivogue card (`components/storefront/ProductCarousel.jsx`): scroll-snap, four in view on a laptop, two on a tablet, one and a bit on a phone, swipe, arrow keys and round arrow buttons either side of the "See more" link. Every word and picture comes from the Home page module in the admin. The rest of the site keeps the new design.

## Shop and product page

- **Shop:** applied filters as removable chips above the grid. A long list shows 24 pieces and a **Show more** button with "Showing 24 of N" and a progress bar (`sections/ShowMore.jsx`). How far it has been opened is kept in the address (`?n=48`), so Back from a product returns to the same place; any filter change starts over. Not endless scrolling: the footer stays reachable. Below 881px the filter sidebar becomes a bottom sheet opened from a floating "Filter" pill, with a "Show N pieces" button.
- **Product card:** Quivogue's card. Add puts the first colour and size in stock in the bag and says which, so it works the same on phones and laptops.
- **Filters:** which groups show, their names and order come from the admin (Colours, sizes, filters).
- **Product page:** desktop shows a photo stack and a sticky buy panel (96px from the top); phones show a swipeable gallery with dots and a sticky add-to-bag bar.

## Footer

The old light background (white with one hairline above; the client does not want the purple one), `components/layout/Footer.jsx`. The newsletter leads (large "First to know" and a pill form); then the logo with its social buttons in a row, the Shop and Help columns, and Visit us with an icon per line. Legal links sit in the bottom bar, and Delivery and Returns appear once, under Help. On a phone everything is centred and link rows are 40px.

## Vee

`components/assistant/`: the round button and the chat panel. Her replies are blocks: text, product cards, an **outfit card** (`components/storefront/OutfitCard.jsx`: pieces in their colour and size, why the colours work, the total or a kit's saving, one "Add all" button), links and one-tap **quick replies** under the newest message. The same card is used on the product page (`StyleWith`, "Style it with") and in the bag drawer ("Complete the look", which adds only what is missing). The chat has a "Forget me" link. The dashboard page (Vee) has Settings (on or off, name, greeting, tone, suggestion buttons with a preview), Pairing rules (test any two colours, overrule with always and never pairs) and Questions.

## Offer card

`components/storefront/Sticker.jsx`, the small first-order card. Closing it takes effect at once and is remembered for `snoozeDays` (`offers.json`), with a session fallback when storage is blocked.

## Responsive ranges

Audited at 19 sizes over 15 pages: no sideways scroll, the header never wraps, and controls are 44px to tap on touch screens. Links inside sentences are exempt.

| Range | Widths | What changes |
|---|---|---|
| Phones | 320 to 430 | Menu button, centred logo; filter sheet; product bar |
| Tablets | 600 to 1023 | As phones, wider grids |
| Laptops | 1024 to 1680 | Full nav with mega menu; sticky buy panel |
| Desktops | 1920 | Quivogue's 1620px column |
| Large screens and TV | 2560, 3840 | Page zoomed 1.25× from 2400px and 2× from 3200px |

## Floors (do not regress)

- 44×44px touch targets; a visible focus ring.
- Text from `ink` to `ink-4` only; white over photos sits on an ink scrim at 4.5:1 or better.
- One `h1` per page, no skipped heading levels.
- Images carry width and height and a WebP ladder (`components/storefront/Photo.jsx`, `utils/media.js`).
- The main bundle stays near 134 KB gzipped; pages and the motion engine load as their own chunks.
- `prefers-reduced-motion` stills the slideshow and the reveals.

## Product photos

Product cards use free Unsplash photos as placeholders (the `photos` of each product in `src/data/products.json`) until the shop's own arrive. The admin can upload replacements: each is resized to a 1200px WebP in the browser first. Hero, campaign and movement photos are the brand's own, in `public/photos`.

## Dashboards

The customer area uses the storefront look: a sticky member card (initials, name, member since) holding the menu on the left, the page on the right under one heading; the profile page opens with a strip of counts (orders, saved pieces, addresses) that link to their pages. The admin uses the same tokens and fonts in a calmer layout (sidebar, tables, panels on `cream` and `white`), built from one kit in `AdminDashboard/components/`: `DataTable` for every list (pill search with close matching from `utils/search.js` (word starts, plurals, a slip or two in spelling, joined or split words; one matcher for the shop and the dashboard), rows per page, numbered paging, filters on the right, sort, bulk actions, CSV), `ChipGroup` for choice chips that fold behind "+N more" past ten and get a search past twenty (selected chips never fold away), `Drawer` for long forms, `Modal` for short ones, `SaveBar` for documents. Nothing is taken from Artistry's or Belioras's look.
