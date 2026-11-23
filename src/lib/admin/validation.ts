// Admin form parsing: FormData in, typed input or field errors out. Pure, so
// it is unit tested without a server. Prices are typed in major units
// ("2480" or "2480.50") and stored as integer minor units.

import type { Image } from "@/types";

export type FieldErrors = Record<string, string>;

export type Parsed<T> =
  { ok: true; data: T } | { ok: false; errors: FieldErrors };

/** Result of a form Server Action, read with useActionState. */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: FieldErrors;
};

export const initialFormState: FormState = { status: "idle" };

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const PRICE_PATTERN = /^\d{1,8}(?:\.\d{1,2})?$/;
const UNSIGNED_INT_PATTERN = /^\d{1,7}$/;
const SIGNED_INT_PATTERN = /^-?\d{1,7}$/;
const IMAGE_FITS = ["cover", "contain"] as const;

export const MAX_STOCK = 1_000_000;

function text(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(
  form: FormData,
  name: string,
  label: string,
  max: number,
  errors: FieldErrors,
) {
  const value = text(form, name);
  if (!value) errors[name] = `${label} is required.`;
  else if (value.length > max)
    errors[name] = `${label} must be ${max} characters or fewer.`;
  return value;
}

function slug(form: FormData, errors: FieldErrors) {
  const value = text(form, "slug").toLowerCase();
  if (!value) errors.slug = "Slug is required.";
  else if (value.length > 80)
    errors.slug = "Slug must be 80 characters or fewer.";
  else if (!SLUG_PATTERN.test(value)) {
    errors.slug =
      "Use lowercase letters, numbers and single hyphens, e.g. silk-scarf.";
  }
  return value;
}

/** A non-negative whole number of units. */
export function parseStock(raw: unknown): number | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!UNSIGNED_INT_PATTERN.test(value)) return undefined;
  const stock = Number(value);
  return stock <= MAX_STOCK ? stock : undefined;
}

/** A price in major units to integer minor units. */
export function parsePriceToCents(raw: string): number | undefined {
  const value = raw.trim();
  if (!PRICE_PATTERN.test(value)) return undefined;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/** Minor units back to the form's major-unit string. */
export function centsToPriceInput(cents: number) {
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  return fraction === 0
    ? String(whole)
    : `${whole}.${String(fraction).padStart(2, "0")}`;
}

function isImageUrl(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    return new URL(src).protocol === "https:";
  } catch {
    return false;
  }
}

/** Image rows arrive as parallel `imageSrc` / `imageAlt` / `imageFit` fields, in order. */
function images(form: FormData, errors: FieldErrors): Image[] {
  const srcs = form.getAll("imageSrc");
  const alts = form.getAll("imageAlt");
  const fits = form.getAll("imageFit");
  const result: Image[] = [];

  srcs.forEach((rawSrc, index) => {
    const src = typeof rawSrc === "string" ? rawSrc.trim() : "";
    const rawAlt = alts[index];
    const alt = typeof rawAlt === "string" ? rawAlt.trim() : "";
    if (!src && !alt) return; // Empty row.

    const row = result.length + 1;
    if (!isImageUrl(src)) {
      errors[`images.${index}`] =
        `Image ${row}: use an https:// URL or a /path on this site.`;
    } else if (!alt) {
      errors[`images.${index}`] =
        `Image ${row}: describe the image in the alt text.`;
    } else if (src.length > 2000 || alt.length > 300) {
      errors[`images.${index}`] = `Image ${row}: URL or alt text is too long.`;
    }

    const fit = fits[index];
    result.push({
      src,
      alt,
      ...(fit === "contain" ? { fit: IMAGE_FITS[1] } : {}),
    });
  });

  if (result.length > 12) errors.images = "Add 12 images or fewer.";
  return result;
}

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  priceCents: number;
  currency: string;
  stock: number;
  badge: string | null;
  position: number;
  published: boolean;
  images: Image[];
};

/**
 * Parse the product form. Editing omits stock (`withStock: false`): it changes
 * only through the conflict-checked stock form.
 */
export function parseProductForm(
  form: FormData,
  { withStock = true }: { withStock?: boolean } = {},
): Parsed<ProductInput> {
  const errors: FieldErrors = {};

  const name = requiredText(form, "name", "Name", 120, errors);
  const productSlug = slug(form, errors);
  const description = requiredText(
    form,
    "description",
    "Description",
    4000,
    errors,
  );

  const categoryRaw = text(form, "categoryId");
  const categoryId = Number(categoryRaw);
  if (!/^\d+$/.test(categoryRaw) || categoryId < 1)
    errors.categoryId = "Choose a category.";

  const priceCents = parsePriceToCents(text(form, "price"));
  if (priceCents === undefined)
    errors.price = "Enter a price such as 2480 or 2480.50.";

  const currency = text(form, "currency").toUpperCase() || "USD";
  if (!CURRENCY_PATTERN.test(currency))
    errors.currency = "Use a 3-letter code such as USD.";

  const stock = withStock ? parseStock(form.get("stock")) : 0;
  if (stock === undefined) errors.stock = "Enter a whole number, 0 or more.";

  const badge = text(form, "badge");
  if (badge.length > 40) errors.badge = "Badge must be 40 characters or fewer.";

  const positionRaw = text(form, "position") || "0";
  if (!SIGNED_INT_PATTERN.test(positionRaw))
    errors.position = "Enter a whole number.";

  const published = form.get("published") === "on";
  const productImages = images(form, errors);
  if (published && productImages.length === 0) {
    errors.images = "Add at least one image before publishing.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name,
      slug: productSlug,
      description,
      categoryId,
      priceCents: priceCents!,
      currency,
      stock: stock!,
      badge: badge || null,
      position: Number(positionRaw),
      published,
      images: productImages,
    },
  };
}

export type CategoryInput = {
  title: string;
  slug: string;
  description: string;
  position: number;
};

export function parseCategoryForm(form: FormData): Parsed<CategoryInput> {
  const errors: FieldErrors = {};
  const title = requiredText(form, "title", "Title", 80, errors);
  const categorySlug = slug(form, errors);
  const description = requiredText(
    form,
    "description",
    "Description",
    1000,
    errors,
  );
  const positionRaw = text(form, "position") || "0";
  if (!SIGNED_INT_PATTERN.test(positionRaw))
    errors.position = "Enter a whole number.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      title,
      slug: categorySlug,
      description,
      position: Number(positionRaw),
    },
  };
}

/** A positive integer id from a form field or route param. */
export function parseId(raw: unknown): number | undefined {
  if (typeof raw !== "string" || !/^\d{1,9}$/.test(raw)) return undefined;
  const id = Number(raw);
  return id > 0 ? id : undefined;
}

// Inventory

/** State of a stock form; `stock` is the latest count the server saw. */
export type StockFormState = FormState & { stock?: number };

export type StockAdjustment =
  | { id: number; mode: "adjust"; delta: number }
  | { id: number; mode: "set"; expected: number; stock: number };

/**
 * Parse an inventory form. `adjust` adds or removes a positive `amount`
 * (direction comes from the button pressed); `set` replaces the count only
 * if it still equals `expected`.
 */
export function parseStockAdjustment(form: FormData): Parsed<StockAdjustment> {
  const id = parseId(form.get("id"));
  if (!id)
    return { ok: false, errors: { form: "Reload the page and try again." } };

  const mode = form.get("mode");
  if (mode === "adjust") {
    const direction = form.get("direction");
    if (direction !== "add" && direction !== "remove") {
      return { ok: false, errors: { form: "Choose add or remove." } };
    }
    const amount = parseStock(form.get("amount"));
    if (amount === undefined || amount === 0) {
      return {
        ok: false,
        errors: {
          amount: `Enter a whole number from 1 to ${MAX_STOCK.toLocaleString("en-US")}.`,
        },
      };
    }
    return {
      ok: true,
      data: { id, mode, delta: direction === "add" ? amount : -amount },
    };
  }

  if (mode === "set") {
    const expected = parseStock(form.get("expected"));
    if (expected === undefined) {
      return { ok: false, errors: { form: "Reload the page and try again." } };
    }
    const stock = parseStock(form.get("stock"));
    if (stock === undefined) {
      return {
        ok: false,
        errors: {
          stock: `Enter a whole number from 0 to ${MAX_STOCK.toLocaleString("en-US")}.`,
        },
      };
    }
    return { ok: true, data: { id, mode, expected, stock } };
  }

  return { ok: false, errors: { form: "Reload the page and try again." } };
}
