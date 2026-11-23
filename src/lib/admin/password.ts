// Shared admin password hashing. The hash lives in ADMIN_PASSWORD_HASH as
// `scrypt:<salt hex>:<hash hex>`; generate one with
// `npx tsx scripts/hash-admin-password.ts`.

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

/** Check a password against a stored hash in constant time. */
export async function verifyPassword(
  password: string,
  stored: string | undefined,
): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored?.split(":") ?? [];
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await derive(password, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(actual, expected);
}
