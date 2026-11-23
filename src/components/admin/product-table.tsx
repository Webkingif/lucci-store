import Image from "next/image";
import Link from "next/link";
import { getStockState } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/utils";
import type { AdminProduct } from "@/types";
import { AdminTable, StatusTag } from "./admin-ui";
import { StockForm } from "./stock-form";

/** Every product with live stock and an inline stock editor per row. */
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
          <th scope="col">Stock</th>
        </>
      }
    >
      {products.map((product) => {
        const image = product.images[0];
        const stock = getStockState(product);
        return (
          <tr key={product.id}>
            <td>
              <div className="relative h-16 w-12 overflow-hidden bg-surface">
                {image && (
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes="48px"
                    className={cn(
                      image.fit === "contain"
                        ? "object-contain p-1 mix-blend-multiply"
                        : "object-cover",
                    )}
                  />
                )}
              </div>
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
                {stock.status === "sold-out" && (
                  <StatusTag tone="solid">Sold out</StatusTag>
                )}
                {stock.status === "low-stock" && (
                  <StatusTag tone="muted">Low</StatusTag>
                )}
              </div>
            </td>
            <td>
              <StockForm
                productId={product.id}
                productName={product.name}
                stock={product.stock}
              />
            </td>
          </tr>
        );
      })}
    </AdminTable>
  );
}
