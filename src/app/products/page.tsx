import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { CatalogToolbar } from "@/components/product/catalog-toolbar";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/product/product-grid";
import { Eyebrow } from "@/components/ui/layout";
import { getCategories, getProducts, parseCatalogQuery } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    // searchParams is request-time data, so with cacheComponents the listing
    // streams in behind a matching skeleton.
    <Suspense fallback={<ListingSkeleton />}>
      <Listing searchParams={searchParams} />
    </Suspense>
  );
}

async function Listing({
  searchParams,
}: Pick<PageProps<"/products">, "searchParams">) {
  const { categorySlug, sort } = parseCatalogQuery(await searchParams);
  const categories = await getCategories();
  // Unknown category slugs fall back to all products.
  const category = categories.find((c) => c.slug === categorySlug);
  const products = await getProducts({ categorySlug: category?.slug, sort });
  const count = `${products.length} ${products.length === 1 ? "piece" : "pieces"}`;

  return (
    <>
      <Intro
        title={category?.title ?? "All products"}
        description={
          category?.description ??
          "Outerwear, tailoring, leather goods and accessories."
        }
        meta={count}
      />
      <CatalogToolbar categories={categories} category={category} sort={sort} />
      <ListingBody>
        <h2 className="sr-only">Products</h2>
        <ProductGrid products={products} />
      </ListingBody>
    </>
  );
}

function ListingSkeleton() {
  return (
    <div aria-busy>
      <Intro
        title={<span className="invisible">Loading</span>}
        description={<span className="invisible">Loading products</span>}
      />
      <div className="h-12 border-b lg:h-14" />
      <ListingBody>
        <ProductGridSkeleton />
      </ListingBody>
    </div>
  );
}

type IntroProps = {
  title: ReactNode;
  description: ReactNode;
  meta?: string;
};

/** Page title block: modest headline with the result count aligned to the end. */
function Intro({ title, description, meta }: IntroProps) {
  return (
    <header className="container-page flex flex-col gap-4 pt-10 pb-8 sm:flex-row sm:items-end sm:justify-between lg:pt-16 lg:pb-10">
      <div className="flex flex-col gap-3">
        <Eyebrow className="text-muted">Shop</Eyebrow>
        <h1 className="font-display text-headline">{title}</h1>
        <p className="max-w-prose text-muted">{description}</p>
      </div>
      {meta && (
        <p className="shrink-0 eyebrow text-muted" aria-live="polite">
          {meta}
        </p>
      )}
    </header>
  );
}

function ListingBody({ children }: { children: ReactNode }) {
  return (
    <section className="container-page pt-6 pb-(--section-y) lg:pt-8">
      {children}
    </section>
  );
}
