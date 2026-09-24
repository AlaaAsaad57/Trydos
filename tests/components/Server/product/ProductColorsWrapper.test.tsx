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

import ProductColorsWrapper from "components/Server/product/ProductColorsWrapper";

describe("the product colours wrapper", () => {
  it("shows nothing for a product with one colour or none", async () => {
    const one = render(await ProductColorsWrapper({ isRtl: false, globalPromise: Promise.resolve({ sync_color_images: [{}] }), activeColor: null, language: "en", country: "sy", slug: "shoe" }));
    expect(one.container.innerHTML, "one colour needs no picker").toBe("");
    const none = render(await ProductColorsWrapper({ isRtl: false, globalPromise: Promise.resolve({}), activeColor: null, language: "en", country: "sy", slug: "shoe" }));
    expect(none.container.innerHTML, "no colours need no picker").toBe("");
  });

  it("links each colour to its own page, reversed in Arabic", async () => {
    captured.colorItems = [];
    const { container } = render(
      await ProductColorsWrapper({
        isRtl: true,
        globalPromise: Promise.resolve({
          sync_color_images: [
            { color_option: "red", color_name: "Red", images: ["r.png"], color_trend: 1 },
            { color_option: "blue", images: ["b.png"] },
          ],
        }),
        activeColor: "red",
        language: "ar",
        country: "sy",
        slug: "shoe",
      }),
    );
    expect(captured.colorItems.map((p: any) => p.href), "each colour should link to its own page").toEqual([
      "/sy-ar/products/shoe?color=red",
      "/sy-ar/products/shoe?color=blue",
    ]);
    expect(captured.colorItems[0].trend, "a trending colour should be marked").toBe(true);
    expect(captured.colorItems[1].colorKeys, "missing keys should be dropped").toEqual(["blue"]);
    expect(container.querySelector('[data-pw="AvailableColor"]')?.className, "the picker should be reversed in Arabic").toContain("flex-row-reverse");
  });
});
