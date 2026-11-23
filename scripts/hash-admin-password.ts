// Print an ADMIN_PASSWORD_HASH value for .env:
//   npx tsx scripts/hash-admin-password.ts "your password"
// Also prints a fresh ADMIN_SESSION_SECRET when none is set.

import { randomBytes } from "node:crypto";
import { hashPassword } from "../src/lib/admin/password";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error(
    "Pass a password of at least 12 characters as the first argument.",
  );
  process.exit(1);
}

console.log(`ADMIN_PASSWORD_HASH=${await hashPassword(password)}`);
if (!process.env.ADMIN_SESSION_SECRET) {
  console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
}
