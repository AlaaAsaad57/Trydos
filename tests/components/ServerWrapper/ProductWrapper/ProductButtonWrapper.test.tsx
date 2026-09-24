// The "Buy" button on a product card, and the luck badge that sits on top of it
// while the product's luck window is open.
import { describe, expect, it, vi } from "vitest";

import ProductButtonWrapper from "components/ServerWrapper/ProductWrapper/ProductButtonWrapper";

import { renderWithProviders, screen, userEvent } from "../../../render";

const currency = { exchange_rate: 1, decimal_digits: 2, symbol: "$" };

describe("the product card buy button", () => {
  it("without luck: shows Buy only and sends the plain product to the bag", async () => {
    const setSelectedProductForCart = vi.fn();
    const { container } = await renderWithProviders(
      <ProductButtonWrapper
        language="en"
        currency={currency}
        is_luck={false}
        id={5}
        luck_price={1}
        slug="shoe"
        InitialProductData={{ name: "Shoe" } as any}
      />,
      { store: { setSelectedProductForCart } },
    );
    expect(
      container.querySelector("[data-luck-badge]"),
      "no luck badge without an open luck window",
    ).toBeNull();
    await userEvent.click(screen.getByText("Buy"));
    expect(
      setSelectedProductForCart,
      "Buy should hand the plain product to the bag",
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        name: "Shoe",
        showRedeemPrice: false,
        is_from_listing: true,
        sizes_filters: undefined,
        seconds: 0,
      }),
    );
  });

  it("with luck open: shows the countdown and the luck price, and sends the seconds and the size filter", async () => {
    const setSelectedProductForCart = vi.fn();
    const { container } = await renderWithProviders(
      <ProductButtonWrapper
        language="ar"
        currency={currency}
        is_luck
        luckActive
        secondsLeft={9}
        id={5}
        luck_price={3}
        slug="shoe"
        sizes_filters={["M"] as any}
      />,
      { store: { setSelectedProductForCart }, language: "ar" },
    );
    expect(
      container.querySelector("#counter-5")?.textContent,
      "the countdown should show the seconds left",
    ).toBe("-9");
    expect(
      container.querySelector('[data-pw="product-redeem-price"]')?.textContent,
      "the luck price should be shown while luck is open",
    ).toContain("3");
    expect(
      container.querySelector(".min-w-\\[140px\\]")?.className,
      "in Arabic the luck ribbon should sit on the right",
    ).toContain("right-0");
    await userEvent.click(
      container.querySelector('[data-pw="buy-button"]') as HTMLElement,
    );
    expect(
      setSelectedProductForCart,
      "Buy during luck should send the redeem flag, the seconds and the size filter",
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        showRedeemPrice: true,
        seconds: 9,
        sizes_filters: ["M"],
      }),
    );
  });

  it("with luck open in English, the luck ribbon sits on the left", async () => {
    const { container } = await renderWithProviders(
      <ProductButtonWrapper
        language="en"
        currency={currency}
        is_luck
        luckActive
        id={6}
        luck_price={3}
        slug="s"
      />,
    );
    expect(
      container.querySelector(".min-w-\\[140px\\]")?.className,
      "in English the luck ribbon should sit on the left",
    ).toContain("left-0");
  });
});
