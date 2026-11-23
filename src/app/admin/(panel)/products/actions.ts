"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createProduct, updateProduct } from "@/lib/admin/products";
import {
  parseId,
  parseProductForm,
  type FormState,
} from "@/lib/admin/validation";
import { CATALOG_CACHE_TAG } from "@/lib/catalog";

const INVALID: FormState = {
  status: "error",
  message: "Check the highlighted fields.",
};

export async function createProductAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.ok) return { ...INVALID, errors: parsed.errors };

  const result = await createProduct(parsed.data);
  if (!result.ok) return { ...INVALID, errors: result.errors };

  updateTag(CATALOG_CACHE_TAG);
  redirect(`/admin/products/${result.id}?created=1`);
}

export async function updateProductAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id)
    return { status: "error", message: "This product no longer exists." };

  const parsed = parseProductForm(formData, { withStock: false });
  if (!parsed.ok) return { ...INVALID, errors: parsed.errors };

  const input = parsed.data;
  const result = await updateProduct(id, input);
  if (!result.ok) {
    return "notFound" in result
      ? { status: "error", message: "This product no longer exists." }
      : { ...INVALID, errors: result.errors };
  }

  updateTag(CATALOG_CACHE_TAG);
  return {
    status: "success",
    message: input.published
      ? "Saved. Live on the storefront."
      : "Saved. Hidden from the storefront.",
  };
}
