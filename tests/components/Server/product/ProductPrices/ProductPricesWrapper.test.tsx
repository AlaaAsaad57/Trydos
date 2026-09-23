// The price part of the product footer: it formats the three prices at the
// country's rate and hands them, with the currency symbol, to the price row.
import { describe, expect, it, vi } from "vitest";

const { seen } = vi.hoisted(() => ({ seen: {} as any }));
vi.mock("components/Server/product/ProductPrices/PricesRowClientLogic", () => ({
  default: (p: any) => {
    seen.row = p;
    return null;
  },
}));
vi.mock("components/Cart/AddToCart/PropertiesMarquee", () => ({
  default: (p: any) => {
    seen.marquee = p;
    return null;
  },
}));

import ProductPricesWrapper from "components/Server/product/ProductPrices/ProductPricesWrapper";

import { renderWithProviders } from "../../../../render";

const currency = { symbol: "$", exchange_rate: 2, decimal_digits: 0 };

describe("the product footer prices", () => {
  it("converts the prices, flags a discount, and passes the shipping facts on", async () => {
    const { container } = await renderWithProviders(
      <ProductPricesWrapper
        qtyPricePromise={{
          id: 1,
          price: 10,
          offer_price: 8,
          luck_price: 3,
          is_luck: true,
          shipping_cost: 4,
          shipping_days: 2,
          country_shipping_days: 3,
          allow_return_in_days: 7,
        }}
        currencyPromise={currency}
        language="en"
        isRtl={false}
      />,
    );
    expect(seen.row.prices, "the prices should be converted at the rate").toEqual({
      original: 20,
      offer: 16,
      redeem: 6,
      isDiscounted: true,
    });
    expect(seen.row.is_luck_active, "the luck flag should be passed on").toBe(true);
    expect(seen.marquee, "the shipping facts should reach the marquee").toEqual(
      expect.objectContaining({ shipping_cost: 4, shippingDays: 2, country_shipping_days: 3, allowReturnInDays: 7 }),
    );
    expect((container.firstElementChild as HTMLElement).className, "the row should run left to right").toContain("pl-[20px]");
  });

  it("marks a price without a discount, and lays out right to left", async () => {
    const { container } = await renderWithProviders(
      <ProductPricesWrapper qtyPricePromise={{ id: 1, price: 10, offer_price: 10 }} currencyPromise={currency} language="ar" isRtl />,
    );
    expect(seen.row.prices.isDiscounted, "an equal offer is no discount").toBe(false);
    expect((container.firstElementChild as HTMLElement).className, "the row should be reversed in Arabic").toContain("flex-row-reverse");
  });

  it("BUG-server-50: hands the currency symbol to the price row", async () => {
    await renderWithProviders(
      <ProductPricesWrapper qtyPricePromise={{ id: 1, price: 10, offer_price: 8 }} currencyPromise={currency} language="en" isRtl={false} />,
    );
    expect(seen.row.currencySymbol, "the price must be shown with the currency symbol").toBe("$");
  });
});
