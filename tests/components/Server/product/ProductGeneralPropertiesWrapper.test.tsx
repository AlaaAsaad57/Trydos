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
  default: ({ views, language }: any) => <span>views:{views}{language ? `:${language}` : ""}</span>,
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

  it("shows big buyer and recommendation counts in short form, and hands the language to the views", async () => {
    GetProductGeneralData.mockResolvedValue({
      final_rating: 4,
      ratingDetails: [{ count: 1000 }, { count: 250 }],
      total_views: 15300,
      recommendation_stats: [{ count: 10000 }],
    });
    const { container } = render(
      await ProductGeneralPropertiesWrapper({
        globalData: Promise.resolve({ id: 1 }),
        language: "en",
      }),
    );
    const text = container.textContent;
    expect(text, "1,250 buyers should show as 1.2K").toContain("1.2KBuyer Rate");
    expect(text, "10,000 recommendations should show as 10K").toContain("Recommend It By10K");
    expect(text, "the views should get the page language to shorten in").toContain("views:15300:en");
  });

  it("uses ready facts data when it is given, and does not fetch (the /products/temp page)", async () => {
    GetProductGeneralData.mockClear();
    const { container } = render(
      await ProductGeneralPropertiesWrapper({
        globalData: Promise.resolve({ id: "temp" }),
        language: "en",
        generalData: { final_rating: 5, ratingDetails: [{ count: 1000000 }], total_views: 0 },
      }),
    );
    expect(GetProductGeneralData, "the facts were fetched even though ready data was given").not.toHaveBeenCalled();
    expect(container.textContent, "the ready data's 1,000,000 buyers should show as 1M").toContain("1MBuyer Rate");
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

  it("passes hasSizes false when the product has no sizes", async () => {
    GetProductGeneralData.mockResolvedValue({ final_rating: 4, ratingDetails: [] });
    render(
      await ProductGeneralPropertiesWrapper({
        globalData: Promise.resolve({ id: 1, origin_country_iso: "tr" }),
        qtyPricePromise: Promise.resolve({ sizes: [] }),
        language: "en",
      }),
    );
    expect(props.general.hasSizes).toBe(false);
  });

  it("passes hasSizes true when the product has sizes", async () => {
    GetProductGeneralData.mockResolvedValue({ final_rating: 4, ratingDetails: [] });
    render(
      await ProductGeneralPropertiesWrapper({
        globalData: Promise.resolve({ id: 1, origin_country_iso: "tr" }),
        qtyPricePromise: Promise.resolve({ sizes: ["S", "M"] }),
        language: "en",
      }),
    );
    expect(props.general.hasSizes).toBe(true);
  });

  // The size chips and the size reviews hide when a flag says "no sizes".
  // The sheet must agree, or it shows "Buyers Reviews On Product Sizing"
  // for a product whose page shows no sizes.
  it.each([
    ["has_sizes", { sizes: ["M"], has_sizes: false }],
    ["hasSizes", { sizes: ["M"], hasSizes: false }],
  ])("passes hasSizes false when the %s flag is false, even with a sizes list", async (_flag, qty) => {
    GetProductGeneralData.mockResolvedValue({ final_rating: 4, ratingDetails: [] });
    render(
      await ProductGeneralPropertiesWrapper({
        globalData: Promise.resolve({ id: 1, origin_country_iso: "tr" }),
        qtyPricePromise: Promise.resolve(qty),
        language: "en",
      }),
    );
    expect(
      props.general.hasSizes,
      `the sheet would show sizing reviews for ${JSON.stringify(qty)}, but the size sections on the page are hidden`,
    ).toBe(false);
  });

  it("starts the product facts request without waiting for the price data", async () => {
    GetProductGeneralData.mockClear();
    GetProductGeneralData.mockResolvedValue({ final_rating: 4, ratingDetails: [] });
    let finishQty: (v: any) => void = () => {};
    const qtyPricePromise = new Promise((resolve) => {
      finishQty = resolve;
    });
    const pending = ProductGeneralPropertiesWrapper({
      globalData: Promise.resolve({ id: 1 }),
      qtyPricePromise,
      language: "en",
    });
    // Let the wrapper read globalData. The price data is still open.
    await new Promise((r) => setTimeout(r, 0));
    expect(
      GetProductGeneralData,
      "the facts request waited for the price data, so the two fetches ran one after the other",
    ).toHaveBeenCalledWith({ id: 1 });
    finishQty({ sizes: ["M"] });
    render(await pending);
    expect(props.general.hasSizes, "the price data did not reach the sheet after it arrived").toBe(true);
  });
});

