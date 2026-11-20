// Catalogue data access: the single boundary between the storefront and the
// database. Components receive plain `Product` / `Category` objects and never
// touch Drizzle directly.
//
// Queries are cached ("use cache") so pages stay prerendered under
// cacheComponents. Everything is tagged "products": after changing catalogue
// data from inside the app, call revalidateTag("products").

import { asc, count, desc, eq, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category, Product } from "@/types";

export const CATALOG_CACHE_TAG = "products";

/** Shared cache policy for catalogue reads. Stock may be minutes stale. */
function cacheCatalog() {
  cacheTag(CATALOG_CACHE_TAG);
  cacheLife("minutes");
}

// Sorting and URL state (pure; safe to use anywhere on the server).

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

const DEFAULT_SORT: SortValue = "featured";

type SearchParams = Record<string, string | string[] | undefined>;

export type CatalogQuery = {
  /** Requested category slug; unvalidated until matched against categories. */
  categorySlug?: string;
  sort: SortValue;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Read the listing query from search params; unknown sorts fall back to the default. */
export function parseCatalogQuery(params: SearchParams): CatalogQuery {
  const sortParam = firstValue(params.sort);
  return {
    categorySlug: firstValue(params.category),
    sort:
      sortOptions.find((option) => option.value === sortParam)?.value ??
      DEFAULT_SORT,
  };
}

/** Build a listing URL, omitting defaults to keep it clean. */
export function catalogHref({
  category,
  sort,
}: {
  category?: string;
  sort?: SortValue;
}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

// Queries

const productColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  description: products.description,
  priceCents: products.priceCents,
  currency: products.currency,
  stock: products.stock,
  images: products.images,
  badge: products.badge,
  categorySlug: categories.slug,
  categoryTitle: categories.title,
};

function selectProducts() {
  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .$dynamic();
}

type ProductRow = Awaited<ReturnType<typeof selectProducts>>[number];

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.categoryTitle,
    categorySlug: row.categorySlug,
    price: row.priceCents,
    currency: row.currency,
    images: row.images,
    stock: row.stock,
    badge: row.badge ?? undefined,
  };
}

function orderFor(sort: SortValue) {
  switch (sort) {
    case "price-asc":
      return [asc(products.priceCents), asc(products.position)];
    case "price-desc":
      return [desc(products.priceCents), asc(products.position)];
    default:
      return [asc(products.position)];
  }
}

/** Categories in display order, each with its product count. */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheCatalog();

  return db
    .select({
      slug: categories.slug,
      title: categories.title,
      description: categories.description,
      count: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.position));
}

/** Products, optionally filtered by category slug, in the requested order. */
export async function getProducts({
  categorySlug,
  sort = DEFAULT_SORT,
  limit,
}: {
  categorySlug?: string;
  sort?: SortValue;
  limit?: number;
} = {}): Promise<Product[]> {
  "use cache";
  cacheCatalog();

  let query = selectProducts().orderBy(...orderFor(sort));
  if (categorySlug) query = query.where(eq(categories.slug, categorySlug));
  if (limit) query = query.limit(limit);
  return (await query).map(toProduct);
}

/** Most recently added products. */
export async function getNewArrivals(limit = 4): Promise<Product[]> {
  "use cache";
  cacheCatalog();

  const rows = await selectProducts()
    .orderBy(desc(products.createdAt))
    .limit(limit);
  return rows.map(toProduct);
}

/** Look up a product by its URL slug. */
export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  "use cache";
  cacheCatalog();

  const [row] = await selectProducts().where(eq(products.slug, slug)).limit(1);
  return row ? toProduct(row) : undefined;
}

/** Every product slug, for prerendering detail pages. */
export async function getProductSlugs(): Promise<string[]> {
  "use cache";
  cacheCatalog();

  const rows = await db.select({ slug: products.slug }).from(products);
  return rows.map((row) => row.slug);
}

/**
 * Products to suggest alongside one: same category first, then the rest of
 * the catalogue in featured order, so the row is always full.
 */
export async function getRelatedProducts(
  productId: number,
  categorySlug: string,
  limit = 6,
): Promise<Product[]> {
  "use cache";
  cacheCatalog();

  const rows = await selectProducts()
    .where(ne(products.id, productId))
    .orderBy(
      desc(sql`${categories.slug} = ${categorySlug}`),
      asc(products.position),
    )
    .limit(limit);
  return rows.map(toProduct);
}

// Stock

/** At or below this many units, show a low-stock note. */
const LOW_STOCK_THRESHOLD = 3;

export type StockState = {
  status: "in-stock" | "low-stock" | "sold-out";
  label: string;
};

/** Customer-facing stock state for a product. */
export function getStockState({ stock }: Pick<Product, "stock">): StockState {
  if (stock <= 0) return { status: "sold-out", label: "Sold out" };
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { status: "low-stock", label: `Only ${stock} left` };
  }
  return { status: "in-stock", label: "In stock" };
}
