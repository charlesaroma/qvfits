# QV fits: Build Breakdown & Status Tracker

The rebuild of **qvfits.com**, the online shop for QV fits (seamless activewear, swim and lounge wear; showroom at THE CUBE, G17 Kisementi, Kampala). It replaces the static site in `Quivogue/quivogue` with a MERN-stack shop: the public storefront, a customer account area at `/account`, and the admin dashboard at `/admin`.

Vite + React 19 + Tailwind v4 + React Router 7 + TanStack Query + Lucide, with a TypeScript store layer. Until the API is live, everything runs on JSON seeds in `src/data/` (`07-data.md`), reached **only** through `src/store/tanstackStore/services/`.

The API is a separate repo, `qvfits-api` (Express + MongoDB), hosted on DigitalOcean with this site (`06-deployment.md`).

## Where each part comes from

| Source | We take | We do not take |
|---|---|---|
| `Quivogue/quivogue` | **The UI**: tokens, fonts, chrome, page sections, look (`04-design-system.md`) | Static HTML, Supabase |
| `the_artistry360_2024` | Skeleton and rules: numbered folders, `src/store/`, lazy barrels, ESLint layering, these docs | Its visual style, Netlify |
| `belioras` | E-commerce domains: admin modules, customer accounts, catalog / sales / marketing services, cart and currency contexts | Its visual style; its customer dashboard importing admin code |

## Golden Rules

1. **The look.** Quivogue's colours and product card everywhere; the home page is the original Quivogue home; the rest keeps the new design (`04-design-system.md`). No dashes anywhere, in copy or code. Nothing visual is borrowed from Artistry or Belioras.
2. **Backend-ready.** UI never imports `src/data/`, a service or the transport. Always component → query hook → service → api, all under `src/store/` (`03-data-layer.md`). Content is data: lists render from arrays, words from `pages.json`, never typed into JSX. ESLint enforces the layering.
3. **The dashboards never mix.** `AdminDashboard/` and `CustomerDashboard/` never import each other. Shared code goes down to `components/`, `utils/` or `store/`, never sideways (`02-folder-structure.md`). ESLint enforces it.
4. **Folders follow stream.theartistry360.** Every page folder is numbered (`1.home` … `9.legal`); each dashboard starts with its own `1.auth`. Sections are flat files with plain names in `sections/`, no subfolders; page-level helpers sit beside the page file (`02-folder-structure.md`).
5. **Split rule.** Files stay under ~250 lines. A page's private parts go in its `sections/`; anything two pages use goes in `src/components/`.
6. **Comment style.** `{/* Section Name */}` above blocks, title case, no decoration. A file-top `/* Name */` line. Explain *why*, not what.
7. **Accessibility floors** carried over from the Quivogue audit: tap targets ≥ 44px, ink contrast ≥ 4.5:1, exactly one `h1` per page, width and height on every image, `prefers-reduced-motion` respected.
8. **Code splitting.** Every page and dashboard module is `React.lazy`.

## Build Order (Phases)

Delivery is 15 working days (proposal QV-2026-001).

| # | Phase | Doc | Days | Status |
|---|---|---|---|---|
| 0 | Config, dependencies, docs | this folder | 1 | done |
| 1 | Store layer (api, services, queries, fixtures) | `03-data-layer.md` | 1 to 3 | done (mock) |
| 2 | Design foundation (tokens, chrome, UI kit) | `04-design-system.md` | 1 to 3 | done |
| 3 | Shell, routes, both auth realms | `02-folder-structure.md` | 2 to 3 | done (mock sign-in) |
| 4 | Storefront pages ported from Quivogue | `04-design-system.md` | 4 to 11 | done: every Quivogue page and section, one section per file; Vee's full assistant; responsive audit passed (320px to 4K TV) |
| 5 | Customer dashboard | `02-folder-structure.md` | 6 to 9 | done (mock): sign-up, sign-in, profile, orders, return and exchange requests, saved pieces, addresses |
| 6 | Admin dashboard | `02-folder-structure.md` | 4 to 11 | done (mock): 22 modules, roles and permissions, activity log; verified end to end in the browser |
| 7 | Backend integration (payments, email) | `05-backend-integration.md` | 8 to 12 | pending |
| 8 | DigitalOcean deploy | `06-deployment.md` | 2 to 3, 15 | pending |
| 9 | QA, client review, launch | none | 12 to 15 | pending |

Vee's roadmap and the advice not yet applied: `08-vee-roadmap.md`.

**Blocking launch (client):**

- All 16 prices, delivery fees, the exchange window (7 days, in Settings) and showroom hours are still placeholders.
- The payment gateway merchant account needs approval in QV fits' name.
- Online payment (MTN, Airtel, card) needs the gateway; until then orders are recorded and confirmed with the team on WhatsApp.
- Product photos are Unsplash placeholders (in `src/data/products.json`) until the shop's own photography arrives.
- The privacy policy, terms, exchanges and delivery policies (`src/pages/9.legal/content/`) need review by the shop's lawyer, and QV fits must register as a data controller with Uganda's Personal Data Protection Office (PDPO).

## Status Legend

- `pending`: not started
- `in-progress`: being worked on
- `done`: complete and verified (lint, typecheck, build and a browser run)

## Docs

| Doc | What it covers |
|---|---|
| `01-code-conventions.md` | Naming, splitting, imports, forms, styling, comments |
| `02-folder-structure.md` | Where everything lives; the dashboard isolation rule |
| `03-data-layer.md` | `src/store/`: transport, services, queries, mocks, realms |
| `04-design-system.md` | Quivogue tokens, type, component classes, porting a section |
| `05-backend-integration.md` | The `qvfits-api` contract and moving a service from mock to HTTP |
| `06-deployment.md` | DigitalOcean, Nginx, PM2, Spaces, DNS on IONOS |
| `07-data.md` | Every JSON seed in `src/data/`, products, discounts, roles; what is real and what is a placeholder |

New docs take the next free number (`NN-kebab.md`) and are listed here.

## Verifier

After every phase:

```bash
npm run typecheck   # 0 errors
npm run lint        # 0 errors, and no em or en dashes under src/
npm run build
```

Mock sign-ins are in the root `README.md`. For UI work, also click through the changed routes in `npm run dev` at 375px and 1280px, side by side with the same Quivogue page.
