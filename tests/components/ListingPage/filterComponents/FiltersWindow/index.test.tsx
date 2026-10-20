// The full-screen filter window.
//
// It is a staging area: tapping a chip or dragging the price slider changes
// nothing about the listing underneath. Only the Search button at the bottom
// applies anything, and that button is covered by its own file.
//
// What this file is about is the other half — the window keeping its own draft
// honest while the shopper works in it:
//
//   • every change re-asks the backend which filters are still available, so the
//     shopper is never offered a size that no product in the narrowed set has;
//   • that re-ask is debounced, because tapping four chips in a row is four
//     changes and should not be four requests;
//   • the draft is thrown away and re-seeded from the applied filters each time
//     the window opens, so a window closed without applying does not come back
//     showing filters the listing is not actually using.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FiltersWindow from "components/ListingPage/filterComponents/FiltersWindow";
import { useAppStore } from "store";

import { act, renderWithProviders, screen, waitFor } from "../../../../render";

const GetFilters = vi.fn();
const LogError = vi.fn();
const EnableScroll = vi.fn();

vi.mock("serverRequests/listing", () => ({
  GetFilters: (...args: any[]) => GetFilters(...args),
  GetProducts: vi.fn(),
  GetNextPageFilters: vi.fn(),
}));

vi.mock("utils/functions", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  LogError: (...args: any[]) => LogError(...args),
}));

vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...((await importOriginal()) as object),
  EnableScroll: (...args: any[]) => EnableScroll(...args),
}));

/** How long the window waits after a change before re-asking the backend. */
const REFETCH_DEBOUNCE_MS = 400;

const currency = { symbol: "$", exchange_rate: 1, decimal_digits: 2 };

/** The filters the window is seeded with, as the server hands them over. */
function seedRows(overrides: Record<string, any> = {}) {
  return {
    categories: [{ slug: "shoes", name: "Shoes", childes: [] }],
    brands: [
      { slug: "nike", name: "Nike", icon: "nike.png" },
      { slug: "puma", name: "Puma", icon: "puma.png" },
    ],
    colors: ["#ff0000"],
    sizes: ["XL"],
    prices: { min_price: 0, max_price: 100, total: 12, histogram: [] },
    total_size: 12,
    ...overrides,
  };
}

async function renderWindow({
  filterEnabled = true,
  initialFilters = {},
  rows = seedRows(),
}: Record<string, any> = {}) {
  return renderWithProviders(
    <FiltersWindow
      initialFilters={initialFilters}
      language="en"
      country="gb"
      currency={currency}
      isFeatured={false}
      isFlashDeal={false}
    >
      {rows}
    </FiltersWindow>,
    { path: "/filters", store: { filterEnabled } },
  );
}

/** Tap a chip in one of the filter rows, the way a shopper does. */
async function tapChip(value: string) {
  const chip = document.querySelector(
    `[data-filter-value="${value}"]`,
  ) as HTMLElement;
  await act(async () => {
    chip.click();
  });
}

/** Whether a chip is showing as staged. */
const chipIsStaged = (value: string) =>
  Boolean(
    document
      .querySelector(`[data-filter-value="${value}"]`)
      ?.querySelector('img[src="/icons/ActiveCategoryIcon.svg"]'),
  );

describe("the filter window", () => {
  beforeEach(() => {
    GetFilters.mockReset();
    GetFilters.mockResolvedValue(seedRows());
    LogError.mockReset();
    EnableScroll.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when it is on screen at all", () => {
    it("draws nothing while the filter window is closed", async () => {
      const { container } = await renderWindow({ filterEnabled: false });

      expect(
        container.innerHTML,
        "the window is a full-screen overlay; rendering it hidden would still cover the listing and swallow every tap meant for the products",
      ).toBe("");
    });

    it("draws a row for each kind of filter the listing has", async () => {
      await renderWindow();

      expect(
        screen.getByText("Filter By Categories"),
        "each row is one kind of filter, and its heading is the only thing naming which kind the chips under it belong to",
      ).toBeInTheDocument();
      expect(
        screen.getByText("Filter By Brands"),
        "the brands row must be drawn when the listing has brands to offer",
      ).toBeInTheDocument();
      expect(
        screen.getByText("Filter By Prices"),
        "the price section must be drawn when there is more than one product to spread across a range",
      ).toBeInTheDocument();
    });

    it("leaves out a row the listing has nothing for", async () => {
      await renderWindow({ rows: seedRows({ brands: [] }) });

      expect(
        screen.queryByText("Filter By Brands"),
        "an empty row is a heading over nothing — it tells the shopper there is a choice to make where there is none",
      ).not.toBeInTheDocument();
    });

    it("leaves out the price section when there is only one product", async () => {
      await renderWindow({
        rows: seedRows({ total_size: 1, prices: { min_price: 5, max_price: 5, total: 1 } }),
      });

      expect(
        screen.queryByText("Filter By Prices"),
        "a range across a single product has nothing to drag between, so a slider there can only confuse",
      ).not.toBeInTheDocument();
    });
  });

  describe("staging a choice", () => {
    it("marks the chip as chosen straight away", async () => {
      await renderWindow();

      await tapChip("nike");

      expect(
        chipIsStaged("nike"),
        "the tap has to show at once — waiting for the backend to answer before marking the chip makes the window feel broken on a slow connection",
      ).toBe(true);
    });

    it("changes nothing about the listing underneath", async () => {
      await renderWindow();

      await tapChip("nike");

      expect(
        window.location.pathname,
        "the window is a staging area — nothing is applied until Search is pressed, so a tap must not move the browser",
      ).toBe("/gb-en/filters");
    });

    it("takes the chip off again on a second tap", async () => {
      await renderWindow({ initialFilters: { brands: ["nike"] } });

      await tapChip("nike");

      expect(
        chipIsStaged("nike"),
        "a chip is a toggle; without the second tap there is no way to drop one filter without resetting all of them",
      ).toBe(false);
    });
  });

  describe("re-asking which filters are still available", () => {
    it("waits before asking, so four quick taps are not four requests", async () => {
      await renderWindow();

      await tapChip("nike");
      await tapChip("puma");

      expect(
        GetFilters,
        "each tap changes the staged set, and asking on every one of them puts a request behind every finger movement",
      ).not.toHaveBeenCalled();
    });

    it("asks once the shopper has stopped tapping", async () => {
      await renderWindow();

      await tapChip("nike");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      await waitFor(() =>
        expect(
          GetFilters,
          "the available filters change as the set narrows — without re-asking, the window offers sizes and colours that no remaining product has",
        ).toHaveBeenCalled(),
      );
    });

    it("sends the staged choice, not the applied one", async () => {
      await renderWindow();

      await tapChip("nike");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      await waitFor(() => expect(GetFilters).toHaveBeenCalled());
      expect(
        GetFilters.mock.calls[0][0].filters.brands,
        "the point of the re-ask is to describe the set the shopper is building, so it has to carry what they have staged rather than what the listing is showing",
      ).toContain("nike");
    });

    it("asks nothing at all until something changes", async () => {
      await renderWindow();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS * 3);
      });

      expect(
        GetFilters,
        "the window is seeded by the server with the filters for the listing already on screen; asking again on open would repeat a request that has just been made",
      ).not.toHaveBeenCalled();
    });

    it("replaces the rows with what came back", async () => {
      GetFilters.mockResolvedValue(
        seedRows({ brands: [{ slug: "nike", name: "Nike", icon: "nike.png" }] }),
      );
      await renderWindow();

      await tapChip("nike");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      await waitFor(() =>
        expect(
          document.querySelector('[data-filter-value="puma"]'),
          "narrowing to Nike leaves no Puma products, so the Puma chip must go — leaving it offers a choice that would take the shopper to an empty listing",
        ).not.toBeInTheDocument(),
      );
    });

    it("reports a refused re-ask instead of failing quietly", async () => {
      GetFilters.mockRejectedValue(new Error("listing backend is down"));
      await renderWindow();

      await tapChip("nike");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      await waitFor(() => expect(LogError).toHaveBeenCalled());
      expect(
        LogError.mock.calls[0][0].scenario,
        "a refused re-ask leaves the shopper looking at filters for a set they are no longer building, and nothing on screen says so — it has to reach Sentry naming this window",
      ).toContain("FiltersWindow");
    });

    it("leaves the staged choice alone when the re-ask is refused", async () => {
      GetFilters.mockRejectedValue(new Error("listing backend is down"));
      await renderWindow();

      await tapChip("nike");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      await waitFor(() => expect(LogError).toHaveBeenCalled());
      expect(
        chipIsStaged("nike"),
        "the shopper's own choice is not the backend's to undo — dropping it on a failed re-ask would throw away work they can see they did",
      ).toBe(true);
    });
  });

  describe("undoing", () => {
    it("puts the staged choice back to what the listing is actually using", async () => {
      await renderWindow({ initialFilters: { brands: ["nike"] } });

      await tapChip("puma");
      expect(
        chipIsStaged("puma"),
        "the second brand has to be staged first, or there is nothing for Reset to undo",
      ).toBe(true);

      await act(async () => {
        (
          document.querySelector(
            '[data-pw="reset-filter-button"]',
          ) as HTMLElement
        ).click();
      });

      expect(
        chipIsStaged("puma"),
        "Reset means 'back to the listing I am looking at', so the chip the shopper added must go",
      ).toBe(false);
      expect(
        chipIsStaged("nike"),
        "and the filter the listing was already using must stay — Reset undoes the draft, it does not clear the listing",
      ).toBe(true);
    });
  });

  describe("closing the window", () => {
    it("closes on the back control", async () => {
      await renderWindow();

      await act(async () => {
        (
          document.querySelector(
            '[data-pw="backIcon_productPage"]',
          ) as HTMLElement
        ).click();
      });

      expect(
        useAppStore.getState().filterEnabled,
        "the back control has to close the window — it is the one the shopper reaches for first, at the top left",
      ).toBe(false);
    });

    it("closes on the cross", async () => {
      await renderWindow();

      await act(async () => {
        (
          document.querySelector(
            '[data-pw="close-filter-widget-button"]',
          ) as HTMLElement
        ).click();
      });

      expect(
        useAppStore.getState().filterEnabled,
        "the cross must close the window too; two controls that look like they close it and only one that does is worse than one control",
      ).toBe(false);
    });

    it("lets the listing scroll again", async () => {
      await renderWindow();

      await act(async () => {
        (
          document.querySelector(
            '[data-pw="close-filter-widget-button"]',
          ) as HTMLElement
        ).click();
      });

      expect(
        EnableScroll,
        "the page was locked when the window opened; a lock left in place leaves the whole listing frozen and looking fine",
      ).toHaveBeenCalled();
    });
  });

  describe("re-opening after walking away", () => {
    it("shows what the listing is using, not the draft that was abandoned", async () => {
      const { rerender } = await renderWindow({
        initialFilters: { brands: ["nike"] },
      });

      await tapChip("puma");
      act(() => {
        useAppStore.getState().setFilterEnabled(false);
      });
      act(() => {
        useAppStore.getState().setFilterEnabled(true);
      });
      rerender(
        <FiltersWindow
          initialFilters={{ brands: ["nike"] }}
          language="en"
          country="gb"
          currency={currency}
          isFeatured={false}
          isFlashDeal={false}
        >
          {seedRows()}
        </FiltersWindow>,
      );

      await waitFor(() =>
        expect(
          chipIsStaged("puma"),
          "a window closed without pressing Search applied nothing, so re-opening it showing that choice says the listing is narrower than it is",
        ).toBe(false),
      );
      expect(
        chipIsStaged("nike"),
        "and the filter the listing really is using must be shown as chosen",
      ).toBe(true);
    });
  });

  describe("every row stages its own kind of choice", () => {
    it.each([
      ["shoes", "categories", "shoes"],
      ["ff0000", "colors", "ff0000"],
      ["XL", "sizes", "XL"],
    ])("tapping %s stages it under %s", async (chip, kind, sent) => {
      await renderWindow({ initialFilters: { colors: ["#00ff00"] } });

      await tapChip(chip);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      await waitFor(() => expect(GetFilters, `tapping ${chip} should re-ask the backend`).toHaveBeenCalled());
      expect(
        GetFilters.mock.calls[0][0].filters[kind],
        `the ${kind} choice should be sent, colours without the hash`,
      ).toContain(sent);
    });
  });

  describe("the price section", () => {
    it("clears only the price band when its cross is tapped", async () => {
      await renderWindow({ initialFilters: { prices: [10, 50], brands: ["nike"] } });

      await act(async () => {
        (document.querySelector('img[src="/icons/PriceCancel.svg"]') as HTMLElement).click();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      await waitFor(() => expect(GetFilters, "clearing the band should re-ask the backend").toHaveBeenCalled());
      expect(GetFilters.mock.calls[0][0].filters.prices, "the price band should be cleared").toEqual([]);
      expect(GetFilters.mock.calls[0][0].filters.brands, "other staged filters must stay").toEqual(["nike"]);
    });

    it("stages a band dragged on the slider", async () => {
      await renderWindow();
      const [low] = Array.from(document.querySelectorAll('input[type="range"]')) as HTMLInputElement[];

      await act(async () => {
        low.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      });
      const { fireEvent } = await import("../../../../render");
      fireEvent.change(low, { target: { value: "20" } });
      fireEvent.mouseUp(low);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      await waitFor(() => expect(GetFilters, "a dragged band should re-ask the backend").toHaveBeenCalled());
      expect(GetFilters.mock.calls[0][0].filters.prices?.[0], "the dragged lower bound should be sent").toBe(20);
    });

    it("ignores the price cross and the slider while a re-ask is running", async () => {
      GetFilters.mockReturnValue(new Promise(() => {}));
      await renderWindow({ initialFilters: { prices: [10, 50] } });

      await tapChip("nike");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });
      await waitFor(() => expect(GetFilters, "the first re-ask should start").toHaveBeenCalledTimes(1));

      await act(async () => {
        (document.querySelector('img[src="/icons/PriceCancel.svg"]') as HTMLElement).click();
      });
      const { fireEvent } = await import("../../../../render");
      const [low] = Array.from(document.querySelectorAll('input[type="range"]')) as HTMLInputElement[];
      fireEvent.mouseDown(low);
      fireEvent.change(low, { target: { value: "30" } });
      fireEvent.mouseUp(low);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS * 2);
      });

      expect(GetFilters, "price changes during a running re-ask must be ignored").toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Min/).textContent, "the staged lower bound must stay as it was").toContain("10");
    });

    it("draws the price curve from the histogram once the window has settled", async () => {
      // jsdom lays nothing out, so every element is 0px wide and the curve
      // would draw an empty box. Give elements a width for this one test.
      const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
      Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 300 });
      try {
      await renderWindow({
        rows: seedRows({
          prices: {
            min_price: 0,
            max_price: 100,
            total: 12,
            histogram: [
              { count: 3, min_price: 0, max_price: 50 },
              { products_count: 2, min_price: 50, max_price: 100 },
            ],
          },
        }),
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });

      expect(
        document.querySelector('[data-pw="slider"]')?.parentElement?.querySelector("svg path"),
        "the price curve should be drawn once the window has settled",
      ).not.toBeNull();
      } finally {
        if (original) Object.defineProperty(HTMLElement.prototype, "clientWidth", original);
      }
    });
  });

  describe("a chip tapped while a re-ask is still running", () => {
    it("BUG-server-3: still gets its own re-ask once the running one finishes", async () => {
      let finishFirst: (v: any) => void = () => {};
      GetFilters.mockReturnValueOnce(new Promise((r) => (finishFirst = r)));
      GetFilters.mockResolvedValue(seedRows());
      await renderWindow();

      await tapChip("nike");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS);
      });
      await waitFor(() => expect(GetFilters).toHaveBeenCalledTimes(1));

      // The chips stay tappable while the first re-ask runs.
      await tapChip("puma");
      await act(async () => {
        finishFirst(seedRows());
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(REFETCH_DEBOUNCE_MS * 3);
      });

      expect(
        GetFilters,
        "the second tap changed the staged set, so the window must ask again for it",
      ).toHaveBeenCalledTimes(2);
    });
  });
});
