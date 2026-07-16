# APP_DECISIONS.md

This document explains the reasoning behind ShroomHarvest — the storefront theme and the "Smart Inventory Insights" embedded app — beyond what the code and README already show. Where a decision has a real tradeoff, it's stated as one rather than presented as an obviously-correct choice.

---

## Store Concept

**ShroomHarvest** is a premium mushroom specialty store selling fresh and dried mushrooms, mushroom coffee/tea, powders, supplements, home-growing kits, and gift boxes. The brand direction — organic, modern, minimal, educational, trustworthy — shaped two concrete decisions:

- **Color palette:** deep forest green + warm cream + a terracotta accent, deliberately tuned for *higher contrast* than the muddy brown-on-tan look a lot of "earthy/organic" themes default to. Every text/background pairing in the palette was checked against WCAG contrast math (see the Accessibility Review in the README) rather than assumed to look fine.
- **Educational tone over hard-sell:** the Mushroom Benefits section and FAQ exist specifically to inform ("what is Lion's Mane good for") rather than just list products, matching the brand's "educational" positioning from the brief.

## App Idea

**Smart Inventory Insights** exists to solve one specific problem: small mushroom-specialty merchants selling a mix of perishable (fresh mushrooms), shelf-stable (dried, powders), and made-to-order (grow kits) inventory need to know *which* products are at risk of a stockout *before* it costs them a sale — and a stockout on fresh product can't be backordered the way a stockout on, say, a powder can.

This shaped the core product decision in Module 7: the Inventory Health Score isn't "days of stock remaining" in isolation — it's that number measured against *that specific product's supplier's lead time*. A product with 10 days of stock and a 3-day supplier is fine. The same 10 days against a 14-day supplier is a real risk. Treating those the same (as a naive "days remaining < N" rule would) would have been a worse product decision even though it's simpler code.

## Architecture Decisions

- **npm workspaces monorepo** (`app/client`, `app/server`, `theme/` all in one repo) rather than separate repos. For a project this size, one repo means one `npm install`, one place to look for anything, and no version-drift risk between client/server during development. The tradeoff: it doesn't scale cleanly to a large team with independent deploy cadences — a bigger org would likely want separate repos with a shared package for types.
- **Shopify-managed installation + token exchange, not classic OAuth redirects** (Module 2, revised after research mid-project). Fewer moving parts, matches what `shopify app dev`-scaffolded apps do today, and removes an entire redirect-handling code path. The actual code was rewritten mid-project once this was verified against the real current `@shopify/shopify-api` version rather than left as originally shipped — worth being upfront that the first implementation was already-outdated practice, not wrong practice.
- **Express + a thin layer of middleware (`verifyRequest` → `attachShop` → route) rather than a framework like Remix.** The brief specified Node.js with an optional lightweight framework "only if it improves maintainability" — Express plus explicit middleware was enough here; a full framework's conventions (file-based routing, loaders) would have added structure this app's size didn't need.
- **Polaris `Tabs` instead of `react-router`** for the embedded app's navigation (Dashboard / Inventory / Suppliers / Activity / Recommendations). There's no need for deep-linkable URLs yet, and this sidesteps any interaction between browser history and the Shopify admin iframe. If a future module needed shareable URLs (e.g. linking directly to one product's inventory record from a Slack notification), that's a contained change to `App.tsx`, not a rearchitecture.
- **App Bridge 4's CDN script, not the older npm-installed Provider pattern.** Verified this was current via the actual installed package version rather than assumed from training data — App Bridge 4 auto-patches `fetch()` for session tokens, which also meant a custom `authenticatedFetch` wrapper written early on turned out to be redundant and was removed.

## Database Design Decisions

- **Every merchant-owned table carries `shop_id`, enforced by an `attachShop` middleware that resolves the verified shop domain to a numeric ID before any query runs.** This means a query missing a `WHERE shop_id = ?` clause is a bug that's easy to catch in review, not a silent cross-tenant data leak — the shape of the schema itself nudges toward safety.
- **`inventory_history` and `activity_logs` are append-only by convention** (no update/delete paths exist for them in the service layer). An audit trail you can retroactively edit isn't an audit trail.
- **One inventory row per product (single-location model).** Multi-location inventory (common for larger merchants with warehouses + retail) would need `inventory` keyed by `(product_id, location_id)` instead of `product_id` alone. Deferred as a real limitation, not hidden — see Future Improvements.
- **DECIMAL for all money columns, never FLOAT.** Standard practice, worth stating explicitly since it's easy to get wrong by default in some ORMs.
- **Foreign keys are real database constraints (`.references()`), not just application-level checks.** Caught during Module 1 development that the first migration generated zero FK constraints because the columns were plain `int()` without `.references()` — fixed before shipping, but worth noting it's the kind of mistake that's easy to ship silently since the app *works* either way until something tries to violate referential integrity.

## Tradeoffs

Decisions made deliberately in favor of shipping a complete, working project over maximizing any single dimension:

- **No automated test suite.** Every module was verified via `tsc --noEmit`, full builds, and (where no live database was available in the build sandbox) manual `curl`/browser verification steps documented in the README. That's real verification, but it's not the same guarantee a test suite gives against regressions in later changes.
- **No background job scheduler.** The recommendation engine (Module 7) runs on-demand via a button, not on a cron/queue. Simpler to build and test, but means recommendations can go stale between visits to that tab.
- **No webhook handling yet** (e.g. `app/uninstalled` to actually call `markShopUninstalled`, or product webhooks to keep the `products` table in sync with Shopify's own catalog). The function exists (`shopService.markShopUninstalled`) but nothing calls it yet.
- **Hardcoded English strings** in most of the theme rather than full `locales/*.json` translation-key coverage. The locale file structure is in place from Module 0; extending it is mechanical, not architectural.
- **Access tokens are stored in MySQL as plain `varchar`, not encrypted at rest.** Acceptable for a take-home/dev context; a production deployment should encrypt this column or use a secrets-manager-backed session storage.
- **Client bundle size warnings** (Polaris + recharts push a couple of chunks over Vite's 500kB default warning threshold). Functional, but a production app would want route-based code splitting so Recharts (only used on the Dashboard tab) doesn't ship to every tab's initial load.

## Future Improvements

Roughly in the order they'd matter most for a real merchant using this:

1. **Webhook handling** — `app/uninstalled`, `products/update`, `inventory_levels/update` — so the app's data stays in sync with Shopify instead of only updating through the app's own UI.
2. **Multi-location inventory** — the schema and UI both assume one stock number per product; real merchants with a warehouse + retail location need per-location tracking.
3. **A real test suite** — unit tests for the recommendation engine's scoring math (it's pure functions, genuinely easy to test), integration tests for the transactional write workflows.
4. **Background job for recommendation regeneration** — on a schedule or triggered by inventory webhooks, instead of a manual button.
5. **Token encryption at rest** and a secrets-manager-backed config instead of plain `.env` values, before any real production deployment.
6. **Full i18n coverage** for the theme, using the existing locale-file structure.
7. **Route-based code splitting** in the embedded app client to address the bundle-size warnings.
8. **CI pipeline** running `tsc --noEmit` and the (currently nonexistent) test suite on every push — everything in this project was verified manually, module by module, which doesn't scale as well as automation once the codebase is this size.
