import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, LoadingRows } from "@/components/admin/admin-ui";
import { OrderDetail } from "@/components/admin/orders";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminOrder } from "@/lib/admin/orders";

export const metadata: Metadata = { title: "Order" };

export default function AdminOrderPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<LoadingRows label="order" />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({
  params,
}: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  await requireAdmin();
  const order = await getAdminOrder((await params).id);
  if (!order) notFound();

  return (
    <>
      <AdminPageHeader
        eyebrow="Order"
        title={
          <span className="font-mono text-lead break-all">{order.id}</span>
        }
        action={
          <Link href="/admin/orders" className="eyebrow link">
            All orders
          </Link>
        }
      />
      <OrderDetail order={order} />
    </>
  );
}
