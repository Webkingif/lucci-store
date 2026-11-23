"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { deleteAdminSession } from "@/lib/admin/session";

export async function signOut() {
  await requireAdmin();
  await deleteAdminSession();
  redirect("/admin/login");
}
