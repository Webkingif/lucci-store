import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminPageHeader, LoadingRows } from "@/components/admin/admin-ui";
import {
  CategoryForm,
  DeleteCategoryForm,
} from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminCategory } from "@/lib/admin/categories";
import { parseId } from "@/lib/admin/validation";
import { deleteCategoryAction, updateCategoryAction } from "../actions";

export const metadata: Metadata = { title: "Edit category" };

export default function EditCategoryPage({
  params,
}: PageProps<"/admin/categories/[id]">) {
  return (
    <Suspense fallback={<LoadingRows label="category" />}>
      <EditCategory params={params} />
    </Suspense>
  );
}

async function EditCategory({
  params,
}: Pick<PageProps<"/admin/categories/[id]">, "params">) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();
  const category = await getAdminCategory(id);
  if (!category) notFound();

  return (
    <>
      <AdminPageHeader
        eyebrow="Categories"
        title={category.title}
        description={`${category.productCount} ${category.productCount === 1 ? "product" : "products"}`}
      />
      <div className="flex flex-col gap-12">
        <CategoryForm action={updateCategoryAction} category={category} />
        <DeleteCategoryForm action={deleteCategoryAction} category={category} />
      </div>
    </>
  );
}
