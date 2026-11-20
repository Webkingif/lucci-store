// Seed data for the catalogue: the placeholder products and categories the
// storefront was built with. Loaded by `npm run db:seed` (src/db/seed.ts).
// Photos are from Unsplash (https://unsplash.com/license); none show third-party brands.

import type { Image } from "@/types";

export type SeedCategory = {
  slug: string;
  title: string;
  description: string;
};

export type SeedProduct = {
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  priceCents: number;
  currency: string;
  stock: number;
  images: Image[];
  badge?: string;
};

/** Base Unsplash URL; src/lib/image-loader.ts adds size and quality. */
function unsplash(id: string, alt: string, fit?: Image["fit"]): Image {
  return {
    src: `https://images.unsplash.com/photo-${id}`,
    alt,
    ...(fit && { fit }),
  };
}

/** Categories in display order (position = index). */
export const seedCategories: SeedCategory[] = [
  {
    slug: "outerwear",
    title: "Outerwear",
    description: "Coats and jackets in wool, cashmere and gabardine.",
  },
  {
    slug: "tailoring",
    title: "Tailoring",
    description: "Suits and blazers with a precise, unhurried cut.",
  },
  {
    slug: "bags",
    title: "Bags",
    description: "Leather pieces, built to carry every day.",
  },
  {
    slug: "shoes-accessories",
    title: "Shoes & accessories",
    description: "Loafers, eyewear and the finishing details.",
  },
];

/** Sample stock level unless a product sets its own. */
const DEFAULT_STOCK = 12;

function product(
  p: Omit<SeedProduct, "currency" | "images" | "stock"> & {
    image: Image;
    stock?: number;
  },
): SeedProduct {
  const { image, stock = DEFAULT_STOCK, ...rest } = p;
  return { ...rest, currency: "USD", images: [image], stock };
}

/** Newest first: seeded with the most recent createdAt. */
export const newArrivals: SeedProduct[] = [
  product({
    slug: "structured-top-handle-bag",
    name: "Structured top-handle bag",
    description: "Polished calf leather with a detachable shoulder strap.",
    categorySlug: "bags",
    priceCents: 248000,
    badge: "New in",
    image: unsplash(
      "1691480150204-66dd1eb77391",
      "Tan leather top-handle bag with buckled straps",
      "contain",
    ),
  }),
  product({
    slug: "browline-sunglasses",
    name: "Browline sunglasses",
    description: "Acetate brow with a slim metal rim.",
    categorySlug: "shoes-accessories",
    priceCents: 42000,
    image: unsplash(
      "1584036553516-bf83210aa16c",
      "Black browline sunglasses on a white surface",
    ),
  }),
  product({
    slug: "penny-loafer-burgundy",
    name: "Penny loafer",
    description: "Burnished burgundy leather on a stacked heel.",
    categorySlug: "shoes-accessories",
    priceCents: 89000,
    image: unsplash(
      "1675947258177-aa8120ddefa3",
      "Pair of burgundy leather penny loafers",
    ),
  }),
  product({
    stock: 2,
    slug: "doctor-bag-cognac",
    name: "Weekend doctor bag",
    description: "Cognac leather with studded base.",
    categorySlug: "bags",
    priceCents: 295000,
    badge: "New in",
    image: unsplash(
      "1691480250099-a63081ecfcb8",
      "Cognac leather doctor bag with long strap",
      "contain",
    ),
  }),
];

const outerwear: SeedProduct[] = [
  product({
    slug: "belted-wrap-coat-camel",
    name: "Belted wrap coat",
    description: "Double-faced wool and cashmere.",
    categorySlug: "outerwear",
    priceCents: 320000,
    image: unsplash(
      "1539533113208-f6df8cc8b543",
      "Woman in a long belted camel coat against a stone wall",
    ),
  }),
  product({
    stock: 0,
    slug: "oversized-coat-ivory",
    name: "Oversized coat",
    description: "Ivory brushed wool with dropped shoulders.",
    categorySlug: "outerwear",
    priceCents: 345000,
    image: unsplash(
      "1680690395101-1b2a56c0ac21",
      "Woman in an ivory oversized coat and trousers",
    ),
  }),
  product({
    slug: "long-coat-olive",
    name: "Long tailored coat",
    description: "Dark olive melton, cut below the knee.",
    categorySlug: "outerwear",
    priceCents: 289000,
    image: unsplash(
      "1764298493462-071f7e39b02c",
      "Woman in a long dark coat and cap against a concrete wall",
    ),
  }),
  product({
    slug: "double-breasted-coat-grey",
    name: "Double-breasted coat",
    description: "Herringbone wool with peak lapels.",
    categorySlug: "outerwear",
    priceCents: 310000,
    image: unsplash(
      "1739301722226-b60b59c3590a",
      "Woman in a grey double-breasted coat and black sunglasses",
    ),
  }),
  product({
    slug: "wrap-coat-sand",
    name: "Shawl-collar wrap coat",
    description: "Sand wool-blend with a tie belt.",
    categorySlug: "outerwear",
    priceCents: 298000,
    image: unsplash(
      "1550872199-63f4382fe925",
      "Woman in a sand-coloured wrap coat over a red dress",
    ),
  }),
  product({
    slug: "trench-coat-stone",
    name: "Trench coat",
    description: "Water-repellent cotton gabardine.",
    categorySlug: "outerwear",
    priceCents: 265000,
    image: unsplash(
      "1737508945707-ebdccee97cc5",
      "Man in a stone trench coat and sunglasses walking down a street",
    ),
  }),
];

const tailoringAndMore: SeedProduct[] = [
  product({
    slug: "single-breasted-blazer-crimson",
    name: "Single-breasted blazer",
    description: "Crimson wool crepe with a softly padded shoulder.",
    categorySlug: "tailoring",
    priceCents: 185000,
    badge: "New in",
    image: unsplash(
      "1580478491436-fd6a937acc9e",
      "Woman in a red blazer sitting on stairs",
    ),
  }),
  product({
    stock: 1,
    slug: "two-piece-suit-black",
    name: "Two-piece suit",
    description: "Black wool barathea with a slim notch lapel.",
    categorySlug: "tailoring",
    priceCents: 275000,
    image: unsplash(
      "1772757844633-0f1e20b8a199",
      "Man in a black suit and sunglasses against an orange wall",
    ),
  }),
  product({
    slug: "relaxed-tailored-set-black",
    name: "Relaxed tailored set",
    description: "Black wool twill, cut easy through the leg.",
    categorySlug: "tailoring",
    priceCents: 260000,
    image: unsplash(
      "1761637322362-113b4f6c633c",
      "Man in an all-black outfit seated on a chair in a white studio",
    ),
  }),
  product({
    slug: "tailored-coat-grey",
    name: "Tailored overcoat",
    description: "Grey wool flannel, single-breasted.",
    categorySlug: "outerwear",
    priceCents: 299000,
    image: unsplash(
      "1613915617430-8ab0fd7c6baf",
      "Black-and-white photo of a woman in a tailored grey coat",
    ),
  }),
  product({
    slug: "oversized-jacket-black",
    name: "Oversized jacket",
    description: "Black wool gabardine with a dropped shoulder.",
    categorySlug: "outerwear",
    priceCents: 215000,
    image: unsplash(
      "1603189343302-e603f7add05a",
      "Silhouette of a figure in an oversized black jacket against a white background",
    ),
  }),
  product({
    slug: "leather-tote-tan",
    name: "Leather tote",
    description: "Unlined vegetable-tanned leather.",
    categorySlug: "bags",
    priceCents: 165000,
    image: unsplash(
      "1624687943971-e86af76d57de",
      "Tan leather tote hanging against a white door",
    ),
  }),
];

/** Every product in merchandised ("featured") order (position = index). */
export const seedProducts: SeedProduct[] = [
  newArrivals[0],
  outerwear[0],
  tailoringAndMore[0],
  newArrivals[2],
  outerwear[1],
  tailoringAndMore[3],
  newArrivals[3],
  tailoringAndMore[1],
  outerwear[2],
  newArrivals[1],
  tailoringAndMore[4],
  outerwear[3],
  tailoringAndMore[5],
  outerwear[4],
  tailoringAndMore[2],
  outerwear[5],
];
