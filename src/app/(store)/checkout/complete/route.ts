import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { fulfillCheckout, getOrderIdBySession } from "@/lib/orders";

// Checkout's success_url. Settles the order right away (in case the webhook
// hasn't arrived yet) by re-reading the session from Stripe; the session id in
// the URL is only a lookup key, never proof of payment. Then shows the order.

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId?.startsWith("cs_")) redirect("/products");

  let orderId: string | undefined;
  try {
    orderId = await fulfillCheckout(sessionId);
  } catch (error) {
    // The webhook will retry; show whatever state the order is in now.
    console.error(`Fulfilling Checkout Session ${sessionId} failed`, error);
    orderId = await getOrderIdBySession(sessionId);
  }

  redirect(orderId ? `/checkout/success?order=${orderId}` : "/products");
}
