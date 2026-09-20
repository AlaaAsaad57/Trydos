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
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { renderWithProviders, screen, userEvent, waitFor } from "../../render";

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
