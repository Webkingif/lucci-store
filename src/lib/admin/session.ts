// Admin session cookie. Reading works anywhere on the server at request time;
// creating and deleting only work in Server Actions (cookies can't be set once
// streaming has started).

import "server-only";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  readSessionSecret,
  signAdminToken,
  verifyAdminToken,
  type AdminSession,
} from "./token";

/** The current admin session, or null. Never throws. */
export async function readAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token, readSessionSecret());
}

export async function createAdminSession() {
  const secret = readSessionSecret();
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is missing or shorter than 32 characters.",
    );
  }
  (await cookies()).set(ADMIN_COOKIE, await signAdminToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Only sent to admin pages and their Server Actions.
    path: "/admin",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export async function deleteAdminSession() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
}
