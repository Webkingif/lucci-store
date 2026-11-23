"use server";

import { notFound, redirect } from "next/navigation";
import { createCheckout } from "@/lib/orders";

/**
 * "Buy now": start Stripe Checkout for one unit of a product. Only the slug
 * is read from the form; price and stock come from the database.
 */
export async function buyNow(formData: FormData) {
  const slug = formData.get("slug");
  if (typeof slug !== "string" || !slug) notFound();

  const result = await createCheckout(slug);
  if (result.status === "not-found") notFound();
  if (result.status === "sold-out") {
    redirect(`/products/${encodeURIComponent(slug)}?checkout=sold-out`);
  }
  redirect(result.url);
}
