// Admin product data. Uncached on purpose: admins must see live stock, not
// the minute-long storefront cache. Every export authorizes itself.
// Callers (Server Actions) refresh the storefront with updateTag afterwards.

import "server-only";
import { asc, between, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import type { AdminProduct } from "@/types";
import { requireAdmin } from "./auth";
import { isForeignKeyViolation, isUniqueViolation } from "./db-errors";
import type { FieldErrors, ProductInput } from "./validation";

const adminProductColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  description: products.description,
  priceCents: products.priceCents,
  currency: products.currency,
  stock: products.stock,
  images: products.images,
  badge: products.badge,
  position: products.position,
  published: products.published,
  categoryId: products.categoryId,
  categorySlug: categories.slug,
  categoryTitle: categories.title,
};

function selectAdminProducts() {
  return db
    .select(adminProductColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .$dynamic();
}

type AdminProductRow = Awaited<ReturnType<typeof selectAdminProducts>>[number];

function toAdminProduct(row: AdminProductRow): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.categoryTitle,
    categorySlug: row.categorySlug,
    categoryId: row.categoryId,
    price: row.priceCents,
    currency: row.currency,
    images: row.images,
    stock: row.stock,
    badge: row.badge ?? undefined,
    position: row.position,
    published: row.published,
  };
}

/** Every product, hidden ones included, in merchandised order. */
export async function listAdminProducts(): Promise<AdminProduct[]> {
  await requireAdmin();
  const rows = await selectAdminProducts().orderBy(
    asc(products.position),
    asc(products.name),
  );
  return rows.map(toAdminProduct);
}

export type InventoryFilter = "all" | "low" | "out";

/**
 * Products for the inventory screen, lowest stock first. `low` matches the
 * storefront's "Only N left" range; `out` is sold out.
 */
export async function listInventory(
  filter: InventoryFilter = "all",
): Promise<AdminProduct[]> {
  await requireAdmin();
  let query = selectAdminProducts();
  if (filter === "out") query = query.where(eq(products.stock, 0));
  if (filter === "low") {
    query = query.where(between(products.stock, 1, LOW_STOCK_THRESHOLD));
  }
  const rows = await query.orderBy(asc(products.stock), asc(products.name));
  return rows.map(toAdminProduct);
}

export async function getAdminProduct(
  id: number,
): Promise<AdminProduct | undefined> {
  await requireAdmin();
  const [row] = await selectAdminProducts().where(eq(products.id, id)).limit(1);
  return row ? toAdminProduct(row) : undefined;
}

export type ProductWriteResult =
  { ok: true; id: number; slug: string } | { ok: false; errors: FieldErrors };

function writeError(error: unknown): ProductWriteResult {
  if (isUniqueViolation(error)) {
    return {
      ok: false,
      errors: { slug: "Another product already uses this slug." },
    };
  }
  if (isForeignKeyViolation(error)) {
    return {
      ok: false,
      errors: { categoryId: "That category no longer exists." },
    };
  }
  throw error;
}

export async function createProduct(
  input: ProductInput,
): Promise<ProductWriteResult> {
  await requireAdmin();
  try {
    const [row] = await db
      .insert(products)
      .values(input)
      .returning({ id: products.id, slug: products.slug });
    return { ok: true, ...row };
  } catch (error) {
    return writeError(error);
  }
}

/**
 * Update every field except stock, which has its own conflict-safe path
 * (setStock) so an edit can't overwrite a sale that happened meanwhile.
 */
export async function updateProduct(
  id: number,
  input: ProductInput,
): Promise<ProductWriteResult | { ok: false; notFound: true }> {
  await requireAdmin();
  try {
    const [row] = await db
      .update(products)
      // Drizzle skips undefined keys, so stock is left untouched.
      .set({ ...input, stock: undefined })
      .where(eq(products.id, id))
      .returning({ id: products.id, slug: products.slug });
    if (!row) return { ok: false, notFound: true };
    return { ok: true, ...row };
  } catch (error) {
    return writeError(error);
  }
}
