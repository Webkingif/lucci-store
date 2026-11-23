// Admin category data. Uncached; every export authorizes itself.

import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { AdminCategory } from "@/types";
import { requireAdmin } from "./auth";
import { isForeignKeyViolation, isUniqueViolation } from "./db-errors";
import type { CategoryInput, FieldErrors } from "./validation";

function selectAdminCategories() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      title: categories.title,
      description: categories.description,
      position: categories.position,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .$dynamic();
}

/** Categories in display order, with all their products counted. */
export async function listAdminCategories(): Promise<AdminCategory[]> {
  await requireAdmin();
  return selectAdminCategories().orderBy(
    asc(categories.position),
    asc(categories.title),
  );
}

export async function getAdminCategory(
  id: number,
): Promise<AdminCategory | undefined> {
  await requireAdmin();
  const [row] = await selectAdminCategories()
    .where(eq(categories.id, id))
    .limit(1);
  return row;
}

export type CategoryWriteResult =
  { ok: true; id: number } | { ok: false; errors: FieldErrors };

function slugTaken(error: unknown): CategoryWriteResult {
  if (isUniqueViolation(error)) {
    return {
      ok: false,
      errors: { slug: "Another category already uses this slug." },
    };
  }
  throw error;
}

export async function createCategory(
  input: CategoryInput,
): Promise<CategoryWriteResult> {
  await requireAdmin();
  try {
    const [row] = await db
      .insert(categories)
      .values(input)
      .returning({ id: categories.id });
    return { ok: true, id: row.id };
  } catch (error) {
    return slugTaken(error);
  }
}

export async function updateCategory(
  id: number,
  input: CategoryInput,
): Promise<CategoryWriteResult | { ok: false; notFound: true }> {
  await requireAdmin();
  try {
    const [row] = await db
      .update(categories)
      .set(input)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    return row ? { ok: true, id: row.id } : { ok: false, notFound: true };
  } catch (error) {
    return slugTaken(error);
  }
}

export type DeleteCategoryResult =
  { status: "deleted" } | { status: "has-products" } | { status: "not-found" };

/** Delete an empty category. The products FK (`restrict`) backs up the check. */
export async function deleteCategory(
  id: number,
): Promise<DeleteCategoryResult> {
  await requireAdmin();
  try {
    const deleted = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    return deleted.length > 0 ? { status: "deleted" } : { status: "not-found" };
  } catch (error) {
    if (isForeignKeyViolation(error)) return { status: "has-products" };
    throw error;
  }
}
