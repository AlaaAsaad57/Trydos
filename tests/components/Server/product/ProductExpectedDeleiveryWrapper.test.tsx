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

import ProductExpectedDeleiveryWrapper from "components/Server/product/ProductExpectedDeleiveryWrapper";

describe("the expected delivery wrapper", () => {
  it("adds the country's shipping days to the product's, and names the country", async () => {
    const { container } = render(
      await ProductExpectedDeleiveryWrapper({
        language: "ar",
        country: "sy",
        globalPromise: Promise.resolve({ id: 1, shipping_days: "2", allow_return_in_days: 7 }),
        StarttingSettingPromise: Promise.resolve({ shipping_duration_days: 3 }),
      }),
    );
    expect(captured.delivery.shipping_days, "the product's own shipping days should be handed on").toBe(2);
    expect(container.textContent, "the total should be the country's days plus the product's").toContain("5 Work Days");
    expect(container.textContent, "the country should be named").toContain("country:sy");
  });

  it("treats missing shipping days as zero and shows a placeholder with no country", async () => {
    const { container } = render(
      await ProductExpectedDeleiveryWrapper({
        language: "en",
        country: "",
        globalPromise: Promise.resolve({ id: 1 }),
        StarttingSettingPromise: Promise.resolve(null),
      }),
    );
    expect(container.textContent, "missing days must count as zero, never NaN").toContain("0 Work Days");
    expect(container.querySelector(".react-loading-skeleton"), "no country should show a placeholder").not.toBeNull();
  });
});
