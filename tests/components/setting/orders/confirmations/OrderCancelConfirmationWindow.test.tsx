// The "cancel this pack" confirmation
// (components/setting/orders/confirmations/OrderCancelConfirmationWindow.tsx).
//
// Cancel only works after the shopper ticks the terms. A good cancel records
// the event with the reasons, refreshes the order and closes.
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

import OrderCancelConfirmationWindow from "components/setting/orders/confirmations/OrderCancelConfirmationWindow";
import { buildOrder } from "../../../../fixtures/order";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../../render";

beforeEach(() => orderService.CancelOrder.mockReset());
afterEach(() => vi.clearAllMocks());

const agree = () => document.querySelector('[data-pw="cancel-order-agree"]') as HTMLElement;
const confirm = () => document.querySelector('[data-pw="cancel-order-confirm"]') as HTMLElement;

async function renderWindow(extra: any = {}) {
  const props = {
    order: buildOrder({ id: 4, order_amount: 80 }),
    close: vi.fn(),
    isRtl: false,
    callback: vi.fn(async () => {}),
    ...extra,
  };
  await renderWithProviders(<OrderCancelConfirmationWindow {...props} />);
  return props;
}

describe("the pack cancel confirmation", () => {
  it("does nothing before the terms are ticked, and I Disagree closes", async () => {
    const props = await renderWindow({ isRtl: true });
    const user = userEvent.setup();
    await user.click(confirm());
    expect(orderService.CancelOrder, "the pack was cancelled before the terms were ticked").not.toHaveBeenCalled();
    await user.click(screen.getByText("I Disagree"));
    expect(props.close, "I Disagree did not close").toHaveBeenCalled();
  });

  it("cancels the pack, records the reasons, refreshes and closes", async () => {
    orderService.CancelOrder.mockResolvedValue({});
    const props = await renderWindow({ cancelReasons: ["I Changed My Mind"] });
    const user = userEvent.setup();
    await user.click(agree());
    expect(screen.getByTestId("agree-box").dataset.active, "the terms box is not ticked").toBe("true");
    await user.click(confirm());
    await waitFor(() => expect(props.close, "a good cancel did not close").toHaveBeenCalled());
    expect(orderService.CancelOrder, "the cancel did not name the pack").toHaveBeenCalledWith({ order_id: 4 });
    expect(trackOrderMgmt, "the cancel was not recorded with its reasons").toHaveBeenCalledWith("order_cancelled", {
      order_id: 4,
      order_value: 80,
      order_status: "pending",
      payment_type: "cash_on_delivery",
      cancel_reason: ["I Changed My Mind"],
    });
    expect(props.callback, "the order was not refreshed").toHaveBeenCalled();
  });

  it("logs a cancel that fails after the request and stays open, with no reasons by default", async () => {
    // The failure is raised by a plain function, not a vi.fn: an error thrown
    // by a vi.fn here is reported by the runner as the test's own failure.
    orderService.CancelOrder.mockResolvedValue(undefined);
    const props = await renderWindow({
      callback: async () => {
        throw new Error("refresh refused");
      },
    });
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(confirm());
    await waitFor(() =>
      expect(logError.mock.calls[0]?.[0]?.scenario, "a refused cancel was not logged").toBe(
        "Error In ConfirmFunction in OrderCancelConfirmationWindow",
      ),
    );
    expect(props.close, "a refused cancel closed the window").not.toHaveBeenCalled();
    expect(screen.getByText("I Agree & Cancel"), "the button stayed busy after a refusal").toBeInTheDocument();
  });
});
