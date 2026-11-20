import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types";

/** Cards in the first row on the widest (4-column) layout. */
const FIRST_ROW = 4;

type ProductGridProps = {
  products: Product[];
};

/** Catalogue grid: 2 / 3 / 4 columns of near-touching portrait tiles. */
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="font-display text-title">Nothing here yet</p>
        <p className="text-muted">
          There are no pieces in this category at the moment.
        </p>
        <Link href="/products" className="mt-2 eyebrow link">
          View all products
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid-catalog">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < FIRST_ROW} />
        </li>
      ))}
    </ul>
  );
}

/** Placeholder shown while the listing streams in; mirrors the grid. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul aria-hidden className="grid-catalog">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex flex-col gap-4">
          <div className="media-frame animate-pulse" />
          <div className="flex flex-col gap-2 px-1 sm:px-0">
            <div className="h-3.5 w-2/3 bg-surface" />
            <div className="h-3.5 w-1/4 bg-surface" />
          </div>
        </li>
      ))}
    </ul>
  );
}
