import { ProductCard } from "@/components/product/product-card";
import { Section, SectionHeading } from "@/components/ui/layout";
import type { Product } from "@/types";

type ProductRailProps = {
  id: string;
  eyebrow?: string;
  title: string;
  products: Product[];
  /** "View all" target; defaults to the full listing. */
  viewAllHref?: string;
};

/**
 * Horizontally scrolling product row with scroll snapping. Shows about
 * 1.4 cards on mobile, 2.5 on tablet and 4.5 on desktop to signal overflow.
 */
export function ProductRail({
  id,
  eyebrow,
  title,
  products,
  viewAllHref = "/products",
}: ProductRailProps) {
  return (
    <Section aria-labelledby={id} className="bg-surface">
      <div className="container-page">
        <SectionHeading
          id={id}
          eyebrow={eyebrow}
          title={title}
          action={{ label: "View all", href: viewAllHref }}
        />
      </div>
      <div
        role="region"
        aria-label={`${title}, scrollable`}
        tabIndex={0}
        className="scrollbar-none flex snap-x snap-mandatory scroll-px-(--gutter) gap-1 overflow-x-auto px-(--gutter) focus-visible:outline-offset-[-1px]"
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sizes="(min-width: 64rem) 22vw, (min-width: 40rem) 40vw, 70vw"
            className="w-[70%] shrink-0 snap-start sm:w-[40%] lg:w-[22%]"
          />
        ))}
      </div>
    </Section>
  );
}
