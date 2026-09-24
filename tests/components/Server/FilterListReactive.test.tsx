// The filter chips controller. While the live ?search= equals the search the
// server rendered with, it shows the server's filters. When the shopper types a
// new search, it refetches the filters (after a 400 ms pause) and shows those.
import { beforeEach, describe, expect, it, vi } from "vitest";

const GetFilters = vi.fn();
const LogError = vi.fn();
const filterList = vi.fn();

vi.mock("serverRequests/listing", () => ({
  GetFilters: (...args: any[]) => GetFilters(...args),
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...args: any[]) => LogError(...args),
}));
vi.mock("components/Server/FilterList", () => ({
  default: (props: any) => {
    filterList(props);
    return <div data-pw="filters">{props.searchText}</div>;
  },
}));

import FilterListReactive from "components/Server/FilterListReactive";

import { setRoute } from "../../mocks/nextNavigation";
import { renderWithProviders, waitFor } from "../../render";

const SERVER_FILTERS = { brands: ["server"], boutiques: ["nike"] };
const lastProps = () => filterList.mock.calls.at(-1)[0];

const element = (props: Record<string, any> = {}) => (
  <FilterListReactive
    serverFilters={SERVER_FILTERS}
    serverSearch="old"
    parsedFilters={{ colors: ["red"] }}
    params={{ lang: "sy-en" }}
    currency={null}
    itemsLength={5}
    {...props}
  />
);

describe("the filter chips controller", () => {
  beforeEach(() => {
    GetFilters.mockReset();
    LogError.mockReset();
    filterList.mockClear();
  });

  it("shows the server's filters while the search is the one the server rendered", async () => {
    await renderWithProviders(element(), { search: "search=old" });
    expect(lastProps().filters, "the server's filters should be shown").toBe(SERVER_FILTERS);
    expect(lastProps().itemsLength, "the server's count should be shown").toBe(5);
    expect(GetFilters, "no refetch is needed when the search did not change").not.toHaveBeenCalled();
  });

  it("refetches the filters for a new search and shows them with the new total", async () => {
    GetFilters.mockResolvedValue({
      categories: ["c"],
      brands: ["b"],
      colors: ["blue"],
      sizes: ["M"],
      prices: { priceRanges: [1] },
      total_size: 12,
    });
    await renderWithProviders(element({ isFeatured: true }), { search: "search=new" });
    expect(lastProps().searchText, "the live search should be shown at once").toBe("new");
    await waitFor(() => expect(lastProps().itemsLength, "the refetched total should be shown").toBe(12));
    expect(lastProps().filters, "the refetched filters should be shown, keeping the server's boutiques").toEqual({
      categories: ["c"],
      brands: ["b"],
      colors: ["blue"],
      sizes: ["M"],
      prices: [1],
      boutiques: ["nike"],
      related_categories: [],
      search_text: "new",
    });
    expect(GetFilters, "the refetch must send the live search and the page's flags").toHaveBeenCalledWith({
      country: "sy",
      language: "en",
      filter_offset: 1,
      filters: { colors: ["red"], featured: true, flashdeal: undefined, search_text: "new" },
    });
  });

  it("uses empty lists and a zero total when the refetch returns none, and searches all when the search is cleared", async () => {
    GetFilters.mockResolvedValue({});
    await renderWithProviders(element({ serverFilters: null, isFlashDeals: true }), { search: "" });
    await waitFor(() => expect(lastProps().itemsLength, "no total should count as zero").toBe(0));
    expect(lastProps().filters, "missing lists should be empty").toEqual({
      categories: [],
      brands: [],
      colors: [],
      sizes: [],
      prices: [],
      boutiques: [],
      related_categories: [],
      search_text: null,
    });
    expect(GetFilters.mock.calls[0][0].filters.flashdeal, "a flash-deals page must send its flag").toBe(true);
  });

  it("keeps the server's filters when the refetch returns nothing", async () => {
    GetFilters.mockResolvedValue(null);
    await renderWithProviders(element(), { search: "search=new" });
    await waitFor(() => expect(GetFilters, "the refetch should run").toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(lastProps().filters, "an empty answer must not replace the server's filters").toBe(SERVER_FILTERS);
  });

  it("reports a failed refetch", async () => {
    GetFilters.mockRejectedValue(new Error("es down"));
    await renderWithProviders(element(), { search: "search=new" });
    await waitFor(() =>
      expect(LogError, "a failed refetch should be reported").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "FilterListReactive GetFilters" }),
      ),
    );
  });

  it("ignores a slow answer for an older search, and does not report its failure", async () => {
    let answerFirst: (v: any) => void = () => {};
    let failSecond: (e: any) => void = () => {};
    GetFilters.mockReturnValueOnce(new Promise((r) => (answerFirst = r)));
    const { rerender } = await renderWithProviders(element(), { search: "search=a" });
    await waitFor(() => expect(GetFilters, "the first refetch should start").toHaveBeenCalledTimes(1));

    GetFilters.mockReturnValueOnce(new Promise((_, rej) => (failSecond = rej)));
    setRoute({ search: "search=b" });
    rerender(element({ parsedFilters: { colors: ["red"] } }));
    await waitFor(() => expect(GetFilters, "the second refetch should start").toHaveBeenCalledTimes(2));

    // The second search's answer arrives, then the older one fails late.
    GetFilters.mockReturnValueOnce(new Promise(() => {}));
    setRoute({ search: "search=c" });
    rerender(element({ parsedFilters: { colors: ["blue"] } }));
    answerFirst({ brands: ["stale"], total_size: 99 });
    failSecond(new Error("late"));
    await new Promise((r) => setTimeout(r, 20));
    expect(lastProps().itemsLength, "an answer for an older search must be ignored").toBe(5);
    expect(LogError, "a failure for an older search must not be reported").not.toHaveBeenCalled();
  });

  it("drops the refetched filters when the search goes back to the server's", async () => {
    GetFilters.mockResolvedValue({ brands: ["b"], total_size: 3 });
    const { rerender } = await renderWithProviders(element(), { search: "search=new" });
    await waitFor(() => expect(lastProps().itemsLength, "the refetch should land first").toBe(3));
    setRoute({ search: "search=old" });
    rerender(element({ parsedFilters: { colors: ["red"] } }));
    await waitFor(() => expect(lastProps().filters, "back on the server's search, its filters should return").toBe(SERVER_FILTERS));
  });

  it("cancels the waiting refetch when the chips leave the page", async () => {
    const { unmount } = await renderWithProviders(element(), { search: "search=new" });
    unmount();
    await new Promise((r) => setTimeout(r, 450));
    expect(GetFilters, "no refetch should run after the chips are gone").not.toHaveBeenCalled();
  });
});
