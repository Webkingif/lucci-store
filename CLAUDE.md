# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Gotchas

- `cacheComponents` is enabled in `next.config.ts`. Reading `new Date()`, `Math.random()` or other request-time values during prerender breaks `next build`, while `lint` and `typecheck` still pass. After touching server components, verify with `npm run build`.
- When you add a `--text-*` token in `globals.css`, also add it to the `extendTailwindMerge` list in `src/lib/utils.ts`. Otherwise `cn()` treats the size as a color and silently drops one of `text-<size>` / `text-<color>`.
- `globals.css` resets Tailwind's default colors and radii. Classes like `bg-gray-100`, `text-white` or `rounded-lg` generate nothing. Use the design tokens instead.
- `next build` queries the database to prerender pages, so it needs `DATABASE_URL`. Locally it lives in `.env`, written by `neon env pull`.
- `.env` points at the Neon **production** branch. `npm run db:seed` upserts every product and resets live stock, and migrations apply there too. For risky work, create a branch first with `neon checkout <name> --create`.
- Catalogue reads are cached for about a minute (tag `products`), so direct database edits show up late. Code that writes catalogue data must call `revalidateTag("products")`.

## Database

- Change the schema only through migrations: edit `src/db/schema.ts`, run `npm run db:generate`, review and commit the SQL, then run `npm run db:migrate`. Never use `drizzle-kit push`.
- Components get data only through `src/lib/catalog.ts` and receive `Product` / `Category` types, never Drizzle rows.
- Stock is a single `products.stock` count. Derive labels such as "Sold out" in code; never store them.

## Conventions

- Get the store name, description and nav links from `siteConfig` in `src/lib/site.ts`. Never hardcode them.
- Store prices as integer minor units (cents) and display them with `formatPrice()` from `src/lib/utils.ts`.

- Visual direction: a monochrome, editorial, image-led luxury storefront. It takes inspiration from high-end fashion sites, but never copy another brand's text, assets, logos or proprietary fonts.

## Scope

The project is intentionally minimal. The database holds only categories and products (with stock). Don't add carts, orders, payments, wishlists, reviews, warehouses, product variants, authentication or admin features unless explicitly asked.
