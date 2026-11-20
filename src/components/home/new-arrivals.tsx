import Image from "next/image";
import { ProductCard } from "@/components/product/product-card";
import { Section, SectionHeading } from "@/components/ui/layout";
import type { Image as ImageData, Product } from "@/types";

type NewArrivalsProps = {
  image: ImageData;
  products: Product[];
};

/**
 * Curated drop: one editorial image beside a 2×2 block of products.
 * Desktop: image spans the left half; tablet/mobile: image on top.
 */
export function NewArrivals({ image, products }: NewArrivalsProps) {
  return (
    <Section aria-labelledby="new-arrivals-title" className="container-page">
      <SectionHeading
        id="new-arrivals-title"
        title="New arrivals"
        action={{ label: "View all", href: "/products" }}
      />
      <div className="grid grid-cols-2 gap-x-1 gap-y-10 lg:grid-cols-4">
        <div className="relative col-span-2 aspect-4/5 bg-surface sm:aspect-3/2 lg:row-span-2 lg:aspect-auto">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 64rem) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            sizes="(min-width: 64rem) 25vw, 50vw"
          />
        ))}
      </div>
    </Section>
  );
}
