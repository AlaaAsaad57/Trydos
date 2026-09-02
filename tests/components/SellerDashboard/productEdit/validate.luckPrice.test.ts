/**
 * A luck price is what a shopper pays through a luck draw. It must never be
 * above the price the product already sells for.
 *
 * The editor used to accept any non-negative luck price, at product level and
 * in the variants table, so a seller could set a luck price of 900 on a product
 * that sells for 100. These tests pin the rule and were seen red against the
 * old code (no `luck_price` error existed at all) before the fix.
 *
 * The binding limit is the discount price when one is set, and the unit price
 * otherwise — the editor already refuses a discount price that is not below the
 * unit price, so the lower of the two is the only one worth reporting.
 */

import { describe, expect, it } from "vitest";

import {
  emptyProductForm,
  emptyVariantRow,
  validate,
  type ProductForm,
  type VariantRow,
} from "components/SellerDashboard/productEdit/helpers";

/** A form that is valid apart from the one thing each test is looking at. */
const formWith = (over: Partial<ProductForm>): ProductForm => ({
  ...emptyProductForm(),
  ...over,
});

/** Prices only — every other field is left as the empty form has it. */
const priced = (
  unit_price: string,
  discount_price: string,
  luck_price: string,
): ProductForm => formWith({ unit_price, discount_price, luck_price });

describe("product editor luck price validation", () => {
  it("refuses a luck price above the unit price when there is no discount price", () => {
    const errors = validate(priced("100", "", "150"));

    expect(
      errors.luck_price,
      "a luck price of 150 was accepted on a product that sells for 100 — the shopper would pay more through the draw than in the shop",
    ).toBe("Luck price cannot be greater than unit price");
  });

  it("refuses a luck price above the discount price when a discount price is set", () => {
    const errors = validate(priced("100", "80", "90"));

    expect(
      errors.luck_price,
      "a luck price of 90 was accepted on a product discounted to 80 — the discount price is the price the shopper really pays",
    ).toBe("Luck price cannot be greater than discount price");
  });

  it("accepts a luck price equal to the unit price when there is no discount price", () => {
    const errors = validate(priced("100", "", "100"));

    expect(
      errors.luck_price,
      `a luck price equal to the unit price was refused: ${errors.luck_price}`,
    ).toBeUndefined();
  });

  it("accepts a luck price equal to the discount price", () => {
    const errors = validate(priced("100", "80", "80"));

    expect(
      errors.luck_price,
      `a luck price equal to the discount price was refused: ${errors.luck_price}`,
    ).toBeUndefined();
  });

  it("accepts a luck price below both prices", () => {
    const errors = validate(priced("100", "80", "50"));

    expect(
      errors.luck_price,
      `a luck price of 50 under a discount price of 80 was refused: ${errors.luck_price}`,
    ).toBeUndefined();
  });

  it("leaves an empty luck price alone", () => {
    const errors = validate(priced("100", "80", ""));

    expect(
      errors.luck_price,
      `an empty luck price was refused: ${errors.luck_price} — the field is optional`,
    ).toBeUndefined();
  });

  it("does not check the luck price for a seller whose prices are locked", () => {
    // An unapproved seller sends only the purchase price, and the unit and
    // discount inputs are not even rendered, so there is nothing to compare with.
    const errors = validate(priced("100", "", "150"), false, true);

    expect(
      errors.luck_price,
      "the luck price was compared with a unit price the unapproved seller cannot enter or send",
    ).toBeUndefined();
  });
});

/**
 * One color, so `combos()` produces exactly one variant row to check. The combo
 * key comes from the color NAME ("Red"), while `colorImages` is keyed by the
 * color CODE ("RED") — see `variantKey` and `buildSyncColorImages`.
 */
const variantForm = (row: Partial<VariantRow>): ProductForm =>
  formWith({
    unit_price: "100",
    colors: [{ code: "RED", name: "Red" }],
    images: [{ name: "a.jpg", url: "a.jpg" }],
    colorImages: { RED: ["a.jpg"] },
    variations: {
      Red: {
        ...emptyVariantRow(),
        qty: "5",
        sku: "Red",
        location_id: "1",
        ...row,
      },
    },
  });

describe("product editor variant luck price validation", () => {
  it("refuses a variant luck price above the variant unit price", () => {
    const errors = validate(variantForm({ price: "200", luck: "250" }));

    expect(
      errors.variations,
      "a variant luck price of 250 was accepted on a variant priced at 200",
    ).toBe("Variant luck price cannot be greater than unit price");
  });

  it("refuses a variant luck price above the variant discount price", () => {
    const errors = validate(variantForm({ price: "200", discount: "150", luck: "180" }));

    expect(
      errors.variations,
      "a variant luck price of 180 was accepted on a variant discounted to 150",
    ).toBe("Variant luck price cannot be greater than discount price");
  });

  it("compares an empty variant price with the product unit price", () => {
    // An empty variant price is sent as the product unit price, so that is the
    // price the shopper pays and the price the luck price must sit under.
    const errors = validate(variantForm({ price: "", luck: "150" }));

    expect(
      errors.variations,
      "a variant luck price of 150 was accepted on a variant that falls back to the product unit price of 100",
    ).toBe("Variant luck price cannot be greater than unit price");
  });

  it("accepts a variant luck price equal to the variant price", () => {
    const errors = validate(variantForm({ price: "200", luck: "200" }));

    expect(
      errors.variations,
      `a variant luck price equal to the variant price was refused: ${errors.variations}`,
    ).toBeUndefined();
  });

  it("accepts a variant luck price below the variant discount price", () => {
    const errors = validate(variantForm({ price: "200", discount: "150", luck: "120" }));

    expect(
      errors.variations,
      `a variant luck price of 120 under a discount price of 150 was refused: ${errors.variations}`,
    ).toBeUndefined();
  });

  it("does not check the variant luck price for a seller whose prices are locked", () => {
    const errors = validate(variantForm({ price: "200", luck: "250" }), false, true);

    expect(
      errors.variations,
      "the variant luck price was compared with a variant price the unapproved seller cannot enter or send",
    ).toBeUndefined();
  });
});
