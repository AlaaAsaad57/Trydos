// The /flashDeals listing page (server component) and its metadata.
// The cases are shared with /featured — see ../listingPageHarness.tsx.
import { vi } from "vitest";

import { listingPageCases, stub, type ListingSpies } from "../listingPageHarness";

const spies = vi.hoisted(() => ({
  props: {} as Record<string, any>,
  getProductsAndFiltersFromElastic: vi.fn(),
  fetchCurrency: vi.fn(),
  generateMetadataForListing: vi.fn(),
  LogServerError: vi.fn(),
  parseFiltersFromParams: vi.fn(),
  lang: { current: "sy-en" },
}));

vi.mock("next/root-params", () => ({ lang: async () => spies.lang.current }));
vi.mock("serverRequests", () => ({ fetchCurrency: (...a: unknown[]) => spies.fetchCurrency(...a) }));
vi.mock("services/elastic/elasticSearch", () => ({
  getProductsAndFiltersFromElastic: (...a: unknown[]) => spies.getProductsAndFiltersFromElastic(...a),
}));
vi.mock("serverRequests/meta/listing", () => ({
  generateMetadataForListing: (...a: unknown[]) => spies.generateMetadataForListing(...a),
}));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: (...a: unknown[]) => spies.LogServerError(...a) }));
vi.mock("utils/server", async () => {
  const helpers = await vi.importActual<typeof import("utils/server/helpers")>("utils/server/helpers");
  spies.parseFiltersFromParams.mockImplementation(helpers.parseFiltersFromParams);
  return {
    parseFiltersFromParams: (...a: [string[]]) => spies.parseFiltersFromParams(...a),
    translateFunction: (key: string) => key,
  };
});
vi.mock("components/global/NextLink", async () => ({ default: (await import("../listingPageHarness")).stub(spies.props, "NextLink") }));
vi.mock("components/skeleton/listing", () => ({ default: () => null }));
vi.mock("components/Server/ListingBarActions", async () => ({ default: (await import("../listingPageHarness")).stub(spies.props, "ListingBarActions") }));
vi.mock("components/Server/FilterWidgetServer", async () => ({ default: (await import("../listingPageHarness")).stub(spies.props, "FilterWidgetServer") }));
vi.mock("components/Server/ListingSearchContainer", async () => ({ default: (await import("../listingPageHarness")).stub(spies.props, "ListingSearchContainer") }));
vi.mock("components/Server/FilterListContainer", async () => ({ default: (await import("../listingPageHarness")).stub(spies.props, "FilterListContainer") }));
vi.mock("components/Server/ProductListConainer", async () => ({ default: (await import("../listingPageHarness")).stub(spies.props, "ProductListConainer") }));
vi.mock("components/Listing/ListingBarOptions", async () => ({ default: (await import("../listingPageHarness")).stub(spies.props, "ListingBarOptions") }));

void stub;
listingPageCases(
  "flashDeals",
  () => import("app/(client)/[lang]/flashDeals/[[...filters]]/page") as any,
  spies as unknown as ListingSpies,
);
