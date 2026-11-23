import type Stripe from "stripe";
import {
  expireCheckout,
  fulfillCheckout,
  handlePaymentIntentCanceled,
  isEventProcessed,
  markRefunded,
  recordEvent,
} from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

// Stripe webhook endpoint. Subscribe it to exactly:
//   checkout.session.completed, checkout.session.expired,
//   payment_intent.canceled, charge.refunded
//
// Failures return 500 without recording the event, so Stripe retries. Every
// handler is idempotent, so the event log is a fast path, not a correctness
// requirement.

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    // Must be the raw body: signatures are computed over the exact bytes.
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (await isEventProcessed(event.id)) {
      return Response.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed":
        // Only the id is used; state is re-read from Stripe.
        await fulfillCheckout(event.data.object.id);
        break;
      case "checkout.session.expired":
        await expireCheckout(event.data.object);
        break;
      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(event.data.object);
        break;
      case "charge.refunded":
        await markRefunded(event.data.object);
        break;
      default:
        // Not subscribed to anything else; acknowledge and ignore.
        break;
    }

    await recordEvent(event);
    return Response.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook ${event.id} (${event.type}) failed`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }
}
