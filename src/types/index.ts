// Shared domain types. Product and Category are mapped from database rows in
// src/lib/catalog.ts, so components never depend on the schema directly.

export type Image = {
  src: string;
  alt: string;
  /**
   * `contain` for product shots on a white background: shown whole, inset,
   * and blended onto the surface color. Defaults to `cover`.
   */
  fit?: "cover" | "contain";
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string;
  /** Category title, for display. */
  category: string;
  /** Category slug, for links and filtering. */
  categorySlug: string;
  /** Price in minor units (e.g. cents). */
  price: number;
  currency: string;
  images: Image[];
  /** Units available; 0 means sold out. */
  stock: number;
  /** Short merchandising label, e.g. "New in". */
  badge?: string;
};

/** A product category used to filter the catalogue. */
export type Category = {
  slug: string;
  /** Matches `Product.category`. */
  title: string;
  description: string;
  /** Number of products in the category, when queried with counts. */
  count?: number;
};

export type Collection = {
  slug: string;
  title: string;
  description: string;
  image: Image;
  href: string;
};
