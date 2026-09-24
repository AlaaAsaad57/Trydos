// The small server wrappers of the product page. Each one waits for the
// product data, decides whether its section has anything to show, and hands
// the data to the client part in the shape it reads.
import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";

const { captured, stub } = vi.hoisted(() => {
  const captured: Record<string, any> = {};
  const stub = (name: string) => ({
    default: (props: any) => {
      captured[name] = props;
      const React = require("react");
      return React.createElement("div", { "data-pw": name }, props.children);
    },
  });
  return { captured, stub };
});

vi.mock("components/products/ProductVideo", () => stub("video"));
vi.mock("components/products/ProductDetailsText", () => stub("details"));
vi.mock("components/products/ProductFeatures", () => stub("features"));
vi.mock("components/products/ProductStories", () => stub("stories"));
vi.mock("components/products/ProductDescriptors", () => stub("descriptors"));
vi.mock("components/products/ProductColors", () => stub("colors"));
vi.mock("components/products/ProductColorItem", () => ({
  default: (props: any) => {
    (captured.colorItems ??= []).push(props);
    return null;
  },
}));
vi.mock("components/products/ExpectedDeleiveryBanner", () => stub("delivery"));
vi.mock("components/products/ActiveColorDetailsSlider", () => stub("slider"));

const { GetProductStoriesData, GetSocialInfoForProduct, getCookieServer } = vi.hoisted(() => ({
  GetProductStoriesData: vi.fn(),
  GetSocialInfoForProduct: vi.fn(),
  getCookieServer: vi.fn(),
}));
vi.mock("serverRequests/product", () => ({
  GetProductStoriesData: (...a: any[]) => GetProductStoriesData(...a),
  GetSocialInfoForProduct: (...a: any[]) => GetSocialInfoForProduct(...a),
}));
vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: (...a: any[]) => getCookieServer(...a),
}));
vi.mock("utils/server", () => ({
  translateFunction: (key: string) => key,
  GetImageUrl: (url: string) => url,
  getConfiguredImage: ({ src }: any) => src,
  countryNameFromIso: (iso: string) => `country:${iso}`,
  formatTime: () => "1 Jan",
  ShowDayStr: () => "Mon",
}));

import ProductExtendedSliderWrapper from "components/Server/product/ProductExtendedSliderWrapper";

describe("the zoom slider wrapper", () => {
  it("hands the slider the product facts, the price and the like count for analytics", async () => {
    getCookieServer.mockResolvedValue({ id: "7" });
    GetSocialInfoForProduct.mockResolvedValue({ total_likes: 4 });
    render(
      await ProductExtendedSliderWrapper({
        globalPromise: Promise.resolve({
          id: 1,
          name: "Shoe",
          brand: { id: 2, name: "Nike" },
          categories: [{ id: 3, name: "Men" }],
          boutique_id: 9,
          images: ["a"],
        }),
        qtyPricePromise: Promise.resolve({ price: 20 }),
        color: "red",
      }),
    );
    expect(GetSocialInfoForProduct, "likes must be read for this product and shopper").toHaveBeenCalledWith({
      productId: 1,
      userId: "7",
    });
    expect(captured.slider.productGA, "the analytics facts should be complete").toEqual({
      item_id: 1,
      item_name: "Shoe",
      brand: "Nike",
      brand_id: 2,
      category: "Men",
      category_id: 3,
      price: 20,
      interaction_type: "view",
      likes_count: 4,
      boutique_id: 9,
    });
    expect(captured.slider.imagesByColor, "the slider should get the shared photo groups").toEqual([
      { keys: [], images: ["a"] },
    ]);
  });
});
