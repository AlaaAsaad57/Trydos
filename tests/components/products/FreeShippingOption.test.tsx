// The "Free Shipping" block on a product page (a server component). It shows
// only when the product's shipping cost is 0.
import { describe, expect, it, vi } from "vitest";

import FreeShippingOption from "components/products/FreeShippingOption";

import { render, screen } from "../../render";

vi.mock("utils/server", () => ({
  translateFunction: (key: string, language: string) => `${language}:${key}`,
}));

describe("FreeShippingOption", () => {
  it("shows free shipping and the delivery guarantee when shipping costs 0", async () => {
    render(await FreeShippingOption({ lang: "sy-en", qtyPricePromise: Promise.resolve({ shipping_cost: "0" }) }));
    expect(screen.getByText("en:Free Shipping"), "free shipping is not shown").toBeInTheDocument();
    expect(screen.getByText("en:Delivery Guarantee"), "the guarantee is not shown").toBeInTheDocument();
  });

  it("aligns to the right in Arabic", async () => {
    render(await FreeShippingOption({ lang: "sy-ar", qtyPricePromise: Promise.resolve({ shipping_cost: 0 }) }));
    expect(
      document.querySelector('[data-pw="FreeShipping"]')!.className,
      "the Arabic block is not aligned right",
    ).toContain("items-end");
  });

  it("shows nothing when shipping is not free", async () => {
    const { container } = render(
      await FreeShippingOption({ lang: "sy-en", qtyPricePromise: Promise.resolve({ shipping_cost: 5 }) }),
    );
    expect(container.innerHTML, "paid shipping still showed the free block").toBe("");
  });
});
