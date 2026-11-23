import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_SESSION_TTL_SECONDS,
  signAdminToken,
  verifyAdminToken,
} from "../../src/lib/admin/token";

const SECRET = "test-secret-that-is-at-least-32-characters-long";
const NOW = Date.UTC(2026, 10, 23, 12);

function base64url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("admin session token", () => {
  it("verifies a freshly signed token", async () => {
    const token = await signAdminToken(SECRET, NOW);
    const session = await verifyAdminToken(token, SECRET, NOW);
    assert.equal(session?.role, "admin");
    assert.equal(
      session?.exp,
      Math.floor(NOW / 1000) + ADMIN_SESSION_TTL_SECONDS,
    );
  });

  it("rejects an expired token", async () => {
    const token = await signAdminToken(SECRET, NOW);
    const later = NOW + ADMIN_SESSION_TTL_SECONDS * 1000;
    assert.equal(await verifyAdminToken(token, SECRET, later), null);
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signAdminToken(
      "another-secret-also-32-characters-long!!",
      NOW,
    );
    assert.equal(await verifyAdminToken(token, SECRET, NOW), null);
  });

  it("rejects a tampered payload", async () => {
    const [header, , signature] = (await signAdminToken(SECRET, NOW)).split(
      ".",
    );
    const forged = base64url({ role: "admin", iat: 0, exp: 9_999_999_999 });
    assert.equal(
      await verifyAdminToken(`${header}.${forged}.${signature}`, SECRET, NOW),
      null,
    );
  });

  it("rejects a token with another role, even when correctly signed", async () => {
    // Re-sign a non-admin payload with the real secret.
    const header = base64url({ alg: "HS256", typ: "JWT" });
    const payload = base64url({ role: "viewer", iat: 0, exp: 9_999_999_999 });
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = Buffer.from(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(`${header}.${payload}`),
      ),
    ).toString("base64url");
    assert.equal(
      await verifyAdminToken(`${header}.${payload}.${signature}`, SECRET, NOW),
      null,
    );
  });

  it("rejects alg none, garbage and missing input", async () => {
    const none = `${base64url({ alg: "none", typ: "JWT" })}.${base64url({ role: "admin", iat: 0, exp: 9_999_999_999 })}.`;
    for (const token of [none, "garbage", "a.b.c", "", undefined]) {
      assert.equal(await verifyAdminToken(token, SECRET, NOW), null);
    }
    const valid = await signAdminToken(SECRET, NOW);
    assert.equal(await verifyAdminToken(valid, undefined, NOW), null);
  });
});
