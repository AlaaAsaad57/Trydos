// The product card at the top of the add-to-cart sheet: picture, name,
// shipping lines and the price block (normal, offer and luck price).
import { beforeEach, describe, expect, it, vi } from "vitest";

import Card from "components/Cart/AddToCart/Card";

import { renderWithProviders, screen, waitFor } from "../../../render";

const GetCountries = vi.fn();
vi.mock("serverRequests/product", () => ({
  GetCountries: (...args: any[]) => GetCountries(...args),
}));

const baseProps = {
  image: "/p.png",
  shouldShowOrangeBorder: false,
  brandImabge: "/b.png",
  name: "Blue shirt",
  shippingDays: 2,
  offer_price: 100,
  price: 100,
  luck_price: 0,
};

const store = {
  currency: { symbol: "$", exchange_rate: 1, decimal_digits: 0 },
  settings: { starting_setting: { shipping_duration_days: 3 } },
};

function marked(name: string) {
  return document.querySelectorAll(`[data-pw="${name}"]`);
}

describe("the product card in the add-to-cart sheet", () => {
  beforeEach(() => {
    GetCountries.mockReset();
    GetCountries.mockResolvedValue([]);
  });

  it("shows the name, total shipping days and the country the shopper is in", async () => {
    await renderWithProviders(<Card {...baseProps} />, {
      store,
      country: "sy",
    });

    expect(
      screen.getByText("Blue shirt"),
      "the product name is missing",
    ).toBeInTheDocument();
    expect(
      screen.getByText(/5\s+Days/),
      "shipping days must be the product's 2 plus the shop's 3",
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        GetCountries,
        "the card never asked for the country list",
      ).toHaveBeenCalledWith({ country: "sy", language: "en" }),
    );
    expect(
      screen.getByText("Syria"),
      "the card must name the shopper's country",
    ).toBeInTheDocument();
  });

  it("shows a placeholder instead of a country name when the path has no country", async () => {
    const { container } = await renderWithProviders(
      <Card {...baseProps} shouldShowOrangeBorder shippingDays={-10} />,
      { store: { ...store, settings: null }, country: "", language: "ar" },
    );

    expect(
      container.querySelector(".skeleton-base"),
      "with no country in the path the card must show a loading placeholder",
    ).not.toBeNull();
    expect(
      container.querySelector('rect[stroke="#FF6200"]'),
      "the orange border was asked for and not drawn",
    ).not.toBeNull();
  });

  it("shows one bold price when the offer price equals the price", async () => {
    await renderWithProviders(<Card {...baseProps} />, { store });

    expect(
      marked("offer-price-label")[0]?.textContent,
      "the single price is wrong",
    ).toBe("100");
    expect(
      marked("normal-price-label")[0],
      "no crossed-out price must be shown when there is no discount",
    ).toBeUndefined();
  });

  it("crosses out the old price when there is an offer", async () => {
    await renderWithProviders(<Card {...baseProps} offer_price={80} />, {
      store,
    });

    expect(
      marked("normal-price-label")[0]?.textContent,
      "the old price must be shown crossed out",
    ).toBe("100");
    expect(
      marked("offer-price-label")[0]?.textContent,
      "the offer price is wrong",
    ).toBe("80");
  });

  it("shows the luck price after a crossed-out price", async () => {
    await renderWithProviders(<Card {...baseProps} luck_price={50} />, {
      store,
    });

    expect(
      marked("redeem-price-label")[0]?.textContent,
      "the luck price is missing",
    ).toBe("50");
    expect(
      marked("offer-price-label")[0]?.textContent,
      "the normal price must be shown crossed out next to the luck price",
    ).toBe("100");
  });

  it("shows price, offer and luck price when all three differ", async () => {
    await renderWithProviders(
      <Card {...baseProps} offer_price={80} luck_price={50} />,
      { store, language: "ku" },
    );

    expect(
      marked("normal-price-label")[0]?.textContent,
      "the first crossed-out price is wrong",
    ).toBe("100");
    expect(
      marked("offer-price-label")[0]?.textContent,
      "the second crossed-out price is wrong",
    ).toBe("80");
    expect(
      marked("redeem-price-label ")[0]?.textContent,
      "the luck price is missing",
    ).toBe("50");
  });
});
