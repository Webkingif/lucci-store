import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  AdminPageHeader,
  AdminTable,
  EmptyState,
  LoadingRows,
} from "@/components/admin/admin-ui";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/admin/categories";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="Shown in the storefront filter bar and as collection pages, in position order."
        action={
          <Link
            href="/admin/categories/new"
            className={buttonVariants({ size: "sm" })}
          >
            New category
          </Link>
        }
      />
      <Suspense fallback={<LoadingRows label="categories" />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  await requireAdmin();
  const categories = await listAdminCategories();

  if (categories.length === 0) {
    return (
      <EmptyState title="No categories yet">
        <Link href="/admin/categories/new" className="link">
          Create the first category
        </Link>
      </EmptyState>
    );
  }

  return (
    <AdminTable
      label="Categories"
      head={
        <>
          <th scope="col" className="w-24">
            Position
          </th>
          <th scope="col">Category</th>
          <th scope="col">Description</th>
          <th scope="col" className="text-right">
            Products
          </th>
        </>
      }
    >
      {categories.map((category) => (
        <tr key={category.id}>
          <td className="text-muted tabular-nums">{category.position}</td>
          <td>
            <Link
              href={`/admin/categories/${category.id}`}
              className="font-medium link-reveal"
            >
              {category.title}
            </Link>
            <p className="text-caption text-muted">/{category.slug}</p>
          </td>
          <td className="max-w-md text-muted">
            <p className="line-clamp-2">{category.description}</p>
          </td>
          <td className="text-right tabular-nums">{category.productCount}</td>
        </tr>
      ))}
    </AdminTable>
  );
}
