import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type { AdminProduct } from "@/types";
import { AdminTable, StatusTag } from "./admin-ui";
import { ProductThumb, StockTag } from "./product-bits";

/** Every product with its live stock. Stock is changed on /admin/inventory. */
export function ProductTable({ products }: { products: AdminProduct[] }) {
  return (
    <AdminTable
      label="Products"
      head={
        <>
          <th scope="col" className="w-16">
            <span className="sr-only">Image</span>
          </th>
          <th scope="col">Product</th>
          <th scope="col">Category</th>
          <th scope="col" className="text-right">
            Price
          </th>
          <th scope="col">Status</th>
          <th scope="col" className="text-right">
            Stock
          </th>
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
            <p className="text-caption text-muted">/{product.slug}</p>
          </td>
          <td className="text-muted">{product.category}</td>
          <td className="text-right tabular-nums">
            {formatPrice(product.price, product.currency)}
          </td>
          <td>
            <div className="flex flex-wrap gap-2">
              {product.published ? (
                <StatusTag>Published</StatusTag>
              ) : (
                <StatusTag tone="muted">Hidden</StatusTag>
              )}
              <StockTag stock={product.stock} />
            </div>
          </td>
          <td className="text-right">
            <span className="tabular-nums">{product.stock}</span>
            <Link
              href="/admin/inventory"
              className="ml-3 eyebrow text-muted link-reveal hover:text-ink"
            >
              Adjust
            </Link>
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}
