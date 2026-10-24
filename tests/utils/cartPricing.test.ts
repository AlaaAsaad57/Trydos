import { describe, expect, it } from "vitest";
import { resolveShowedPrice } from "utils/cart/pricing";

describe("resolveShowedPrice", () => {
  it("returns luck_price when isLuck is true and variant has luck_price", () => {
    const price = resolveShowedPrice({
      product: { price: 100, offer_price: 80, luck_price: 50 },
      selectedVariant: { price: 120, offer_price: 90, luck_price: 40 },
      isLuck: true,
    });
    expect(price).toBe(40);
  });

  it("returns product luck_price when variant luck_price is missing and isLuck is true", () => {
    const price = resolveShowedPrice({
      product: { price: 100, offer_price: 80, luck_price: 50 },
      selectedVariant: { price: 120, offer_price: 90 },
      isLuck: true,
    });
    expect(price).toBe(50);
  });

  it("returns variant offer_price when not luck and variant has offer_price", () => {
    const price = resolveShowedPrice({
      product: { price: 100, offer_price: 80 },
      selectedVariant: { price: 120, offer_price: 90 },
      isLuck: false,
    });
    expect(price).toBe(90);
  });

  it("returns variant price when offer_price is null or 0", () => {
    const price1 = resolveShowedPrice({
      product: { price: 100, offer_price: 80 },
      selectedVariant: { price: 120, offer_price: null },
      isLuck: false,
    });
    expect(price1).toBe(120);

    const price2 = resolveShowedPrice({
      product: { price: 100, offer_price: 80 },
      selectedVariant: { price: 120, offer_price: 0 },
      isLuck: false,
    });
    expect(price2).toBe(120);
  });

  it("falls back to product offer_price / price when there are no variants", () => {
    const withOffer = resolveShowedPrice({
      product: { price: 100, offer_price: 80 },
      selectedVariant: null,
      isLuck: false,
    });
    expect(withOffer).toBe(80);

    const withoutOffer = resolveShowedPrice({
      product: { price: 100, offer_price: null },
      selectedVariant: null,
      isLuck: false,
    });
    expect(withoutOffer).toBe(100);

    const luckNoVariant = resolveShowedPrice({
      product: { price: 100, offer_price: 80, luck_price: 35 },
      selectedVariant: null,
      isLuck: true,
    });
    expect(luckNoVariant).toBe(35);
  });

  it("handles string numbers correctly", () => {
    const price = resolveShowedPrice({
      product: { price: "100.5", offer_price: "85.25" },
      selectedVariant: { price: "120", offer_price: "99.9" },
      isLuck: false,
    });
    expect(price).toBe(99.9);
  });
});
