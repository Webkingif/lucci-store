import type { Metadata } from "next";
import { Suspense } from "react";
import {
  AdminPageHeader,
  EmptyState,
  LoadingRows,
} from "@/components/admin/admin-ui";
import {
  InventoryFilter,
  InventoryTable,
  inventoryFilters,
} from "@/components/admin/inventory-table";
import { requireAdmin } from "@/lib/admin/auth";
import {
  listInventory,
  type InventoryFilter as Filter,
} from "@/lib/admin/products";

export const metadata: Metadata = { title: "Inventory" };

export default function AdminInventoryPage({
  searchParams,
}: PageProps<"/admin/inventory">) {
  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Inventory"
        description="Live stock, lowest first. Add or remove units at any time; “Set” only saves if no sale changed the count meanwhile. Setting stock to 0 during a checkout cancels that order without charging the customer."
      />
      <Suspense fallback={<LoadingRows label="inventory" />}>
        <Inventory searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function parseFilter(value: string | string[] | undefined): Filter {
  const raw = Array.isArray(value) ? value[0] : value;
  return (
    inventoryFilters.find((filter) => filter.value === raw)?.value ?? "all"
  );
}

async function Inventory({
  searchParams,
}: Pick<PageProps<"/admin/inventory">, "searchParams">) {
  await requireAdmin();
  const filter = parseFilter((await searchParams).stock);
  const products = await listInventory(filter);

  return (
    <>
      <InventoryFilter current={filter} />
      {products.length === 0 ? (
        <EmptyState
          title={
            filter === "out"
              ? "Nothing is sold out"
              : filter === "low"
                ? "Nothing is running low"
                : "No products yet"
          }
        />
      ) : (
        <InventoryTable products={products} />
      )}
    </>
  );
}
