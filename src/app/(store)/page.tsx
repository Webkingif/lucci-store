import { CategoryTiles } from "@/components/home/category-tiles";
import { EditorialFeature } from "@/components/home/editorial-feature";
import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { ProductRail } from "@/components/home/product-rail";
import { Services } from "@/components/home/services";
import { collectionHref, getNewArrivals, getProducts } from "@/lib/catalog";
import {
  categories,
  featureImage,
  heroImages,
  newArrivalsImage,
  services,
} from "@/lib/sample-data";

export default async function HomePage() {
  const [newArrivals, outerwear] = await Promise.all([
    getNewArrivals(4),
    getProducts({ categorySlug: "outerwear", limit: 6 }),
  ]);

  return (
    <>
      <Hero images={heroImages} />

      <NewArrivals image={newArrivalsImage} products={newArrivals} />

      <EditorialFeature image={featureImage} />

      <CategoryTiles categories={categories} />

      <ProductRail
        id="outerwear-title"
        eyebrow="Featured collection"
        title="The outerwear edit"
        products={outerwear}
        viewAllHref={collectionHref("outerwear")}
      />

      <Services items={services} />
    </>
  );
}
