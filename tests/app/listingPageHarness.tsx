// Shared cases for the two listing pages that differ only in which flag they
// set: /featured (featured: true) and /flashDeals (flashdeal: true).
//
// This file holds the cases, not the mocks. `vi.mock` is hoisted per test file,
// so each test file registers the same mocks itself (see featured/page.test.tsx)
// and hands its spies in here.
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cacheSpies } from "../mocks/serverRequests";
import { navigationSpies } from "../mocks/nextNavigation";

export type ListingSpies = {
  /** Props each stubbed child was last rendered with, by component name. */
  props: Record<string, any>;
  getProductsAndFiltersFromElastic: ReturnType<typeof vi.fn>;
  fetchCurrency: ReturnType<typeof vi.fn>;
  generateMetadataForListing: ReturnType<typeof vi.fn>;
  LogServerError: ReturnType<typeof vi.fn>;
  parseFiltersFromParams: ReturnType<typeof vi.fn>;
  lang: { current: string };
};

type PageModule = {
  default: (args: any) => Promise<any>;
  generateMetadata: (args: any) => Promise<any>;
};

/** A stub child that only remembers the props it was given. */
export const stub = (props: Record<string, any>, name: string) =>
  function Stub(p: any) {
    props[name] = p;
    return p.children ?? null;
  };

export function listingPageCases(
  route: "featured" | "flashDeals",
  load: () => Promise<PageModule>,
  spies: ListingSpies,
) {
  const flags =
    route === "featured"
      ? { featured: true, flashdeal: false }
      : { featured: false, flashdeal: true };

  const args = (filters?: string[], searchParams: Record<string, unknown> | null = {}) => ({
    params: Promise.resolve({ filters }),
    searchParams: Promise.resolve(searchParams),
  });

  const renderPage = async (filters?: string[], searchParams: Record<string, unknown> | null = {}) => {
    const { default: Page } = await load();
    const tree = await Page(args(filters, searchParams));
    render(tree);
    return tree;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(spies.props)) delete spies.props[key];
    spies.lang.current = "sy-en";
    spies.getProductsAndFiltersFromElastic.mockResolvedValue({ products: [] });
    spies.fetchCurrency.mockResolvedValue({ data: { code: "USD", exchange_rate: 1 } });
    spies.generateMetadataForListing.mockResolvedValue({ title: "Listing" });
    cacheSpies.getCurrencyFromCache.mockResolvedValue(null);
  });

  describe(`the ${route} page metadata`, () => {
    it("returns the listing metadata for the search text", async () => {
      const { generateMetadata } = await load();

      const metadata = await generateMetadata(args(["colors", "red"], { search: "shoe" }));

      expect(metadata, "the listing metadata was not returned").toEqual({ title: "Listing" });
      expect(spies.generateMetadataForListing.mock.calls[0][0], "the metadata was not built for this route and search").toMatchObject({
        routeBase: route,
        searchText: "shoe",
      });
    });

    it("returns an empty list and reports when the metadata cannot be built", async () => {
      spies.generateMetadataForListing.mockRejectedValue(new Error("meta down"));
      const { generateMetadata } = await load();

      const metadata = await generateMetadata(args(undefined, null));

      expect(metadata, "a failed metadata build did not fall back to an empty list").toEqual([]);
      expect(spies.LogServerError, "the failed metadata build was not reported").toHaveBeenCalled();
    });
  });

  describe(`the ${route} page`, () => {
    it("moves a legacy search path to ?search= with a permanent redirect", async () => {
      const { default: Page } = await load();

      await expect(Page(args(["search", "red"], { sort: "new" })), "the legacy search path was not redirected").rejects.toThrow();
      expect(navigationSpies.permanentRedirect, "the legacy search path went to the wrong place").toHaveBeenCalledWith(
        `/sy-en/${route}?sort=new&search=red`,
      );
    });

    it(`asks Elasticsearch for ${route} products only, with the sort and search`, async () => {
      await renderPage(["boutiques", "b1", "prices", "10-20,30"], { sort: "price_asc", search: "shoe" });

      const asked = spies.getProductsAndFiltersFromElastic.mock.calls[0][0];
      expect(asked, "the listing was not asked for this route's products").toMatchObject({
        country: "sy",
        language_code: "en",
        limit: 10,
        sort: "price_asc",
        filters: { ...flags, search_text: "shoe", boutiques: ["b1"], prices: [10, 20, 30] },
      });
      expect(spies.props.ProductListConainer, "the product list did not get the parsed filters").toMatchObject({
        sort: "price_asc",
        serverSearch: "shoe",
        language: "en",
      });
      expect(spies.props.FilterWidgetServer.parsedFilters, "the filter widget did not get this route's flags").toMatchObject(flags);
    });

    it("uses the search from the path filters and faces right-to-left in Arabic", async () => {
      spies.lang.current = "iq-ar";
      await renderPage(["colors", "red"], { search: ["not", "a", "string"] });

      expect(spies.props.ListingBarOptions, "the Arabic page did not face right-to-left").toMatchObject({ isRtl: true });
      expect(
        spies.getProductsAndFiltersFromElastic.mock.calls[0][0].filters.search_text,
        "a page with no search text still sent one",
      ).toBeUndefined();
      expect(spies.props.NextLink.href, "the back link does not go to the locale home").toBe("/iq-ar");
    });

    it("takes the search from a search_text path filter when there is no ?search=", async () => {
      spies.parseFiltersFromParams.mockReturnValueOnce({ search_text: ["bag"] });

      await renderPage(["x"]);

      expect(spies.props.ListingSearchContainer.serverSearch, "the path search text was not used").toBe("bag");
    });

    it("reads the currency from the cache when it is stored as text", async () => {
      cacheSpies.getCurrencyFromCache.mockResolvedValue(JSON.stringify({ code: "IQD" }) as any);

      await renderPage();

      await expect(spies.props.FilterWidgetServer.currencyPromise, "the cached text currency was not used").resolves.toEqual({
        code: "IQD",
        redis: true,
      });
    });

    it("reads the currency from the cache when it is stored as an object", async () => {
      cacheSpies.getCurrencyFromCache.mockResolvedValue({ code: "TRY", exchange_rate: 30 } as any);

      await renderPage();

      await expect(spies.props.FilterWidgetServer.currencyPromise, "the cached currency was not used").resolves.toEqual({
        code: "TRY",
        exchange_rate: 30,
        redis: true,
      });
      expect(spies.fetchCurrency, "the currency was fetched although it was cached").not.toHaveBeenCalled();
    });

    it("fetches and stores the currency when the cache has none", async () => {
      await renderPage();

      await expect(spies.props.FilterWidgetServer.currencyPromise, "the fetched currency was not used").resolves.toEqual({
        code: "USD",
        exchange_rate: 1,
        redis: false,
      });
      expect(cacheSpies.StoreCurrency, "the fetched currency was not stored").toHaveBeenCalledWith("sy", {
        code: "USD",
        exchange_rate: 1,
      });
    });

    it("gives no currency and reports when the currency cannot be read", async () => {
      spies.fetchCurrency.mockRejectedValue(new Error("currency down"));

      await renderPage();

      await expect(spies.props.FilterWidgetServer.currencyPromise, "a failed currency read did not give nothing").resolves.toBeUndefined();
      expect(spies.LogServerError, "the failed currency read was not reported").toHaveBeenCalled();
    });

    it("reports and rethrows an error while building the page", async () => {
      spies.parseFiltersFromParams.mockImplementationOnce(() => {
        throw new Error("bad filters");
      });
      const { default: Page } = await load();

      await expect(Page(args(["x"])), "a page build error was swallowed").rejects.toThrow("bad filters");
      expect(spies.LogServerError, "the page build error was not reported").toHaveBeenCalled();
    });

    it("wraps a thrown value that is not an Error", async () => {
      spies.parseFiltersFromParams.mockImplementationOnce(() => {
        throw "plain";
      });
      const { default: Page } = await load();

      await expect(Page(args(["x"])), "a thrown string was not turned into an Error").rejects.toThrow("plain");
    });
  });
}
