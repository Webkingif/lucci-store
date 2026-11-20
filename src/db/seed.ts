// Seed categories and products: `npm run db:seed`.
// Idempotent: rows are upserted on `slug`, so it is safe to rerun after edits
// to seed-data.ts. Runs outside Next, so it uses createDb() rather than the
// server-only `db` export.

import { loadEnvConfig } from "@next/env";
import { createDb } from "./client";
import { categories, products } from "./schema";
import { newArrivals, seedCategories, seedProducts } from "./seed-data";

loadEnvConfig(process.cwd());

/** Fixed reference time so reseeding produces the same ordering. */
const BASE_TIME = Date.parse("2026-11-01T00:00:00Z");
const MINUTE = 60_000;

/** New arrivals get the newest timestamps, in their listed order. */
function createdAtFor(slug: string, index: number) {
  const arrival = newArrivals.findIndex((p) => p.slug === slug);
  const minutesAgo = arrival >= 0 ? arrival : 100 + index;
  return new Date(BASE_TIME - minutesAgo * MINUTE);
}

async function main() {
  const db = createDb();

  const categoryIds = new Map<string, number>();
  for (const [position, category] of seedCategories.entries()) {
    const values = { ...category, position };
    const [row] = await db
      .insert(categories)
      .values(values)
      .onConflictDoUpdate({ target: categories.slug, set: values })
      .returning({ id: categories.id, slug: categories.slug });
    categoryIds.set(row.slug, row.id);
  }

  for (const [
    position,
    { categorySlug, ...product },
  ] of seedProducts.entries()) {
    const categoryId = categoryIds.get(categorySlug);
    if (!categoryId) {
      throw new Error(`Unknown category "${categorySlug}" for ${product.slug}`);
    }
    const values = {
      ...product,
      badge: product.badge ?? null,
      categoryId,
      position,
      createdAt: createdAtFor(product.slug, position),
    };
    await db
      .insert(products)
      .values(values)
      .onConflictDoUpdate({ target: products.slug, set: values });
  }

  console.log(
    `Seeded ${categoryIds.size} categories and ${seedProducts.length} products.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
