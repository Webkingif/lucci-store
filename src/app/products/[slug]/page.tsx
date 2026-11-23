import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductRail } from "@/components/home/product-rail";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import {
  collectionHref,
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/catalog";

// Every product page is prerendered at build time. Unknown slugs render the
// not-found page (noindex) at request time; `dynamicParams` is unavailable
// with cacheComponents, so the status is 200 once streaming has begun.
export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return { title: product.name, description: product.description };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    // params is URL data: reading it behind Suspense keeps navigation instant
    // (the skeleton shows from the prefetched shell while the product streams).
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({
  params,
}: Pick<PageProps<"/products/[slug]">, "params">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.categorySlug);

  return (
    <>
      <ProductLayout
        gallery={<ProductGallery images={product.images} />}
        info={<ProductInfo product={product} />}
      />

      <ProductRail
        id="related-title"
        eyebrow="You may also like"
        title={`More ${product.category.toLowerCase()}`}
        products={related}
        viewAllHref={collectionHref(product.categorySlug)}
      />
    </>
  );
}

/** Placeholder matching the gallery and details layout. */
function ProductSkeleton() {
  return (
    <div aria-busy>
      <ProductLayout
        gallery={<div className="media-frame bleed animate-pulse lg:mx-0" />}
        info={
          <div className="flex flex-col gap-4">
            <div className="h-4 w-24 bg-surface" />
            <div className="h-12 w-3/4 bg-surface" />
            <div className="h-5 w-20 bg-surface" />
            <div className="mt-4 h-24 bg-surface" />
            <div className="mt-4 h-14 bg-surface" />
          </div>
        }
      />
    </div>
  );
}

/** Two-column detail layout: imagery left, sticky details right (lg+). */
function ProductLayout({
  gallery,
  info,
}: {
  gallery: ReactNode;
  info: ReactNode;
}) {
  return (
    <div className="container-page grid gap-8 pb-(--section-y) lg:grid-cols-12 lg:gap-12 lg:pt-8">
      <div className="lg:col-span-7">{gallery}</div>
      <div className="lg:col-span-5 xl:col-span-4 xl:col-start-9">
        {/* Details stay in view while the imagery scrolls past. */}
        <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
          {info}
        </div>
      </div>
    </div>
  );
}
