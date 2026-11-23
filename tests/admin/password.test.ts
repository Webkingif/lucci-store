import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "../../src/lib/admin/password";

describe("admin password", () => {
  it("accepts the right password and rejects others", async () => {
    const stored = await hashPassword("correct horse battery");
    assert.equal(await verifyPassword("correct horse battery", stored), true);
    assert.equal(await verifyPassword("correct horse batter", stored), false);
    assert.equal(await verifyPassword("", stored), false);
  });

  it("salts each hash", async () => {
    assert.notEqual(await hashPassword("same"), await hashPassword("same"));
  });

  it("rejects when no usable hash is configured", async () => {
    for (const stored of [
      undefined,
      "",
      "plain",
      "scrypt:abc",
      "scrypt:00:11",
      "bcrypt:a:b",
    ]) {
      assert.equal(await verifyPassword("anything", stored), false);
    }
  });
});
