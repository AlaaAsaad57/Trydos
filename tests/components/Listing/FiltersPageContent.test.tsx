// @vitest-environment node
//
// The server component behind every filtered listing. It reads the filters out
// of the path, resolves the currency and the boutique, fires one Elasticsearch
// query and hands un-awaited promises to the streamed children.
//
// It is tested by what it DECIDES, not by the markup it returns. The markup is a
// tree of Suspense boundaries whose children are themselves server components
// that never run here; walking it would assert the shape of the file rather than
// the behaviour of the page. The decisions are:
//
//   • what the price filter in the path actually means;
//   • which search wins when the path and the query string both carry one;
//   • what happens when the boutique in the address does not exist;
//   • that the same page rendered twice in one request only queries once.
//
// Each of those has a failure that reaches a shopper and none of them is visible
// in the markup.
import { beforeEach, describe, expect, it, vi } from "vitest";

import FiltersPageContent from "components/Listing/FiltersPageContent";
import { navigationSpies } from "tests/mocks/nextNavigation";

const getProductsAndFiltersFromElastic = vi.fn();
const getBoutiqueInfo = vi.fn();
const getCookieServer = vi.fn();
const LogServerError = vi.fn();
const dedupeRequest = vi.fn();

vi.mock("services/elastic/elasticSearch", () => ({
  getProductsAndFiltersFromElastic: (...args: any[]) =>
    getProductsAndFiltersFromElastic(...args),
}));

vi.mock("services/elastic/elasticsearch-reader.service", () => ({
  ElasticsearchReader: class {
    getBoutiqueInfo(...args: any[]) {
      return getBoutiqueInfo(...args);
    }
  },
}));

vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: (...args: any[]) => getCookieServer(...args),
}));

vi.mock("utils/serverErrorReporter", () => ({
  LogServerError: (...args: any[]) => LogServerError(...args),
  default: vi.fn(),
}));

// Recorded, and the work is run straight through, so a test can read the key
// that decides whether two renders share one query.
vi.mock("serverRequests/requestDedup", () => ({
  dedupeRequest: (key: string, work: () => any) => {
    dedupeRequest(key);
    return work();
  },
}));

vi.mock("serverRequests", () => ({
  fetchCurrency: vi.fn().mockResolvedValue({ data: { exchange_rate: 1 } }),
}));

/** Run the page and hand back the filters the Elasticsearch query was given. */
async function filtersSentToElastic() {
  return getProductsAndFiltersFromElastic.mock.calls[0][0].filters;
}

async function renderPage({
  filters = [] as string[],
  sort,
  search,
  intercepted = false,
}: {
  filters?: string[];
  sort?: string;
  search?: string;
  intercepted?: boolean;
} = {}) {
  return FiltersPageContent({
    params: { lang: "gb-en", filters },
    sort,
    search,
    intercepted,
  } as any);
}

describe("the filtered listing page", () => {
  beforeEach(() => {
    getProductsAndFiltersFromElastic.mockReset();
    getProductsAndFiltersFromElastic.mockResolvedValue({ products: [] });
    getBoutiqueInfo.mockReset();
    getBoutiqueInfo.mockResolvedValue({ banners: [], name: "Blue Boutique" });
    getCookieServer.mockReset();
    getCookieServer.mockResolvedValue({ id: "42" });
    LogServerError.mockReset();
    dedupeRequest.mockReset();
    navigationSpies.redirect.mockClear();
  });

  describe("reading a price band out of the address", () => {
    it("keeps both bounds of a band written with a dash", async () => {
      await renderPage({ filters: ["prices", "10-50"] });

      expect(
        (await filtersSentToElastic()).prices,
        "a price card writes its band as one dash-joined token, and both numbers in it are bounds the shopper chose",
      ).toEqual([10, 50]);
    });

    it("keeps both bounds of a band written with a comma", async () => {
      await renderPage({ filters: ["prices", "10,50"] });

      expect(
        (await filtersSentToElastic()).prices,
        "once a numeric band has gone through the shared link builder — which any other filter tap does — it comes back comma-joined; reading only the dash form collapses the band to [10,10] and the listing goes empty",
      ).toEqual([10, 50]);
    });

    it("drops anything in the band that is not a number", async () => {
      await renderPage({ filters: ["prices", "10-abc"] });

      expect(
        (await filtersSentToElastic()).prices,
        "a hand-edited address must not put NaN into the query, where it would match nothing and look like an empty catalogue",
      ).toEqual([10]);
    });
  });

  describe("which search the listing runs", () => {
    it("uses the one in the query string", async () => {
      await renderPage({ search: "blue shirt" });

      expect(
        (await filtersSentToElastic()).search_text,
        "the query string is where the search box writes what the shopper typed, so it is what the listing must search for",
      ).toBe("blue shirt");
    });

    it("falls back to the one in the path", async () => {
      await renderPage({ filters: ["search", "blue%20shirt"] });

      expect(
        (await filtersSentToElastic()).search_text,
        "the filter window applies its search as a path segment rather than a query value, so both spellings of a search have to work",
      ).toBeTruthy();
    });

    it("prefers the query string when the address carries both", async () => {
      await renderPage({
        filters: ["search", "trousers"],
        search: "blue shirt",
      });

      expect(
        (await filtersSentToElastic()).search_text,
        "the query string is the one the search box just wrote; the path is the older one it is replacing, so a path that wins puts back the word the shopper deleted",
      ).toBe("blue shirt");
    });

    it("searches for nothing when neither carries one", async () => {
      await renderPage({ filters: ["categories", "shoes"] });

      expect(
        (await filtersSentToElastic()).search_text,
        "an empty search must be absent rather than an empty string — asking the backend to match '' is a different question from not searching",
      ).toBeUndefined();
    });
  });

  describe("a filtered listing is never featured or flash deals", () => {
    it("says so on every query", async () => {
      await renderPage({ filters: ["categories", "shoes"] });

      const sent = await filtersSentToElastic();
      expect(
        sent.featured,
        "this page is the general filtered listing; leaving the flag off would let it inherit whatever the caller happened to pass and quietly narrow to featured products",
      ).toBe(false);
      expect(
        sent.flashdeal,
        "the same holds for flash deals",
      ).toBe(false);
    });
  });

  describe("a boutique that does not exist", () => {
    it("sends the shopper to the home page with something to show them", async () => {
      getBoutiqueInfo.mockResolvedValue({ banners: null });

      await expect(
        renderPage({ filters: ["boutiques", "gone-away"] }),
        "a dead boutique link must move the browser; the redirect stand-in throws exactly as the real one does",
      ).rejects.toThrow();

      expect(
        navigationSpies.redirect,
        "a shop that has closed leaves its links all over the web, and landing them on an empty 'Search' listing tells the shopper nothing about why",
      ).toHaveBeenCalledWith("/gb-en?message=boutique_not_found");
    });

    it("hands an intercepted overlay something that can navigate from the browser", async () => {
      getBoutiqueInfo.mockResolvedValue({ banners: null });

      const result: any = await renderPage({
        filters: ["boutiques", "gone-away"],
        intercepted: true,
      });

      expect(
        navigationSpies.redirect,
        "Next isolates errors thrown inside a parallel route slot, so a redirect raised there is serialised into the stream and never moves the browser — the overlay has to be told to navigate itself",
      ).not.toHaveBeenCalled();
      expect(
        result?.props?.href,
        "and it has to be told where to go",
      ).toBe("/gb-en?message=boutique_not_found");
    });

    it("reports a boutique read that failed, rather than treating it as missing", async () => {
      getBoutiqueInfo.mockRejectedValue(new Error("the search index is down"));

      await renderPage({ filters: ["boutiques", "blue-boutique"] });

      expect(
        LogServerError,
        "a dead search index and a deleted shop look the same from here, and only one of them is somebody's fault — the failure has to be reported",
      ).toHaveBeenCalled();
    });

    it("still draws the listing when the boutique read failed", async () => {
      getBoutiqueInfo.mockRejectedValue(new Error("the search index is down"));

      await renderPage({ filters: ["boutiques", "blue-boutique"] });

      expect(
        getProductsAndFiltersFromElastic,
        "a missing banner is not a missing listing — the products are a separate query and must still be asked for",
      ).toHaveBeenCalled();
    });
  });

  describe("the same page rendered twice in one request", () => {
    it("keys the query on everything that makes it unique", async () => {
      await renderPage({
        filters: ["categories", "shoes"],
        sort: "price_asc",
        search: "blue shirt",
      });

      const key = dedupeRequest.mock.calls[0][0];
      expect(
        key,
        "this page renders twice per request — once as the page and once as the intercepted overlay — and without one shared key both fire the query and the discarded copy leaks its snapshot",
      ).toContain("price_asc");
      expect(
        key,
        "the search has to be in the key, or two different searches in one request would share one answer",
      ).toContain("blue shirt");
      expect(
        key,
        "and so do the filters, for the same reason",
      ).toContain("shoes");
    });

    it("keys on who is asking", async () => {
      getCookieServer.mockResolvedValue({ id: "42" });

      await renderPage({ filters: ["categories", "shoes"] });

      expect(
        dedupeRequest.mock.calls[0][0],
        "the listing is personalised, so two shoppers must never share a cached answer inside one request",
      ).toContain("42");
    });
  });

  describe("the sort the shopper asked for", () => {
    it("is passed to the query", async () => {
      await renderPage({ filters: ["categories", "shoes"], sort: "price_asc" });

      expect(
        getProductsAndFiltersFromElastic.mock.calls[0][0].sort,
        "the order is server-rendered from `?sort=`; dropping it here would make the sort widget change the address and nothing else",
      ).toBe("price_asc");
    });

    it("is left out entirely when there is none", async () => {
      await renderPage({ filters: ["categories", "shoes"] });

      expect(
        getProductsAndFiltersFromElastic.mock.calls[0][0].sort,
        "the default order is the absence of a sort, not a sort named 'relevance'",
      ).toBeUndefined();
    });
  });

  describe("paging through one unchanging set of results", () => {
    it("opens a snapshot for the filter session", async () => {
      await renderPage({ filters: ["categories", "shoes"] });

      expect(
        getProductsAndFiltersFromElastic.mock.calls[0][0].usePit,
        "products move in and out of the index while the shopper scrolls; without a snapshot, page two is drawn from a different set than page one and items are repeated or skipped",
      ).toBe(true);
    });
  });
});
