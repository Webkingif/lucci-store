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

export type OrderStatus =
  "pending" | "authorized" | "paid" | "canceled" | "expired" | "refunded";

export type OrderCancelReason =
  | "out_of_stock"
  | "amount_mismatch"
  | "capture_failed"
  | "authorization_canceled";

export type ShippingAddress = {
  name: string;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

/** A customer order, as shown on the checkout confirmation page. */
export type Order = {
  id: string;
  status: OrderStatus;
  cancelReason?: OrderCancelReason;
  productName: string;
  productSlug: string;
  quantity: number;
  /** Total in minor units. */
  amountTotal: number;
  currency: string;
  customerEmail?: string;
};

export type Collection = {
  slug: string;
  title: string;
  description: string;
  image: Image;
  href: string;
};

// Admin. Mapped from rows in src/lib/admin/*, like the storefront types above.

/** A product as the admin sees it: every product, including hidden ones. */
export type AdminProduct = Product & {
  categoryId: number;
  /** Merchandised sort order. */
  position: number;
  published: boolean;
};

/** A category as the admin edits it. */
export type AdminCategory = {
  id: number;
  slug: string;
  title: string;
  description: string;
  position: number;
  /** All products in the category, published or not. */
  productCount: number;
};

/** One row of the admin order list. */
export type AdminOrder = {
  id: string;
  status: OrderStatus;
  productName: string;
  quantity: number;
  /** Total in minor units. */
  amountTotal: number;
  currency: string;
  customerEmail?: string;
  createdAt: Date;
};

/** Everything stored about an order, for the admin detail view. */
export type AdminOrderDetail = AdminOrder & {
  cancelReason?: OrderCancelReason;
  productId: number;
  productSlug: string;
  /** Unit price snapshot in minor units. */
  unitPrice: number;
  shippingAddress?: ShippingAddress;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: Date;
  updatedAt: Date;
};
