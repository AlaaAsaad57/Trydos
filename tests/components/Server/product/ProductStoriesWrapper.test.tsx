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

import ProductStoriesWrapper from "components/Server/product/ProductStoriesWrapper";

describe("the product stories wrapper", () => {
  it("shows nothing when the product has no stories", async () => {
    GetProductStoriesData.mockResolvedValue({ data: [], stories: [] });
    const { container } = render(await ProductStoriesWrapper({ globalPromise: Promise.resolve({ id: 1 }), language: "en" }));
    expect(container.innerHTML, "no stories should draw nothing").toBe("");
  });

  it("hands the first page of stories on, aligned right in Arabic", async () => {
    GetProductStoriesData.mockResolvedValue({ data: [{ id: 5 }], stories: ["s"] });
    const { container } = render(await ProductStoriesWrapper({ globalPromise: Promise.resolve({ id: 1 }), language: "ar" }));
    expect(GetProductStoriesData, "stories must be read for this product, page 1").toHaveBeenCalledWith({ page: 1, productId: 1 });
    expect(captured.stories.InitialStoriesData, "the stories should be handed on").toEqual([{ id: 5 }]);
    expect((container.firstElementChild as HTMLElement).className, "the section should align right in Arabic").toContain("items-end");
  });
});
