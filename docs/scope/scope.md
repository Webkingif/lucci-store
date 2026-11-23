# Scope: Store

A monochrome, editorial luxury storefront (categories, products with stock, Stripe checkout). This slice adds a small, protected admin area so staff can run the catalogue, stock and orders without touching the database directly.

**Build approach:** Tracer Bullet (prove one real, protected admin thread end to end first, then thicken it one screen at a time).
**Workflow:** Beta (check verify, then test, after develop). The admin sign in and guard feature is tagged `· GA` because a gap there exposes everything else. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

Admin boundaries for this version: one shared admin login (no per person accounts), orders are read only, images are pasted as URLs, products are hidden with a published flag rather than deleted. No dashboards, analytics, warehouses or role systems.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Storefront home | Existing | existing |
| B | Product listing | Existing | existing |
| C | Product detail | Existing | existing |
| D | New arrivals & collections | Existing | existing |
| E | Stripe checkout & orders | Existing | in-progress |
| 1 | Admin sign in & guard | Slice 1 | planned |
| 2 | Admin product list with stock | Slice 1 | planned |
| 3 | Update stock | Slice 1 | planned |
| 4 | Product published flag | Slice 2 | planned |
| 5 | Create product | Slice 2 | planned |
| 6 | Edit product | Slice 2 | planned |
| 7 | Manage categories | Slice 3 | planned |
| 8 | View orders | Slice 4 | planned |

## Already built

### A. Storefront home · existing
Hero, category tiles, editorial feature, product rails. code in `src/app/page.tsx`, `src/components/home/`

### B. Product listing · existing
Catalogue grid with category filter and sort, read through `src/lib/catalog.ts`. code in `src/app/products/page.tsx`, `src/components/product/`

### C. Product detail · existing
Gallery and product info, stock derived labels. code in `src/app/products/[slug]/`

### D. New arrivals & collections · existing
New arrivals page and per category collection pages. code in `src/app/new-arrivals/`, `src/app/collections/[slug]/`

### E. Stripe checkout & orders · in-progress
Buy now, authorize then capture checkout, orders table and webhook. Written but uncommitted, and migration `0001` is not yet applied. Finish it (env keys, migrate on a Neon branch, test purchase, build, commit) before Slice 4. code in `src/lib/orders.ts`, `src/app/api/stripe/webhook/`, `src/app/checkout/`

## Slice 1: Protected admin thread

### 1. Admin sign in & guard · needs a decision · GA
One shared admin login that issues a session carrying an `admin` role, plus a single server side check every admin page, action and admin data read calls. This is the security boundary the whole admin area stands on.
**Done when:** signed out visitors to any `/admin` route land on the sign in page; every admin server action rejects a direct POST without a valid admin session; sign out ends the session; admin pages are not indexed; storefront pages stay prerendered.
- [ ] Design it (spec): `/architect admin sign in & guard`

### 2. Admin product list with stock · needs a decision
The first admin screen and the admin shell around it: every product (including sold out) with category, price and current stock, read fresh rather than from the minute long catalogue cache.
**Done when:** a signed in admin sees all products with live stock and a Sold out marker at zero; empty and error states render; the admin shell has navigation for the later screens.
- [ ] Design it (spec): `/architect admin product list with stock`

### 3. Update stock · needs a decision
Set a product's stock from the admin list. Closes the thread: sign in, read, write, storefront refresh.
**Done when:** an admin changes stock and the storefront shows it immediately; negative or non integer values are rejected; a concurrent checkout sale is never silently overwritten.
- [ ] Design it (spec): `/architect update stock`

## Slice 2: Catalogue editing

### 4. Product published flag · needs a decision
A published on or off column so admins can take a product off sale without deleting it or breaking order history. Every storefront read in `src/lib/catalog.ts` and checkout must exclude hidden products.
**Done when:** a hidden product disappears from listings, collections, new arrivals and its detail page, and cannot be bought; it still shows in admin and in past orders; migration is generated and reviewed.
- [ ] Design it (spec): `/architect product published flag`

### 5. Create product · needs a decision
A product form: name, slug, description, category, price, currency, stock, badge, position, published, and an ordered list of image URLs with alt text.
**Done when:** an admin creates a product, invalid input (duplicate slug, negative price, bad currency, bad image URL) shows field errors, and the product appears on the storefront when published.
- [ ] Design it (spec): `/architect create product`

### 6. Edit product
Reuse the create form to edit an existing product, including hide or unhide.
**Done when:** an admin edits any field and the storefront reflects it immediately; changing the slug keeps the product reachable at its new URL.
- [ ] Build it: `/develop edit product`

## Slice 3: Categories

### 7. Manage categories · needs a decision
List, create, edit and order categories (title, slug, description, position).
**Done when:** an admin adds, renames and reorders categories and the storefront filter bar and collection pages follow; deleting a category that still has products is blocked with a clear message.
- [ ] Design it (spec): `/architect manage categories`

## Slice 4: Orders

### 8. View orders · needs a decision
A read only order list filterable by status, plus an order detail view (product snapshot, amount, customer email, shipping address, Stripe references, timestamps). Depends on E being finished.
**Done when:** an admin finds any order by status and opens its detail; amounts use `formatPrice()`; nothing on these screens changes an order; refunds stay in the Stripe Dashboard.
- [ ] Design it (spec): `/architect view orders`

## Deferred
Out of scope for this version, kept so the plan stays honest.
- **Per person admin accounts**: individual logins and an audit of who changed what · needs a decision · GA
- **Image uploads**: upload files instead of pasting URLs · needs a decision
- **Refund and cancel from admin**: payment actions in the store · needs a decision · GA
- **Stock change history**: a log of manual stock edits · needs a decision
- **Dashboards and analytics**: excluded on purpose for now
- **Login rate limiting**: v1 only delays failed attempts · needs a decision
- **Server-side session revocation**: v1 sessions are stateless (8h); sign out clears the browser cookie, rotating `ADMIN_SESSION_SECRET` ends all sessions · needs a decision
- **Product deletion**: hide with the published flag instead

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` + 2 to 5 milestones; the tier's closing boxes |
| `in-progress` (building) | `/develop` | milestone sub boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is; `/sync` reconciles | the tier's last stage (`Beta` → after `/test`, `GA` → after `/document`) is the suggested point to call it done |

- **Next step** = the first unticked box.
- **needs a decision** = run `/architect` first; otherwise straight to `/develop`.
- **Atomic build tasks live in the spec's `## Build plan`, not here.**
- **Status** `planned` → `in-progress` → `done`, plus `existing` (built before this workflow) and `dropped` (removed from scope, kept for history).
- **Workflow tier tag** beside a heading (e.g. `· GA`) sets that feature's rigor above the project default; no tag inherits it.
- **Workflow**: **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
