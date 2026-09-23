// The client part of the product footer. It is placed into document.body, so
// it must hide itself while a page navigation is loading (but not for a filter
// change), and it folds the luck status into the prices it shows.
import { describe, expect, it, vi } from "vitest";

const prices = vi.fn();
const wrapper = vi.fn();

vi.mock("components/products/VirtualTryOnWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductVideosWrapper", () => ({ default: () => null }));
vi.mock("components/Server/product/ProductPrices/ProductPricesWrapper", () => ({
  default: (props: any) => {
    prices(props);
    return null;
  },
}));
vi.mock("components/Server/product/ProductFooter.tsx/ProductFooterWrapper", () => ({
  default: (props: any) => {
    wrapper(props);
    return null;
  },
}));

import ProductFooterClient from "components/Product/ProductFooterClient";

import { renderWithProviders } from "../../render";

const renderFooter = (store: Record<string, any> = {}) =>
  renderWithProviders(
    <ProductFooterClient
      GlobalData={{ id: 9 }}
      language="en"
      QtyPricesData={{ price: 10, is_luck: 1 }}
      currency={{ symbol: "$" }}
      isRtl={false}
      Params={{ lang: "sy-en" }}
      color="red"
      Size="M"
      socialData={{}}
      redeemed_status={false}
      shippingDays={3}
    />,
    { store },
  );

const footer = () => document.body.querySelector(".product-details-footer") as HTMLElement;

describe("the product footer (client part)", () => {
  it("is placed into the page body, with the luck status folded into the prices", async () => {
    prices.mockClear();
    await renderFooter();
    expect(footer(), "the footer should be placed into the page body").not.toBeNull();
    expect(footer().style.display, "the footer should be shown when nothing is loading").toBe("");
    expect(prices.mock.calls.at(-1)[0].qtyPricePromise, "the prices must use the redeemed status and shipping days").toEqual({
      price: 10,
      is_luck: false,
      country_shipping_days: 3,
    });
    expect(wrapper.mock.calls.at(-1)[0].local, "the footer wrapper should get the locale").toBe("sy-en");
  });

  it("hides while a page navigation is loading", async () => {
    await renderFooter({ isNavigating: { is_product: true } });
    expect(footer().style.display, "the footer must hide under the page loader").toBe("none");
  });

  it("stays visible during a filter change", async () => {
    await renderFooter({ isNavigating: { is_filter: true } });
    expect(footer().style.display, "a filter change does not hide the page, so the footer stays").toBe("");
  });
});
