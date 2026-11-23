import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/product/product-grid";
import { Eyebrow, PageIntro } from "@/components/ui/layout";
import { collectionHref, getCategories, getProducts } from "@/lib/catalog";

// One prerendered page per category. Unknown slugs render the not-found page,
// as on product pages (see src/app/products/[slug]/page.tsx).
export async function generateStaticParams() {
  return (await getCategories()).map(({ slug }) => ({ slug }));
}

async function getCategory(slug: string) {
  return (await getCategories()).find((category) => category.slug === slug);
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};
  return { title: category.title, description: category.description };
}

export default function CollectionPage({
  params,
}: PageProps<"/collections/[slug]">) {
  return (
    // params is URL data: behind Suspense the skeleton shows from the
    // prefetched shell while the collection streams.
    <Suspense fallback={<CollectionSkeleton />}>
      <Collection params={params} />
    </Suspense>
  );
}

async function Collection({
  params,
}: Pick<PageProps<"/collections/[slug]">, "params">) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const products = await getProducts({ categorySlug: category.slug });
  const others = categories.filter((c) => c.slug !== category.slug);

  return (
    <>
      <PageIntro
        eyebrow="Collection"
        title={category.title}
        description={category.description}
        meta={`${products.length} ${products.length === 1 ? "piece" : "pieces"}`}
      />
      <CollectionBody>
        <h2 className="sr-only">Products</h2>
        <ProductGrid products={products} />
      </CollectionBody>
      {others.length > 0 && (
        <nav
          aria-labelledby="more-collections-title"
          className="container-page flex flex-col items-center gap-6 border-t py-(--section-y) text-center"
        >
          <Eyebrow id="more-collections-title" className="text-muted">
            Explore further
          </Eyebrow>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={collectionHref(other.slug)}
                  className="font-display text-title link-reveal"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/products" className="mt-2 eyebrow link">
            Shop all products
          </Link>
        </nav>
      )}
    </>
  );
}

function CollectionSkeleton() {
  return (
    <div aria-busy>
      <PageIntro
        eyebrow="Collection"
        title={<span className="invisible">Loading</span>}
        description={<span className="invisible">Loading products</span>}
      />
      <CollectionBody>
        <ProductGridSkeleton />
      </CollectionBody>
    </div>
  );
}

function CollectionBody({ children }: { children: ReactNode }) {
  return (
    <section className="container-page border-t pt-6 pb-(--section-y) lg:pt-8">
      {children}
    </section>
  );
}
