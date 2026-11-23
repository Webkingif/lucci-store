// Database schema: categories and products (stock is a column on products),
// plus orders and the Stripe webhook event log for checkout.
// Column names are camelCase here and snake_case in Postgres (`casing` option
// in drizzle.config.ts and src/db/client.ts). After changing this file, run
// `npm run db:generate` and commit the migration in ./drizzle.

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Image, OrderCancelReason, ShippingAddress } from "@/types";

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
    /** Shown on the storefront and purchasable. Hidden products stay in admin and order history. */
    published: boolean().notNull().default(true),
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

/**
 * Order lifecycle. Checkout authorizes the card only; stock is taken and the
 * payment captured when the webhook (or success redirect) fulfils the order.
 */
export const orderStatus = pgEnum("order_status", [
  /** Checkout Session created; waiting on the customer. */
  "pending",
  /** Card authorized and stock decremented; capture in flight. */
  "authorized",
  /** Payment captured. */
  "paid",
  /** Authorization released (no stock, amount mismatch, capture failed). */
  "canceled",
  /** Session expired or abandoned; stock was never taken. */
  "expired",
  /** Fully refunded later. Stock is not restored automatically. */
  "refunded",
]);

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    status: orderStatus().notNull().default("pending"),
    productId: integer()
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    /** Snapshot of the product name at checkout. */
    productName: text().notNull(),
    quantity: integer().notNull().default(1),
    /** Unit price snapshot from the database, never from the client. */
    unitPriceCents: integer().notNull(),
    /** Amount we expect Stripe to authorize. */
    amountTotalCents: integer().notNull(),
    currency: char({ length: 3 }).notNull(),
    stripeCheckoutSessionId: text().unique(),
    stripePaymentIntentId: text().unique(),
    customerEmail: text(),
    shippingAddress: jsonb().$type<ShippingAddress>(),
    /** Why a `canceled` order was canceled. */
    cancelReason: text().$type<OrderCancelReason>(),
    paidAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_product_id_idx").on(t.productId),
    check("orders_quantity_pos", sql`${t.quantity} > 0`),
    check(
      "orders_amounts_nonneg",
      sql`${t.unitPriceCents} >= 0 AND ${t.amountTotalCents} >= 0`,
    ),
    check("orders_currency_iso", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  ],
);

/** Stripe webhook events already handled, for skipping duplicate deliveries. */
export const stripeEvents = pgTable("stripe_events", {
  /** Stripe event id (evt_...). */
  id: text().primaryKey(),
  type: text().notNull(),
  processedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
}));
