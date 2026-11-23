import "server-only";
import Stripe from "stripe";

// Server-only Stripe client. Created lazily so builds don't need the key.
// The API version is pinned to the SDK's own (stripe@23 → 2026-11-18.endive).

let client: Stripe | undefined;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    client = new Stripe(key);
  }
  return client;
}

/** Absolute origin for Checkout return URLs, e.g. http://localhost:3000. */
export function getSiteUrl(): string {
  const url = process.env.SITE_URL;
  if (!url) throw new Error("SITE_URL is not set.");
  return url.replace(/\/+$/, "");
}
