// Database tests for the shared stock SQL (src/db/stock.ts), run against a
// real Postgres: `npm run test:db`.
//
// Needs TEST_DATABASE_URL pointing at a throwaway Neon branch with all
// migrations applied (e.g. `neon branches create --name stock-tests`). The
// suite skips without it and refuses to run against DATABASE_URL, which is
// the production branch. It only touches a fixture category and product it
// creates, and deletes them afterwards.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { createDb } from "../../src/db/client";
import { categories, products } from "../../src/db/schema";
import {
  adjustStockBy,
  restoreStock,
  setStockIf,
  takeStock,
} from "../../src/db/stock";

loadEnvConfig(process.cwd());

const url = process.env.TEST_DATABASE_URL;
const productionUrls = [
  process.env.DATABASE_URL,
  process.env.DATABASE_URL_UNPOOLED,
].filter(Boolean);

if (url && productionUrls.includes(url)) {
  throw new Error(
    "TEST_DATABASE_URL matches DATABASE_URL. Point it at a throwaway Neon branch, never production.",
  );
}

describe(
  "stock SQL",
  { skip: url ? false : "TEST_DATABASE_URL is not set" },
  () => {
    const db = url ? createDb(url) : (undefined as never);
    const suffix = `${Date.now()}-${process.pid}`;
    let categoryId: number;
    let productId: number;

    async function stock() {
      const [row] = await db
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, productId));
      return row.stock;
    }

    async function reset(value: number) {
      await db
        .update(products)
        .set({ stock: value })
        .where(eq(products.id, productId));
    }

    before(async () => {
      const [category] = await db
        .insert(categories)
        .values({
          slug: `test-stock-${suffix}`,
          title: "Stock test",
          description: "Fixture for tests/db/stock.test.ts",
          position: 9999,
        })
        .returning({ id: categories.id });
      categoryId = category.id;

      const [product] = await db
        .insert(products)
        .values({
          slug: `test-stock-${suffix}`,
          name: "Stock test product",
          description: "Fixture",
          categoryId,
          priceCents: 100,
          stock: 0,
          published: false,
        })
        .returning({ id: products.id });
      productId = product.id;
    });

    after(async () => {
      if (productId)
        await db.delete(products).where(eq(products.id, productId));
      if (categoryId)
        await db.delete(categories).where(eq(categories.id, categoryId));
    });

    it("adjusts up and down", async () => {
      await reset(3);
      assert.deepEqual(await adjustStockBy(db, productId, 5), {
        status: "updated",
        stock: 8,
      });
      assert.deepEqual(await adjustStockBy(db, productId, -8), {
        status: "updated",
        stock: 0,
      });
    });

    it("refuses to go below zero or over the limit, leaving stock unchanged", async () => {
      await reset(3);
      assert.deepEqual(await adjustStockBy(db, productId, -4), {
        status: "insufficient",
        stock: 3,
      });
      assert.deepEqual(await adjustStockBy(db, productId, 1_000_000), {
        status: "limit",
        stock: 3,
      });
      assert.equal(await stock(), 3);
    });

    it("reports a missing product", async () => {
      assert.deepEqual(await adjustStockBy(db, 2_000_000_000, 1), {
        status: "not-found",
      });
      assert.deepEqual(await setStockIf(db, 2_000_000_000, 0, 1), {
        status: "not-found",
      });
    });

    it("sets only when the expected count still matches", async () => {
      await reset(5);
      assert.deepEqual(await setStockIf(db, productId, 5, 12), {
        status: "updated",
        stock: 12,
      });
      // A stale view (5) must not overwrite the current 12.
      assert.deepEqual(await setStockIf(db, productId, 5, 1), {
        status: "conflict",
        stock: 12,
      });
      assert.equal(await stock(), 12);
    });

    it("takes and restores stock for checkout", async () => {
      await reset(1);
      assert.equal(await takeStock(db, productId, 1), true);
      assert.equal(await takeStock(db, productId, 1), false);
      assert.equal(await stock(), 0);
      await restoreStock(db, productId, 1);
      assert.equal(await stock(), 1);
    });

    it("never oversells when sales and an admin restock race", async () => {
      await reset(10);
      const sales = Array.from({ length: 15 }, () =>
        takeStock(db, productId, 1),
      );
      const restock = adjustStockBy(db, productId, 5);
      const [taken, restocked] = await Promise.all([
        Promise.all(sales),
        restock,
      ]);

      assert.deepEqual(restocked.status, "updated");
      // 10 + 5 units for 15 buyers: whatever the interleaving, exactly 15 sell
      // only if the restock landed before the stock ran out. In every order,
      // stock stays >= 0 and sales + remaining = 15.
      const sold = taken.filter(Boolean).length;
      const remaining = await stock();
      assert.ok(remaining >= 0);
      assert.equal(sold + remaining, 15);
    });

    it("lets exactly one of two concurrent sets with the same expected count win", async () => {
      await reset(4);
      const results = await Promise.all([
        setStockIf(db, productId, 4, 20),
        setStockIf(db, productId, 4, 30),
      ]);
      const winners = results.filter((r) => r.status === "updated");
      assert.equal(winners.length, 1);
      assert.equal(results.filter((r) => r.status === "conflict").length, 1);
      assert.equal(
        await stock(),
        winners[0].status === "updated" ? winners[0].stock : -1,
      );
    });
  },
);
