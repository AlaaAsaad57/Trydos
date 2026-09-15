// "More From brands" — the button at the end of a filter row that fetches the
// next page of filter circles.
//
// One response carries every kind of filter at once (categories, brands,
// colours, sizes, prices). This component asks for that whole response and then
// has to pick its own kind out of it. Picking the wrong key is the failure this
// file is built around: it does not crash and it does not look broken — the row
// simply says "no more" while there are more, or fills a brands row with
// categories.
import { beforeEach, describe, expect, it, vi } from "vitest";

import InfiniteScrollFilters from "components/ListingPage/filterComponents/InfiniteScrollFilters";

import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

const GetNextPageFilters = vi.fn();
const LogError = vi.fn();

vi.mock("serverRequests/listing", () => ({
  GetNextPageFilters: (...args: any[]) => GetNextPageFilters(...args),
  GetProducts: vi.fn(),
  GetFilters: vi.fn(),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...args: any[]) => LogError(...args),
}));

const currency = { symbol: "$", exchange_rate: 1, decimal_digits: 2 };

/** A page of every filter kind at once, the way one response really arrives. */
function aPageOfFilters(overrides: Record<string, any[]> = {}) {
  return {
    categories: [{ slug: "shoes", name: "Shoes", childes: [] }],
    brands: [{ slug: "nike", name: "Nike", icon: "nike.png" }],
    colors: ["ff0000"],
    sizes: ["XL"],
    prices: [{ min_price: 10, max_price: 50 }],
    ...overrides,
  };
}

async function renderRow(term: string) {
  return renderWithProviders(
    <InfiniteScrollFilters
      term={term}
      filters={{ categories: ["shoes"] }}
      country="gb"
      language="en"
      params={{ lang: "gb-en" }}
      currency={currency}
      isRtl={false}
      baseUrlOfFiltersPage="/filters"
      isUsingParsedFilters={true}
    />,
    { path: "/filters" },
  );
}

/** The "More From <kind>" button at the end of the row. */
const moreButton = () => screen.getByText(/More From/);

describe("the 'more filters' button at the end of a filter row", () => {
  beforeEach(() => {
    GetNextPageFilters.mockReset();
    LogError.mockReset();
  });

  describe("which part of the response it reads", () => {
    it("fills a brands row from the response's brands", async () => {
      GetNextPageFilters.mockResolvedValue(aPageOfFilters());
      await renderRow("brands");

      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          document.querySelector('[data-pw="brand_filter_item"]'),
          "the response carries every filter kind at once, so a brands row must read the brands out of it — reading the wrong key fills the row with the wrong thing and nothing looks broken",
        ).toBeInTheDocument(),
      );
      expect(
        screen.getByText("Nike"),
        "the brand that came back must actually be drawn, not merely counted",
      ).toBeInTheDocument();
    });

    it("fills a categories row from the response's categories", async () => {
      GetNextPageFilters.mockResolvedValue(aPageOfFilters());
      await renderRow("categories");

      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          screen.getByText("Shoes"),
          "a categories row must read the categories key, not whichever key happens to be first",
        ).toBeInTheDocument(),
      );
    });

    it("fills a colours row from the response's colours", async () => {
      GetNextPageFilters.mockResolvedValue(aPageOfFilters());
      await renderRow("colors");

      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          document.querySelector('[data-pw="color_filter_item"]'),
          "colours arrive as bare strings rather than objects, so a colours row that read another key would draw nothing and look like the end of the list",
        ).toBeInTheDocument(),
      );
    });

    it("fills a sizes row from the response's sizes", async () => {
      GetNextPageFilters.mockResolvedValue(aPageOfFilters());
      await renderRow("sizes");

      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          document.querySelector('[data-pw="size_filter_item"]'),
          "a sizes row must read the sizes key",
        ).toBeInTheDocument(),
      );
    });

    it("fills a prices row from the response's price bands", async () => {
      GetNextPageFilters.mockResolvedValue(aPageOfFilters());
      await renderRow("prices");

      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          document.querySelector('[data-pw="price_filter_item"]'),
          "a prices row must read the prices key",
        ).toBeInTheDocument(),
      );
    });
  });

  describe("paging through the row", () => {
    it("asks the listing backend for the page after the one already on screen", async () => {
      GetNextPageFilters.mockResolvedValue(aPageOfFilters());
      await renderRow("brands");

      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          GetNextPageFilters.mock.calls[0]?.[0]?.filter_offset,
          "the first page is already server-rendered in the row, so the first 'more' must ask for page 2 — asking for page 1 again would repeat the circles already on screen",
        ).toBe(2),
      );
    });

    it("carries the applied filters and the country into the request", async () => {
      GetNextPageFilters.mockResolvedValue(aPageOfFilters());
      await renderRow("brands");

      await userEvent.click(moreButton());

      await waitFor(() => expect(GetNextPageFilters).toHaveBeenCalled());
      const sent = GetNextPageFilters.mock.calls[0][0];

      expect(
        sent.filters,
        "the next page of brands must be the brands that still match what the shopper has already narrowed to, so the applied filters have to travel with the request",
      ).toEqual({ categories: ["shoes"] });
      expect(
        sent.country,
        "filter availability differs by country, so the country must be sent",
      ).toBe("gb");
    });

    it("moves on to the next page again on a second press", async () => {
      GetNextPageFilters.mockResolvedValueOnce(
        aPageOfFilters({ brands: [{ slug: "nike", name: "Nike" }] }),
      ).mockResolvedValueOnce(
        aPageOfFilters({ brands: [{ slug: "puma", name: "Puma" }] }),
      );
      await renderRow("brands");

      await userEvent.click(moreButton());
      await waitFor(() => expect(screen.getByText("Nike")).toBeInTheDocument());
      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          GetNextPageFilters.mock.calls[1]?.[0]?.filter_offset,
          "the cursor must move on with each press — asking for page 2 twice would append the same circles again",
        ).toBe(3),
      );
      expect(
        screen.getByText("Nike"),
        "the circles from the earlier page must stay on screen; 'more' adds to the row, it does not replace it",
      ).toBeInTheDocument();
      expect(
        screen.getByText("Puma"),
        "and the new page's circles must be added to them",
      ).toBeInTheDocument();
    });
  });

  describe("the end of the row", () => {
    it("stops offering more once a page comes back with none of this kind", async () => {
      GetNextPageFilters.mockResolvedValue(aPageOfFilters({ brands: [] }));
      await renderRow("brands");

      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          screen.queryByText(/More From/),
          "an empty page of this kind is the end of the row, so the button must go — leaving it invites a press that can only fetch nothing again",
        ).not.toBeInTheDocument(),
      );
    });

    it("stops offering more when the response has no such kind at all", async () => {
      GetNextPageFilters.mockResolvedValue({ categories: [], brands: [] });
      await renderRow("sizes");

      await userEvent.click(moreButton());

      await waitFor(() =>
        expect(
          screen.queryByText(/More From/),
          "a response that never mentions sizes is the same as an empty one, and must not be read as 'there might be more'",
        ).not.toBeInTheDocument(),
      );
    });
  });

  describe("when the listing backend refuses", () => {
    it("reports the failure rather than letting it escape", async () => {
      GetNextPageFilters.mockRejectedValue(new Error("listing backend is down"));
      await renderRow("brands");

      await userEvent.click(moreButton());

      await waitFor(() => expect(LogError).toHaveBeenCalled());
      expect(
        LogError.mock.calls[0][0].scenario,
        "a failure here has to reach Sentry naming this row, or a filter row that quietly stops paging is invisible",
      ).toContain("InfinteScrollFiters");
    });

    it("leaves the button there so the shopper can try again", async () => {
      GetNextPageFilters.mockRejectedValue(new Error("listing backend is down"));
      await renderRow("brands");

      await userEvent.click(moreButton());

      await waitFor(() => expect(LogError).toHaveBeenCalled());
      expect(
        screen.getByText(/More From/),
        "a refused request is not the end of the row — taking the button away would turn a passing outage into a row the shopper can never finish reading",
      ).toBeInTheDocument();
    });
  });
});
