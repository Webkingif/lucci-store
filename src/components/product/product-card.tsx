import Image from "next/image";
import Link from "next/link";
import { getStockState } from "@/lib/catalog";
import type { Product } from "@/types";
import { cn, formatPrice } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  /** Responsive `sizes` hint for the image; defaults to the catalog grid. */
  sizes?: string;
  /** Load eagerly at high priority, for cards in the first visible row. */
  priority?: boolean;
  className?: string;
};

export function ProductCard({
  product,
  sizes = "(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 50vw",
  priority = false,
  className,
}: ProductCardProps) {
  const [image] = product.images;
  const stock = getStockState(product);

  return (
    <article className={cn("group relative flex flex-col gap-4", className)}>
      <div className="media-frame">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          loading={priority ? "eager" : undefined}
          fetchPriority={priority ? "high" : undefined}
          className={cn(
            "transition-transform duration-700 ease-standard group-hover:scale-[1.03]",
            image.fit === "contain"
              ? "object-contain p-[12%] mix-blend-multiply"
              : "object-cover",
          )}
        />
        {product.badge && (
          <span className="absolute top-4 left-4 eyebrow">{product.badge}</span>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1 sm:px-0">
        <h3 className="text-body">
          {/* Stretched link: the whole card is clickable. */}
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-body text-muted">
          {formatPrice(product.price, product.currency)}
          {/* Same states and labels as the product page (getStockState). */}
          {stock.status !== "in-stock" && (
            <span className={cn(stock.status === "low-stock" && "text-ink")}>
              {" · "}
              {stock.label}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
