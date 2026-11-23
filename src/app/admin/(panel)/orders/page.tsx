import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  AdminPageHeader,
  EmptyState,
  LoadingRows,
} from "@/components/admin/admin-ui";
import { OrderStatusFilter, OrderTable } from "@/components/admin/orders";
import { requireAdmin } from "@/lib/admin/auth";
import {
  listAdminOrders,
  ORDER_STATUSES,
  ORDERS_PAGE_SIZE,
  parseOrderStatus,
} from "@/lib/admin/orders";
import type { OrderStatus } from "@/types";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  return (
    <>
      <AdminPageHeader
        eyebrow="Sales"
        title="Orders"
        description="Read only. Status is set by checkout and Stripe; refunds happen in the Stripe Dashboard."
      />
      <Suspense fallback={<LoadingRows label="orders" />}>
        <Orders searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(status: OrderStatus | undefined, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

async function Orders({
  searchParams,
}: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin();
  const query = await searchParams;
  const status = parseOrderStatus(first(query.status));
  const pageParam = Number(first(query.page));
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

  const { orders, total } = await listAdminOrders({ status, page });
  const pages = Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE));

  return (
    <>
      <OrderStatusFilter statuses={ORDER_STATUSES} current={status} />
      {orders.length === 0 ? (
        <EmptyState
          title={status ? "No orders with this status" : "No orders yet"}
        />
      ) : (
        <>
          <OrderTable orders={orders} />
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between pt-6 eyebrow text-muted"
          >
            <span>
              {total} {total === 1 ? "order" : "orders"} · page{" "}
              {Math.min(page, pages)} of {pages}
            </span>
            <span className="flex gap-6">
              {page > 1 && (
                <Link
                  href={pageHref(status, page - 1)}
                  className="text-ink link-reveal"
                >
                  Previous
                </Link>
              )}
              {page < pages && (
                <Link
                  href={pageHref(status, page + 1)}
                  className="text-ink link-reveal"
                >
                  Next
                </Link>
              )}
            </span>
          </nav>
        </>
      )}
    </>
  );
}
