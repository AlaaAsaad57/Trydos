import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let lang = "sy-en";
vi.mock("next/root-params", () => ({ lang: async () => lang }));

const getCachedFeatured = vi.fn();
const getCachedFlashDeals = vi.fn();
vi.mock("serverRequests/cached/home", () => ({
  getCachedFeatured: (...a: any[]) => getCachedFeatured(...a),
  getCachedFlashDeals: (...a: any[]) => getCachedFlashDeals(...a),
}));
vi.mock("serverRequests/cached/currency", () => ({
  getCachedCurrency: () => Promise.resolve({ code: "USD" }),
}));

const { stub } = vi.hoisted(() => ({ stub: (id: string) => ({
  default: (props: any) => (
    <div data-testid={id} data-props={JSON.stringify(props)}>
      {props.children}
    </div>
  ),
}) }));
vi.mock("components/Home/Search/SearchIcon", () => stub("search"));
vi.mock("components/Server/MainCategories", () => stub("categories"));
vi.mock("components/Home/Stories/StoriesBarClient", () => stub("stories"));
vi.mock("components/Home", () => stub("home"));
vi.mock("components/ServerWrapper/RecommendedWrapper", () => stub("recommended"));
vi.mock("components/ServerWrapper/BoutiquesListWrapper", () => ({
  BoutiquesListWrapper: (props: any) => <div data-testid="boutiques">{props.children}</div>,
}));
vi.mock("components/ServerWrapper/FlashDealsProduct", () => ({
  FlashProductWrapper: () => <div data-testid="flash" />,
}));
vi.mock("components/ServerWrapper/FeaturedProduct", () => ({
  FeaturedProductWrapper: () => <div data-testid="featured" />,
}));
vi.mock("components/skeleton/MobileNavigation", () => ({ default: () => null }));
vi.mock("components/skeleton/OfferList", () => ({ default: () => null }));
vi.mock("components/skeleton/loaders/FeaturedProductsSkeleton", () => ({ default: () => null }));

import CategoryHomeView from "components/Home/CategoryHomeView";

describe("CategoryHomeView", () => {
  beforeEach(() => {
    lang = "sy-en";
    getCachedFeatured.mockReset();
    getCachedFlashDeals.mockReset();
  });

  it("home page: shows both product rows and the recommendations when both rows have products", async () => {
    getCachedFeatured.mockResolvedValue([{ id: 1 }]);
    getCachedFlashDeals.mockResolvedValue([{ id: 2 }]);
    const { container } = render(await CategoryHomeView({ slug: null }));
    expect(screen.getByTestId("featured"), "the featured row is missing").toBeInTheDocument();
    expect(screen.getByTestId("flash"), "the flash-deal row is missing").toBeInTheDocument();
    expect(screen.getByTestId("recommended"), "the home page lost its recommendations").toBeInTheDocument();
    expect(
      JSON.parse(screen.getByTestId("search").dataset.props!),
      "the search bar got the wrong locale",
    ).toEqual({ country: "sy", language: "en" });
    expect(container.firstElementChild!.className, "an English page must lay out left to right").toContain("flex-row pl-[10px]");
    expect(getCachedFeatured, "the featured row was asked for the wrong page").toHaveBeenCalledWith("sy", "en", null);
  });

  it("category page: hides empty rows and the recommendations, right to left in Arabic", async () => {
    lang = "iq-ar";
    getCachedFeatured.mockResolvedValue([]);
    getCachedFlashDeals.mockResolvedValue([]);
    const { container } = render(await CategoryHomeView({ slug: "shoes" }));
    expect(screen.queryByTestId("featured"), "an empty featured row was reserved").toBeNull();
    expect(screen.queryByTestId("flash"), "an empty flash-deal row was reserved").toBeNull();
    expect(screen.queryByTestId("recommended"), "a category page must not show recommendations").toBeNull();
    expect(container.firstElementChild!.className, "an Arabic page must lay out right to left").toContain("flex-row-reverse");
  });

  it("keeps a row when its read fails, so a broken backend hides nothing", async () => {
    lang = "iq-ku";
    getCachedFeatured.mockRejectedValue(new Error("down"));
    getCachedFlashDeals.mockRejectedValue(new Error("down"));
    render(await CategoryHomeView({ slug: "bags" }));
    expect(screen.getByTestId("featured"), "a failed featured read hid the row").toBeInTheDocument();
    expect(screen.getByTestId("flash"), "a failed flash-deal read hid the row").toBeInTheDocument();
  });
});
