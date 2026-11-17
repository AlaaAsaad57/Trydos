// The pack facts label (components/products/packInfo.tsx): the number of
// pieces and the sale unit from the market `qtyPriceDetails` answer.
// The label must show nothing when both fields are missing.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { getPackInfo, PackInfoLabel, unitKey } from "components/products/packInfo";

describe("reading the pack facts from qtyPriceDetails", () => {
  it("gives nothing when the backend sends neither field", () => {
    expect(getPackInfo({}), "a product with no pack fields must give no label").toBeNull();
  });

  it("gives nothing when both fields are null", () => {
    expect(
      getPackInfo({ count_of_pieces: null, unit: null }),
      "null pieces and null unit must give no label",
    ).toBeNull();
  });

  it("gives nothing when the product itself is missing", () => {
    expect(getPackInfo(undefined), "a missing product must give no label").toBeNull();
  });

  it("keeps both fields when the backend sends both", () => {
    expect(
      getPackInfo({ count_of_pieces: 12, unit: "Box" }),
      "12 pieces in a Box must both reach the label",
    ).toEqual({ count: 12, unit: "Box" });
  });

  it("keeps the count alone when the unit is missing", () => {
    expect(
      getPackInfo({ count_of_pieces: 6 }),
      "a count with no unit must still give the count",
    ).toEqual({ count: 6, unit: null });
  });

  it("keeps the unit alone when the count is missing", () => {
    expect(
      getPackInfo({ unit: "Kg", count_of_pieces: null }),
      "a unit with no count must still give the unit",
    ).toEqual({ count: null, unit: "Kg" });
  });

  it("reads a count sent as a numeric string", () => {
    expect(
      getPackInfo({ count_of_pieces: "24" })?.count,
      'the count "24" sent as text must become the number 24',
    ).toBe(24);
  });

  it("drops a count that is zero or not a number", () => {
    expect(
      getPackInfo({ count_of_pieces: 0, unit: null }),
      "a count of 0 is not a pack size and must give no label",
    ).toBeNull();
    expect(
      getPackInfo({ count_of_pieces: "abc", unit: null }),
      "a count that is not a number must give no label",
    ).toBeNull();
  });

  it("drops a unit that is only spaces", () => {
    expect(
      getPackInfo({ count_of_pieces: null, unit: "   " }),
      "an empty unit must give no label",
    ).toBeNull();
  });
});

describe("the word for each unit code", () => {
  it.each([
    ["pc", "Piece"],
    ["kg", "Kilo"],
    ["gms", "Gram"],
    ["l", "Liter"],
  ])("turns the backend code %s into the full word %s", (code, word) => {
    expect(unitKey(code), `the unit code "${code}" must use the key "${word}"`).toBe(word);
  });

  it("reads a code in capitals the same way", () => {
    expect(unitKey("KG"), 'the unit code "KG" must use the key "Kilo"').toBe("Kilo");
  });

  it("uses Piece when the unit is missing", () => {
    expect(unitKey(null), "a missing unit must fall back to Piece").toBe("Piece");
  });

  it("uses the caller's fallback when the unit is missing", () => {
    expect(unitKey(undefined, "Pieces"), "a missing unit must use the given fallback").toBe("Pieces");
  });

  it("keeps an unknown code as it is", () => {
    expect(unitKey("box"), "an unknown unit code must still reach the shopper").toBe("box");
  });
});

describe("the pack facts label", () => {
  // A stand-in translate function that marks each key, so the test sees which key was used.
  const t = (key: string) => `[${key}]`;
  const value = () => document.querySelector('[data-pw="product-pack-value"]')?.textContent;

  it("renders nothing when there is no pack info", () => {
    const { container } = render(<PackInfoLabel info={null} t={t} isRtl={false} />);
    expect(container.innerHTML, "the label must not render without pack info").toBe("");
  });

  it("puts the unit word in place of Piece when both fields are known", () => {
    render(<PackInfoLabel info={{ count: 2, unit: "kg" }} t={t} isRtl={false} />);
    expect(screen.getByText("[Composed Of:]"), "the 'Composed Of:' title is missing").toBeInTheDocument();
    expect(value(), "2 kg must read as 2 and the Kilo word").toBe("2 [Kilo]");
  });

  it("uses the Piece word when only the count is known", () => {
    render(<PackInfoLabel info={{ count: 12, unit: null }} t={t} isRtl={false} />);
    expect(value(), "a count with no unit must read as 12 and the Piece word").toBe("12 [Piece]");
  });

  it("shows the unit with a Unit title when only the unit is known", () => {
    render(<PackInfoLabel info={{ count: null, unit: "l" }} t={t} isRtl={false} />);
    expect(screen.getByText("[Unit]:"), "the 'Unit:' title is missing").toBeInTheDocument();
    expect(value(), "a unit with no count must read as the Liter word alone").toBe("[Liter]");
  });

  it("writes right to left for Arabic and Kurdish", () => {
    render(<PackInfoLabel info={{ count: 2, unit: null }} t={t} isRtl />);
    expect(
      document.querySelector('[data-pw="product-pack-info"]')?.getAttribute("dir"),
      "the label must be right to left when isRtl is true",
    ).toBe("rtl");
  });
});
