"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { adjustStock, setStock } from "@/lib/admin/inventory";
import {
  parseStockAdjustment,
  type StockFormState,
} from "@/lib/admin/validation";
import { CATALOG_CACHE_TAG } from "@/lib/catalog";

const GONE: StockFormState = {
  status: "error",
  message: "This product no longer exists.",
};

function invalid(errors: Record<string, string>): StockFormState {
  return {
    status: "error",
    message: errors.form ?? Object.values(errors)[0],
    errors,
  };
}

const units = (n: number) => `${n} ${n === 1 ? "unit" : "units"}`;

/** Add or remove units. Relative, so it never conflicts with a sale. */
export async function adjustStockAction(
  _state: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  await requireAdmin();
  const parsed = parseStockAdjustment(formData);
  if (!parsed.ok) return invalid(parsed.errors);
  if (parsed.data.mode !== "adjust")
    return invalid({ form: "Reload the page and try again." });

  const { id, delta } = parsed.data;
  const result = await adjustStock(id, delta);
  switch (result.status) {
    case "not-found":
      return GONE;
    case "insufficient":
      return {
        status: "error",
        stock: result.stock,
        message: `Can't remove ${units(-delta)}: only ${result.stock} in stock.`,
        errors: { amount: "Too many to remove." },
      };
    case "limit":
      return {
        status: "error",
        stock: result.stock,
        message: "That would exceed the 1,000,000 unit limit.",
        errors: { amount: "Too many to add." },
      };
    case "updated":
      updateTag(CATALOG_CACHE_TAG);
      return {
        status: "success",
        stock: result.stock,
        message: `${delta > 0 ? "Added" : "Removed"} ${units(Math.abs(delta))}. Now ${result.stock}.`,
      };
  }
}

/** Set an absolute count; refuses if stock changed since the admin saw it. */
export async function setStockAction(
  _state: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  await requireAdmin();
  const parsed = parseStockAdjustment(formData);
  if (!parsed.ok) return invalid(parsed.errors);
  if (parsed.data.mode !== "set")
    return invalid({ form: "Reload the page and try again." });

  const { id, expected, stock } = parsed.data;
  if (stock === expected) return { status: "idle", stock };

  const result = await setStock(id, expected, stock);
  switch (result.status) {
    case "not-found":
      return GONE;
    case "conflict":
      return {
        status: "error",
        stock: result.stock,
        message: `Stock changed to ${result.stock} meanwhile, probably a sale. Check it and save again.`,
      };
    case "updated":
      updateTag(CATALOG_CACHE_TAG);
      return {
        status: "success",
        stock: result.stock,
        message: `Set to ${result.stock}.`,
      };
  }
}
