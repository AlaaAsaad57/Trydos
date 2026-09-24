// The boutique offers section on the home page. It reads the cached boutiques
// and hands the search engine's page marker to the list under both names.
import { describe, expect, it, vi } from "vitest";

const getCachedBoutiques = vi.fn();

vi.mock("serverRequests/cached/home", () => ({
  getCachedBoutiques: (...args: any[]) => getCachedBoutiques(...args),
}));
vi.mock("components/Server/OfferListServer", () => ({ default: () => null }));

import { BoutiquesListWrapper } from "components/ServerWrapper/BoutiquesListWrapper";

describe("the boutique offers wrapper", () => {
  it("reads the boutiques for the locale and passes the page marker as both offset and searchAfter", async () => {
    getCachedBoutiques.mockResolvedValue({ boutiques: [{ slug: "b" }], offset: [5] });
    const params = { lang: "sy-ar" };
    const element: any = await BoutiquesListWrapper({
      params,
      mainCategory: "kids",
      children: "recommended",
    });
    expect(getCachedBoutiques, "the boutiques must be read for this country, language and category").toHaveBeenCalledWith(
      "sy",
      "ar",
      "kids",
    );
    expect(element.props.boutiquesData, "the list must get the boutiques and the page marker under both names").toEqual({
      boutiques: [{ slug: "b" }],
      offset: [5],
      searchAfter: [5],
    });
    expect(element.props.children, "the personal recommendations must be passed through").toBe("recommended");
  });

  it("uses no category and no children by default", async () => {
    getCachedBoutiques.mockResolvedValue({ boutiques: [], offset: null });
    const element: any = await BoutiquesListWrapper({ params: { lang: "sy-en" } });
    expect(getCachedBoutiques, "no category should be read as null").toHaveBeenLastCalledWith("sy", "en", null);
    expect(element.props.children, "no recommendations should be passed when none were given").toBeNull();
  });
});
