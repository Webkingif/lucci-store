// Checkout and order lifecycle. The only code that creates orders, moves
// order status or takes stock for a sale.
//
// Trust model:
// - The client sends a product slug only. Price, currency and name come from
//   the database and are snapshotted on the order.
// - Payment state is always re-read from Stripe on the server, never taken
//   from a redirect, a query string or (beyond ids) a webhook payload.
//
// Flow: createCheckout() makes a `pending` order and a Checkout Session that
// only *authorizes* the card. fulfillCheckout() (webhook and success redirect)
// atomically takes stock, then captures the payment or, when the piece sold
// out meanwhile, releases the authorization so the customer is never charged.
// Every step is a conditional status transition or a Stripe call with an
// idempotency key, so replays and concurrent calls are safe.

import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { db } from "@/db";
import { getTxDb } from "@/db/pool";
import { orders, products, stripeEvents } from "@/db/schema";
import { CATALOG_CACHE_TAG } from "@/lib/catalog";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import type { Order, OrderCancelReason, ShippingAddress } from "@/types";

/** Unpaid sessions expire after this long (Stripe's minimum is 30 minutes). */
const SESSION_TTL_SECONDS = 30 * 60;

/** Countries Checkout collects shipping addresses for. */
const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["US", "CA", "GB", "IE", "FR", "DE", "IT", "ES", "NL", "BE", "AU"];

type OrderRow = typeof orders.$inferSelect;

/** Stock changed: product pages and grids must not show the old count. */
function revalidateStock() {
  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });
}

// Create

export type CheckoutResult =
  | { status: "redirect"; url: string }
  | { status: "not-found" }
  | { status: "sold-out" };

/** Create a pending order and its Stripe Checkout Session for one unit. */
export async function createCheckout(slug: string): Promise<CheckoutResult> {
  // Uncached read: the catalogue cache may be a minute stale.
  const [product] = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      priceCents: products.priceCents,
      currency: products.currency,
      stock: products.stock,
      images: products.images,
    })
    .from(products)
    // Hidden products can't be bought, even by a direct POST.
    .where(and(eq(products.slug, slug), eq(products.published, true)))
    .limit(1);

  if (!product) return { status: "not-found" };
  // Early check only; the authoritative check is the decrement at fulfilment.
  if (product.stock < 1) return { status: "sold-out" };

  const quantity = 1;
  const [order] = await db
    .insert(orders)
    .values({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPriceCents: product.priceCents,
      amountTotalCents: product.priceCents * quantity,
      currency: product.currency,
    })
    .returning({ id: orders.id });

  const siteUrl = getSiteUrl();
  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity,
            price_data: {
              currency: product.currency.toLowerCase(),
              unit_amount: product.priceCents,
              product_data: {
                name: product.name,
                images: product.images
                  .map((image) => image.src)
                  .filter((src) => src.startsWith("https://"))
                  .slice(0, 1),
              },
            },
          },
        ],
        // Authorize only; captured once stock is confirmed.
        payment_intent_data: {
          capture_method: "manual",
          metadata: { orderId: order.id },
        },
        metadata: { orderId: order.id },
        client_reference_id: order.id,
        shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
        expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
        success_url: `${siteUrl}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/products/${encodeURIComponent(product.slug)}?checkout=canceled`,
      },
      { idempotencyKey: `checkout-${order.id}` },
    );
  } catch (error) {
    // No session exists, so the order can never be paid.
    await db
      .update(orders)
      .set({ status: "expired" })
      .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
    throw error;
  }

  await db
    .update(orders)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(orders.id, order.id));

  if (!session.url) throw new Error(`Checkout Session ${session.id} has no URL`);
  return { status: "redirect", url: session.url };
}

// Fulfil

/**
 * Confirm a completed Checkout Session against Stripe and settle its order:
 * take stock and capture, or release the authorization. Idempotent; safe to
 * call from both the webhook and the success redirect, concurrently.
 * Returns the order id, or undefined when the session isn't one of ours.
 */
export async function fulfillCheckout(
  sessionId: string,
): Promise<string | undefined> {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const orderId = session.metadata?.orderId;
  if (!orderId) return undefined;
  if (session.status !== "complete") return orderId;

  const paymentIntent = session.payment_intent;
  if (!paymentIntent || typeof paymentIntent === "string") {
    throw new Error(`Checkout Session ${session.id} has no PaymentIntent`);
  }

  const { order, stockChanged } = await getTxDb().transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");

    if (!locked) throw new Error(`Order ${orderId} not found`);
    if (
      locked.stripeCheckoutSessionId &&
      locked.stripeCheckoutSessionId !== session.id
    ) {
      throw new Error(`Order ${orderId} belongs to another Checkout Session`);
    }
    // Already settled (or being settled) by an earlier call.
    if (locked.status !== "pending") {
      return { order: locked, stockChanged: false };
    }

    const details = {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntent.id,
      customerEmail: session.customer_details?.email ?? null,
      shippingAddress: toShippingAddress(session),
    };

    const matches =
      session.amount_total === locked.amountTotalCents &&
      paymentIntent.amount === locked.amountTotalCents &&
      session.currency?.toUpperCase() === locked.currency &&
      (paymentIntent.status === "requires_capture" ||
        paymentIntent.status === "succeeded");

    if (!matches) {
      const [updated] = await tx
        .update(orders)
        .set({
          ...details,
          status: "canceled",
          cancelReason: "amount_mismatch",
        })
        .where(eq(orders.id, orderId))
        .returning();
      return { order: updated, stockChanged: false };
    }

    // Atomic: only succeeds while enough stock remains.
    const taken = await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${locked.quantity}` })
      .where(
        and(
          eq(products.id, locked.productId),
          gte(products.stock, locked.quantity),
        ),
      )
      .returning({ id: products.id });

    const [updated] = await tx
      .update(orders)
      .set(
        taken.length > 0
          ? { ...details, status: "authorized" }
          : { ...details, status: "canceled", cancelReason: "out_of_stock" },
      )
      .where(eq(orders.id, orderId))
      .returning();
    return { order: updated, stockChanged: taken.length > 0 };
  });

  if (stockChanged) revalidateStock();

  // Stripe calls happen outside the transaction; each is idempotent.
  if (order.status === "authorized") await captureOrder(order);
  else if (order.status === "canceled") await releasePayment(order);

  return orderId;
}

/** Capture an authorized order's payment and mark it paid. */
async function captureOrder(order: OrderRow) {
  const paymentIntentId = order.stripePaymentIntentId;
  if (!paymentIntentId) throw new Error(`Order ${order.id} has no PaymentIntent`);

  const stripe = getStripe();
  let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === "requires_capture") {
    try {
      paymentIntent = await stripe.paymentIntents.capture(
        paymentIntentId,
        {},
        { idempotencyKey: `capture-${order.id}` },
      );
    } catch (error) {
      // A failed capture may have canceled the PaymentIntent (for example an
      // expired authorization). Anything else is retried by the caller.
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "canceled") throw error;
    }
  }

  if (paymentIntent.status === "succeeded") {
    await db
      .update(orders)
      .set({ status: "paid", paidAt: new Date() })
      .where(and(eq(orders.id, order.id), eq(orders.status, "authorized")));
  } else if (paymentIntent.status === "canceled") {
    await cancelAuthorizedOrder(order.id, "capture_failed");
  } else {
    throw new Error(
      `PaymentIntent ${paymentIntentId} is ${paymentIntent.status}; cannot capture`,
    );
  }
}

/** Make sure a canceled order's customer isn't charged. */
async function releasePayment(order: OrderRow) {
  const paymentIntentId = order.stripePaymentIntentId;
  if (!paymentIntentId) return;

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status === "succeeded") {
    // Only if something captured outside this flow; refund in full.
    await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { idempotencyKey: `refund-${order.id}` },
    );
  } else if (paymentIntent.status !== "canceled") {
    await stripe.paymentIntents.cancel(
      paymentIntentId,
      {},
      { idempotencyKey: `cancel-${order.id}` },
    );
  }
}

/** Cancel an `authorized` order and put its stock back. */
async function cancelAuthorizedOrder(
  orderId: string,
  reason: OrderCancelReason,
) {
  const restored = await getTxDb().transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update");
    if (!locked || locked.status !== "authorized") return false;

    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${locked.quantity}` })
      .where(eq(products.id, locked.productId));
    await tx
      .update(orders)
      .set({ status: "canceled", cancelReason: reason })
      .where(eq(orders.id, orderId));
    return true;
  });

  if (restored) revalidateStock();
}

// Other webhook transitions

/** Session expired or abandoned. Stock was never taken, so nothing to restore. */
export async function expireCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  await db
    .update(orders)
    .set({ status: "expired" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
}

/** Safety net: an authorization was canceled outside our flow. */
export async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent,
) {
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, paymentIntent.id))
    .limit(1);
  if (order) await cancelAuthorizedOrder(order.id, "authorization_canceled");
}

/** A paid order was fully refunded (e.g. from the Dashboard). */
export async function markRefunded(charge: Stripe.Charge) {
  if (!charge.refunded || !charge.payment_intent) return;
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent.id;
  await db
    .update(orders)
    .set({ status: "refunded" })
    .where(
      and(
        eq(orders.stripePaymentIntentId, paymentIntentId),
        eq(orders.status, "paid"),
      ),
    );
}

// Webhook event log

export async function isEventProcessed(eventId: string) {
  const [row] = await db
    .select({ id: stripeEvents.id })
    .from(stripeEvents)
    .where(eq(stripeEvents.id, eventId))
    .limit(1);
  return Boolean(row);
}

export async function recordEvent(event: Stripe.Event) {
  await db
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing();
}

// Reads

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** An order for the confirmation page. Uncached: status changes quickly. */
export async function getOrder(orderId: string): Promise<Order | undefined> {
  if (!UUID_PATTERN.test(orderId)) return undefined;
  const [row] = await db
    .select({
      id: orders.id,
      status: orders.status,
      cancelReason: orders.cancelReason,
      productName: orders.productName,
      productSlug: products.slug,
      quantity: orders.quantity,
      amountTotalCents: orders.amountTotalCents,
      currency: orders.currency,
      customerEmail: orders.customerEmail,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!row) return undefined;

  return {
    id: row.id,
    status: row.status,
    cancelReason: row.cancelReason ?? undefined,
    productName: row.productName,
    productSlug: row.productSlug,
    quantity: row.quantity,
    amountTotal: row.amountTotalCents,
    currency: row.currency,
    customerEmail: row.customerEmail ?? undefined,
  };
}

/** Order id for a Checkout Session, from our own records. */
export async function getOrderIdBySession(sessionId: string) {
  const [row] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.stripeCheckoutSessionId, sessionId))
    .limit(1);
  return row?.id;
}

function toShippingAddress(
  session: Stripe.Checkout.Session,
): ShippingAddress | null {
  const shipping = session.collected_information?.shipping_details;
  if (!shipping) return null;
  const { address } = shipping;
  return {
    name: shipping.name,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
  };
}
