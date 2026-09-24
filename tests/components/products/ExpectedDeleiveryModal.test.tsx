// The "Expected Shipping & delivery Date" sheet on a product. It shows the
// expected day, a 1..10-day chart of past deliveries (services/products,
// fetched once when the sheet first opens), the delivery guarantee, and the
// return sections only when the product can be returned.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ExpectedDeleiveryModal from "components/products/ExpectedDeleiveryModal";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { GetCountries, GetProductDeliveryTimes, trackPosthog } = vi.hoisted(() => ({
  GetCountries: vi.fn(),
  GetProductDeliveryTimes: vi.fn(),
  trackPosthog: vi.fn(),
}));
vi.mock("serverRequests/product", () => ({ GetCountries }));
vi.mock("services/products", () => ({ GetProductDeliveryTimes }));
vi.mock("utils/posthogEvents", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackPosthog,
}));
vi.mock("components/global/BottomSheet", () => ({
  default: ({ children, onClose }: any) => (
    <div data-testid="sheet">
      <button onClick={onClose}>close sheet</button>
      {children}
    </div>
  ),
}));

const OPEN = { ColorBottomSheet: { is_for_deleviery: true } };
const SETTINGS = { settings: { starting_setting: { shipping_duration_days: 2 } } };

/** The percentage text of each of the ten chart rows, in order. */
const chart = () =>
  Array.from(document.querySelectorAll(".whitespace-nowrap.w-\\[30px\\]")).map((el) => el.textContent);

describe("ExpectedDeleiveryModal", () => {
  beforeEach(() => {
    sessionStorage.clear();
    GetCountries.mockReset();
    GetCountries.mockResolvedValue([{ iso: "sy" }]);
    GetProductDeliveryTimes.mockReset();
    trackPosthog.mockReset();
  });

  it("loads the delivery chart once, buckets days 0 and 10+, and reports the view", async () => {
    GetProductDeliveryTimes.mockResolvedValue([
      { days_count: 0, orders_count: 1 },
      { days_count: 3, orders_count: 2 },
      { days_count: 14, orders_count: 1 },
    ]);
    await renderWithProviders(<ExpectedDeleiveryModal product_id={5} shipping_days={3} />, {
      store: { ...OPEN, ...SETTINGS },
      country: "sy",
    });
    await waitFor(() => expect(chart()[0], "the chart did not load").toBe("25%"));
    expect(chart(), "the day buckets are wrong").toEqual([
      "25%", "0%", "50%", "0%", "0%", "0%", "0%", "0%", "0%", "25%",
    ]);
    expect(screen.getByText("+10"), "the last row is not '+10'").toBeInTheDocument();
    expect(GetProductDeliveryTimes, "the chart was not asked for this product").toHaveBeenCalledWith({
      productId: 5,
    });
    expect(trackPosthog, "the view was not reported with 2 + 3 days").toHaveBeenCalledWith(
      expect.any(String),
      { product_id: 5, expected_days: 5 },
    );
    expect(screen.getAllByText(/^5/).length > 0, "the 5 expected days are not shown").toBe(true);
    expect(screen.getByText("Syria"), "the country name is not shown").toBeInTheDocument();
    expect(sessionStorage.getItem("countries-sy-en"), "the countries were not cached").toBe(
      JSON.stringify([{ iso: "sy" }]),
    );
  });

  it("shows an empty chart when nothing was delivered yet, and the return sections for a returnable product", async () => {
    GetProductDeliveryTimes.mockResolvedValue(null);
    await renderWithProviders(
      <ExpectedDeleiveryModal product_id={5} shipping_days={1} allow_return_in_days={7} />,
      { store: OPEN, language: "ar" },
    );
    await waitFor(() => expect(chart().length === 10, "the empty chart has no ten rows").toBe(true));
    expect(chart().every((v) => v === "0%"), "an empty chart shows orders").toBe(true);
    expect(
      screen.getAllByText("7").some((el) => el.className === "px-[3px] bold"),
      "the 7 return days are not shown",
    ).toBe(true);
  });

  it("hides the return sections for a product with no returns", async () => {
    GetProductDeliveryTimes.mockResolvedValue([]);
    await renderWithProviders(<ExpectedDeleiveryModal product_id={5} shipping_days={1} />, { store: OPEN });
    expect(screen.queryByText("Return Guarantee"), "returns showed for a no-return product").not.toBeInTheDocument();
    await act(async () => {});
  });

  it("does not load the chart without a product id, and reads cached countries", async () => {
    sessionStorage.setItem("countries-gb-en", "[]");
    await renderWithProviders(<ExpectedDeleiveryModal shipping_days={1} />, { store: OPEN });
    expect(GetProductDeliveryTimes, "the chart was asked for without a product").not.toHaveBeenCalled();
    expect(GetCountries, "cached countries were asked for again").not.toHaveBeenCalled();
  });

  it("ignores a failed country read", async () => {
    GetCountries.mockRejectedValue(new Error("down"));
    await renderWithProviders(<ExpectedDeleiveryModal shipping_days={1} />, { store: { ColorBottomSheet: false } });
    await act(async () => {});
    expect(screen.queryByTestId("sheet"), "the closed sheet rendered").not.toBeInTheDocument();
  });

  it("shows a skeleton while the chart loads, and closes through the store", async () => {
    GetProductDeliveryTimes.mockReturnValue(new Promise(() => {}));
    const { store } = await renderWithProviders(<ExpectedDeleiveryModal product_id={5} shipping_days={1} />, {
      store: OPEN,
    });
    expect(chart().length === 0, "the chart showed while loading").toBe(true);
    fireEvent.click(screen.getByText("close sheet"));
    expect(store.getState().ColorBottomSheet, "closing did not clear the sheet").toBe(false);
  });
});
