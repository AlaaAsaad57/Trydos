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

  // The redeemed cookie used to be read here, and it decided is_luck. It no
  // longer can: this function runs inside a cached scope shared by every
  // shopper. is_luck is now a fact about the product, and the shopper's own
  // record is applied in their browser — see tests/utils/luck/redeemedScript.
  it("marks a luck product as luck, whoever is looking", () => {
    const normalized = normalizeListingProduct({
      product_id: 201,
      name: "Luck Product",
      is_luck: true,
      luck_price: 10,
    });

    expect(
      normalized.is_luck,
      "a product with a luck offer came back without is_luck, so its badge would never be drawn for anybody",
    ).toBe(true);
  });

  it("does not mark a luck product with no luck price", () => {
    const normalized = normalizeListingProduct({
      product_id: 202,
      name: "Luck Product With No Price",
      is_luck: true,
    });

    expect(
      normalized.is_luck,
      "a product flagged as luck but carrying no luck price was marked is_luck, so the card would offer a redeem price it does not have",
    ).toBeUndefined();
  });

  it("handles empty or null inputs gracefully without crashing", () => {
    const normalized = normalizeListingProduct(null);
    expect(normalized.product_id, "should return undefined product_id for null input").toBeUndefined();
    expect(normalized.categories, "should handle null categories safely").toBeUndefined();
  });
});
