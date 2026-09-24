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

import ProductFeaturesWrapper from "components/Server/product/ProductFeaturesWrapper";

describe("the product labels wrapper", () => {
  it("shows each label in alternating colours, right to left in Arabic", async () => {
    const { container } = render(
      await ProductFeaturesWrapper({ globalPromise: Promise.resolve({ label_names: '["New","Hot","Sale"]' }), isRtl: true }),
    );
    const labels = Array.from(container.querySelectorAll('[style]')) as HTMLElement[];
    expect(labels.map((l) => l.textContent), "every label should be shown").toEqual(["New", "Hot", "Sale"]);
    expect(labels[0].style.color, "the colours should alternate").toBe(labels[2].style.color);
    expect(labels[0].style.color, "neighbouring labels should differ").not.toBe(labels[1].style.color);
    expect(labels[0].className, "labels should be marked RTL in Arabic").toContain("dir-rtl");
  });

  it("shows no labels when the product has none", async () => {
    const { container } = render(await ProductFeaturesWrapper({ globalPromise: Promise.resolve({}), isRtl: false }));
    expect(container.querySelectorAll("[style]").length, "no labels should be drawn").toBe(0);
  });
});
