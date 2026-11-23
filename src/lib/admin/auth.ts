// The admin gate. Every admin page, Server Action and admin data function
// calls requireAdmin() before doing anything else; proxy.ts is only an
// optimistic early redirect and is never relied on alone.

import "server-only";
import { redirect } from "next/navigation";
import { readAdminSession } from "./session";

export const ADMIN_LOGIN_PATH = "/admin/login";

/** Continue only with a valid admin session; otherwise go to the login page. */
export async function requireAdmin() {
  const session = await readAdminSession();
  if (!session) redirect(ADMIN_LOGIN_PATH);
  return session;
}
