// The price row in the product footer. While the product's luck window is open
// it shows the luck price in orange, with the normal prices struck through.
import { describe, expect, it } from "vitest";

import PricesRowClientLogic from "components/Server/product/ProductPrices/PricesRowClientLogic";

import { renderWithProviders, screen } from "../../../../render";

const prices = { original: "20", offer: "15", redeem: "5", isDiscounted: true };

describe("the product price row", () => {
  it("without luck: shows the offer, and the old price struck through when discounted", async () => {
    const { container } = await renderWithProviders(
      <PricesRowClientLogic id={1} is_luck_active={false} isRtl={false} currencySymbol="$" prices={prices} />,
    );
    expect(screen.getByText("15").className, "the offer should be the bold price").toContain("bold");
    expect(container.querySelectorAll("svg line").length, "only the old price should be struck through").toBe(1);
    expect(screen.queryByText("5"), "no luck price without luck").toBeNull();
  });

  it("with luck open: shows the luck price and strikes both prices, right to left in Arabic", async () => {
    const { container } = await renderWithProviders(
      <PricesRowClientLogic id={2} is_luck_active isRtl currencySymbol="$" prices={prices} />,
      { language: "ar" },
    );
    expect(screen.getByText("5").className, "the luck price should be shown in orange").toContain("text-[#FF6200]");
    expect(container.querySelectorAll("svg line").length, "old and offer prices should both be struck through").toBe(2);
    expect((container.firstElementChild as HTMLElement).className, "the row should be reversed in Arabic").toContain(
      "flex-row-reverse",
    );
  });

  it("with luck open and no discount: strikes only the offer price", async () => {
    const { container } = await renderWithProviders(
      <PricesRowClientLogic id={3} is_luck_active isRtl={false} currencySymbol="$" prices={{ ...prices, isDiscounted: false }} />,
    );
    expect(container.querySelectorAll("svg line").length, "only the offer should be struck through").toBe(1);
  });
});
