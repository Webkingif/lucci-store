import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  readSessionSecret,
  verifyAdminToken,
} from "@/lib/admin/token";

// Optimistic check only: sends signed-out visitors to the login page before
// rendering. The real check is requireAdmin() in every admin page, action and
// data function.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminToken(token, readSessionSecret());
  if (session) return NextResponse.next();

  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  if (token) response.cookies.delete({ name: ADMIN_COOKIE, path: "/admin" });
  return response;
}

export const config = {
  // Every admin route except the login page itself.
  matcher: ["/admin", "/admin/((?!login(?:/|$)).*)"],
};
