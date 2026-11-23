import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import { PageIntro } from "@/components/ui/layout";
import { getNewArrivals } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "New arrivals",
};

/** Two full rows on the widest (4-column) grid. */
const NEW_ARRIVALS_LIMIT = 8;

// Reads only cached catalogue data, so the page is prerendered and refreshed
// with the "products" cache tag.
export default async function NewArrivalsPage() {
  const products = await getNewArrivals(NEW_ARRIVALS_LIMIT);

  return (
    <>
      <PageIntro
        eyebrow="Just in"
        title="New arrivals"
        description="The latest pieces to join the collection."
      />
      <section className="container-page flex flex-col items-center gap-12 border-t pt-6 pb-(--section-y) lg:gap-16 lg:pt-8">
        <h2 className="sr-only">Products</h2>
        <div className="w-full">
          <ProductGrid products={products} />
        </div>
        <Link href="/products" className="eyebrow link">
          Shop all products
        </Link>
      </section>
    </>
  );
}
