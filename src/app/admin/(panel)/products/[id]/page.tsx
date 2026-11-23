import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminPageHeader,
  LoadingRows,
  StatusTag,
} from "@/components/admin/admin-ui";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/admin/categories";
import { getAdminProduct } from "@/lib/admin/products";
import { parseId } from "@/lib/admin/validation";
import { updateProductAction } from "../actions";

export const metadata: Metadata = { title: "Edit product" };

export default function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<LoadingRows label="product" />}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProduct({
  params,
  searchParams,
}: Pick<PageProps<"/admin/products/[id]">, "params" | "searchParams">) {
  await requireAdmin();
  const id = parseId((await params).id);
  if (!id) notFound();

  const [product, categories, query] = await Promise.all([
    getAdminProduct(id),
    listAdminCategories(),
    searchParams,
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        eyebrow="Products"
        title={product.name}
        description={query.created ? "Product created." : undefined}
        action={
          product.published ? (
            <Link
              href={`/products/${product.slug}`}
              className="eyebrow link"
              target="_blank"
            >
              View on store
            </Link>
          ) : (
            <StatusTag tone="muted">Hidden</StatusTag>
          )
        }
      />
      <ProductForm
        action={updateProductAction}
        categories={categories}
        product={product}
      />
    </>
  );
}
