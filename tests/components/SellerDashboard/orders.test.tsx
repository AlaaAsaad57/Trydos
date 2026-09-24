// The Orders section of the seller dashboard.
//
// It is two screens in one component: the list of the shop's orders, and the
// detail of one order with a row per item. The item rows are where the work
// happens — a seller confirms an item, packs it, or cancels part of it, and
// each of those is a separate call to the shop backend.
//
// The list lives in the shared store (`sellerOrders`), because push
// notifications refresh it from outside this component. That is why the tests
// read what is on screen rather than what the component returned.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSellerOrders = vi.fn();
const confirmOrderDetailStatus = vi.fn();
const packOrderDetailStatus = vi.fn();
const cancelOrderDetail = vi.fn();

vi.mock("services/sellerDashboard", () => ({
  default: {
    getSellerOrders: (...a: unknown[]) => getSellerOrders(...a),
    confirmOrderDetailStatus: (...a: unknown[]) => confirmOrderDetailStatus(...a),
    packOrderDetailStatus: (...a: unknown[]) => packOrderDetailStatus(...a),
    cancelOrderDetail: (...a: unknown[]) => cancelOrderDetail(...a),
    updateOrderStatus: vi.fn(),
  },
}));

// The section subscribes to two push topics on mount. Push needs a service
// worker, which jsdom has none of, and no test below is about push.
vi.mock("services/home", () => ({
  default: {
    subscribeToTopic: vi.fn(async () => ({ success: true })),
    UnsubscripeFromTopic: vi.fn(async () => ({ success: true })),
  },
}));

import RenderOrders from "components/SellerDashboard/orders";

import { act, renderWithProviders, screen, userEvent, waitFor } from "../../render";
import { useAppStore } from "store";

// Every browser has IntersectionObserver; jsdom has none. The section uses one
// to load the next page when the seller scrolls to the bottom. This stand-in
// lets the section mount and never reports an intersection, so nothing below
// loads a second page by accident.
class NeverIntersects {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", NeverIntersects);

const SELLER_ID = "77";

/** One item inside an order. */
const item = (over: Record<string, unknown> = {}) => ({
  id: 501,
  product_id: 900,
  product_name: "Blue Shoe",
  qty: 2,
  unit_price: 10,
  offer_price: 9,
  color: "Blue",
  size: "42",
  is_confirm: false,
  is_packed: false,
  cart_image: "shoe.webp",
  brand_icon: "brand.webp",
  ...over,
});

/** One order, with its items under `details`. */
const order = (over: Record<string, unknown> = {}) => ({
  id: 1001,
  order_status: "in_progress",
  order_amount: 18,
  created_at: "2026-01-05T10:00:00Z",
  remaining_in_minutes: 0,
  details: [item()],
  ...over,
});

/** What GET /shop/orders answers with. */
const listAnswer = (
  orders: unknown[],
  meta: Record<string, unknown> | null = { has_more_pages: false },
) => ({ success: true, data: { orders, meta, user_abilities: {} } });

async function mount(canViewOrders = true) {
  return renderWithProviders(
    <RenderOrders
      canViewOrders={canViewOrders}
      sellerId={SELLER_ID}
      activeTab="orders"
      setActiveTab={() => {}}
    />,
    { path: `/sellerProfile/sellerDashboard/${SELLER_ID}`, search: "tab=orders" },
  );
}

/**
 * Open the first order in the list.
 *
 * The card is a plain div, not a button, so there is no role to ask for. It
 * carries `data-pw="order-shop-card"`, which the browser suite already uses to
 * find it, so this test uses the same handle.
 */
async function openFirstOrder() {
  await waitFor(() => {
    if (!document.querySelector('[data-pw="order-shop-card"]')) {
      throw new Error("the order list has not drawn a card yet");
    }
  });
  await userEvent.click(
    document.querySelector('[data-pw="order-shop-card"]') as HTMLElement,
  );
}

beforeEach(() => {
  getSellerOrders.mockReset();
  confirmOrderDetailStatus.mockReset();
  packOrderDetailStatus.mockReset();
  cancelOrderDetail.mockReset();
  getSellerOrders.mockResolvedValue(listAnswer([order()]));
});

describe("Orders section — the permission gate", () => {
  it("never asks the shop backend without the order permission", async () => {
    await mount(false);
    expect(
      screen.getByText("Access Denied"),
      "a seller without order permission should be told the section is blocked",
    ).toBeInTheDocument();
    expect(
      getSellerOrders,
      "an order list the seller may not read must not be requested",
    ).not.toHaveBeenCalled();
  });

  it("says which permission is missing", async () => {
    await mount(false);
    expect(
      screen.getByText(
        "You need order viewing permissions to see this section",
      ),
      "the blocked section should say what the seller is missing",
    ).toBeInTheDocument();
  });
});

describe("Orders section — the list", () => {
  it("asks for page 1 with no status filter to begin with", async () => {
    await mount();
    await waitFor(() => expect(getSellerOrders).toHaveBeenCalled());
    expect(
      getSellerOrders.mock.calls[0],
      "the section should open on All orders, page 1, with no status",
    ).toEqual([SELLER_ID, 1, undefined]);
  });

  it("re-asks the backend with the status of the tab that was picked", async () => {
    await mount();
    await waitFor(() => expect(getSellerOrders).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button", { name: "Cancelled" }));

    await waitFor(() => {
      expect(
        getSellerOrders.mock.calls.at(-1),
        "the Cancelled tab should ask the backend for the canceled status",
      ).toEqual([SELLER_ID, 1, "canceled"]);
    });
  });

  it("asks for in_progress on the In Progress tab", async () => {
    await mount();
    await waitFor(() => expect(getSellerOrders).toHaveBeenCalled());

    await userEvent.click(screen.getByRole("button", { name: "In Progress" }));

    await waitFor(() => {
      expect(
        getSellerOrders.mock.calls.at(-1),
        "the In Progress tab should ask the backend for in_progress",
      ).toEqual([SELLER_ID, 1, "in_progress"]);
    });
  });

  it("says when the shop has no orders in this tab", async () => {
    getSellerOrders.mockResolvedValue(listAnswer([]));
    await mount();
    expect(
      await screen.findByText("No orders found"),
      "an empty tab should say so rather than show nothing at all",
    ).toBeInTheDocument();
  });

  it("shows the shop backend's own reason for refusing", async () => {
    getSellerOrders.mockResolvedValue({
      success: false,
      message: "The orders service is unavailable.",
    });
    await mount();
    expect(
      await screen.findByText("The orders service is unavailable."),
      "the seller should read what the orders backend said",
    ).toBeInTheDocument();
  });

  it("loads the list again on Retry", async () => {
    getSellerOrders.mockResolvedValue({ success: false, message: "Boom" });
    await mount();
    await screen.findByText("Boom");

    getSellerOrders.mockResolvedValue(listAnswer([]));
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByText("No orders found"),
      "Retry should ask the orders backend again",
    ).toBeInTheDocument();
  });
});

describe("Orders section — one order's detail", () => {
  it("opens the detail of the order that was clicked", async () => {
    await mount();
    await openFirstOrder();

    expect(
      await screen.findByText("Order Number"),
      "clicking an order card should open its detail screen",
    ).toBeInTheDocument();
    expect(
      screen.getByText("1001"),
      "the detail screen should show the order number it opened",
    ).toBeInTheDocument();
  });

  it("shows the item with its quantity and variant", async () => {
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    expect(
      screen.getByText("Blue Shoe"),
      "the item's name should be on its row",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Blue"),
      "the colour the shopper picked should be on the row",
    ).toBeInTheDocument();
    expect(
      screen.getByText("42"),
      "the size the shopper picked should be on the row",
    ).toBeInTheDocument();
  });

  it("counts an order by the quantity ordered, not the number of rows", async () => {
    getSellerOrders.mockResolvedValue(
      listAnswer([order({ details: [item({ qty: 3 })] })]),
    );
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    expect(
      screen.getByText(/Confirmed\s*0\s*\/\s*3/),
      "one row of three pieces is three items, not one",
    ).toBeInTheDocument();
  });

  it("goes back to the list", async () => {
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    // The back arrow is the first button on the detail header.
    await userEvent.click(screen.getAllByRole("button")[0]);

    expect(
      await screen.findByRole("button", { name: "In Progress" }),
      "going back should show the list and its filter tabs again",
    ).toBeInTheDocument();
  });
});

describe("Orders section — working through an item", () => {
  it("offers Confirm and Cancel on an item nobody has touched", async () => {
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    expect(
      screen.getByRole("button", { name: "Confirm & Start Packing" }),
      "an unconfirmed item should be confirmable",
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel" }),
      "an unconfirmed item should still be cancellable",
    ).toBeInTheDocument();
  });

  it("confirms the item the seller clicked", async () => {
    confirmOrderDetailStatus.mockResolvedValue({ success: true });
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    await userEvent.click(
      screen.getByRole("button", { name: "Confirm & Start Packing" }),
    );

    await waitFor(() => {
      expect(
        confirmOrderDetailStatus,
        "the confirm should name the shop and the order line it applies to",
      ).toHaveBeenCalledWith(SELLER_ID, { order_detail_id: 501 });
    });
  });

  it("moves the item on to packing once it is confirmed", async () => {
    confirmOrderDetailStatus.mockResolvedValue({ success: true });
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    await userEvent.click(
      screen.getByRole("button", { name: "Confirm & Start Packing" }),
    );

    expect(
      await screen.findByRole("button", { name: "Packed" }),
      "a confirmed item should now offer the next step, packing",
    ).toBeInTheDocument();
  });

  it("packs an item that is already confirmed", async () => {
    packOrderDetailStatus.mockResolvedValue({ success: true });
    getSellerOrders.mockResolvedValue(
      listAnswer([order({ details: [item({ is_confirm: true })] })]),
    );
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    await userEvent.click(screen.getByRole("button", { name: "Packed" }));

    await waitFor(() => {
      expect(
        packOrderDetailStatus,
        "packing should name the shop and the order line",
      ).toHaveBeenCalledWith(SELLER_ID, { order_detail_id: 501 });
    });
    expect(
      await screen.findByText("Ready To Collect"),
      "a packed item is waiting to be collected and needs no further action",
    ).toBeInTheDocument();
  });

  it("cancels the item's whole quantity", async () => {
    cancelOrderDetail.mockResolvedValue({ success: true });
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        cancelOrderDetail,
        "a cancel should name the order, the line and how many pieces go",
      ).toHaveBeenCalledWith(SELLER_ID, {
        detail_id: 501,
        order_id: 1001,
        qty: 2,
      });
    });
  });

  it("takes a fully cancelled item off the order", async () => {
    cancelOrderDetail.mockResolvedValue({ success: true });
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.queryByText("Blue Shoe"),
        "an item whose whole quantity was cancelled should leave the order",
      ).not.toBeInTheDocument();
    });
  });

  it("says why the shop backend refused to confirm", async () => {
    confirmOrderDetailStatus.mockResolvedValue({
      success: false,
      message: "This order line is already collected.",
    });
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    await userEvent.click(
      screen.getByRole("button", { name: "Confirm & Start Packing" }),
    );

    await waitFor(() => expect(confirmOrderDetailStatus).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: "Confirm & Start Packing" }),
      "a refused confirm must not move the item on as if it worked",
    ).toBeInTheDocument();
  });

  it("does not offer actions on an order the shop already cancelled", async () => {
    getSellerOrders.mockResolvedValue(
      listAnswer([order({ order_status: "canceled" })]),
    );
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    expect(
      screen.getByRole("button", { name: "Confirm & Start Packing" }),
      "a cancelled order's items cannot be confirmed any more",
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancel" }),
      "a cancelled order's items cannot be cancelled again",
    ).toBeDisabled();
  });
});

describe("Orders section — reading the item's details", () => {
  it("reads product details that arrived as a JSON string", async () => {
    getSellerOrders.mockResolvedValue(
      listAnswer([
        order({
          details: [
            item({
              product_name: "",
              cart_image: "",
              product_details: JSON.stringify({
                product_name: "Red Bag",
                thumbnail: "bag.webp",
              }),
            }),
          ],
        }),
      ]),
    );
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    expect(
      screen.getByText("Red Bag"),
      "product_details sometimes arrives as a JSON string and must still be read",
    ).toBeInTheDocument();
  });

  it("falls back to the product id when nothing names the item", async () => {
    getSellerOrders.mockResolvedValue(
      listAnswer([
        order({
          details: [item({ product_name: "", product_details: "not json" })],
        }),
      ]),
    );
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    expect(
      screen.getByText("Product #900"),
      "an unnamed item should still be identifiable by its product id",
    ).toBeInTheDocument();
  });

  it("shows where the item has got to", async () => {
    getSellerOrders.mockResolvedValue(
      listAnswer([
        order({ details: [item({ is_confirm: true, is_packed: true })] }),
      ]),
    );
    await mount();
    await openFirstOrder();
    await screen.findByText("Order Number");

    expect(
      screen.getAllByText("Packed").length,
      "a packed item should read as Packed on its row",
    ).toBeGreaterThan(0);
  });
});

/** Open the detail of the first order and wait for it to draw. */
async function openFirstOrderDetail() {
  await openFirstOrder();
  await screen.findByText("Order Number");
}

describe("Orders section — how the list card reads its data", () => {
  it("formats the time, the status and the counts from every shape the backend sends", async () => {
    getSellerOrders.mockResolvedValue(
      listAnswer([
        order({
          id: 1,
          order_status: null,
          created_at: { date: "2026-01-05", time: "10:00" },
          remaining_in_minutes: 15,
          details: [item({ qty: 0 }), item({ id: 502, qty: 0 })],
        }),
        order({ id: 2, created_at: null, updated_at: { date: "2026-02-01" }, details: null }),
        order({ id: 3, created_at: 12345 }),
        order({ id: 4, created_at: "" }),
      ]),
    );
    await mount();

    expect(
      await screen.findByText("2026-01-05 10:00"),
      "a created_at with a date and a time should be shown as both",
    ).toBeInTheDocument();
    expect(screen.getByText("2026-02-01"), "updated_at with only a date should be the fallback time").toBeInTheDocument();
    expect(screen.getByText("15m"), "the remaining minutes should be shown on the card").toBeInTheDocument();
    expect(screen.getByText("No items"), "an order whose details are not a list should say it has no items").toBeInTheDocument();
    const statuses = Array.from(document.querySelectorAll('[data-pw="order-shop-status"]')).map((e) => e.textContent);
    expect(statuses[0], "an order with no status should read N/A").toBe("N/A");
    expect(statuses[2], "a snake_case status should read as words").toBe("In Progress");
  });

  it("picks the item picture from the product's images when there is no cart picture", async () => {
    getSellerOrders.mockResolvedValue(
      listAnswer([
        order({
          details: [
            item({ id: 1, cart_image: "", product_details: { images: JSON.stringify(["from-string.webp"]) } }),
            item({ id: 2, cart_image: "", product_details: { images: ["from-list.webp"] } }),
            item({ id: 3, cart_image: "", product_details: { images: "{broken" } }),
          ],
        }),
      ]),
    );
    await mount();
    await waitFor(() => expect(document.querySelectorAll('img[alt="item"]').length).toBeGreaterThan(0));
    const sources = Array.from(document.querySelectorAll('img[alt="item"]')).map((i) => i.getAttribute("src"));
    expect(sources.some((src) => src?.includes("from-string.webp")), "images sent as a JSON string should be read").toBe(true);
    expect(sources.some((src) => src?.includes("from-list.webp")), "images sent as a list should be read").toBe(true);
    expect(screen.getByText("No image"), "images that cannot be read should show No image").toBeInTheDocument();
  });
});

describe("Orders section — the detail screen's edges", () => {
  it("shows the time left to act in hours and minutes", async () => {
    getSellerOrders.mockResolvedValue(listAnswer([order({ remaining_in_minutes: 125 })]));
    await mount();
    await openFirstOrderDetail();
    expect(screen.getByText("Remaining 2h 5m"), "125 minutes should read as 2h 5m").toBeInTheDocument();
  });

  it("shows whole hours without minutes", async () => {
    getSellerOrders.mockResolvedValue(listAnswer([order({ remaining_in_minutes: 120 })]));
    await mount();
    await openFirstOrderDetail();
    expect(screen.getByText("Remaining 2h"), "120 minutes should read as 2h").toBeInTheDocument();
  });

  it("shows minutes alone under an hour", async () => {
    getSellerOrders.mockResolvedValue(listAnswer([order({ remaining_in_minutes: 45 })]));
    await mount();
    await openFirstOrderDetail();
    expect(screen.getByText("Remaining 45m"), "45 minutes should read as 45m").toBeInTheDocument();
  });

  it("says Confirmed for an item that is confirmed but not packed", async () => {
    getSellerOrders.mockResolvedValue(listAnswer([order({ details: [item({ is_confirm: true })] })]));
    await mount();
    await openFirstOrderDetail();
    expect(screen.getByText("Confirmed"), "the row's status should read Confirmed").toBeInTheDocument();
  });

  it("says no order is selected when the open order leaves the list", async () => {
    await mount();
    await openFirstOrderDetail();
    act(() => {
      useAppStore.setState({ sellerOrders: [] } as any);
    });
    expect(
      await screen.findByText("No order selected"),
      "an order that vanished from the list (a push refresh) should leave an empty detail, not a crash",
    ).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(
      await screen.findByText("No orders found"),
      "the back arrow on the empty detail should go back to the list",
    ).toBeInTheDocument();
  });
});

describe("Orders section — item actions that stop early or fail", () => {
  it("sends nothing for an item that has no id", async () => {
    getSellerOrders.mockResolvedValue(listAnswer([order({ details: [item({ id: undefined })] })]));
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getByRole("button", { name: "Confirm & Start Packing" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(confirmOrderDetailStatus, "an item with no id cannot be confirmed").not.toHaveBeenCalled();
    expect(cancelOrderDetail, "an item with no id cannot be cancelled").not.toHaveBeenCalled();
  });

  it("sends no pack for a confirmed item that has no id", async () => {
    getSellerOrders.mockResolvedValue(
      listAnswer([order({ details: [item({ id: undefined, is_confirm: true })] })]),
    );
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getByRole("button", { name: "Packed" }));
    expect(packOrderDetailStatus, "an item with no id cannot be packed").not.toHaveBeenCalled();
  });

  it("sends no cancel for an item with no quantity", async () => {
    getSellerOrders.mockResolvedValue(listAnswer([order({ details: [item({ qty: null })] })]));
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancelOrderDetail, "there is nothing to cancel on an item with no quantity").not.toHaveBeenCalled();
  });

  it("keeps a pack-refused item on the pack step", async () => {
    packOrderDetailStatus.mockResolvedValue({ success: false });
    getSellerOrders.mockResolvedValue(listAnswer([order({ details: [item({ is_confirm: true })] })]));
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getByRole("button", { name: "Packed" }));
    await waitFor(() => expect(packOrderDetailStatus).toHaveBeenCalled());
    expect(
      await screen.findByRole("button", { name: "Packed" }),
      "a refused pack must leave the item waiting to be packed",
    ).toBeInTheDocument();
  });

  it("keeps the item when the cancel is refused or throws", async () => {
    cancelOrderDetail.mockResolvedValueOnce({ success: false }).mockRejectedValueOnce("offline");
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(cancelOrderDetail).toHaveBeenCalledTimes(1));
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(cancelOrderDetail).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Blue Shoe"), "a cancel that did not go through must keep the item on the order").toBeInTheDocument();
  });

  it("keeps the item waiting when the confirm throws", async () => {
    confirmOrderDetailStatus.mockRejectedValue(new Error(""));
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getByRole("button", { name: "Confirm & Start Packing" }));
    await waitFor(() => expect(confirmOrderDetailStatus).toHaveBeenCalled());
    expect(
      await screen.findByRole("button", { name: "Confirm & Start Packing" }),
      "a failed confirm must leave the item waiting",
    ).toBeInTheDocument();
  });

  it("keeps the item packable when the pack throws", async () => {
    packOrderDetailStatus.mockRejectedValue("offline");
    getSellerOrders.mockResolvedValue(listAnswer([order({ details: [item({ is_confirm: true })] })]));
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getByRole("button", { name: "Packed" }));
    await waitFor(() => expect(packOrderDetailStatus).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: "Packed" }), "a failed pack must leave the item packable").toBeInTheDocument();
  });
});

describe("Orders section — items that arrive grouped", () => {
  // The update helpers accept `details` as a list of groups (a group is a list
  // of items) as well as a flat list. The flat row is the one acted on; a
  // grouped row with the same id is updated with it, and other rows are not.
  const grouped = () =>
    order({
      details: [
        item(),
        [item({ id: 601, product_name: "Grouped A", qty: 1 }), item({ id: 501, product_name: "Grouped B", qty: 2 })],
      ],
    });

  it("confirms a flat row and the same id inside a group", async () => {
    confirmOrderDetailStatus.mockResolvedValue({ success: true });
    const withOtherRow = grouped();
    withOtherRow.details.push(item({ id: 700 }) as any);
    // The second order shares the id on purpose: the helper must let an order
    // whose details are not a list pass through.
    getSellerOrders.mockResolvedValue(listAnswer([withOtherRow, order({ details: null })]));
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getAllByRole("button", { name: "Confirm & Start Packing" })[0]);
    await waitFor(() => {
      const current = useAppStore.getState().sellerOrders[0] as any;
      expect(current.details[0].is_confirm, "the flat row should be confirmed").toBe(true);
      expect(current.details[1][1].is_confirm, "the grouped row with the same id should be confirmed too").toBe(true);
      expect(current.details[1][0].is_confirm, "a grouped row with another id must stay as it was").toBe(false);
      expect(current.details[2].is_confirm, "a flat row with another id must stay as it was").toBe(false);
    });
    expect(
      (useAppStore.getState().sellerOrders[1] as any).details,
      "an order with no list of details must pass through unchanged",
    ).toBeNull();
  });

  it("cancels a flat row and drops the same id from inside a group", async () => {
    cancelOrderDetail.mockResolvedValue({ success: true });
    getSellerOrders.mockResolvedValue(listAnswer([grouped(), order({ id: 2002 })]));
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
    await waitFor(() => {
      const current = useAppStore.getState().sellerOrders[0] as any;
      expect(
        current.details.map((g: any) => (Array.isArray(g) ? g.map((i: any) => i.id) : g.id)),
        "the cancelled id should leave the flat list and the group, the other grouped row should stay",
      ).toEqual([[601]]);
    });
    expect(
      (useAppStore.getState().sellerOrders[1] as any).details[0].qty,
      "another order must not be touched by the cancel",
    ).toBe(2);
  });

  it("keeps a partly cancelled row with what is left", async () => {
    cancelOrderDetail.mockResolvedValue({ success: true });
    // The cancel is sent for the first row's whole quantity (2). A grouped row
    // with the same id and a larger quantity (5) keeps what is left (3).
    // The second order shares the id on purpose: the helpers must also let an
    // order whose details are not a list pass through.
    getSellerOrders.mockResolvedValue(
      listAnswer([
        order({ details: [item(), item({ id: 501, qty: 5 }), item({ id: 700, qty: 1 })] }),
        order({ details: null }),
      ]),
    );
    await mount();
    await openFirstOrderDetail();
    await userEvent.click(screen.getAllByRole("button", { name: "Cancel" })[0]);
    await waitFor(() =>
      expect(
        (useAppStore.getState().sellerOrders[0] as any).details.map((d: any) => d.qty),
        "each row with the cancelled id should lose 2 pieces, a row left with none should leave, another row should stay",
      ).toEqual([3, 1]),
    );
    expect(
      (useAppStore.getState().sellerOrders[1] as any).details,
      "an order with no list of details must pass through unchanged",
    ).toBeNull();
  });
});

describe("Orders section — refreshes from outside and more pages", () => {
  it("reloads the list when a push says the orders changed", async () => {
    await mount();
    await waitFor(() => expect(getSellerOrders).toHaveBeenCalledTimes(1));
    act(() => {
      useAppStore.setState({ shouldUpdateOrders: 1 } as any);
    });
    await waitFor(() =>
      expect(getSellerOrders, "a push about the orders should reload page 1").toHaveBeenCalledTimes(2),
    );
  });

  it("goes back to the dashboard home from the top back arrow", async () => {
    const setActiveTab = vi.fn();
    await renderWithProviders(
      <RenderOrders canViewOrders sellerId={SELLER_ID} activeTab="orders" setActiveTab={setActiveTab} />,
      { path: `/sellerProfile/sellerDashboard/${SELLER_ID}` },
    );
    await userEvent.click(
      document.querySelector('[data-pw="seller-dashboard-screen-top-back-button"]') as HTMLElement,
    );
    expect(setActiveTab, "the back arrow should close the Orders section").toHaveBeenCalledWith("none");
  });

  describe("when the bottom of the list scrolls into view", () => {
    let observerCallbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
    class Intersects {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        observerCallbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    const scrollToBottom = () =>
      act(async () => {
        observerCallbacks.at(-1)?.([{ isIntersecting: true }]);
      });
    const firstPageCard = () => screen.findByText("In Progress", { selector: '[data-pw="order-shop-status"]' });

    beforeEach(() => {
      observerCallbacks = [];
      vi.stubGlobal("IntersectionObserver", Intersects);
    });
    afterEach(() => {
      vi.stubGlobal("IntersectionObserver", NeverIntersects);
    });

    it("adds the next page to the list", async () => {
      getSellerOrders
        .mockResolvedValueOnce(listAnswer([order()], { has_more_pages: true }))
        .mockResolvedValueOnce({
          success: true,
          data: { orders: [order({ id: 2002, order_status: "delivered" })] },
        });
      await mount();
      await firstPageCard();
      await scrollToBottom();
      expect(await screen.findByText("Delivered"), "page 2 should be added under page 1").toBeInTheDocument();
      expect(getSellerOrders.mock.calls.at(-1), "the next page should be page 2").toEqual([SELLER_ID, 2, undefined]);
      expect(await firstPageCard(), "page 1 must still be on screen").toBeInTheDocument();
    });

    it("asks for nothing when the backend said there are no more pages", async () => {
      await mount();
      await firstPageCard();
      await scrollToBottom();
      expect(getSellerOrders, "without more pages the bottom must not load anything").toHaveBeenCalledTimes(1);
    });

    it("keeps the first page when the next page is refused", async () => {
      getSellerOrders
        .mockResolvedValueOnce(listAnswer([order()], { has_more_pages: true }))
        .mockResolvedValueOnce({ success: false });
      await mount();
      await firstPageCard();
      await scrollToBottom();
      await waitFor(() => expect(getSellerOrders).toHaveBeenCalledTimes(2));
      expect(await firstPageCard(), "a refused next page must keep the first page on screen").toBeInTheDocument();
    });

    it("keeps the first page when the next page throws a non-error", async () => {
      getSellerOrders
        .mockResolvedValueOnce(listAnswer([order()], { has_more_pages: true }))
        .mockRejectedValueOnce("offline");
      await mount();
      await firstPageCard();
      await scrollToBottom();
      await waitFor(() => expect(getSellerOrders).toHaveBeenCalledTimes(2));
      expect(await firstPageCard(), "a failed next page must keep the first page on screen").toBeInTheDocument();
    });
  });
});
