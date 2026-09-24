// "Added N Item … To Your Bag": the summary the add-to-cart sheet shows once
// this product is in the bag, with one line per bag row of this product.
import { describe, expect, it } from "vitest";

import CartContentOfProduct from "components/Cart/AddToCart/CartContentOfProduct";

import { renderWithProviders, screen } from "../../../render";

const product = {
  id: 1,
  colors: [{ code: "#00f", name: "Blue" }],
};

const currency = { symbol: "$", exchange_rate: 1, decimal_digits: 0 };

const rowsOfThisProduct = [
  { id: 1, color: "#00f", size: "M", quantity: 2, offer_price: 10, image: "a.png" },
  { id: 1, color: "Red", quantity: 1, offer_price: 20, image: "b.png" },
  { id: 1, choice_1: "XL", quantity: 1, offer_price: 0, image: "c.png" },
  { id: 1, quantity: 1, offer_price: 0, image: "d.png" },
];

/** The purple header line, as the shopper reads it. */
function header() {
  return screen.getByText("To Your Bag").parentElement!.textContent!;
}

describe("the bag summary in the add-to-cart sheet", () => {
  it("lists each bag row of this product with its color and size", async () => {
    await renderWithProviders(<CartContentOfProduct product={product} />, {
      store: { localCart: rowsOfThisProduct, currency },
    });

    const lines = Array.from(
      document.querySelectorAll(".horizntal-scroll > div"),
    ).map((line) => line.textContent?.replace(/\s+/g, ""));

    expect(
      lines[0],
      "a row with a color code and a size must show the color's name and the size",
    ).toBe("2ItemColorBlue|SizeM");
    expect(
      lines[1],
      "a row whose color is not in the product's list must show the color as stored",
    ).toBe("1ItemColorRed");
    expect(
      lines[2],
      "a row with only choice_1 must show it as the size",
    ).toBe("1ItemSizeXL");
    expect(
      lines[3],
      "a row with no color and no size must show only the quantity",
    ).toBe("1Item");
    expect(
      header(),
      "the header must add up this product's rows: 2×10 + 1×20 = 40",
    ).toContain("40 $");
  });

  it(
    "BUG-cart-201: the header counts and prices only this product's rows, not the whole bag",
    async () => {
      await renderWithProviders(<CartContentOfProduct product={product} />, {
        store: {
          localCart: [
            rowsOfThisProduct[0],
            { id: 2, quantity: 5, offer_price: 100, image: "x.png" },
          ],
          currency,
        },
      });

      expect(
        header().replace(/\s+/g, " "),
        "the header for product 1 must say 1 row and 20 $, not include product 2",
      ).toBe("Added1Item 20 $To Your Bag".replace(/\s+/g, " "));
    },
  );
});
