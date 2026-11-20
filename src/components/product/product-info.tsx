import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/layout";
import { catalogHref, getStockState } from "@/lib/catalog";
import { services } from "@/lib/sample-data";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

const stockDot = {
  "in-stock": "bg-success",
  "low-stock": "bg-ink",
  "sold-out": "bg-muted",
} as const;

type ProductInfoProps = {
  product: Product;
};

/**
 * Product details panel: category trail, name, price, stock state, the bag
 * action and collapsible details. Mirrors the card's hierarchy at a larger
 * scale: display serif for the name, quiet tracked labels for everything else.
 */
export function ProductInfo({ product }: ProductInfoProps) {
  const stock = getStockState(product);
  const soldOut = stock.status === "sold-out";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 eyebrow text-muted">
              <li>
                <Link href="/products" className="link-reveal hover:text-ink">
                  Shop
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={catalogHref({ category: product.categorySlug })}
                  className="link-reveal hover:text-ink"
                >
                  {product.category}
                </Link>
              </li>
            </ol>
          </nav>
          {product.badge && <Eyebrow>{product.badge}</Eyebrow>}
        </div>

        <h1 className="font-display text-headline">{product.name}</h1>

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="text-lead">
            {formatPrice(product.price, product.currency)}
          </p>
          <p className="inline-flex items-center gap-2 eyebrow">
            <span
              aria-hidden
              className={cn("size-1.5 rounded-full", stockDot[stock.status])}
            />
            {stock.label}
          </p>
        </div>
      </div>

      <p className="max-w-prose text-lead text-ink-soft">
        {product.description}
      </p>

      {/* Placeholder: no cart exists yet. */}
      <Button size="lg" fullWidth disabled={soldOut}>
        {soldOut ? "Sold out" : "Add to bag"}
      </Button>

      <div className="border-b">
        <Disclosure title="Details" defaultOpen>
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
            <dt className="text-muted">Category</dt>
            <dd>{product.category}</dd>
            <dt className="text-muted">Availability</dt>
            <dd>{stock.label}</dd>
          </dl>
        </Disclosure>
        <Disclosure title="Delivery & returns">
          <ul className="flex flex-col gap-3">
            {services.map((item) => (
              <li key={item.title}>
                <span className="block">{item.title}</span>
                <span className="text-muted">{item.body}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      </div>
    </div>
  );
}

/** Hairline-separated expandable row built on native <details>. */
function Disclosure({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-t">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 eyebrow [&::-webkit-details-marker]:hidden">
        {title}
        <Plus
          aria-hidden
          className="size-3.5 transition-transform duration-200 ease-standard group-open:rotate-45"
          strokeWidth={1.25}
        />
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}
