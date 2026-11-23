import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  centsToPriceInput,
  parseCategoryForm,
  parseId,
  parsePriceToCents,
  parseProductForm,
  parseStock,
} from "../../src/lib/admin/validation";

function form(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value])
      data.append(name, item);
  }
  return data;
}

function without<T extends object>(value: T, key: keyof T) {
  return Object.fromEntries(
    Object.entries(value).filter(([name]) => name !== key),
  ) as Record<string, string | string[]>;
}

const validProduct = {
  name: "Silk scarf",
  slug: "silk-scarf",
  description: "Printed silk twill.",
  categoryId: "2",
  price: "480",
  currency: "usd",
  stock: "5",
  badge: "",
  position: "3",
  published: "on",
  imageSrc: ["https://images.unsplash.com/photo-1", ""],
  imageAlt: ["Folded scarf", ""],
  imageFit: ["contain", "cover"],
};

describe("parseProductForm", () => {
  it("parses a valid product", () => {
    const result = parseProductForm(form(validProduct));
    assert.ok(result.ok);
    assert.deepEqual(result.data, {
      name: "Silk scarf",
      slug: "silk-scarf",
      description: "Printed silk twill.",
      categoryId: 2,
      priceCents: 48000,
      currency: "USD",
      stock: 5,
      badge: null,
      position: 3,
      published: true,
      images: [
        {
          src: "https://images.unsplash.com/photo-1",
          alt: "Folded scarf",
          fit: "contain",
        },
      ],
    });
  });

  it("rejects bad values with field errors", () => {
    const result = parseProductForm(
      form({
        ...validProduct,
        name: "",
        slug: "Silk Scarf!",
        categoryId: "x",
        price: "-1",
        currency: "US",
        stock: "1.5",
        position: "first",
      }),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(Object.keys(result.errors).sort(), [
      "categoryId",
      "currency",
      "name",
      "position",
      "price",
      "slug",
      "stock",
    ]);
  });

  it("rejects negative stock and non-https or alt-less images", () => {
    const result = parseProductForm(
      form({
        ...validProduct,
        stock: "-3",
        imageSrc: [
          "http://example.com/a.jpg",
          "https://example.com/b.jpg",
          "javascript:alert(1)",
        ],
        imageAlt: ["A", "", "C"],
        imageFit: ["cover", "cover", "cover"],
      }),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.stock);
    assert.ok(result.errors["images.0"]);
    assert.ok(result.errors["images.1"]);
    assert.ok(result.errors["images.2"]);
  });

  it("requires an image to publish, but not for a hidden draft", () => {
    const noImages = {
      ...validProduct,
      imageSrc: [""],
      imageAlt: [""],
      imageFit: ["cover"],
    };
    const published = parseProductForm(form(noImages));
    assert.equal(published.ok, false);

    assert.ok(parseProductForm(form(without(noImages, "published"))).ok);
  });

  it("ignores stock when editing", () => {
    const result = parseProductForm(form(without(validProduct, "stock")), {
      withStock: false,
    });
    assert.ok(result.ok);
  });
});

describe("parseCategoryForm", () => {
  it("parses a valid category and rejects a bad slug", () => {
    const valid = {
      title: "Bags",
      slug: "bags",
      description: "Leather goods.",
      position: "1",
    };
    assert.ok(parseCategoryForm(form(valid)).ok);
    assert.equal(
      parseCategoryForm(form({ ...valid, slug: "-bags-" })).ok,
      false,
    );
  });
});

describe("number parsing", () => {
  it("parses prices to cents and back", () => {
    assert.equal(parsePriceToCents("2480"), 248000);
    assert.equal(parsePriceToCents("2480.5"), 248050);
    assert.equal(parsePriceToCents("0.05"), 5);
    for (const bad of ["", "-1", "1.234", "1e3", "abc", "1,000"]) {
      assert.equal(parsePriceToCents(bad), undefined, bad);
    }
    assert.equal(centsToPriceInput(248000), "2480");
    assert.equal(centsToPriceInput(248005), "2480.05");
  });

  it("parses stock and ids strictly", () => {
    assert.equal(parseStock("0"), 0);
    assert.equal(parseStock("12"), 12);
    for (const bad of ["-1", "1.5", "", "abc", "99999999", null]) {
      assert.equal(parseStock(bad), undefined, String(bad));
    }
    assert.equal(parseId("7"), 7);
    for (const bad of ["0", "-1", "1.0", "abc", null]) {
      assert.equal(parseId(bad), undefined, String(bad));
    }
  });
});
