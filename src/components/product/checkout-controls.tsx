"use client";

import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Submit button for the Buy now form; shows progress while Checkout loads. */
export function BuyNowButton({ soldOut }: { soldOut: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      fullWidth
      disabled={soldOut || pending}
      aria-busy={pending || undefined}
    >
      {soldOut ? "Sold out" : pending ? "Redirecting…" : "Buy now"}
    </Button>
  );
}

const notices = {
  canceled: "Checkout was canceled. You have not been charged.",
  "sold-out": "This piece has just sold out.",
} as const;

/**
 * Message after returning from Checkout (`?checkout=`). Reads the URL on the
 * client so the product page stays prerendered; wrap in <Suspense>.
 */
export function CheckoutNotice() {
  const value = useSearchParams().get("checkout");
  if (value !== "canceled" && value !== "sold-out") return null;
  return (
    <p role="status" className="border-t border-b py-4 text-muted">
      {notices[value]}
    </p>
  );
}
