// The "cancel this product" confirmation
// (components/setting/orders/confirmations/CancelOrderItemConfirmationWindow.tsx).
//
// Cancel only works after the shopper ticks the terms. A good cancel records
// the event, refreshes the order and closes.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orderService = vi.hoisted(() => ({ CancelOrder: vi.fn(), CancelOrderItem: vi.fn() }));
vi.mock("services/order", () => ({ default: orderService }));

const trackOrderMgmt = vi.hoisted(() => vi.fn());
vi.mock("utils/orderFunnel", () => ({
  ORDER_MGMT_EVENTS: { ORDER_CANCELLED: "order_cancelled", ORDER_ITEM_CANCELLED: "item_cancelled" },
  trackOrderMgmt,
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

vi.mock("components/Cart/PlaceOrderButtons", () => ({
  CheckBoxElement: ({ active }: any) => <span data-testid="agree-box" data-active={String(active)} />,
}));

import OrderItemCancelConfirmationWindow from "components/setting/orders/confirmations/CancelOrderItemConfirmationWindow";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../../render";

beforeEach(() => orderService.CancelOrderItem.mockReset());
afterEach(() => vi.clearAllMocks());

const agree = () => screen.getByTestId("agree-box").parentElement as HTMLElement;
const confirm = () => screen.getByText("I Agree & Cancel");

async function renderWindow(isRtl = false, callback: () => Promise<any> = vi.fn(async () => {})) {
  const props = { order_id: 4, item_id: 9, qty: 2, close: vi.fn(), isRtl, callback };
  await renderWithProviders(<OrderItemCancelConfirmationWindow {...props} />);
  return props;
}

describe("the product cancel confirmation", () => {
  it("does nothing before the terms are ticked, and I Disagree closes", async () => {
    const props = await renderWindow(true);
    const user = userEvent.setup();
    await user.click(confirm());
    expect(orderService.CancelOrderItem, "the product was cancelled before the terms were ticked").not.toHaveBeenCalled();
    await user.click(screen.getByText("I Disagree"));
    expect(props.close, "I Disagree did not close").toHaveBeenCalled();
  });

  it("cancels the product, records it, refreshes and closes", async () => {
    orderService.CancelOrderItem.mockResolvedValue({});
    const props = await renderWindow();
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(confirm());
    await waitFor(() => expect(props.close, "a good cancel did not close").toHaveBeenCalled());
    expect(orderService.CancelOrderItem, "the cancel did not name the product and qty").toHaveBeenCalledWith({
      order_id: 4,
      item_id: 9,
      qty: 2,
    });
    expect(trackOrderMgmt, "the cancel was not recorded").toHaveBeenCalledWith("item_cancelled", {
      order_id: 4,
      item_id: 9,
      qty: 2,
    });
    expect(props.callback, "the order was not refreshed").toHaveBeenCalled();
  });

  it("logs a cancel that fails after the request and stays open", async () => {
    // The failure is raised by a plain function, not a vi.fn: an error thrown
    // by a vi.fn here is reported by the runner as the test's own failure.
    orderService.CancelOrderItem.mockResolvedValue(undefined);
    const props = await renderWindow(false, async () => {
      throw new Error("refresh refused");
    });
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(confirm());
    await waitFor(() =>
      expect(logError.mock.calls[0]?.[0]?.scenario, "a refused cancel was not logged").toBe(
        "Error In ConfirmFunction in CancelOrderItemConfirmation",
      ),
    );
    expect(props.close, "a refused cancel closed the window").not.toHaveBeenCalled();
  });
});
