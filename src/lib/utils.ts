import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the custom type scale in globals.css; otherwise it
// treats e.g. `text-body` as a color and drops it when merged with `text-ink`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "eyebrow",
        "caption",
        "body",
        "lead",
        "title",
        "headline",
        "display",
      ],
    },
  },
});

/** Merge conditional class names and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an amount in minor units (e.g. cents) as a currency string.
 * Whole amounts drop the decimals ($2,480 rather than $2,480.00).
 */
export function formatPrice(amountInCents: number, currency = "USD") {
  const whole = amountInCents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amountInCents / 100);
}
