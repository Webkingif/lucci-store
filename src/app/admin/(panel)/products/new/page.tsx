import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  AdminPageHeader,
  EmptyState,
  LoadingRows,
} from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/admin/categories";
import { createProductAction } from "../actions";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <>
      <AdminPageHeader eyebrow="Products" title="New product" />
      <Suspense fallback={<LoadingRows label="form" />}>
        <NewProduct />
      </Suspense>
    </>
  );
}

async function NewProduct() {
  await requireAdmin();
  const categories = await listAdminCategories();

  if (categories.length === 0) {
    return (
      <EmptyState title="Create a category first">
        Every product belongs to a category.{" "}
        <Link href="/admin/categories/new" className="link">
          New category
        </Link>
      </EmptyState>
    );
  }
  return <ProductForm action={createProductAction} categories={categories} />;
}
