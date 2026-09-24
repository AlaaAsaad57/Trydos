// The strip above the add-to-cart button. It picks one message: "look at other
// colors", the luck countdown, the picked color / size, the feature tape, or
// what is already in the bag.
import { describe, expect, it } from "vitest";

import ExtraInfoArea from "components/Cart/AddToCart/ExtraInfoArea";

import { renderWithProviders, screen } from "../../../render";

const base = {
  isInCart: false,
  isLuck: false,
  luckActive: false,
  secondsLeft: 0,
  isQtyEmpty: false,
  selected_color: null,
  selected_size: null,
  luck_price: 0,
  flashDeal: null,
  isCollectAfterOrder: false,
  colors: [],
  id: 1,
  product: { id: 1 },
};

const store = {
  currency: { symbol: "$", exchange_rate: 1, decimal_digits: 0 },
  localCart: [],
};

function marked(name: string) {
  return document.querySelector(`[data-pw="${name}"]`)?.textContent;
}

describe("the strip above the add-to-cart button", () => {
  it("points to other colors when this one is sold out", async () => {
    await renderWithProviders(
      <ExtraInfoArea {...base} isQtyEmpty colors={[{ id: 1 }]} />,
      { store },
    );

    expect(
      screen.getByText("Take A Look At Other Colors"),
      "a sold-out color must point the shopper to the other colors",
    ).toBeInTheDocument();
  });

  it("shows the luck countdown and the luck price", async () => {
    await renderWithProviders(
      <ExtraInfoArea
        {...base}
        isLuck
        luckActive
        secondsLeft={12}
        luck_price={40}
      />,
      { store },
    );

    expect(screen.getByText("Luck!"), "the luck line is missing").toBeInTheDocument();
    expect(
      screen.getByText("12"),
      "the seconds left are not shown",
    ).toBeInTheDocument();
    expect(
      screen.getByText("40"),
      "the luck price is not shown",
    ).toBeInTheDocument();
  });

  it("names the picked color and size together", async () => {
    await renderWithProviders(
      <ExtraInfoArea
        {...base}
        selected_color={{ color_name: "Blue" }}
        selected_size={{ name: "Medium" }}
      />,
      { store, language: "ar" },
    );

    expect(marked("add-to-cart-selected-color"), "the color is missing").toBe(
      "Blue",
    );
    expect(marked("add-to-cart-selected-size"), "the size is missing").toBe(
      "Medium",
    );
  });

  it("names only the color when no size is picked", async () => {
    await renderWithProviders(
      <ExtraInfoArea {...base} selected_color={{ color_name: "Red" }} />,
      { store },
    );

    expect(marked("add-to-cart-selected-color"), "the color is missing").toBe(
      "Red",
    );
    expect(
      marked("add-to-cart-selected-size"),
      "no size was picked, yet a size is shown",
    ).toBeUndefined();
  });

  it("names only the size when no color is picked", async () => {
    await renderWithProviders(
      <ExtraInfoArea {...base} selected_size="xl" />,
      { store, language: "ku" },
    );

    expect(marked("add-to-cart-selected-size"), "the size is missing").toBe(
      "xl",
    );
    expect(
      marked("add-to-cart-selected-color"),
      "no color was picked, yet a color is shown",
    ).toBeUndefined();
  });

  it("shows the flash deal and the feature tape when nothing is picked", async () => {
    await renderWithProviders(
      <ExtraInfoArea {...base} flashDeal="2999-01-01" />,
      { store },
    );

    expect(
      screen.getByText("Flash Deal"),
      "the flash deal banner is missing",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fast Packing"),
      "the feature tape is missing",
    ).toBeInTheDocument();
  });

  it("shows what is already in the bag once the product is in it", async () => {
    await renderWithProviders(<ExtraInfoArea {...base} isInCart />, {
      store,
    });

    expect(
      screen.getByText("To Your Bag"),
      "a product in the bag must show the bag summary",
    ).toBeInTheDocument();
  });
});
