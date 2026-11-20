// Database schema: categories and products (stock is a column on products).
// Column names are camelCase here and snake_case in Postgres (`casing` option
// in drizzle.config.ts and src/db/client.ts). After changing this file, run
// `npm run db:generate` and commit the migration in ./drizzle.

import { relations, sql } from "drizzle-orm";
import {
  char,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Image } from "@/types";

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  description: text().notNull(),
  /** Display order in the filter bar. */
  position: integer().notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    description: text().notNull(),
    categoryId: integer()
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    /** Price in minor units (cents); format with formatPrice(). */
    priceCents: integer().notNull(),
    /** ISO 4217 code, e.g. "USD". */
    currency: char({ length: 3 }).notNull().default("USD"),
    /** Units available; 0 means sold out. State labels are derived in code. */
    stock: integer().notNull().default(0),
    /** Ordered product images; the first is the card image. */
    images: jsonb().$type<Image[]>().notNull().default([]),
    /** Optional merchandising label, e.g. "New in". */
    badge: text(),
    /** Merchandised ("featured") sort order. */
    position: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    check("products_price_nonneg", sql`${t.priceCents} >= 0`),
    check("products_stock_nonneg", sql`${t.stock} >= 0`),
    check("products_currency_iso", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));
