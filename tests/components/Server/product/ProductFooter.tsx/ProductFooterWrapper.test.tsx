// The footer wrapper merges the product, its prices and its social numbers into
// the one light product object the footer reads.
import { describe, expect, it, vi } from "vitest";

const footer = vi.fn();
vi.mock("components/Server/product/ProductFooter.tsx/ProductFooter", () => ({
  default: (props: any) => {
    footer(props);
    return null;
  },
}));

import { render } from "@testing-library/react";

import ProductFooterWrapper from "components/Server/product/ProductFooter.tsx/ProductFooterWrapper";

const renderWrapper = (props: Record<string, any>) =>
  render(
    <ProductFooterWrapper
      isRtl={false}
      color="red"
      size="M"
      currencyPromise={null}
      local="sy-en"
      redeemed_status={false}
      socialData={null}
      globalPromise={{}}
      QtyPricePromise={{}}
      {...props}
    />,
  );

describe("the product footer wrapper", () => {
  it("builds the light product from the product, the prices and the social numbers", () => {
    footer.mockClear();
    renderWrapper({
      globalPromise: {
        id: 9,
        name: "Shoe",
        slug: "shoe",
        sync_color_images: [{ images: ["https://example.com/red.png"] }],
        brand: { name: "Nike" },
      },
      QtyPricePromise: { price: 20, offer_price: 10, luck_price: 5 },
      socialData: { total_likes: 3, is_liked: true, total_comments: 2, total_shares: 1 },
      redeemed_status: true,
    });
    const light = footer.mock.calls[0][0].productLightData;
    expect(light.image, "the first colour photo should be used").toBe("https://example.com/red.png");
    expect(light.offer_price, "the offer price should come from the prices").toBe(10);
    expect(light.total_likes, "the like count should come from the social numbers").toBe(3);
    expect(light.is_luck, "the luck flag should follow the redeemed status").toBe(true);
    expect(light.luck_price, "the luck price should come from the prices").toBe(5);
  });

  it("falls back to the plain photo and to zero likes", () => {
    footer.mockClear();
    renderWrapper({ globalPromise: { id: 9, images: ["https://example.com/p.png"] } });
    const light = footer.mock.calls[0][0].productLightData;
    expect(light.image, "the plain photo should be used without colour photos").toBe("https://example.com/p.png");
    expect(light.total_likes, "no social numbers should mean zero likes").toBe(0);
  });
});
