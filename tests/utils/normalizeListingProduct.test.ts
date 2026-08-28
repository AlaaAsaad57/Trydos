import { describe, expect, it } from "vitest";
import { normalizeListingProduct } from "utils/listing/normalizeListingProduct";

describe("normalizeListingProduct utility", () => {
  it("normalizes a basic product with standard images when sync_color_images is absent", () => {
    const rawProduct = {
      product_id: 101,
      name: "Sample Shirt",
      slug: "sample-shirt",
      images: ["image1.jpg", "image2.jpg"],
      price: 100,
      offer_price: 80,
      brand: { id: 5, icon: "brand.png", is_verified: true },
      categories: [{ id: 1, name: "Fashion" }],
    };

    const normalized = normalizeListingProduct(rawProduct);

    expect(normalized.product_id, "should preserve product_id").toBe(101);
    expect(normalized.name, "should preserve product name").toBe("Sample Shirt");
    expect(normalized.images, "should include standard images when no sync_color_images").toEqual(["image1.jpg", "image2.jpg"]);
    expect(normalized.brand, "should correctly format brand details").toEqual({
      id: 5,
      icon: "brand.png",
      is_verified: true,
    });
    expect(normalized.categories, "should map categories to name and id").toEqual([
      { id: 1, name: "Fashion" },
    ]);
  });

  it("omits standard images property when sync_color_images exists and is non-empty", () => {
    const rawProduct = {
      product_id: 102,
      name: "Sync Shirt",
      images: ["fallback.jpg"],
      sync_color_images: ["red_shirt.jpg", "blue_shirt.jpg"],
      price: 150,
    };

    const normalized = normalizeListingProduct(rawProduct);

    expect(normalized.sync_color_images, "should preserve sync_color_images").toEqual([
      "red_shirt.jpg",
      "blue_shirt.jpg",
    ]);
    expect(normalized.images, "should omit images property when sync_color_images is present").toBeUndefined();
  });

  it("handles is_luck products checking against redeemedIds", () => {
    const rawProduct = {
      product_id: 201,
      name: "Luck Product",
      is_luck: true,
      luck_price: 10,
    };

    const unredeemed = normalizeListingProduct(rawProduct, []);
    expect(unredeemed.is_luck, "should mark is_luck true when product_id is not in redeemedIds").toBe(true);

    const redeemed = normalizeListingProduct(rawProduct, [{ id: 201 }]);
    expect(redeemed.is_luck, "should mark is_luck false when product_id is in redeemedIds").toBe(false);
  });

  it("handles empty or null inputs gracefully without crashing", () => {
    const normalized = normalizeListingProduct(null);
    expect(normalized.product_id, "should return undefined product_id for null input").toBeUndefined();
    expect(normalized.categories, "should handle null categories safely").toBeUndefined();
  });
});
