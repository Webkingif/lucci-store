// Static editorial content for the home page (campaign imagery, category
// tiles, service promises). Products and categories live in the database;
// see src/db/seed-data.ts.
// Photos are from Unsplash (https://unsplash.com/license); none show third-party brands.

import type { Collection, Image } from "@/types";

/** Base Unsplash URL; src/lib/image-loader.ts adds size and quality. */
function unsplash(id: string, alt: string, fit?: Image["fit"]): Image {
  return { src: `https://images.unsplash.com/photo-${id}`, alt, fit };
}

export const heroImages: [Image, Image] = [
  unsplash(
    "1574015974293-817f0ebebb74",
    "Black-and-white portrait of a woman with windswept hair",
  ),
  unsplash(
    "1613915617430-8ab0fd7c6baf",
    "Black-and-white photo of a woman in a tailored grey coat",
  ),
];

export const featureImage = unsplash(
  "1603189343302-e603f7add05a",
  "Silhouette of a figure in an oversized black jacket against a white background",
);

export const newArrivalsImage = unsplash(
  "1761637322362-113b4f6c633c",
  "Man in an all-black outfit seated on a chair in a white studio",
);

export const categories: Collection[] = [
  {
    slug: "women",
    title: "Women",
    description: "Tailoring, knitwear and coats.",
    href: "/products",
    image: unsplash(
      "1580478491436-fd6a937acc9e",
      "Woman in a red blazer sitting on stairs",
    ),
  },
  {
    slug: "men",
    title: "Men",
    description: "Suiting and everyday essentials.",
    href: "/products",
    image: unsplash(
      "1772757844633-0f1e20b8a199",
      "Man in a black suit and sunglasses against an orange wall",
    ),
  },
  {
    slug: "bags",
    title: "Bags",
    description: "Leather pieces for every day.",
    href: "/products",
    image: unsplash(
      "1624687943971-e86af76d57de",
      "Tan leather tote hanging against a white door",
    ),
  },
];

export const services = [
  {
    title: "Complimentary shipping",
    body: "Free standard delivery on every order.",
  },
  {
    title: "Easy returns",
    body: "Return or exchange within 30 days.",
  },
  {
    title: "Gift wrapping",
    body: "Every order arrives in signature packaging.",
  },
] as const;
