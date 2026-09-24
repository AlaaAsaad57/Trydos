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

import ProductDescriptorsWrapper from "components/Server/product/ProductDescriptorsWrapper";

describe("the product descriptors wrapper", () => {
  it("shows nothing when there are no descriptors", async () => {
    const { container } = render(await ProductDescriptorsWrapper({ priceQtyPromise: Promise.resolve({}), isRtl: false }));
    expect(container.innerHTML, "no descriptors should draw nothing").toBe("");
  });

  it("shows each group with its values, separated, with icons and names when present", async () => {
    const { container } = render(
      await ProductDescriptorsWrapper({
        priceQtyPromise: Promise.resolve({
          descriptors: [
            {
              descriptor_group: { icon: "g.png", name: "Material" },
              descriptors: [
                { descriptor: { icon: "c.png", name: "Cotton" }, value: "80%" },
                { descriptor: {}, value: "20%" },
              ],
            },
          ],
        }),
        isRtl: false,
      }),
    );
    expect(container.querySelector(".descriptor-name")?.textContent, "the group name is missing").toBe("Material");
    expect(container.querySelectorAll(".descriptor-separtor").length, "values after the first should be separated").toBe(1);
    expect(container.querySelector('img[alt="Cotton"]'), "a value with an icon should show it").not.toBeNull();
    expect(
      Array.from(container.querySelectorAll(".desc-value")).map((n) => n.textContent),
      "every value should be shown",
    ).toEqual(["80%", "20%"]);
  });
});
