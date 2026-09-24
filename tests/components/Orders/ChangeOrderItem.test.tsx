// The "change one order line" sheet: pick a new colour, size or a lower
// quantity, then ask to confirm. The sheet loads the product's variants from the
// market backend first, and shows a skeleton until both answers arrive.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChangeOrderItem from "components/Orders/ChangeOrderItem";

import { buildOrderLine } from "../../fixtures/order";
import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const fetchData = vi.fn();
vi.mock("utils/fetchData", () => ({
  fetchData: (...args: any[]) => fetchData(...args),
  abortInFlightForLogout: vi.fn(),
}));

const showErrorNotification = vi.fn();
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...args: any[]) => showErrorNotification(...args),
}));

const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...args: any[]) => logError(...args),
}));

/** The variant list the market backend returns (qtyPriceDetails). */
const VARIANTS = {
  variation: [
    { type: "Red-M", offer_price: 40, qty: 10 },
    { type: "Blue-M", offer_price: 50, qty: 10 },
    { type: "Red-L", offer_price: 45, qty: 10 },
  ],
  variations: [
    { type: "Red-M", qty: 10 },
    { type: "Blue-M", qty: 10 },
    { type: "Red-L", qty: 10 },
    { type: "Green-M", qty: 0 },
    { type: "Red-S", qty: 0 },
  ],
};

/** The global details (globalDetails): colours and sizes. */
const GLOBAL = {
  sync_color_images: [
    { color_name: "Red", color_option: "Red", images: ["/red.jpg"] },
    { color_name: "Blue", color_option: "Blue", images: ["/blue.jpg"] },
    { color_name: "Green", color_option: "Green", images: ["/green.jpg"] },
  ],
  sizes: ["M", "L", "S"],
};

function answer(variants: any = VARIANTS, global: any = GLOBAL) {
  fetchData.mockImplementation(async ({ url }: any) =>
    url.includes("qtyPriceDetails")
      ? { success: true, data: variants }
      : { success: true, data: global },
  );
}

function line(overrides: any = {}) {
  return buildOrderLine({
    id: 55,
    qty: 3,
    product_variation_id: 11,
    variation: [{ id: 11, color: { name: "Red" }, size: "M" }],
    ...overrides,
  });
}

async function renderSheet(item = line(), extra: any = {}) {
  const setShouldConfirmChange = vi.fn();
  const view = await renderWithProviders(
    <ChangeOrderItem
      item={item}
      order_id={9}
      isRtl={false}
      backToMain={vi.fn()}
      setShouldConfirmChange={setShouldConfirmChange}
      shouldConfirmChange={{ keep: true }}
      {...extra}
    />,
  );
  await screen.findByText("Change Request");
  return { ...view, setShouldConfirmChange };
}

describe("ChangeOrderItem", () => {
  beforeEach(() => {
    fetchData.mockReset();
    showErrorNotification.mockReset();
    logError.mockReset();
  });

  it("asks the market backend for both product answers by the line's slug", async () => {
    answer();
    await renderSheet();
    const urls = fetchData.mock.calls.map(([params]: any) => params.url);
    expect(urls, "the variants were not asked for").toContain(
      "/web/product/qtyPriceDetails/test-product",
    );
    expect(urls, "the global details were not asked for").toContain(
      "/web/product/globalDetails/test-product",
    );
    expect(
      fetchData.mock.calls.every(([p]: any) => p.server === "market"),
      "a product call did not go to the market backend",
    ).toBe(true);
  });

  it.each([
    ["variants", "qtyPriceDetails"],
    ["global details", "globalDetails"],
  ])(
    "keeps the skeleton and logs when the %s call is refused",
    async (_name, failing) => {
      fetchData.mockImplementation(async ({ url }: any) =>
        url.includes(failing)
          ? { success: false, message: "refused" }
          : { success: true, data: {} },
      );
      await renderWithProviders(
        <ChangeOrderItem
          item={line()}
          order_id={9}
          isRtl={false}
          setShouldConfirmChange={vi.fn()}
        />,
      );
      await waitFor(() =>
        expect(logError, "a refused product call was not logged").toHaveBeenCalled(),
      );
      expect(
        screen.queryByText("Change Request"),
        "the sheet rendered without product data",
      ).not.toBeInTheDocument();
    },
  );

  it("changing the colour shows the new price and sends a Color request", async () => {
    answer();
    const { setShouldConfirmChange } = await renderSheet();

    expect(
      priceLabel(),
      "a new price showed before anything changed",
    ).not.toBeInTheDocument();
    // Pressing Change Request with nothing changed does nothing.
    fireEvent.click(screen.getByText("Change Request"));
    expect(setShouldConfirmChange, "an unchanged line sent a request").not.toHaveBeenCalled();

    // The current colour (Red) is not offered again.
    expect(screen.queryByText("Red"), "the current colour was not shown as 'from'").toBeInTheDocument();
    fireEvent.click(screen.getByText("Blue"));

    expect(
      screen.getByText((_, el) => el?.getAttribute("data-pw") === "new-price-after-change-value")
        .textContent,
      "the new price is not Blue-M 50 x 3",
    ).toContain("150");

    // Switching tab while a change is open is refused.
    fireEvent.click(screen.getByText("Change Size"));
    expect(showErrorNotification, "switching tab mid-change did not warn").toHaveBeenCalledWith(
      "Confirm the Changes First",
    );

    fireEvent.click(screen.getByText("Change Request"));
    expect(setShouldConfirmChange, "the colour request carried the wrong fields").toHaveBeenCalledWith(
      expect.objectContaining({
        keep: true,
        type: "Color",
        currentColor: "Red",
        currentSize: "M",
        newColor: "Blue",
        newSize: "M",
        detail_id: 55,
      }),
    );
  });

  it("clicking the chosen colour again returns to the ordered colour", async () => {
    answer();
    await renderSheet();
    fireEvent.click(screen.getByText("Blue"));
    expect(priceLabel(), "choosing Blue did not show a price").toBeInTheDocument();
    fireEvent.click(screen.getByText("Blue"));
    expect(
      priceLabel(),
      "clicking Blue again did not undo the change",
    ).not.toBeInTheDocument();
  });

  it("refuses a colour that does not have enough stock", async () => {
    answer();
    await renderSheet();
    fireEvent.click(screen.getByText("Green"));
    expect(showErrorNotification, "an out-of-stock colour did not warn").toHaveBeenCalledWith(
      "this option dosent have enough quantity",
    );
  });

  it("changing the size sends a Size request, and a second click undoes it", async () => {
    answer();
    const { setShouldConfirmChange } = await renderSheet();
    fireEvent.click(screen.getByText("Change Size"));
    expect(screen.getByText("To New Size?"), "the size tab did not open").toBeInTheDocument();

    fireEvent.click(screen.getByText("L"));
    expect(priceLabel(), "choosing L did not show a price").toBeInTheDocument();
    fireEvent.click(screen.getByText("L"));
    expect(priceLabel(), "clicking L again did not undo the change").not.toBeInTheDocument();

    fireEvent.click(screen.getByText("L"));
    fireEvent.click(screen.getByText("Change Request"));
    expect(setShouldConfirmChange, "the size request carried the wrong fields").toHaveBeenCalledWith(
      expect.objectContaining({ type: "Size", newSize: "L", currentSize: "M", newColor: "Red" }),
    );
  });

  it("refuses a size that does not have enough stock", async () => {
    answer();
    await renderSheet();
    fireEvent.click(screen.getByText("Change Size"));
    fireEvent.click(screen.getByText("S"));
    expect(showErrorNotification, "an out-of-stock size did not warn").toHaveBeenCalledWith(
      "this option dosent have enough quantity",
    );
  });

  it("lowering the quantity sends a CancelQty request with the number to cancel", async () => {
    answer();
    const { setShouldConfirmChange } = await renderSheet();
    fireEvent.click(screen.getByText("Change Qty"));
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value, "the quantity did not start at the ordered 3").toBe("3");
    expect(screen.queryByText("+"), "the + button showed at the ordered quantity").not.toBeInTheDocument();

    fireEvent.click(screen.getByText("−"));
    expect(input.value, "the minus button did not lower the quantity").toBe("2");
    fireEvent.click(screen.getByText("+"));
    expect(input.value, "the plus button did not raise the quantity").toBe("3");

    fireEvent.change(input, { target: { value: "5" } });
    expect(showErrorNotification, "a higher quantity did not warn").toHaveBeenCalledWith(
      "You Can't Change Qty To Higher Than The Current Qty",
    );
    fireEvent.change(input, { target: { value: "1" } });
    expect(input.value, "typing 1 did not set the quantity").toBe("1");

    fireEvent.click(screen.getByText("Change Request"));
    expect(setShouldConfirmChange, "the cancel request carried the wrong fields").toHaveBeenCalledWith({
      order_id: 9,
      item_id: 55,
      qty: 2,
      type: "CancelQty",
    });
  });

  it("opens on the quantity tab for a line with no colour or size, and prices a variant-less product", async () => {
    answer({ variation: [] }, { offer_price: 20, sizes: [] });
    await renderSheet(
      line({ variation: [{ id: 11 }], product_variation_id: 11, product_details: undefined as any }),
      { isRtl: true },
    );
    expect(screen.queryByText("Change Color"), "a colour tab showed with no colour").not.toBeInTheDocument();
    expect(screen.queryByText("Change Size"), "a size tab showed with no size").not.toBeInTheDocument();
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2" } });
    expect(
      screen.getByText((_, el) => el?.getAttribute("data-pw") === "new-price-after-change-value")
        .textContent,
      "the new price is not 20 x 2",
    ).toContain("40");
  });

  it("keeps the sheet up when the parent cannot take the cancel request", async () => {
    answer();
    const setShouldConfirmChange = vi.fn(() => {
      throw new Error("parent refused");
    });
    await renderSheet(line(), { setShouldConfirmChange });
    fireEvent.click(screen.getByText("Change Qty"));
    fireEvent.click(screen.getByText("−"));
    fireEvent.click(screen.getByText("Change Request"));
    expect(setShouldConfirmChange, "the cancel request was not tried").toHaveBeenCalled();
    expect(screen.getByText("Change Request"), "the sheet went away after the error").toBeInTheDocument();
  });

  it("opens on the size tab when the first variation has a Size and no colour", async () => {
    answer();
    await renderSheet(
      line({ variation: [{ id: 11, Size: "M", size: "M" }] }),
    );
    expect(screen.getByText("To New Size?"), "the sheet did not open on the size tab").toBeInTheDocument();
  });
});

/** The "New Price" line, shown only when the line has a change. */
function priceLabel() {
  return document.querySelector('[data-pw="new-price-after-change-label"]');
}
