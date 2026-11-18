/**
 * Return days on a seller's product (backend PR #682, ticket z8n6b61qyr).
 *
 * The backend reads two different "no" values for `return_days`:
 *   - empty / null means "not set", so the seller days or the category days apply;
 *   - 0 means "this product cannot be returned".
 * So the form must keep the two apart on load, on validation and on save. The
 * rule the other number fields follow ("empty is sent as 0") would block returns
 * on every product a seller leaves empty, so these tests pin the difference.
 */

import { describe, expect, it } from "vitest";

import {
  buildDiff,
  buildFormFromEdit,
  buildUpdateFormData,
  emptyProductForm,
  mapServerErrors,
  validate,
  type Lookups,
  type ProductForm,
} from "components/SellerDashboard/productEdit/helpers";

const LOOKUPS: Lookups = {
  parent_categories: [],
  sub_categories: [],
  sub_sub_categories: [],
  boutiques: [],
  brands: [],
  colors: [],
  sizes: [],
  countries: [],
  labels: [],
  tags: [],
  locations: [],
  descriptor_groups: [],
  units: [],
  seller_product_ids: [],
};

/** A form that is valid apart from the one thing each test is looking at. */
const formWith = (over: Partial<ProductForm>): ProductForm => ({
  ...emptyProductForm(),
  ...over,
});

describe("product editor return days", () => {
  it("a new product starts with no return days of its own", () => {
    expect(
      emptyProductForm().return_days,
      "a new product must start empty, so the seller or category days apply",
    ).toBe("");
  });

  it.each([
    [null, ""],
    [undefined, ""],
    [0, "0"],
    [14, "14"],
  ])("loads return_days %j from the edit response as %j", (stored, shown) => {
    const form = buildFormFromEdit({ return_days: stored }, LOOKUPS);

    expect(
      form.return_days,
      `the edit response sent return_days ${JSON.stringify(stored)} and the input showed "${form.return_days}"`,
    ).toBe(shown);
  });

  it.each(["", "0", "1", "14", "365"])("accepts return days %j", (value) => {
    expect(
      validate(formWith({ return_days: value })).return_days,
      `return days "${value}" is allowed by the backend but the form refused it`,
    ).toBeUndefined();
  });

  it.each(["-1", "366", "1.5"])("refuses return days %j", (value) => {
    expect(
      validate(formWith({ return_days: value })).return_days,
      `return days "${value}" is refused by the backend but the form let it through`,
    ).toBe("Must be a whole number between 0 and 365");
  });

  it("sends an empty input as an empty string, never as 0", () => {
    const fd = buildUpdateFormData(formWith({ return_days: "" }));

    expect(
      fd.has("return_days"),
      "an empty input must still send the key, so the backend clears the stored days",
    ).toBe(true);
    expect(
      fd.get("return_days"),
      "an empty input was not sent as an empty string — 0 would block returns on this product",
    ).toBe("");
  });

  it.each(["0", "14"])("sends return days %j as it is", (value) => {
    const fd = buildUpdateFormData(formWith({ return_days: value }));

    expect(fd.get("return_days"), `return days "${value}" was changed on the way out`).toBe(value);
  });

  it("sends return days on create too", () => {
    const fd = buildUpdateFormData(formWith({ return_days: "7" }), true);

    expect(fd.get("return_days"), "a new product lost its return days").toBe("7");
  });

  it("marks the return days input when the backend refuses it", () => {
    const result = mapServerErrors({
      success: false,
      httpStatus: 422,
      message: "The given data was invalid.",
      detailed_error: [
        { code: "return_days", message: "The return days field must not be greater than 365." },
      ],
    });

    expect(
      result.fields.return_days,
      "the backend refused return_days and the input was not marked with its message",
    ).toBe("The return days field must not be greater than 365.");
  });

  it("lists a change of return days in the save summary", () => {
    const diff = buildDiff(formWith({ return_days: "" }), formWith({ return_days: "14" }), LOOKUPS);
    const entry = diff.find((d) => d.key === "return_days");

    expect(entry, "changing return days did not show in the save summary").toBeDefined();
    expect(entry?.to, "the save summary did not show the new return days").toBe("14");
  });
});
