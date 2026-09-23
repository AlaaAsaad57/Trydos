// The Hidden Orders view (components/setting/orders/HiddenOrdersWidget.tsx).
//
// It loads the hidden orders and shows one card per order group: the pack ids,
// the summed amount, every product line, and whether every pack is hidden.
// The card (HiddenOrderItem) is stubbed and shows what it was given.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchHiddenOrders = vi.hoisted(() => vi.fn());
vi.mock("services/orders", () => ({ fetchHiddenOrders }));

const trackOrderMgmt = vi.hoisted(() => vi.fn());
vi.mock("utils/orderFunnel", () => ({
  ORDER_MGMT_EVENTS: { HIDDEN_ORDERS_OPENED: "hidden_opened" },
  trackOrderMgmt,
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

vi.mock("components/Orders/HiddenOrderItem", () => ({
  default: ({ order, onRestored }: any) => (
    <div
      data-testid={`card-${order.order_group_id}`}
      data-packs={order.pack_ids.join(",")}
      data-amount={String(order.order_amount)}
      data-lines={String(order.details.length)}
      data-full={String(order.is_fully_hidden)}
    >
      <button onClick={onRestored}>restored {order.order_group_id}</button>
    </div>
  ),
}));

import HiddenOrdersWidget from "components/setting/orders/HiddenOrdersWidget";
import { buildOrder, buildOrderLine } from "../../../fixtures/order";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

beforeEach(() => fetchHiddenOrders.mockReset());
afterEach(() => vi.clearAllMocks());

describe("the hidden orders view", () => {
  it("groups packs into one card per order group", async () => {
    fetchHiddenOrders.mockResolvedValue({
      data: [
        buildOrder({ id: 1, order_group_id: "g1", order_amount: 10, is_hidden: true }),
        buildOrder({ id: 2, order_group_id: "g1", order_amount: 0 as any, is_hidden: false, details: [buildOrderLine({ id: 2 })] }),
        buildOrder({ id: 3, order_group_id: "g2", order_amount: undefined as any, is_hidden: true }),
      ],
    });
    await renderWithProviders(<HiddenOrdersWidget isRtl={false} />);
    const g1 = await screen.findByTestId("card-g1");
    expect(trackOrderMgmt, "opening the view was not recorded").toHaveBeenCalledWith("hidden_opened");
    expect(g1.dataset.packs, "the group does not list both packs").toBe("1,2");
    expect(g1.dataset.amount, "the group amount is not the sum of its packs").toBe("10");
    expect(g1.dataset.lines, "the group does not hold every product line").toBe("2");
    expect(g1.dataset.full, "a group with a visible pack is marked fully hidden").toBe("false");
    expect(screen.getByTestId("card-g2").dataset.full, "a group whose packs are all hidden is not marked so").toBe("true");
    expect(screen.getByTestId("card-g2").dataset.amount, "a missing amount did not count as 0").toBe("0");

    await userEvent.setup().click(screen.getByText("restored g1"));
    expect(fetchHiddenOrders, "restoring did not reload the hidden orders").toHaveBeenCalledTimes(2);
  });

  it("says there are no hidden orders for an empty answer, right-to-left", async () => {
    fetchHiddenOrders.mockResolvedValue(null);
    await renderWithProviders(<HiddenOrdersWidget isRtl />);
    await waitFor(() =>
      expect(
        document.querySelector('[data-pw="hidden-orders-empty"]'),
        "an empty answer did not say there are no hidden orders",
      ).not.toBeNull(),
    );
  });

  it("logs a failing load and shows the empty state", async () => {
    // An answer that breaks when it is read, so the load fails inside the
    // component (the real service logs its own failures and answers undefined).
    fetchHiddenOrders.mockResolvedValue({
      get data() {
        throw new Error("unreadable answer");
      },
    });
    await renderWithProviders(<HiddenOrdersWidget isRtl={false} />);
    await waitFor(() =>
      expect(logError.mock.calls[0]?.[0]?.scenario, "a failing load was not logged").toBe(
        "Error In load in HiddenOrdersWidget",
      ),
    );
    expect(document.querySelector('[data-pw="hidden-orders-empty"]'), "a failing load did not show the empty state").not.toBeNull();
  });
});
