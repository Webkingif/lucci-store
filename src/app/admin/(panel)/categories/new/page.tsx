import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPageHeader, LoadingRows } from "@/components/admin/admin-ui";
import { CategoryForm } from "@/components/admin/category-form";
import { requireAdmin } from "@/lib/admin/auth";
import { createCategoryAction } from "../actions";

export const metadata: Metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <>
      <AdminPageHeader eyebrow="Categories" title="New category" />
      <Suspense fallback={<LoadingRows label="form" />}>
        <NewCategory />
      </Suspense>
    </>
  );
}

async function NewCategory() {
  await requireAdmin();
  return <CategoryForm action={createCategoryAction} />;
}
