// Admin order reads. Read only: order status is moved by checkout and the
// Stripe webhook (src/lib/orders.ts), and refunds happen in the Stripe
// Dashboard. Every export authorizes itself.

import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderStatus, products } from "@/db/schema";
import type { AdminOrder, AdminOrderDetail, OrderStatus } from "@/types";
import { requireAdmin } from "./auth";

export const ORDER_STATUSES = orderStatus.enumValues;
export const ORDERS_PAGE_SIZE = 50;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseOrderStatus(value: unknown): OrderStatus | undefined {
  return ORDER_STATUSES.find((status) => status === value);
}

export async function listAdminOrders({
  status,
  page = 1,
}: {
  status?: OrderStatus;
  page?: number;
}): Promise<{ orders: AdminOrder[]; total: number }> {
  await requireAdmin();
  const where = status ? eq(orders.status, status) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: orders.id,
        status: orders.status,
        productName: orders.productName,
        quantity: orders.quantity,
        amountTotalCents: orders.amountTotalCents,
        currency: orders.currency,
        customerEmail: orders.customerEmail,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(ORDERS_PAGE_SIZE)
      .offset((Math.max(page, 1) - 1) * ORDERS_PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(where),
  ]);

  return {
    total,
    orders: rows.map((row) => ({
      id: row.id,
      status: row.status,
      productName: row.productName,
      quantity: row.quantity,
      amountTotal: row.amountTotalCents,
      currency: row.currency,
      customerEmail: row.customerEmail ?? undefined,
      createdAt: row.createdAt,
    })),
  };
}

export async function getAdminOrder(
  id: string,
): Promise<AdminOrderDetail | undefined> {
  await requireAdmin();
  if (!UUID_PATTERN.test(id)) return undefined;

  const [row] = await db
    .select({ order: orders, productSlug: products.slug })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, id))
    .limit(1);
  if (!row) return undefined;

  const { order } = row;
  return {
    id: order.id,
    status: order.status,
    cancelReason: order.cancelReason ?? undefined,
    productId: order.productId,
    productSlug: row.productSlug,
    productName: order.productName,
    quantity: order.quantity,
    unitPrice: order.unitPriceCents,
    amountTotal: order.amountTotalCents,
    currency: order.currency,
    customerEmail: order.customerEmail ?? undefined,
    shippingAddress: order.shippingAddress ?? undefined,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId ?? undefined,
    stripePaymentIntentId: order.stripePaymentIntentId ?? undefined,
    paidAt: order.paidAt ?? undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
