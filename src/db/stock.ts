// Every write to products.stock lives here, so checkout, the admin and the
// database tests share one implementation. Plain functions over a Drizzle
// database or transaction: no auth and no `server-only`, so callers own
// authorization (src/lib/admin/inventory.ts) and these stay testable.
//
// Each write is a single conditional UPDATE, so concurrent writers are
// serialized by Postgres on the row and stock can never go negative.

import { and, eq, gte, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { MAX_STOCK } from "@/lib/admin/validation";
import { products } from "./schema";
import type * as schema from "./schema";

/** The HTTP client, the WebSocket client, or a transaction from either. */
export type StockDb = Pick<
  PgDatabase<PgQueryResultHKT, typeof schema>,
  "select" | "update"
>;

/**
 * Take `qty` units for a sale, only while enough remain. Returns false when
 * the product is out of stock (or missing). Used by checkout fulfilment.
 */
export async function takeStock(db: StockDb, productId: number, qty: number) {
  const taken = await db
    .update(products)
    .set({ stock: sql`${products.stock} - ${qty}` })
    .where(and(eq(products.id, productId), gte(products.stock, qty)))
    .returning({ id: products.id });
  return taken.length > 0;
}

/** Put `qty` units back, e.g. when an authorized order is canceled. */
export async function restoreStock(
  db: StockDb,
  productId: number,
  qty: number,
) {
  await db
    .update(products)
    .set({ stock: sql`${products.stock} + ${qty}` })
    .where(eq(products.id, productId));
}

async function currentStock(db: StockDb, productId: number) {
  const [row] = await db
    .select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  return row?.stock;
}

export type AdjustResult =
  | { status: "updated"; stock: number }
  | { status: "insufficient"; stock: number }
  | { status: "limit"; stock: number }
  | { status: "not-found" };

/**
 * Add (positive delta) or remove (negative delta) units atomically. Relative,
 * so it combines with concurrent sales instead of conflicting with them.
 * Refuses any change that would leave stock outside 0..MAX_STOCK.
 */
export async function adjustStockBy(
  db: StockDb,
  productId: number,
  delta: number,
): Promise<AdjustResult> {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error(`Invalid stock delta: ${delta}`);
  }
  const [updated] = await db
    .update(products)
    .set({ stock: sql`${products.stock} + ${delta}` })
    .where(
      and(
        eq(products.id, productId),
        sql`${products.stock} + ${delta} between 0 and ${MAX_STOCK}`,
      ),
    )
    .returning({ stock: products.stock });
  if (updated) return { status: "updated", stock: updated.stock };

  const stock = await currentStock(db, productId);
  if (stock === undefined) return { status: "not-found" };
  return { status: delta < 0 ? "insufficient" : "limit", stock };
}

export type SetResult =
  | { status: "updated"; stock: number }
  | { status: "conflict"; stock: number }
  | { status: "not-found" };

/**
 * Set an absolute count, only if stock still equals what the admin saw. A
 * sale in between makes this a conflict instead of a silent overwrite.
 */
export async function setStockIf(
  db: StockDb,
  productId: number,
  expected: number,
  next: number,
): Promise<SetResult> {
  if (!Number.isInteger(next) || next < 0 || next > MAX_STOCK) {
    throw new Error(`Invalid stock: ${next}`);
  }
  const [updated] = await db
    .update(products)
    .set({ stock: next })
    .where(and(eq(products.id, productId), eq(products.stock, expected)))
    .returning({ stock: products.stock });
  if (updated) return { status: "updated", stock: updated.stock };

  const stock = await currentStock(db, productId);
  return stock === undefined
    ? { status: "not-found" }
    : { status: "conflict", stock };
}
