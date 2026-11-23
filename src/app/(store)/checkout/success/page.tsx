import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow, Section } from "@/components/ui/layout";
import { getOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false },
};

// Order confirmation. /checkout/complete settles the order first and redirects
// here; this page only reads the order's current status from the database.
export default function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  return (
    <Section className="container-page flex flex-col items-center gap-6 text-center">
      <Suspense fallback={<Eyebrow className="text-muted">Loading order</Eyebrow>}>
        <OrderSummary searchParams={searchParams} />
      </Suspense>
    </Section>
  );
}

async function OrderSummary({
  searchParams,
}: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const orderParam = (await searchParams).order;
  const orderId = typeof orderParam === "string" ? orderParam : undefined;
  const order = orderId ? await getOrder(orderId) : undefined;

  if (!order) {
    return (
      <>
        <Message
          eyebrow="Order"
          title="Order not found"
          body="We couldn't find this order."
        />
        <ContinueShopping />
      </>
    );
  }

  const copy = messageFor(order);
  return (
    <>
      <Message {...copy} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-left">
        <dt className="text-muted">Piece</dt>
        <dd>
          <Link
            href={`/products/${order.productSlug}`}
            className="link-reveal hover:text-ink"
          >
            {order.productName}
          </Link>
        </dd>
        <dt className="text-muted">Total</dt>
        <dd>{formatPrice(order.amountTotal, order.currency)}</dd>
        <dt className="text-muted">Reference</dt>
        <dd className="break-all">{order.id}</dd>
      </dl>
      {copy.refresh && (
        <Link
          href={`/checkout/success?order=${order.id}`}
          className={buttonVariants({ variant: "secondary" })}
        >
          Refresh status
        </Link>
      )}
      <ContinueShopping />
    </>
  );
}

function messageFor(order: Order): {
  eyebrow: string;
  title: string;
  body: string;
  refresh?: boolean;
} {
  switch (order.status) {
    case "paid":
      return {
        eyebrow: "Order confirmed",
        title: "Thank you",
        body: order.customerEmail
          ? `A receipt is on its way to ${order.customerEmail}.`
          : "Your payment was received.",
      };
    case "pending":
    case "authorized":
      return {
        eyebrow: "Processing",
        title: "Confirming your payment",
        body: "This usually takes a few seconds.",
        refresh: true,
      };
    case "canceled":
      return order.cancelReason === "out_of_stock"
        ? {
            eyebrow: "Sold out",
            title: "This piece sold out",
            body: "Someone completed their purchase moments before you. The hold on your payment has been released and you have not been charged.",
          }
        : {
            eyebrow: "Not completed",
            title: "We couldn't complete your order",
            body: "The hold on your payment has been released and you have not been charged.",
          };
    case "expired":
      return {
        eyebrow: "Expired",
        title: "Checkout expired",
        body: "You have not been charged.",
      };
    case "refunded":
      return {
        eyebrow: "Refunded",
        title: "This order was refunded",
        body: "The full amount was returned to your payment method.",
      };
  }
}

function Message({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <>
      <Eyebrow className="text-muted">{eyebrow}</Eyebrow>
      <h1 className="font-display text-headline">{title}</h1>
      <p className="max-w-prose text-muted">{body}</p>
    </>
  );
}

function ContinueShopping() {
  return (
    <Link href="/products" className="eyebrow link">
      Continue shopping
    </Link>
  );
}
