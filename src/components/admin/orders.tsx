import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import type {
  AdminOrder,
  AdminOrderDetail,
  OrderCancelReason,
  OrderStatus,
} from "@/types";
import { AdminTable, formatDateTime, StatusTag } from "./admin-ui";

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  authorized: "Authorized",
  paid: "Paid",
  canceled: "Canceled",
  expired: "Expired",
  refunded: "Refunded",
};

const cancelReasonLabels: Record<OrderCancelReason, string> = {
  out_of_stock: "Sold out before payment was captured",
  amount_mismatch: "Amount didn't match the order",
  capture_failed: "Payment capture failed",
  authorization_canceled: "Authorization canceled in Stripe",
};

export function OrderStatusTag({ status }: { status: OrderStatus }) {
  const tone =
    status === "paid"
      ? "solid"
      : status === "pending" || status === "authorized"
        ? "default"
        : "muted";
  return <StatusTag tone={tone}>{statusLabels[status]}</StatusTag>;
}

/** Status filter as links, so the filtered list is a shareable URL. */
export function OrderStatusFilter({
  statuses,
  current,
}: {
  statuses: readonly OrderStatus[];
  current?: OrderStatus;
}) {
  const options = [
    { label: "All", href: "/admin/orders", active: !current },
    ...statuses.map((status) => ({
      label: statusLabels[status],
      href: `/admin/orders?status=${status}`,
      active: current === status,
    })),
  ];
  return (
    <nav
      aria-label="Filter by status"
      className="flex flex-wrap gap-x-6 gap-y-2 pb-6"
    >
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? "page" : undefined}
          className={
            option.active
              ? "eyebrow text-ink underline underline-offset-4"
              : "eyebrow text-muted link-reveal hover:text-ink"
          }
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

export function OrderTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <AdminTable
      label="Orders"
      head={
        <>
          <th scope="col">Placed</th>
          <th scope="col">Order</th>
          <th scope="col">Product</th>
          <th scope="col">Customer</th>
          <th scope="col">Status</th>
          <th scope="col" className="text-right">
            Total
          </th>
        </>
      }
    >
      {orders.map((order) => (
        <tr key={order.id}>
          <td className="whitespace-nowrap text-muted tabular-nums">
            {formatDateTime(order.createdAt)}
          </td>
          <td>
            <Link
              href={`/admin/orders/${order.id}`}
              className="font-mono text-caption link-reveal"
            >
              {order.id.slice(0, 8)}
            </Link>
          </td>
          <td>
            {order.productName}
            {order.quantity > 1 && (
              <span className="text-muted"> × {order.quantity}</span>
            )}
          </td>
          <td className="text-muted">{order.customerEmail ?? "—"}</td>
          <td>
            <OrderStatusTag status={order.status} />
          </td>
          <td className="text-right tabular-nums">
            {formatPrice(order.amountTotal, order.currency)}
          </td>
        </tr>
      ))}
    </AdminTable>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="break-words">{children}</dd>
    </>
  );
}

export function OrderDetail({ order }: { order: AdminOrderDetail }) {
  const address = order.shippingAddress;
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section aria-labelledby="order-summary" className="flex flex-col gap-4">
        <h2 id="order-summary" className="eyebrow text-muted">
          Summary
        </h2>
        <dl className="grid grid-cols-[10rem_1fr] gap-x-6 gap-y-3 border-t pt-4">
          <Row label="Status">
            <OrderStatusTag status={order.status} />
          </Row>
          {order.cancelReason && (
            <Row label="Cancel reason">
              {cancelReasonLabels[order.cancelReason]}
            </Row>
          )}
          <Row label="Product">
            <Link href={`/admin/products/${order.productId}`} className="link">
              {order.productName}
            </Link>
          </Row>
          <Row label="Quantity">{order.quantity}</Row>
          <Row label="Unit price">
            {formatPrice(order.unitPrice, order.currency)}
          </Row>
          <Row label="Total">
            {formatPrice(order.amountTotal, order.currency)}
          </Row>
          <Row label="Placed">{formatDateTime(order.createdAt)}</Row>
          <Row label="Paid">
            {order.paidAt ? formatDateTime(order.paidAt) : "—"}
          </Row>
          <Row label="Last updated">{formatDateTime(order.updatedAt)}</Row>
        </dl>
      </section>

      <section aria-labelledby="order-customer" className="flex flex-col gap-4">
        <h2 id="order-customer" className="eyebrow text-muted">
          Customer
        </h2>
        <dl className="grid grid-cols-[10rem_1fr] gap-x-6 gap-y-3 border-t pt-4">
          <Row label="Email">{order.customerEmail ?? "—"}</Row>
          <Row label="Ship to">
            {address ? (
              <address className="not-italic">
                {[
                  address.name,
                  address.line1,
                  address.line2,
                  [address.postalCode, address.city].filter(Boolean).join(" "),
                  address.state,
                  address.country,
                ]
                  .filter(Boolean)
                  .map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
              </address>
            ) : (
              "—"
            )}
          </Row>
        </dl>

        <h2 className="mt-6 eyebrow text-muted">Stripe</h2>
        <dl className="grid grid-cols-[10rem_1fr] gap-x-6 gap-y-3 border-t pt-4 font-mono text-caption">
          <Row label="Checkout Session">
            {order.stripeCheckoutSessionId ?? "—"}
          </Row>
          <Row label="PaymentIntent">{order.stripePaymentIntentId ?? "—"}</Row>
        </dl>
        <p className="text-caption text-muted">
          Orders are read only here. Refunds are made in the Stripe Dashboard.
        </p>
      </section>
    </div>
  );
}
