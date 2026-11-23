import Link from "next/link";
import { LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import type { AdminProduct } from "@/types";
import { AdminTable, StatusTag } from "./admin-ui";
import { ProductThumb, StockTag } from "./product-bits";
import { StockControls } from "./stock-controls";

export const inventoryFilters = [
  { value: "all", label: "All" },
  { value: "low", label: `Low (${LOW_STOCK_THRESHOLD} or fewer)` },
  { value: "out", label: "Sold out" },
] as const;

/** Filter links, so a filtered view is a shareable URL. */
export function InventoryFilter({ current }: { current: string }) {
  return (
    <nav
      aria-label="Filter by stock"
      className="flex flex-wrap gap-x-6 gap-y-2 pb-6"
    >
      {inventoryFilters.map((filter) => {
        const active = filter.value === current;
        return (
          <Link
            key={filter.value}
            href={
              filter.value === "all"
                ? "/admin/inventory"
                : `/admin/inventory?stock=${filter.value}`
            }
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "eyebrow text-ink underline underline-offset-4"
                : "eyebrow text-muted link-reveal hover:text-ink"
            }
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function InventoryTable({ products }: { products: AdminProduct[] }) {
  return (
    <AdminTable
      label="Inventory"
      head={
        <>
          <th scope="col" className="w-16">
            <span className="sr-only">Image</span>
          </th>
          <th scope="col">Product</th>
          <th scope="col">Status</th>
          <th scope="col">Stock</th>
        </>
      }
    >
      {products.map((product) => (
        <tr key={product.id}>
          <td>
            <ProductThumb product={product} />
          </td>
          <td>
            <Link
              href={`/admin/products/${product.id}`}
              className="font-medium link-reveal"
            >
              {product.name}
            </Link>
            <p className="text-caption text-muted">{product.category}</p>
          </td>
          <td>
            <div className="flex flex-wrap gap-2">
              <StockTag stock={product.stock} />
              {!product.published && <StatusTag tone="muted">Hidden</StatusTag>}
            </div>
          </td>
          <td>
            <StockControls
              productId={product.id}
              productName={product.name}
              stock={product.stock}
            />
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
