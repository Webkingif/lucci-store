import { redirect } from "next/navigation";

/** The admin area opens on the product list (which checks the session). */
export default function AdminIndexPage() {
  redirect("/admin/products");
}
