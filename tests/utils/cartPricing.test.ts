import { describe, expect, it } from "vitest";
import { resolveShowedPrice, toShowedPrice } from "utils/cart/pricing";

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

describe("resolveShowedPrice — when the sheet shows no price", () => {
  it("answers null, not 0, so the add sends no showed_price", () => {
    const price = resolveShowedPrice({
      product: {},
      selectedVariant: { price: null, offer_price: undefined },
      isLuck: false,
    });
    expect(
      price,
      "with no price on the variant or the product, resolveShowedPrice claimed the shopper was shown a price of 0",
    ).toBeNull();
  });
});

describe("resolveShowedPrice — the variant is already in the bag as a luck line", () => {
  it("answers the bag line's offer_price, which is what the sheet shows", () => {
    // AddToCartComponent passes PricesRow the bag line's offer_price when that
    // line is a luck line, not the variant's offer_price.
    const price = resolveShowedPrice({
      product: { price: 100, offer_price: 80 },
      selectedVariant: { price: 100, offer_price: 80 },
      cartItem: { is_luck: true, offer_price: 35 },
      isLuck: false,
    } as any);
    expect(
      price,
      "the sheet shows the luck line's own offer_price (35), but resolveShowedPrice answered the variant's",
    ).toBe(35);
  });

  it("ignores a bag line that is not a luck line", () => {
    const price = resolveShowedPrice({
      product: { price: 100, offer_price: 80 },
      selectedVariant: { price: 100, offer_price: 80 },
      cartItem: { is_luck: false, offer_price: 35 },
      isLuck: false,
    } as any);
    expect(price, "a normal bag line must not change the price the sheet shows").toBe(80);
  });
});

describe("toShowedPrice — the value the contract accepts", () => {
  it.each([
    [129.99, 129.99],
    [0, 0],
    ["12.5", 12.5],
  ])("keeps %j as %j", (input, expected) => {
    expect(toShowedPrice(input), `toShowedPrice(${JSON.stringify(input)}) must give a number of 0 or more`).toBe(expected);
  });

  it.each([[undefined], [null], [""], ["  "], ["abc"], [-0.01], [Number.NaN], [Number.POSITIVE_INFINITY], [{}], [true]])(
    "drops %j",
    (input) => {
      expect(
        toShowedPrice(input),
        `toShowedPrice(${String(input)}) must answer null, so the field is left out of the body`,
      ).toBeNull();
    },
  );
});
