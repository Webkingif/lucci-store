import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  AdminPageHeader,
  EmptyState,
  LoadingRows,
} from "@/components/admin/admin-ui";
import { ProductTable } from "@/components/admin/product-table";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminProducts } from "@/lib/admin/products";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Every product, including hidden ones. Stock is live."
        action={
          <Link
            href="/admin/products/new"
            className={buttonVariants({ size: "sm" })}
          >
            New product
          </Link>
        }
      />
      <Suspense fallback={<LoadingRows label="products" />}>
        <Products />
      </Suspense>
    </>
  );
}

async function Products() {
  await requireAdmin();
  const products = await listAdminProducts();

  if (products.length === 0) {
    return (
      <EmptyState title="No products yet">
        <Link href="/admin/products/new" className="link">
          Create the first product
        </Link>
      </EmptyState>
    );
  }
  return <ProductTable products={products} />;
}
