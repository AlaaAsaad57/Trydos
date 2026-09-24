// The listing grid (server side). With products it draws the cards and the
// infinite scroll; with none it shows "No products found", and a "Clear filters"
// link only when a real filter is applied.
import { describe, expect, it, vi } from "vitest";

const sortable = vi.fn();
const infinite = vi.fn();
const card = vi.fn();

vi.mock("components/Server/SortableGrid", () => ({
  default: (props: any) => {
    sortable(props);
    return <div data-pw="grid">{props.children}</div>;
  },
}));
vi.mock("components/ListingPage/ProductInfiniteScroll", () => ({
  default: (props: any) => {
    infinite(props);
    return null;
  },
}));
vi.mock("components/products/ProductCard", () => ({
  default: (props: any) => {
    card(props);
    return <div data-pw="card" />;
  },
}));
vi.mock("components/Listing/PageLoaderReset", () => ({ default: () => null }));
vi.mock("utils/server", () => ({ translateFunction: (key: string) => key }));

import ProductListServer from "components/Server/ProductList";

import { renderWithProviders, screen } from "../../render";

const renderList = (props: Record<string, any>) =>
  renderWithProviders(
    <ProductListServer
      params={{ lang: "sy-en" }}
      currency={null}
      offset={[1]}
      target="/t"
      title="T"
      boutique={undefined}
      parsedFilters={{}}
      products={[]}
      {...props}
    />,
  );

const clearHref = () =>
  document.querySelector('[data-pw="ClearFiltersCta"]')?.getAttribute("href") ?? null;

describe("the listing grid when nothing matched", () => {
  it("shows no Clear filters link when no real filter is applied", async () => {
    await renderList({ parsedFilters: { boutiques: ["nike"] }, products: null });
    expect(screen.getByText("No products found"), "the empty message is missing").toBeInTheDocument();
    expect(clearHref(), "a lone boutique is not a filter, so there is nothing to clear").toBeNull();
  });

  it("clears to the boutique listing, keeping the one boutique", async () => {
    await renderList({ parsedFilters: { boutiques: ["nike"], colors: ["red"] } });
    expect(clearHref(), "clearing should keep the single boutique").toBe("/sy-en/filters/boutiques/nike");
  });

  it("clears to featured, flash deals, or all filters depending on the page", async () => {
    await renderList({ parsedFilters: { search_text: "x" }, isFeatured: true });
    expect(clearHref(), "a featured page should clear to featured").toBe("/sy-en/featured");
  });

  it("clears a flash-deals page to flash deals", async () => {
    await renderList({ parsedFilters: { prices: "1-2" }, isFlashDeals: true });
    expect(clearHref(), "a flash-deals page should clear to flash deals").toBe("/sy-en/flashDeals");
  });

  it("clears several boutiques to the plain listing", async () => {
    await renderList({ parsedFilters: { boutiques: ["a", "b"] } });
    expect(clearHref(), "several boutiques should clear to the plain listing").toBe("/sy-en/filters");
  });
});

describe("the listing grid with products", () => {
  it("draws the cards, marks the first four as priority, and passes the sizes and analytics on", async () => {
    sortable.mockClear();
    card.mockClear();
    infinite.mockClear();
    const products = Array.from({ length: 5 }, (_, i) => ({
      slug: `p${i}`,
      product_id: i,
      name: `P${i}`,
      category: { id: 1, name: "C" },
      brand: { id: 2, name: "B" },
    }));
    const { container } = await renderList({
      products,
      parsedFilters: { sizes: ["M"] },
      boutique: { name: "Nike" },
      sort: "price",
      params: { lang: "sy-ar" },
    });
    expect(card.mock.calls.map(([p]) => p.priority), "only the first four cards should load first").toEqual([
      true, true, true, true, false,
    ]);
    expect(sortable.mock.calls[0][0], "the grid controller should get the server's verdicts and sort").toEqual(
      expect.objectContaining({ serverSort: "price", serverHasResults: true, serverHasMultipleResults: true, sizesFilters: ["M"], boutiqueName: "Nike" }),
    );
    expect(infinite.mock.calls[0][0].analyticsData[0], "the scroll should get analytics rows for the first page").toEqual({
      item_id: 0, item_name: "P0", category: "C", brand: "B", category_id: 1, brand_id: 2,
    });
    expect(container.querySelector(".listing-container")?.className, "the grid should run right to left in Arabic").toContain(
      "flex-row-reverse",
    );
  });

  it("passes no sort and no size filter when none is set, left to right in English", async () => {
    sortable.mockClear();
    const { container } = await renderList({ products: [{ slug: "a" }] });
    expect(sortable.mock.calls[0][0].serverSort, "no sort should be passed as an empty string").toBe("");
    expect(sortable.mock.calls[0][0].sizesFilters, "no sizes should be passed as null").toBeNull();
    expect(sortable.mock.calls[0][0].serverHasMultipleResults, "one product is not several").toBe(false);
    expect(container.querySelector(".listing-container")?.className, "the grid should run left to right in English").not.toContain(
      "flex-row-reverse",
    );
  });
});
