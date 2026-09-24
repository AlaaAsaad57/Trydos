// The facts row under the product name: rating, buyers, views, quality,
// recommendations and where it was made.
import { describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";

const { GetProductGeneralData, props } = vi.hoisted(() => ({
  GetProductGeneralData: vi.fn(),
  props: {} as any,
}));
vi.mock("serverRequests/product", () => ({
  GetProductGeneralData: (...a: any[]) => GetProductGeneralData(...a),
}));
vi.mock("utils/server", () => ({
  translateFunction: (key: string) => key,
  madeInText: (iso: string) => `Made in ${iso}`,
}));
vi.mock("components/products/ProductGeneralProperties", () => ({
  default: (p: any) => {
    props.general = p;
    return <div data-pw="general">{p.children}</div>;
  },
}));
vi.mock("components/products/ProductViews", () => ({
  default: ({ views }: any) => <span>views:{views}</span>,
}));

import ProductGeneralPropertiesWrapper from "components/Server/product/ProductGeneralPropertiesWrapper";

describe("the product facts row", () => {
  it("shows nothing for a product without an id", async () => {
    GetProductGeneralData.mockResolvedValue({});
    const { container } = render(
      await ProductGeneralPropertiesWrapper({ globalData: Promise.resolve({}), language: "en" }),
    );
    expect(container.innerHTML, "a product without an id has no facts to show").toBe("");
  });

  it("shows buyers, views, quality, recommendations and the origin", async () => {
    GetProductGeneralData.mockResolvedValue({
      final_rating: 4,
      ratingDetails: [{ count: 2 }, { count: 3 }],
      total_views: 10,
      good_quality_product: true,
      recommendation_stats: [{ count: 6 }],
    });
    const { container } = render(
      await ProductGeneralPropertiesWrapper({
        globalData: Promise.resolve({ id: 1, origin_country_iso: "tr" }),
        language: "ar",
      }),
    );
    const text = container.textContent;
    expect(text, "the buyer count should be the sum of the rating counts").toContain("5Buyer Rate");
    expect(text, "the views should be shown").toContain("views:10");
    expect(text, "a good-quality product should say so").toContain("Good Quality Product");
    expect(text, "the recommendations should be counted").toContain("Recommend It By6");
    expect(text, "the origin country should be shown").toContain("Made in tr");
    expect(props.general.total_rating, "the rating should reach the facts panel").toBe(4);
  });

  it("leaves out the empty facts", async () => {
    GetProductGeneralData.mockResolvedValue({ final_rating: 0, total_views: 0, good_quality_product: true });
    const { container } = render(
      await ProductGeneralPropertiesWrapper({
        globalData: Promise.resolve({ id: 1, origin_country_iso: "zz" }),
        language: "en",
      }),
    );
    const text = container.textContent;
    expect(text, "no buyers should show no buyer count").not.toContain("Buyer Rate");
    expect(text, "quality needs buyers to vouch for it").not.toContain("Good Quality Product");
    expect(text, "an unknown country must not be shown").not.toContain("Made in");
  });
});
