// The featured row wrapper on the home page: it waits for the request, reads the
// cached featured products for the locale, and hands them to the row.
import { beforeEach, describe, expect, it, vi } from "vitest";

const connection = vi.fn(async () => undefined);
const getCachedFeatured = vi.fn();

vi.mock("next/server", () => ({ connection: () => connection() }));
vi.mock("serverRequests/cached/home", () => ({
  getCachedFeatured: (...args: any[]) => getCachedFeatured(...args),
}));
vi.mock("components/Server/FeatureProducts", () => ({ default: () => null }));

import { FeaturedProductWrapper } from "components/ServerWrapper/FeaturedProduct";

describe("the featured row wrapper", () => {
  beforeEach(() => {
    connection.mockClear();
    getCachedFeatured.mockReset();
  });

  it("reads the featured products for the locale and category, and passes them with the currency", async () => {
    getCachedFeatured.mockResolvedValue([{ id: 1 }]);
    const element: any = await FeaturedProductWrapper({
      lang: "sy-ar",
      currency: Promise.resolve({ symbol: "$" }),
      mainCategory: "men" as any,
    });
    expect(connection, "the row must wait for the request before rendering cards").toHaveBeenCalled();
    expect(getCachedFeatured, "the featured products must be read for this country, language and category").toHaveBeenCalledWith(
      "sy",
      "ar",
      "men",
    );
    expect(element.props.fetauredProductsData, "the products should reach the row").toEqual({
      data: { products: [{ id: 1 }] },
    });
    expect(element.props.currencyData, "the resolved currency should reach the row").toEqual({ symbol: "$" });
    expect(element.props.lang, "the locale should reach the row").toBe("sy-ar");
  });

  it("reads the whole home page when no category is given", async () => {
    getCachedFeatured.mockResolvedValue([]);
    await FeaturedProductWrapper({ lang: "sy-en", currency: null });
    expect(getCachedFeatured, "no category should be read as null").toHaveBeenCalledWith("sy", "en", null);
  });
});
