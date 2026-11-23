import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseStockAdjustment } from "../../src/lib/admin/validation";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return data;
}

describe("parseStockAdjustment: adjust", () => {
  it("turns add and remove into a signed delta", () => {
    const add = parseStockAdjustment(
      form({ id: "4", mode: "adjust", direction: "add", amount: "5" }),
    );
    assert.deepEqual(add, {
      ok: true,
      data: { id: 4, mode: "adjust", delta: 5 },
    });

    const remove = parseStockAdjustment(
      form({ id: "4", mode: "adjust", direction: "remove", amount: " 3 " }),
    );
    assert.deepEqual(remove, {
      ok: true,
      data: { id: 4, mode: "adjust", delta: -3 },
    });
  });

  it("rejects zero, signs, decimals, blanks and amounts over the limit", () => {
    for (const amount of [
      "0",
      "-5",
      "--5",
      "+5",
      "1.5",
      "",
      "abc",
      "1000001",
    ]) {
      const result = parseStockAdjustment(
        form({ id: "4", mode: "adjust", direction: "add", amount }),
      );
      assert.equal(result.ok, false, amount);
      if (!result.ok) assert.ok(result.errors.amount, amount);
    }
  });

  it("accepts the limit itself", () => {
    const result = parseStockAdjustment(
      form({ id: "4", mode: "adjust", direction: "add", amount: "1000000" }),
    );
    assert.ok(result.ok);
  });

  it("requires a direction", () => {
    for (const direction of ["", "up", "ADD"]) {
      const result = parseStockAdjustment(
        form({ id: "4", mode: "adjust", direction, amount: "1" }),
      );
      assert.equal(result.ok, false, direction);
    }
  });
});

describe("parseStockAdjustment: set", () => {
  it("parses a count and the expected count", () => {
    const result = parseStockAdjustment(
      form({ id: "9", mode: "set", expected: "3", stock: "0" }),
    );
    assert.deepEqual(result, {
      ok: true,
      data: { id: 9, mode: "set", expected: 3, stock: 0 },
    });
  });

  it("rejects bad counts with a field error", () => {
    for (const stock of ["-1", "2.5", "", "1000001", "ten"]) {
      const result = parseStockAdjustment(
        form({ id: "9", mode: "set", expected: "3", stock }),
      );
      assert.equal(result.ok, false, stock);
      if (!result.ok) assert.ok(result.errors.stock, stock);
    }
  });

  it("rejects a missing or bad expected count", () => {
    for (const expected of ["", "-1", "x"]) {
      const result = parseStockAdjustment(
        form({ id: "9", mode: "set", expected, stock: "1" }),
      );
      assert.equal(result.ok, false, expected);
    }
  });
});

describe("parseStockAdjustment: form", () => {
  it("rejects a bad id or mode", () => {
    const cases: Record<string, string>[] = [
      { id: "0", mode: "set", expected: "1", stock: "1" },
      { id: "abc", mode: "set", expected: "1", stock: "1" },
      { id: "1", mode: "delete", expected: "1", stock: "1" },
      { id: "1", expected: "1", stock: "1" },
    ];
    for (const fields of cases) {
      assert.equal(parseStockAdjustment(form(fields)).ok, false);
    }
  });
});
