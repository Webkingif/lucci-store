"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/admin/password";
import { createAdminSession } from "@/lib/admin/session";
import type { FormState } from "@/lib/admin/validation";

const FAILED_ATTEMPT_DELAY_MS = 750;

/**
 * Sign in with the shared admin password. The only admin action that runs
 * without a session, so it does nothing but check the password.
 */
export async function signIn(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = formData.get("password");
  const valid =
    typeof password === "string" &&
    password.length > 0 &&
    password.length <= 256 &&
    (await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH));

  if (!valid) {
    // Slow down guessing. Rate limiting is deferred (see docs/scope).
    await new Promise((resolve) =>
      setTimeout(resolve, FAILED_ATTEMPT_DELAY_MS),
    );
    return { status: "error", message: "That password isn't right." };
  }

  await createAdminSession();
  redirect("/admin/products");
}
