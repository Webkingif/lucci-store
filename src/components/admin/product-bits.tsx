import Image from "next/image";
import { getStockState } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { AdminProduct } from "@/types";
import { StatusTag } from "./admin-ui";

/** Small card image for admin tables. */
export function ProductThumb({ product }: { product: AdminProduct }) {
  const image = product.images[0];
  return (
    <div className="relative h-16 w-12 overflow-hidden bg-surface">
      {image && (
        <Image
          src={image.src}
          alt=""
          fill
          sizes="48px"
          className={cn(
            image.fit === "contain"
              ? "object-contain p-1 mix-blend-multiply"
              : "object-cover",
          )}
        />
      )}
    </div>
  );
}

/** Stock state tag, from the same rules the storefront uses. */
export function StockTag({ stock }: { stock: number }) {
  const state = getStockState({ stock });
  if (state.status === "sold-out")
    return <StatusTag tone="solid">Sold out</StatusTag>;
  if (state.status === "low-stock") return <StatusTag>Low</StatusTag>;
  return <StatusTag tone="muted">In stock</StatusTag>;
}
