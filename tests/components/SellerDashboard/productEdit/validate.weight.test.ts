/**
 * Weight is required on every product, whatever unit it is sold in.
 *
 * It used to be required only for `pc` and `l`, and optional for `kg` / `gms` —
 * so a seller could save a kilogram-priced product carrying no weight at all,
 * which cannot be shipped or costed. These tests pin the rule to "always
 * required" and were seen red against the old two-branch rule before the fix.
 */

import { describe, expect, it } from "vitest";

import {
  emptyProductForm,
  UNITS,
  validate,
  type ProductForm,
} from "components/SellerDashboard/productEdit/helpers";

/** A form that is valid apart from the one thing each test is looking at. */
const formWith = (over: Partial<ProductForm>): ProductForm => ({
  ...emptyProductForm(),
  ...over,
});

describe("product editor weight validation", () => {
  it.each(UNITS)(
    "requires a weight when the unit is %s",
    (unit) => {
      const errors = validate(formWith({ unit, weight: "" }));

      expect(
        errors.weight,
        `saving a "${unit}" product with an empty weight was allowed through — weight must be required for every unit`,
      ).toBe("Weight is required");
    },
  );

  it.each(UNITS)(
    "rejects a zero weight when the unit is %s",
    (unit) => {
      const errors = validate(formWith({ unit, weight: "0" }));

      expect(
        errors.weight,
        `a "${unit}" product was allowed a weight of 0, which is never a real weight`,
      ).toBe("Enter a valid weight");
    },
  );

  it.each(UNITS)(
    "rejects a negative weight when the unit is %s",
    (unit) => {
      const errors = validate(formWith({ unit, weight: "-3" }));

      expect(
        errors.weight,
        `a "${unit}" product was allowed a negative weight`,
      ).toBe("Enter a valid weight");
    },
  );

  it("rejects a weight that is not a number", () => {
    const errors = validate(formWith({ unit: "kg", weight: "heavy" }));

    expect(
      errors.weight,
      'the text "heavy" was accepted as a weight',
    ).toBe("Enter a valid weight");
  });

  it.each(UNITS)(
    "accepts a positive weight when the unit is %s",
    (unit) => {
      const errors = validate(formWith({ unit, weight: "2.5" }));

      expect(
        errors.weight,
        `a "${unit}" product with a valid weight of 2.5 was refused: ${errors.weight}`,
      ).toBeUndefined();
    },
  );
});
