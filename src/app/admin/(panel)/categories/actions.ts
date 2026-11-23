"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/admin/categories";
import {
  parseCategoryForm,
  parseId,
  type FormState,
} from "@/lib/admin/validation";
import { CATALOG_CACHE_TAG } from "@/lib/catalog";

const INVALID: FormState = {
  status: "error",
  message: "Check the highlighted fields.",
};

export async function createCategoryAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return { ...INVALID, errors: parsed.errors };

  const result = await createCategory(parsed.data);
  if (!result.ok) return { ...INVALID, errors: result.errors };

  updateTag(CATALOG_CACHE_TAG);
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id)
    return { status: "error", message: "This category no longer exists." };

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return { ...INVALID, errors: parsed.errors };

  const result = await updateCategory(id, parsed.data);
  if (!result.ok) {
    return "notFound" in result
      ? { status: "error", message: "This category no longer exists." }
      : { ...INVALID, errors: result.errors };
  }

  updateTag(CATALOG_CACHE_TAG);
  return { status: "success", message: "Saved" };
}

export async function deleteCategoryAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id)
    return { status: "error", message: "This category no longer exists." };

  const result = await deleteCategory(id);
  if (result.status === "has-products") {
    return {
      status: "error",
      message: "Move or reassign this category's products before deleting it.",
    };
  }

  updateTag(CATALOG_CACHE_TAG);
  redirect("/admin/categories");
}
