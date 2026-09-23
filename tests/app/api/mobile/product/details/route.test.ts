// @vitest-environment node
//
// The mobile product-details route: it merges the two backend product answers
// with the Elasticsearch block and reshapes them into the mobile contract.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetGlobalProduct = vi.fn();
const GetProductPriceQtyDetails = vi.fn();
vi.mock("serverRequests/product", () => ({
  GetGlobalProduct: (...a: unknown[]) => GetGlobalProduct(...a),
  GetProductPriceQtyDetails: (...a: unknown[]) => GetProductPriceQtyDetails(...a),
}));
const getProductDataFromElastic = vi.fn();
vi.mock("utils/pagesDataRequests/ProductPageData", () => ({
  getProductDataFromElastic: (...a: unknown[]) => getProductDataFromElastic(...a),
}));
const LogServerError = vi.fn();
vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...a: unknown[]) => LogServerError(...a),
}));

import { GET, OPTIONS } from "app/api/mobile/product/details/[slug]/route";

const call = (query = "", headers: Record<string, string> = {}) =>
  GET(new NextRequest(`https://trydos.test/api/mobile/product/details/shoe${query}`, { headers }), {
    params: Promise.resolve({ slug: "shoe" }),
  });

const read = async (query = "", headers: Record<string, string> = {}) =>
  (await (await call(query, headers)).json()).data;

beforeEach(() => {
  vi.clearAllMocks();
  GetGlobalProduct.mockResolvedValue({ id: 5, name: "Shoe", slug: "shoe" });
  GetProductPriceQtyDetails.mockResolvedValue({ price: "100", offer_price: "80", shipping_days: 2 });
  getProductDataFromElastic.mockResolvedValue({ total_rating: "4.5", buyers_comment: { total: 3 }, total_views: 9 });
});

describe("the mobile product-details route", () => {
  it("answers a preflight with 204 and open CORS headers", async () => {
    const response = await OPTIONS();

    expect(response.status, "the preflight did not answer 204").toBe(204);
    expect(response.headers.get("access-control-allow-origin"), "the preflight is not open to every origin").toBe("*");
  });

  it("asks both backends with the request's locale and the cache switch", async () => {
    await call("?no_cache=true&user_id=7", { country: "iq", lang: "ar" });

    expect(GetGlobalProduct, "the global product was not asked with the request's locale").toHaveBeenCalledWith({
      slug: "shoe",
      language: "ar",
      country: "iq",
      noCache: true,
    });
    expect(getProductDataFromElastic, "Elasticsearch was not asked for this product and shopper").toHaveBeenCalledWith({
      productId: 5,
      lang: "ar",
      slug: "shoe",
      userId: "7",
    });
  });

  it("uses Syria, English and the cache when the request says nothing", async () => {
    await call();

    expect(GetProductPriceQtyDetails.mock.calls[0][0], "the defaults were not applied").toEqual({
      slug: "shoe",
      language: "en",
      country: "sy",
      noCache: false,
    });
  });

  it("reshapes a full product into the mobile contract", async () => {
    GetGlobalProduct.mockResolvedValue({
      id: 5,
      name: "Shoe",
      slug: "shoe",
      images: ["https://img/1.png", { file_path: "https://img/2.png", original_width: "10" }, { nope: 1 }, null],
      brand: { id: 1, slug: "b", name: "Brand", icon: "https://img/b.png" },
      label_names: '["new"]',
      colors: [{ name: "Red", code: "#f00", option: "r" }, { name: "Blue", color: "#00f" }, { name: "None" }],
      sync_color_images: [{ color_name: "Red", images: ["https://img/r.png"] }, { color_name: "Blue" }],
      luck_price: 5,
      is_luck: true,
    });
    getProductDataFromElastic.mockResolvedValue(null);

    const data = await read();

    expect(data.images, "the images were not wrapped as file_path objects").toEqual([
      { file_path: "https://img/1.png", original_width: "0", original_height: "0" },
      { file_path: "https://img/2.png", original_width: "10", original_height: "0" },
    ]);
    expect(data.thumbnail?.file_path, "the thumbnail is not the first image").toBe("https://img/1.png");
    expect(data.brand, "the brand was not reshaped with its icon").toMatchObject({
      id: 1,
      is_verified: null,
      icon: { file_path: "https://img/b.png" },
    });
    expect(data.label_names, "the label names were not turned into an array").toEqual(["new"]);
    expect(data.colors, "the colors were not keyed on color").toEqual([
      { name: "Red", color: "#f00", option: "r" },
      { name: "Blue", color: "#00f", option: undefined },
      { name: "None", color: false, option: undefined },
    ]);
    expect(data.sync_color_images[1], "a color with no images did not get an empty list").toMatchObject({
      images: [],
      color_trend: false,
    });
    expect(data.redeem_price, "the redeem price is not the luck price").toBe(5);
    expect(data.has_discount, "an 80 offer on a 100 price is not a discount").toBe(true);
    expect(data.rating, "a product with no Elasticsearch data did not get a zero rating").toEqual({
      overall_rating: 0,
      total_rating: 0,
    });
  });

  it("fills safe defaults for a bare product", async () => {
    GetGlobalProduct.mockResolvedValue({ id: 5, label_names: "not json", price: "x" });
    GetProductPriceQtyDetails.mockResolvedValue({});

    const data = await read();

    expect(data.images, "a product with no images did not get an empty list").toEqual([]);
    expect(data.brand, "a product with no brand did not get null").toBeNull();
    expect(data.thumbnail, "a product with no images got a thumbnail").toBeNull();
    expect(data.label_names, "unreadable label names did not become an empty list").toEqual([]);
    expect(data.has_discount, "a product with no numeric price was marked discounted").toBe(false);
    expect(data.views_count, "the views count is not the Elasticsearch view counter").toBe(9);
  });

  it("turns label names that are neither text nor a list into an empty list", async () => {
    GetGlobalProduct.mockResolvedValue({ id: 5, label_names: { a: 1 } });

    expect((await read()).label_names, "an object of label names was not dropped").toEqual([]);
  });

  it("keeps label names that are already a list, and a JSON value that is not a list becomes empty", async () => {
    GetGlobalProduct.mockResolvedValue({ id: 5, label_names: ["hot"] });
    expect((await read()).label_names, "a list of label names was not kept").toEqual(["hot"]);

    GetGlobalProduct.mockResolvedValue({ id: 5, label_names: '{"a":1}' });
    expect((await read()).label_names, "a JSON object of label names was not dropped").toEqual([]);
  });

  it.each([
    ["ar", "ar-EG"],
    ["tr", "tr-TR"],
    ["ku", "en-GB"],
  ])("formats the delivery date for %s", async (language, locale) => {
    const data = await read("", { language });

    const expected = new Date();
    expected.setDate(expected.getDate() + 2);
    expect(data.delivery_at, `the ${language} delivery date is not in ${locale}`).toBe(
      new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(expected),
    );
  });

  it("gives no delivery date when the shipping days make an impossible date", async () => {
    GetProductPriceQtyDetails.mockResolvedValue({ shipping_days: "Infinity" });

    expect((await read()).delivery_at, "an impossible delivery date was not null").toBeNull();
  });

  it("answers 500 and reports when Elasticsearch throws", async () => {
    getProductDataFromElastic.mockRejectedValue(new Error("es down"));

    const response = await call();

    expect(response.status, "an Elasticsearch failure did not become 500").toBe(500);
    expect(response.headers.get("access-control-allow-origin"), "the 500 lost its CORS header").toBe("*");
    expect(LogServerError, "the Elasticsearch failure was not reported").toHaveBeenCalled();
  });
});
