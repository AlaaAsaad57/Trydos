// The listing's product grid — everything below the first server-rendered page.
// It pages through results as the shopper scrolls, and it is where three
// separate kinds of silent failure live.
//
// 1. DUPLICATES. Results move between pages while the shopper is reading them, so
//    the same product can arrive twice. The grid keeps every id it has already
//    shown and appends only what it has never seen. A break here shows the same
//    product twice and nothing reports it.
//
// 2. A STALLED SCROLL. A full page whose items were all seen before appends
//    nothing, which leaves the in-view sentinel exactly where it was — so
//    nothing asks for the next page and the grid stops dead, halfway down a list
//    that has more in it. The grid fetches the next page itself to get past
//    that, and caps how many times it will do so, because an unbounded version
//    of the same loop spins for ever.
//
// 3. A STUCK FULL-SCREEN LOADER. The loader is switched on by the link that
//    started the navigation and switched off here. Which moment counts as
//    "arrived" differs: a normal navigation has its grid already server-
//    rendered, so mounting is enough; a client-owned refetch (a sort confirm, a
//    search) has an empty grid at mount, so the loader has to stay up until the
//    data actually lands.
//
// None of the three looks like an error. All three need a test that reads the
// grid, not the response.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import ProductsInfiniteScroll from "components/ListingPage/ProductInfiniteScroll";
import { useAppStore } from "store";

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

const GetProducts = vi.fn();
const GAevent = vi.fn();
const showErrorNotification = vi.fn();

vi.mock("serverRequests/listing", () => ({
  GetProducts: (...args: any[]) => GetProducts(...args),
  GetNextPageFilters: vi.fn(),
  GetFilters: vi.fn(),
}));

vi.mock("utils/gtag", () => ({
  GAevent: (...args: any[]) => GAevent(...args),
  pageview: vi.fn(),
}));

vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  showErrorNotification: (...args: any[]) => showErrorNotification(...args),
}));

vi.mock("services/auth", () => ({
  default: { UserID: () => "user-1" },
}));

// The real card is covered by its own file; here it would only add noise, and a
// grid of 10 of them per page makes every failure message longer, not clearer.
vi.mock("components/products/ProductCard", () => ({
  default: ({ product }: any) => (
    <div data-pw="product-card">{product.name}</div>
  ),
}));

vi.mock("components/skeleton/listing", () => ({
  ProductCardSkeleton: () => <div data-pw="product-card-skeleton" />,
  default: () => <div />,
}));

// The real sentinel needs a viewport and an IntersectionObserver. A button that
// reports "you can see me" is the same signal, and a test can press it.
vi.mock("react-intersection-observer", () => ({
  InView: ({ onChange }: any) => (
    <button type="button" onClick={() => onChange(true)}>
      scrolled to the bottom
    </button>
  ),
}));

/** The page size the grid asks for. Fewer than this means the last page. */
const PAGE_LIMIT = 10;

/** One page of results, exactly as the listing backend hands it back. */
function aPage({
  ids,
  offset,
  pit_id = "pit-1",
  isAnalyzed,
}: {
  ids: number[];
  offset: number[];
  pit_id?: string | null;
  isAnalyzed?: { name: string };
}) {
  return {
    products: ids.map((id) => ({ product_id: id, name: `Product ${id}` })),
    productIds: ids.map(String),
    GA_PRODUCTS_LIST: ids.map((id) => ({ item_id: String(id) })),
    offset,
    recomended_offset: null,
    pit_id,
    isAnalyzed,
  };
}

/** A page that is full, so the grid keeps going. */
const aFullPage = (from: number, offset: number[]) =>
  aPage({
    ids: Array.from({ length: PAGE_LIMIT }, (_, i) => from + i),
    offset,
  });

async function renderGrid(props: Record<string, any> = {}) {
  return renderWithProviders(
    <ProductsInfiniteScroll
      offset={[1]}
      currency={{ symbol: "$", exchange_rate: 1, decimal_digits: 2 }}
      boutiqueName={null}
      analyticsData={[]}
      parsedFilters={{}}
      {...props}
    />,
    { path: "/filters" },
  );
}

const cardNames = () =>
  Array.from(document.querySelectorAll('[data-pw="product-card"]')).map(
    (card) => card.textContent,
  );

const scrollToTheBottom = () =>
  userEvent.click(
    screen.getByRole("button", { name: "scrolled to the bottom" }),
  );

describe("the listing's product grid", () => {
  beforeEach(() => {
    GetProducts.mockReset();
    GAevent.mockReset();
    showErrorNotification.mockReset();
  });

  describe("the first page", () => {
    it("asks the listing backend for products as soon as it mounts", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1, 2], offset: [2] }));
      await renderGrid();

      await waitFor(() =>
        expect(
          GetProducts,
          "the grid fetches on mount rather than waiting to be scrolled — the server-rendered page is short and the next one has to be ready before the shopper reaches the bottom",
        ).toHaveBeenCalled(),
      );
    });

    it("carries the filter session's snapshot id into the request", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid({ pit_id: "pit-from-the-server" });

      await waitFor(() => expect(GetProducts).toHaveBeenCalled());

      expect(
        GetProducts.mock.calls[0][0].pit_id,
        "every page of one filter session must read the same immutable snapshot, or products shift between pages and the shopper sees duplicates and gaps",
      ).toBe("pit-from-the-server");
    });

    it("rotates to the snapshot id the last page came back with", async () => {
      // A FULL first page, so the grid has not decided it is finished and the
      // sentinel is still there to be scrolled to.
      GetProducts.mockResolvedValueOnce({
        ...aFullPage(1, [2]),
        pit_id: "pit-2",
      }).mockResolvedValueOnce(aPage({ ids: [99], offset: [3] }));
      await renderGrid({ pit_id: "pit-1" });

      await waitFor(() => expect(GetProducts).toHaveBeenCalledTimes(1));
      await scrollToTheBottom();

      await waitFor(() =>
        expect(
          GetProducts.mock.calls[1]?.[0]?.pit_id,
          "the backend hands back the snapshot to use next; sending the original one for ever would read an increasingly stale snapshot",
        ).toBe("pit-2"),
      );
    });
  });

  describe("never showing the same product twice", () => {
    it("leaves out a product the server-rendered page already showed", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1, 2], offset: [2] }));
      await renderGrid({
        // The first page is already on screen above this grid.
        analyticsData: [{ item_id: "1" }],
      });

      await waitFor(() => expect(cardNames().length).toBeGreaterThan(0));

      expect(
        cardNames(),
        "product 1 is already on the page above this grid, so appending it again would show the shopper the same product twice",
      ).toEqual(["Product 2"]);
    });

    it("leaves out a product an earlier page of its own already showed", async () => {
      // Page 1 is full (so the grid keeps going); page 2 repeats the last
      // product of page 1 and carries one genuinely new one.
      GetProducts.mockResolvedValueOnce(aFullPage(1, [2])).mockResolvedValueOnce(
        aPage({ ids: [10, 11], offset: [3] }),
      );
      await renderGrid();

      await waitFor(() =>
        expect(cardNames()).toContain(`Product ${PAGE_LIMIT}`),
      );
      await scrollToTheBottom();

      await waitFor(() =>
        expect(
          cardNames(),
          "the new product on page 2 must be appended — dropping the whole page because part of it was a repeat would lose results",
        ).toContain("Product 11"),
      );
      expect(
        cardNames().filter((name) => name === `Product ${PAGE_LIMIT}`).length,
        "results move between pages while the shopper reads, so the same product can arrive on two pages; product 10 was on both and must appear on screen exactly once",
      ).toBe(1);
    });

    it("reports only the newly shown products to analytics", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1, 2], offset: [2] }));
      await renderGrid({ analyticsData: [{ item_id: "1" }] });

      await waitFor(() => expect(cardNames().length).toBeGreaterThan(0));

      // The mount event reports the server-rendered page; the one after it
      // reports what this grid added.
      const pageEvents = GAevent.mock.calls.filter(
        (call) => call[0]?.params?.items?.length,
      );
      const lastReported = pageEvents.at(-1)?.[0].params.items;

      expect(
        lastReported,
        "a product that was filtered out as a duplicate was never put in front of the shopper, so counting it as viewed overstates every listing's impressions",
      ).toEqual([{ item_id: "2" }]);
    });
  });

  describe("knowing it has reached the end", () => {
    it("stops when a page comes back short", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1, 2, 3], offset: [2] }));
      await renderGrid();

      await waitFor(() =>
        expect(
          screen.getByText("You've Reached The End"),
          "a page shorter than the page size is the last page — carrying on would ask for a page the backend has already said is not there",
        ).toBeInTheDocument(),
      );
    });

    it("still shows the products a short last page carried", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1, 2, 3], offset: [2] }));
      await renderGrid();

      await waitFor(() =>
        expect(
          cardNames(),
          "the last page is short AND full of products; stopping before appending them would silently drop the tail of every listing",
        ).toEqual(["Product 1", "Product 2", "Product 3"]),
      );
    });

    it("stops when the cursor comes back unchanged", async () => {
      // A full page, but the backend did not move the cursor on.
      GetProducts.mockResolvedValue(aFullPage(1, [1]));
      await renderGrid({ offset: [1] });

      await waitFor(() =>
        expect(
          screen.getByText("You've Reached The End"),
          "a cursor that does not advance means the next request would fetch this same page again, for ever",
        ).toBeInTheDocument(),
      );
    });

    it("stops when a page comes back with nothing in it", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [], offset: [2] }));
      await renderGrid();

      await waitFor(() =>
        expect(
          screen.getByText("You've Reached The End"),
          "an empty page is the end of the list",
        ).toBeInTheDocument(),
      );
    });

    it("offers nothing more to load once it has reached the end", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid();

      await waitFor(() =>
        expect(screen.getByText("You've Reached The End")).toBeInTheDocument(),
      );

      expect(
        screen.queryByRole("button", { name: "scrolled to the bottom" }),
        "the sentinel must go once the list is finished, or scrolling at the bottom keeps firing requests the backend can only answer with nothing",
      ).not.toBeInTheDocument();
    });
  });

  describe("a full page that adds nothing new", () => {
    it("fetches the next page itself instead of stalling", async () => {
      // A whole page of products the grid has already shown.
      const alreadySeen = Array.from({ length: PAGE_LIMIT }, (_, i) => ({
        item_id: String(i + 1),
      }));
      GetProducts.mockResolvedValueOnce(aFullPage(1, [2])).mockResolvedValueOnce(
        aPage({ ids: [99], offset: [3] }),
      );
      await renderGrid({ analyticsData: alreadySeen });

      await waitFor(() =>
        expect(
          cardNames(),
          "an all-duplicate page appends nothing, which leaves the sentinel exactly where it was — so the grid has to ask for the next page itself, or the listing stops dead halfway down",
        ).toEqual(["Product 99"]),
      );
      expect(
        GetProducts,
        "the second request must be the grid's own doing, with no further scrolling from the shopper",
      ).toHaveBeenCalledTimes(2);
    });

    it("gives up after five such pages rather than looping for ever", async () => {
      const alreadySeen = Array.from({ length: PAGE_LIMIT }, (_, i) => ({
        item_id: String(i + 1),
      }));
      // Every page is the same ten products the grid has already shown, and the
      // cursor keeps moving, so nothing else would ever stop it.
      let cursor = 2;
      GetProducts.mockImplementation(async () => aFullPage(1, [cursor++]));
      await renderGrid({ analyticsData: alreadySeen });

      await waitFor(() =>
        expect(
          screen.getByText("You've Reached The End"),
          "a backend that keeps answering with products already shown would spin this loop for ever; the grid caps it and calls the list finished",
        ).toBeInTheDocument(),
      );
      expect(
        GetProducts.mock.calls.length,
        "the cap is five consecutive all-seen pages, so the grid must stop asking soon after that rather than keep going",
      ).toBeLessThanOrEqual(6);
    });
  });

  describe("the full-screen page loader", () => {
    it("is switched off as soon as an ordinary navigation arrives", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid({});

      expect(
        useAppStore.getState().isNavigating,
        "an ordinary navigation already has its first page server-rendered, so the moment this grid mounts the shopper has arrived and the loader must go",
      ).toBeNull();
    });

    it("stays up through a client-owned refetch until the data lands", async () => {
      let releasePage: (value: any) => void = () => {};
      GetProducts.mockImplementation(
        () => new Promise((resolve) => (releasePage = resolve)),
      );

      await renderGrid({ firstPageSkeleton: true });
      useAppStore.getState().setIsNavigating("sort");

      expect(
        useAppStore.getState().isNavigating,
        "a sort confirm re-fetches page 1 from the client, so at mount the grid is empty — clearing the loader there would show the shopper a blank listing",
      ).toBe("sort");

      releasePage(aPage({ ids: [1], offset: [2] }));

      await waitFor(() =>
        expect(
          useAppStore.getState().isNavigating,
          "and it must be cleared once the first page has actually landed, or the loader never goes",
        ).toBeNull(),
      );
    });

    it("shows product-card skeletons while a client-owned refetch is in flight", async () => {
      GetProducts.mockImplementation(() => new Promise(() => {}));
      await renderGrid({ firstPageSkeleton: true });

      expect(
        document.querySelectorAll('[data-pw="product-card-skeleton"]').length,
        "the shopper who pressed Confirm needs to see the grid change at once; card-shaped skeletons say 'new results are coming' where an empty grid says nothing",
      ).toBeGreaterThan(0);
    });
  });

  describe("a search typed into the listing", () => {
    it("sends the shopper's own words on the first page", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid({ searchMode: true, searchQuery: "blue shirt" });

      await waitFor(() => expect(GetProducts).toHaveBeenCalled());

      expect(
        GetProducts.mock.calls[0][0].parsedFilters.search_text,
        "page 1 sends the raw words so the search backend can analyse them",
      ).toBe("blue shirt");
    });

    it("sends the analysed words the backend returned on later pages", async () => {
      // A full first page, so there is still a sentinel to scroll to.
      GetProducts.mockResolvedValueOnce({
        ...aFullPage(1, [2]),
        isAnalyzed: { name: "blue shirts" },
      }).mockResolvedValueOnce(aPage({ ids: [99], offset: [3] }));
      await renderGrid({ searchMode: true, searchQuery: "blue shirt" });

      await waitFor(() => expect(GetProducts).toHaveBeenCalledTimes(1));
      await scrollToTheBottom();

      await waitFor(() =>
        expect(
          GetProducts.mock.calls[1]?.[0]?.parsedFilters?.search_text,
          "page 2 must repeat the analysed words, not the raw ones — asking a different question gives a different result set, and paging across two of them shows duplicates and gaps",
        ).toBe("blue shirts"),
      );
    });

    it("stops the in-input spinner once the first page has landed", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderWithProviders(
        <ProductsInfiniteScroll
          offset={[1]}
          currency={{ symbol: "$", exchange_rate: 1, decimal_digits: 2 }}
          boutiqueName={null}
          analyticsData={[]}
          parsedFilters={{}}
          searchMode
          searchQuery="blue shirt"
        />,
        { path: "/filters", store: { searchLoading: true } },
      );

      await waitFor(() =>
        expect(
          useAppStore.getState().searchLoading,
          "the spinner sits inside the search box and is this grid's to clear — leaving it turning says the search is still running after the results are already on screen",
        ).toBe(false),
      );
    });

    it("reports that the search found several products", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1, 2], offset: [2] }));
      await renderGrid({ searchMode: true, searchQuery: "shirt" });

      await waitFor(() =>
        expect(
          useAppStore.getState().searchHasResults,
          "the sort, filter and share buttons are gated on these two verdicts, and only this grid knows what a client-side search actually found",
        ).toBe(true),
      );
      expect(
        useAppStore.getState().searchHasMultipleResults,
        "two results means the sort and filter buttons belong on the bar",
      ).toBe(true);
    });

    it("reports that the search found exactly one product", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid({ searchMode: true, searchQuery: "shirt" });

      await waitFor(() =>
        expect(
          useAppStore.getState().searchHasMultipleResults,
          "one result is worth sharing but not worth sorting, so the two verdicts must part company here",
        ).toBe(false),
      );
      expect(
        useAppStore.getState().searchHasResults,
        "one result still counts as results — share stays on the bar",
      ).toBe(true);
    });

    it("reports that the search found nothing", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [], offset: [2] }));
      await renderGrid({ searchMode: true, searchQuery: "zzzz" });

      await waitFor(() =>
        expect(
          useAppStore.getState().searchHasResults,
          "an empty search must be reported, or the bar keeps offering to sort and share a listing with nothing in it",
        ).toBe(false),
      );
    });

    it("tells the shopper their search found nothing, rather than that they reached the end", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [], offset: [2] }));
      await renderGrid({ searchMode: true, searchQuery: "zzzz" });

      await waitFor(() =>
        expect(
          screen.getByText("No Products Found"),
          "'you have reached the end' after typing a word reads as though the search worked and the list was short; the shopper needs to be told the word matched nothing",
        ).toBeInTheDocument(),
      );
      expect(
        screen.getByText("Try Changing Or Clearing Your Filters."),
        "and to be told what to do about it — the filters still applied are the usual reason a search finds nothing",
      ).toBeInTheDocument();
    });
  });

  describe("when the listing backend answers with nothing at all", () => {
    it("tells the shopper, rather than looking like the end of the list", async () => {
      GetProducts.mockResolvedValue(undefined);
      await renderGrid();

      await waitFor(() =>
        expect(
          showErrorNotification,
          "a refused request is not an empty listing; showing the end-of-list illustration would tell the shopper there is nothing more when the request simply failed",
        ).toHaveBeenCalled(),
      );
    });
  });

  describe("which list the analytics say the shopper was looking at", () => {
    it("names the featured list", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid({ isFeatured: true });

      await waitFor(() => expect(GAevent).toHaveBeenCalled());

      expect(
        GAevent.mock.calls[0][0].params.item_list_name,
        "every listing reports into the same event, so the list name is the only thing separating featured products from a filter result in the numbers",
      ).toBe("Featured-Products");
    });

    it("names the flash deals list", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid({ isFlashDeals: true });

      await waitFor(() => expect(GAevent).toHaveBeenCalled());

      expect(
        GAevent.mock.calls[0][0].params.item_list_name,
        "flash deals must be separable from ordinary featured products in the numbers",
      ).toBe("FlashDeals-Products");
    });

    it("names the boutique whose page the shopper is on", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid({
        boutiqueName: "Blue Boutique",
        parsedFilters: { boutiques: ["blue-boutique"] },
      });

      await waitFor(() => expect(GAevent).toHaveBeenCalled());

      expect(
        GAevent.mock.calls[0][0].params.item_list_name,
        "a seller needs their own boutique page separated from the general filter results, and the boutique's name is what does that",
      ).toBe("Blue Boutique-Boutique-Page");
    });

    it("names the filters list for an ordinary filter result", async () => {
      GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
      await renderGrid({ parsedFilters: { categories: ["shoes"] } });

      await waitFor(() => expect(GAevent).toHaveBeenCalled());

      expect(
        GAevent.mock.calls[0][0].params.item_list_name,
        "anything that is not featured, flash deals or one boutique is a filter result",
      ).toBe("Filters-Page");
    });
  });
});

describe("the listing's product grid � less common answers", () => {
  // An earlier test left a grid whose 3-second retry keeps firing after it was
  // unmounted (see BUG-server-2 at the end of this file). Answer those stray
  // retries with an empty page so they stop, before these tests count calls.
  beforeAll(async () => {
    GetProducts.mockReset();
    GetProducts.mockResolvedValue(aPage({ ids: [], offset: [] }));
    await new Promise((r) => setTimeout(r, 3500));
  }, 10000);

  beforeEach(() => {
    GetProducts.mockReset();
    GAevent.mockReset();
    showErrorNotification.mockReset();
  });

  it.each([
    ["/filters/boutiques/blue", "a boutique page"],
    ["/filters/tags_names/summer", "a tag page"],
    ["/", "the home page"],
  ])("reports the screen for %s (%s) to analytics", async (path, label) => {
    GetProducts.mockResolvedValue(aPage({ ids: [1], offset: [2] }));
    await renderWithProviders(
      <ProductsInfiniteScroll
        offset={[1]}
        currency={{ symbol: "$", exchange_rate: 1, decimal_digits: 2 }}
        boutiqueName={null}
        analyticsData={[]}
        parsedFilters={{}}
      />,
      { path },
    );
    await waitFor(() => expect(GAevent, `no analytics event was sent on ${label}`).toHaveBeenCalled());
    const screens = GAevent.mock.calls.map(([e]) => e.params.screen_name);
    expect(new Set(screens).size, `every event on ${label} should name the same screen`).toBe(1);
    expect(screens[0], `the screen name for ${label} should be set`).toBeTruthy();
  });

  it("falls back to the analytics list for ids, and skips items without an id", async () => {
    GetProducts.mockResolvedValue({
      ...aPage({ ids: [1, 2], offset: [2] }),
      productIds: [],
      GA_PRODUCTS_LIST: [{ item_id: "1" }, {}],
    });
    await renderGrid();
    await waitFor(() => expect(cardNames(), "the product with an id should be shown").toEqual(["Product 1"]));
  });

  it("treats a cursor of a different length as a new cursor", async () => {
    GetProducts.mockResolvedValueOnce(aFullPage(1, [2, 5]));
    GetProducts.mockResolvedValueOnce(aPage({ ids: [50], offset: [3, 6] }));
    await renderGrid();
    await waitFor(() => expect(cardNames().length, "the first page should land").toBe(PAGE_LIMIT));
    await scrollToTheBottom();
    await waitFor(() => expect(cardNames(), "the next page after a longer cursor should load").toContain("Product 50"));
  });

  it("skips the timed retry when a scroll already started a load", async () => {
    GetProducts.mockResolvedValueOnce(undefined);
    GetProducts.mockReturnValueOnce(new Promise(() => {}));
    await renderGrid();
    await waitFor(() => expect(showErrorNotification, "the empty answer should be reported").toHaveBeenCalled());
    // The shopper scrolls before the 3-second retry fires; that load hangs.
    await scrollToTheBottom();
    await new Promise((r) => setTimeout(r, 3300));
    expect(GetProducts, "the timed retry must not start a second load while one is running").toHaveBeenCalledTimes(2);
  });

  it("tries again three seconds after the backend answered with nothing", async () => {
    GetProducts.mockResolvedValueOnce(undefined);
    GetProducts.mockResolvedValueOnce(aPage({ ids: [7], offset: [2] }));
    await renderGrid();
    await waitFor(() => expect(showErrorNotification, "the shopper should be told the load failed").toHaveBeenCalled());
    await waitFor(
      () => expect(cardNames(), "the retry three seconds later should load the products").toEqual(["Product 7"]),
      { timeout: 8000 },
    );
  });
});

describe("a grid that has left the page", () => {
  it("BUG-server-2: stops retrying a failed load once the grid is unmounted", async () => {
    GetProducts.mockReset();
    GetProducts.mockResolvedValue(undefined);
    const { unmount } = await renderGrid();
    await waitFor(() => expect(GetProducts, "the first load should run").toHaveBeenCalledTimes(1));
    unmount();
    await new Promise((r) => setTimeout(r, 3300));
    expect(
      GetProducts,
      "a grid that is no longer on the page must not keep asking the backend every 3 seconds",
    ).toHaveBeenCalledTimes(1);
  });
});
