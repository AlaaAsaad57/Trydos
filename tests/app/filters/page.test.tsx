// The /filters listing page (server component) and its metadata.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { navigationSpies } from "../../mocks/nextNavigation";

const spies = vi.hoisted(() => ({
  generateMetadataForListing: vi.fn(),
  LogServerError: vi.fn(),
  lang: { current: "sy-en" },
}));

vi.mock("next/root-params", () => ({ lang: async () => spies.lang.current }));
vi.mock("serverRequests/meta/listing", () => ({
  generateMetadataForListing: (...a: unknown[]) => spies.generateMetadataForListing(...a),
}));
vi.mock("serverRequests/meta/StructuredData/Constants", () => ({ General_Site_Data: { url: "https://trydos.test" } }));
vi.mock("utils/serverErrorReporter", () => ({ LogServerError: (...a: unknown[]) => spies.LogServerError(...a) }));
vi.mock("utils/server", () => ({ translateFunction: (key: string, language: string) => `${language}:${key}` }));
vi.mock("components/Listing/FiltersPageContent", () => ({ default: () => null }));

import FiltersPageContent from "components/Listing/FiltersPageContent";
import Page, { generateMetadata } from "app/(client)/[lang]/filters/[[...filters]]/page";

const args = (filters?: string[], searchParams: Record<string, unknown> | null = {}) => ({
  params: Promise.resolve({ filters }),
  searchParams: Promise.resolve(searchParams),
});

beforeEach(() => {
  vi.clearAllMocks();
  spies.lang.current = "sy-en";
  spies.generateMetadataForListing.mockResolvedValue({ title: "Listing" });
});

describe("the filters page metadata", () => {
  it("returns the listing metadata for the search text", async () => {
    const metadata = await generateMetadata(args(["colors", "red"], { search: "shoe" }));

    expect(metadata, "the listing metadata was not returned").toEqual({ title: "Listing" });
    expect(spies.generateMetadataForListing.mock.calls[0][0].searchText, "the search text was not used").toBe("shoe");
  });

  it("falls back to translated default metadata with the filter path when the build fails", async () => {
    spies.lang.current = "iq-ar";
    spies.generateMetadataForListing.mockRejectedValue(new Error("meta down"));

    const metadata: any = await generateMetadata(args(["colors", "red"], null));

    expect(spies.LogServerError, "the failed metadata build was not reported").toHaveBeenCalled();
    expect(metadata.title, "the fallback title was not translated to Arabic").toBe(
      "ar:TryDos - Boutique & Product Listing",
    );
    expect(metadata.alternates.canonical, "the fallback canonical does not carry the filter path").toBe(
      "https://trydos.test/iq-ar/filters/colors/red",
    );
    expect(metadata.twitter.images, "the fallback share image is missing").toEqual([
      "https://trydos.test/opengraph-image.png",
    ]);
  });

  it("leaves the filter path out of the fallback canonical when there are no filters", async () => {
    spies.generateMetadataForListing.mockRejectedValue(new Error("meta down"));

    const metadata: any = await generateMetadata(args(undefined));

    expect(metadata.openGraph.url, "the fallback address has a filter path without filters").toBe(
      "https://trydos.test/sy-en/filters",
    );
  });
});

describe("the filters page", () => {
  it("moves a legacy search path to ?search= with a permanent redirect", async () => {
    await expect(Page(args(["search", "red"])), "the legacy search path was not redirected").rejects.toThrow();

    expect(navigationSpies.permanentRedirect, "the legacy search path went to the wrong place").toHaveBeenCalledWith(
      "/sy-en/filters?search=red",
    );
  });

  it("hands the filters, sort and search to the page content", async () => {
    const tree: any = await Page(args(["colors", "red"], { sort: "new", search: "shoe" }));

    expect(tree.type, "the page did not render the filters page content").toBe(FiltersPageContent);
    expect(tree.props, "the page content did not get the filters, sort and search").toEqual({
      params: { filters: ["colors", "red"] },
      sort: "new",
      search: "shoe",
    });
  });

  it("passes no sort or search when they are not text", async () => {
    const tree: any = await Page(args(undefined, null));

    expect(tree.props.sort, "a missing sort was passed on").toBeUndefined();
    expect(tree.props.search, "a missing search was passed on").toBeUndefined();
  });
});
