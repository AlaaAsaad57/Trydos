// The order details page (components/setting/orders/OrderDetailsWrapper.tsx).
//
// The page loads one order group, shows the active pack, and opens the
// delivery-worker chat when the pack is on its way (or a return is being
// collected). The heavy children — the chat, the option menus, the return
// confirmation, the items list — are stubbed: each stub exposes the callbacks
// the page hands it as buttons, so a test can drive the page the way the child
// would. Nothing here talks to a network: the order service and fetchData are
// replaced.
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orderService = vi.hoisted(() => ({
  getOrderDetails: vi.fn(),
  GetReturnDetailsForOrderGroup: vi.fn(),
  CancelReturnRequest: vi.fn(),
}));
vi.mock("services/order", () => ({ default: orderService }));

const fetchDataMock = vi.hoisted(() => vi.fn());
vi.mock("utils/fetchData", () => ({
  fetchData: fetchDataMock,
  abortInFlightForLogout: vi.fn(),
}));

vi.mock("services/auth", () => ({ default: { UserID: () => 7 } }));

const trackOrderMgmt = vi.hoisted(() => vi.fn());
vi.mock("utils/orderFunnel", () => ({
  ORDER_MGMT_EVENTS: { ORDER_DETAILS_VIEWED: "order_details_viewed" },
  trackOrderMgmt,
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

vi.mock("components/skeleton/loaders/OrderDetailsSkeleton", () => ({
  default: () => <div data-testid="order-details-skeleton" />,
}));

vi.mock("components/Chat/ChatWidget", () => ({
  default: ({ isOpen, onClose }: any) => (
    <div data-testid="chat-widget" data-open={String(isOpen)}>
      <button onClick={onClose}>close chat</button>
    </div>
  ),
}));

vi.mock("components/settings/OrderChatIcon", () => ({
  default: ({ getChatWithShipping, id }: any) => (
    <button data-testid="order-chat-icon" data-id={String(id)} onClick={getChatWithShipping}>
      open delivery chat
    </button>
  ),
}));

vi.mock("components/setting/orders/OrderOptionsMenu", () => ({
  default: ({ update, close, onHidden, order }: any) => (
    <div data-testid="order-options-menu" data-order={order.id}>
      <button onClick={() => update()}>menu update</button>
      <button onClick={close}>menu close</button>
      <button onClick={onHidden}>menu hidden</button>
    </div>
  ),
}));

vi.mock("components/setting/orders/OrderItemOptions", () => ({
  default: ({ close, update, onOrderEmptied, orderItem }: any) => (
    <div data-testid="order-item-options" data-item={orderItem?.id}>
      <button onClick={close}>item close</button>
      <button onClick={() => update()}>item update</button>
      <button onClick={onOrderEmptied}>item emptied</button>
    </div>
  ),
}));

vi.mock(
  "components/setting/orders/confirmations/OrderItemReturnConfirmationWindow",
  () => ({
    default: ({ callback, close }: any) => (
      <div data-testid="return-confirmation">
        <button onClick={() => callback()}>confirm return done</button>
        <button onClick={close}>confirm return close</button>
      </div>
    ),
  }),
);

vi.mock("components/Orders/OrderRetailsReturnInfo", () => ({
  default: ({ product, price, callback, return_request_id }: any) => (
    <div
      data-testid="return-info"
      data-status={product.return_status?.value}
      data-price={String(price)}
      data-return-id={String(return_request_id)}
    >
      <button onClick={callback}>return info refresh</button>
    </div>
  ),
}));

vi.mock("components/settings/cards/RateOrderButton", () => ({
  default: ({ setExpanded }: any) => (
    <button onClick={() => setExpanded()}>rate order</button>
  ),
}));

vi.mock("components/settings/cards/OrderItemsList", () => ({
  default: (props: any) => (
    <div data-testid="order-items-list">
      <button onClick={() => props.setExpanded(true)}>expand</button>
      <button onClick={() => props.getOrderDetails()}>list refresh</button>
      <span data-testid="product-url">
        {props.items.map((item: any) => props.getProductUrl(item)).join("|")}
      </span>
      <span data-testid="product-comment">
        {JSON.stringify(props.getProductComment(1001, 1) ?? null)}
      </span>
      <span data-testid="should-show-chat">{String(props.shouldShowChat())}</span>
      <div data-testid="chats">{props.showChats()}</div>
    </div>
  ),
}));

import OrderDetailsWrapper from "components/setting/orders/OrderDetailsWrapper";
import { OPEN_DELIVERY_CHAT_EVENT } from "utils/notificationEvents";
import { buildOrder, buildOrderLine } from "../../../fixtures/order";
import { routerSpies } from "../../../mocks/nextNavigation";
import { renderWithProviders, screen, userEvent, waitFor, fireEvent } from "../../../render";

const LOCAL = "gb-en";

function returnEntry(overrides: any = {}) {
  return {
    order_id: 1,
    return_request_id: 50,
    total_returnable_amount: 0,
    description_returnable_amount_less_than_0: "",
    return_request_destination_id: 1,
    status: { name: "pending", value: "pending" },
    order_details: [
      {
        detail_id: 1,
        return_request_id: 50,
        already_return: true,
        return_request_product_id: 900,
        return_request_product_quantity: "1",
      },
    ],
    ...overrides,
  };
}

function storeSpies() {
  return {
    openChat: vi.fn(),
    setIsNavigating: vi.fn(),
    showNotificationIndicator: vi.fn(),
    showNotificaionCircle: [
      { order_id: 999, order_group_id: "other-group" },
      { order_id: 1, order_group_id: "test-order-group" },
    ],
    currency: { symbol: "$" },
    userChat: { id: 5, name: "Me" },
    settings: { starting_setting: { shipping_duration_days: 2 } },
  };
}

async function renderPage(props: Partial<any> = {}, store: any = {}) {
  const spies = storeSpies();
  const result = await renderWithProviders(
    <OrderDetailsWrapper
      order_id={props.order_id ?? 1}
      isRtl={props.isRtl ?? false}
      local={props.local ?? LOCAL}
      order_group_id={props.order_group_id ?? "test-order-group"}
      order_chat_id={props.order_chat_id ?? null}
    />,
    {
      store: { ...spies, ...store },
      language: props.language ?? "en",
      path: "/settings/orders/test-order-group",
    },
  );
  return { ...result, spies: { ...spies, ...store } };
}

beforeEach(() => {
  orderService.getOrderDetails.mockReset();
  orderService.GetReturnDetailsForOrderGroup.mockReset();
  orderService.CancelReturnRequest.mockReset();
  fetchDataMock.mockReset();
  trackOrderMgmt.mockReset();
  logError.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("an order group that cannot be loaded", () => {
  it("shows the not-found state when the request fails, and its button goes back to the orders list", async () => {
    orderService.getOrderDetails.mockResolvedValue(null);
    await renderPage();

    expect(
      await screen.findByText("Order Not Found"),
      "a failed order request did not show the not-found state",
    ).toBeInTheDocument();

    await userEvent.setup().click(screen.getByText("Go To My Orders"));
    expect(
      routerSpies.replace,
      "the not-found button did not send the shopper to the orders list",
    ).toHaveBeenCalledWith(`/${LOCAL}/settings/orders`);
  });

  it("shows the not-found state for an empty group, in right-to-left for Arabic", async () => {
    orderService.getOrderDetails.mockResolvedValue([]);
    await renderPage({ isRtl: true, local: "gb-ar", language: "ar" });

    await screen.findByText("الذهاب إلى طلباتي");
    const state = document.querySelector('[data-pw="order-not-found"]') as HTMLElement;
    expect(
      state.style.direction,
      "the not-found state is not right-to-left for an Arabic shopper",
    ).toBe("rtl");
  });
});

describe("a pending order group", () => {
  it("shows the skeleton first, then the active pack, and tracks the view once", async () => {
    const orders = [
      buildOrder({ id: 1 }),
      buildOrder({ id: 2, order_group_status: null as any }),
    ];
    orderService.getOrderDetails.mockResolvedValue(orders);
    await renderPage({ order_id: 2 });

    expect(
      screen.getByTestId("order-details-skeleton"),
      "the skeleton is not shown while the order loads",
    ).toBeInTheDocument();
    await screen.findByTestId("order-items-list");

    expect(
      trackOrderMgmt,
      "opening the details page did not record a details-viewed event for pack 2",
    ).toHaveBeenCalledWith("order_details_viewed", expect.objectContaining({ order_id: 2 }));
    expect(
      fetchDataMock,
      "ratings were requested for an order that is not delivered",
    ).not.toHaveBeenCalled();
    expect(
      orderService.GetReturnDetailsForOrderGroup,
      "return details were requested for an order with no return request",
    ).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("should-show-chat").textContent,
      "a pending pack offered the delivery chat",
    ).toBe("false");

    // Switching pack from the pack bar.
    await userEvent.setup().click(screen.getByText("1", { selector: "span.bold" }));
    expect(
      screen.getByText("1", { selector: "span.bold" }).parentElement?.className,
      "the tapped pack is not marked as the active one",
    ).toContain("border-[#402cdd]");
  });

  it("builds the product link with colour and size, or plain when there is no variation", async () => {
    const withVariation = buildOrderLine({
      id: 1,
      product_slug: "",
      product_variation_id: 9,
      variation: [{ id: 9, color: { name: "red" }, size: "M" }] as any,
    });
    const variationWithoutValues = buildOrderLine({
      id: 2,
      product_slug: "second",
      product_variation_id: 9,
      variation: [{ id: 8 }] as any,
    });
    const plain = buildOrderLine({ id: 3, product_slug: "third" });
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ details: [withVariation, variationWithoutValues, plain] }),
    ]);
    await renderPage();

    const urls = (await screen.findByTestId("product-url")).textContent?.split("|");
    expect(urls?.[0], "the colour and size did not reach the product link").toBe(
      `/${LOCAL}/products/test-product?color=red&size=M`,
    );
    expect(urls?.[1], "a variation with no colour or size left stray params").toBe(
      `/${LOCAL}/products/second?`,
    );
    expect(urls?.[2], "a product with no variation did not get a plain link").toBe(
      `/${LOCAL}/products/third`,
    );
  });

  it("refetches when the store asks for an update", async () => {
    orderService.getOrderDetails.mockResolvedValue([buildOrder()]);
    const { store } = await renderPage();
    await screen.findByTestId("order-items-list");

    await act(async () => {
      store.setState({ shouldUpdateOrders: 1 } as any);
    });

    await waitFor(() =>
      expect(
        orderService.getOrderDetails,
        "a store update request did not reload the order",
      ).toHaveBeenCalledTimes(2),
    );
    expect(
      trackOrderMgmt,
      "a reload recorded a second details-viewed event",
    ).toHaveBeenCalledTimes(1);
  });

  it("logs and recovers when a follow-up request throws", async () => {
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ order_status: { value: "delivered", label: "Delivered" } }),
    ]);
    fetchDataMock.mockRejectedValue(new Error("ratings down"));
    await renderPage();

    await screen.findByTestId("order-items-list");
    expect(logError, "a failed ratings request was not logged").toHaveBeenCalledWith(
      expect.objectContaining({
        scenario: "Error In getOrderDetails in OrderDetailsWrapper",
      }),
    );
  });
});

describe("the menus on the page", () => {
  it("opens the order menu from the back bar, and the menu can refresh, close, and hide the order", async () => {
    orderService.getOrderDetails.mockResolvedValue([buildOrder()]);
    await renderPage();
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();

    await user.click(document.querySelector('[data-pw="screen-options-button"]')!);
    expect(
      screen.getByTestId("order-options-menu"),
      "the options icon did not open the order menu",
    ).toBeInTheDocument();

    await user.click(screen.getByText("menu update"));
    expect(
      orderService.getOrderDetails,
      "the order menu update did not reload the order",
    ).toHaveBeenCalledTimes(2);

    await screen.findByTestId("order-items-list");
    await user.click(screen.getByText("menu close"));
    expect(
      screen.queryByTestId("order-options-menu"),
      "closing the order menu left it on screen",
    ).not.toBeInTheDocument();

    await user.click(document.querySelector('[data-pw="screen-options-button"]')!);
    await user.click(screen.getByText("menu hidden"));
    expect(
      routerSpies.replace,
      "hiding the order did not leave for the orders list",
    ).toHaveBeenCalledWith(`/${LOCAL}/settings/orders`);
  });

  it("the back arrow first collapses the expanded view, and only then navigates", async () => {
    orderService.getOrderDetails.mockResolvedValue([buildOrder()]);
    await renderPage();
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();

    await user.click(screen.getByText("expand"));
    await user.click(document.querySelector('[data-pw="order-details-screen-back-button"]')!);
    expect(
      routerSpies.push,
      "the back arrow navigated while the details were still expanded",
    ).not.toHaveBeenCalled();

    await user.click(document.querySelector('[data-pw="order-details-screen-back-button"]')!);
    expect(
      routerSpies.push,
      "the back arrow did not go back to the orders list once collapsed",
    ).toHaveBeenCalledWith(`/${LOCAL}/settings/orders`);
  });
});

describe("the expanded view", () => {
  it("lists every product with colour, size, cancelled state and the wallet refund note", async () => {
    const cancelled = buildOrderLine({
      id: 1,
      qty: 0,
      product_variation_id: 9,
      variation: [{ id: 9, color: { name: "red" }, size: "M" }] as any,
    });
    const noOffer = buildOrderLine({ id: 2, offer_price: -1 as any });
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({
        payment_method: { value: "wallet", label: "Wallet" },
        details: [cancelled, noOffer],
      }),
    ]);
    await renderPage({ local: "gb-en" });
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();
    await user.click(screen.getByText("expand"));

    expect(screen.getByText("red"), "the colour of the variation is not shown").toBeInTheDocument();
    expect(screen.getByText("M"), "the size of the variation is not shown").toBeInTheDocument();
    expect(
      screen.getByText("Canceled"),
      "a line with quantity 0 is not marked as cancelled",
    ).toBeInTheDocument();
    expect(
      screen.getByText("Back To Your Wallet"),
      "a cancelled line on a paid order does not say the money goes back to the wallet",
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-pw="order-product-offer-price"]').length,
      "a line with no offer price still shows a struck-through price",
    ).toBe(1);

    await user.click(document.querySelectorAll('[data-pw="order-item-options"]')[0]);
    expect(
      screen.getByTestId("order-item-options").dataset.item,
      "the item options did not open for the tapped line",
    ).toBe("1");

    await user.click(screen.getByText("item update"));
    expect(
      orderService.getOrderDetails,
      "the item options update did not reload the order",
    ).toHaveBeenCalledTimes(2);
  });

  it("the item options can close and can send the shopper away when the order is emptied", async () => {
    orderService.getOrderDetails.mockResolvedValue([buildOrder()]);
    await renderPage({ isRtl: true, local: "gb-ar", language: "ar" });
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();
    await user.click(screen.getByText("expand"));

    await user.click(document.querySelector('[data-pw="order-item-options"]')!);
    await user.click(screen.getByText("item close"));
    expect(
      screen.queryByTestId("order-item-options"),
      "closing the item options left them on screen",
    ).not.toBeInTheDocument();

    await user.click(document.querySelector('[data-pw="order-item-options"]')!);
    await user.click(screen.getByText("item emptied"));
    expect(
      routerSpies.replace,
      "emptying the order did not leave for the orders list",
    ).toHaveBeenCalledWith("/gb-ar/settings/orders");
  });

  it("offers to cancel and to confirm a return, and cancelling calls the service with every request id", async () => {
    const order = buildOrder({
      edit_return_request: true,
      order_has_return_request: true,
      return_request_id: 50,
    } as any);
    orderService.getOrderDetails.mockResolvedValue([order]);
    orderService.GetReturnDetailsForOrderGroup.mockResolvedValue({
      return_requests_data: [
        returnEntry({ status: { name: "draft", value: null } }),
      ],
    });
    let resolveCancel: () => void = () => {};
    orderService.CancelReturnRequest.mockImplementation(
      () => new Promise<void>((resolve) => (resolveCancel = resolve)),
    );
    await renderPage();
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();
    await user.click(screen.getByText("expand"));

    expect(
      screen.getByTestId("return-info").dataset.returnId,
      "the return info did not get the return line id",
    ).toBe("900");

    await user.click(screen.getByText("Confirm Return Request"));
    expect(
      screen.getByTestId("return-confirmation"),
      "the confirm-return link did not open the confirmation",
    ).toBeInTheDocument();
    await user.click(screen.getByText("confirm return close"));
    expect(
      screen.queryByTestId("return-confirmation"),
      "closing the confirmation left it on screen",
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("Confirm Return Request"));
    fireEvent.click(document.querySelector(".opacity-40")!);
    expect(
      screen.queryByTestId("return-confirmation"),
      "tapping the backdrop did not close the confirmation",
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("Confirm Return Request"));
    await user.click(screen.getByText("confirm return done"));
    await waitFor(() =>
      expect(
        orderService.getOrderDetails,
        "finishing the confirmation did not reload the order",
      ).toHaveBeenCalledTimes(2),
    );
    await screen.findByTestId("order-items-list");
    await user.click(screen.getByText("expand"));

    await user.click(screen.getByText("Cancel Return Request"));
    expect(
      orderService.CancelReturnRequest,
      "cancelling the return did not send every return request id",
    ).toHaveBeenCalledWith({ return_request_id: [50] });
    await act(async () => resolveCancel());
    await waitFor(() =>
      expect(
        orderService.getOrderDetails,
        "cancelling the return did not reload the order",
      ).toHaveBeenCalledTimes(3),
    );

    await screen.findByTestId("order-items-list");
    await user.click(screen.getByText("expand"));
    await user.click(screen.getByText("return info refresh"));
    expect(
      orderService.getOrderDetails,
      "the return info refresh did not reload the order",
    ).toHaveBeenCalledTimes(4);
  });

  it("logs a failed return cancel and does not offer confirm when every pack forbids edits", async () => {
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ edit_return_request: true, order_has_return_request: true, return_request_id: 50 } as any),
    ]);
    orderService.GetReturnDetailsForOrderGroup.mockResolvedValue({
      return_requests_data: [returnEntry({ status: { name: "x", value: null } })],
    });
    orderService.CancelReturnRequest.mockRejectedValue(new Error("cancel refused"));
    await renderPage();
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();
    await user.click(screen.getByText("expand"));

    await user.click(screen.getByText("Cancel Return Request"));
    await waitFor(() =>
      expect(logError, "a refused return cancel was not logged").toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In CancelReturnRequest in OrderDetailsWrapper",
        }),
      ),
    );
    expect(
      screen.getByText("Cancel Return Request"),
      "the cancel link did not come back after the cancel failed",
    ).toBeInTheDocument();
  });

  it("hides confirm and cancel when no pack may edit its return, and a return with no ids cancels nothing", async () => {
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ edit_return_request: false, return_request_id: 50 } as any),
    ]);
    orderService.GetReturnDetailsForOrderGroup.mockResolvedValue({
      return_requests_data: [
        returnEntry({
          status: { name: "x", value: null },
          order_details: [{ detail_id: 1, already_return: true, return_request_id: null }],
        }),
      ],
    });
    await renderPage();
    await screen.findByTestId("order-items-list");
    await userEvent.setup().click(screen.getByText("expand"));

    expect(
      screen.queryByText("Confirm Return Request"),
      "confirm was offered although no pack may edit its return",
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Cancel Return Request"),
      "cancel was offered although the pack may not edit its return",
    ).not.toBeInTheDocument();
  });
});

describe("the delivery chat", () => {
  const outForDelivery = () =>
    buildOrder({ order_status: { value: "out_for_delivery", label: "Out" } });

  it("offers the chat for a pack out for delivery and opens an existing channel with the worker renamed", async () => {
    orderService.getOrderDetails.mockResolvedValue([outForDelivery()]);
    fetchDataMock.mockResolvedValue({
      success: true,
      data: {
        chat_participant: { id: 77 },
        channel: {
          id: "c1",
          channel_members: [
            { user_id: 5, user: { name: "Me" } },
            { user_id: 8, user: { name: "Real Name", phone: "x" } },
          ],
          messages: [
            { id: "late", created_at: "2030-01-02" },
            { id: "early", created_at: "2030-01-01" },
          ],
        },
      },
    });
    const { spies } = await renderPage();
    await screen.findByTestId("order-items-list");

    await userEvent.setup().click(screen.getByTestId("order-chat-icon"));

    await waitFor(() =>
      expect(spies.openChat, "the delivery chat was not opened").toHaveBeenCalled(),
    );
    const chat = spies.openChat.mock.calls[0][0];
    expect(
      chat.channel_members[1].user.name,
      "the delivery worker is not shown under the neutral name",
    ).toBe("Delivery Worker");
    expect(chat.channel_members[0].user.name, "the shopper's own name was replaced").toBe("Me");
    expect(
      chat.messages.map((m: any) => m.id),
      "the chat messages are not sorted oldest first",
    ).toEqual(["early", "late"]);
    expect(
      spies.showNotificationIndicator,
      "the notification dot for this order was not cleared, or another order's dot was dropped",
    ).toHaveBeenCalledWith([{ order_id: 999, order_group_id: "other-group" }]);
    expect(
      screen.getByTestId("chat-widget").dataset.open,
      "the chat widget is not open",
    ).toBe("true");
    expect(routerSpies.replace, "the chat query was not cleared from the address").toHaveBeenCalled();

    await userEvent.setup().click(screen.getByText("close chat"));
    expect(
      screen.getByTestId("chat-widget").dataset.open,
      "closing the chat did not close it",
    ).toBe("false");
  });

  it("builds a new chat when the worker has no channel yet, and handles a channel with no messages", async () => {
    orderService.getOrderDetails.mockResolvedValue([outForDelivery()]);
    fetchDataMock.mockResolvedValueOnce({
      success: true,
      data: { chat_participant: { id: 77 }, recipient: { id: 8 }, channel: null },
    });
    const { spies } = await renderPage();
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();
    await user.click(screen.getByTestId("order-chat-icon"));

    await waitFor(() => expect(spies.openChat).toHaveBeenCalled());
    const chat = spies.openChat.mock.calls[0][0];
    expect(chat.id, "a new chat did not get its participant-based id").toBe("ch-77");
    expect(
      chat.channel_members[1].user_id,
      "the new chat does not name the delivery worker as recipient",
    ).toBe(8);

    fetchDataMock.mockResolvedValueOnce({
      success: true,
      data: { chat_participant: { id: 77 }, channel: { channel_members: [] } },
    });
    await user.click(screen.getByTestId("order-chat-icon"));
    await waitFor(() => expect(spies.openChat).toHaveBeenCalledTimes(2));
    expect(
      spies.openChat.mock.calls[1][0].messages,
      "a channel with no messages did not get an empty list",
    ).toEqual([]);
  });

  it("logs a refused chat request, and stays quiet on an aborted one", async () => {
    orderService.getOrderDetails.mockResolvedValue([outForDelivery()]);
    fetchDataMock.mockResolvedValueOnce({ success: false, message: "no worker" });
    const { spies } = await renderPage();
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();
    await user.click(screen.getByTestId("order-chat-icon"));

    await waitFor(() =>
      expect(logError, "a refused chat request was not logged").toHaveBeenCalledWith(
        expect.objectContaining({
          scenario: "Error In getChatWithShipping in OrderDetailsWrapper",
        }),
      ),
    );

    logError.mockClear();
    const abort = new Error("aborted");
    abort.name = "AbortError";
    fetchDataMock.mockRejectedValueOnce(abort);
    await user.click(screen.getByTestId("order-chat-icon"));
    await waitFor(() => expect(fetchDataMock).toHaveBeenCalledTimes(2));
    expect(logError, "an aborted chat request was logged as an error").not.toHaveBeenCalled();
    expect(spies.openChat, "a failed chat request opened a chat").not.toHaveBeenCalled();
  });

  it("opens the chat on load when the address names an out-for-delivery pack", async () => {
    orderService.getOrderDetails.mockResolvedValue([outForDelivery()]);
    fetchDataMock.mockResolvedValue({
      success: true,
      data: { chat_participant: { id: 1 }, recipient: { id: 8 } },
    });
    const { spies } = await renderPage({ order_chat_id: 1 });

    await waitFor(() =>
      expect(spies.openChat, "the chat named in the address did not open").toHaveBeenCalled(),
    );
    const body = JSON.parse(fetchDataMock.mock.calls[0][0].body);
    expect(body, "the chat request did not ask for this order").toEqual({
      original_user_id: 7,
      order_id: 1,
    });
  });

  it("opens the return chat on load for a return being collected, and offers it on the pack", async () => {
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ return_request_id: 50 } as any),
    ]);
    orderService.GetReturnDetailsForOrderGroup.mockResolvedValue({
      return_requests_data: [returnEntry({ status: { name: "out", value: "out_for_return" } })],
    });
    fetchDataMock.mockResolvedValue({
      success: true,
      data: { chat_participant: { id: 1 }, recipient: { id: 8 } },
    });
    const { spies } = await renderPage({ order_chat_id: 50 });

    await waitFor(() => expect(spies.openChat).toHaveBeenCalled());
    const body = JSON.parse(fetchDataMock.mock.calls[0][0].body);
    expect(body, "the return chat did not name the return and its parent pack").toEqual({
      original_user_id: 7,
      order_id: 50,
      parent_order_id: 1,
    });
    expect(
      screen.getByTestId("should-show-chat").textContent,
      "a return out for collection did not offer the chat with its return id",
    ).toBe("50");
  });

  it("does nothing for an address chat id that names no pack, or a pack not on its way", async () => {
    orderService.getOrderDetails.mockResolvedValue([buildOrder()]);
    await renderPage({ order_chat_id: 404 });
    await screen.findByTestId("order-items-list");

    window.dispatchEvent(
      new CustomEvent(OPEN_DELIVERY_CHAT_EVENT, {
        detail: { order_group_id: "test-order-group", chat_id: 1 },
      }),
    );
    window.dispatchEvent(
      new CustomEvent(OPEN_DELIVERY_CHAT_EVENT, {
        detail: { order_group_id: "other-group", chat_id: 1 },
      }),
    );
    window.dispatchEvent(new CustomEvent(OPEN_DELIVERY_CHAT_EVENT));
    expect(fetchDataMock, "a chat was requested for a pack that is not on its way").not.toHaveBeenCalled();
  });

  it("opens the chat when the service worker asks the open tab to", async () => {
    orderService.getOrderDetails.mockResolvedValue([outForDelivery()]);
    fetchDataMock.mockResolvedValue({
      success: true,
      data: { chat_participant: { id: 1 }, recipient: { id: 8 } },
    });
    const { spies } = await renderPage();
    await screen.findByTestId("order-items-list");

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(OPEN_DELIVERY_CHAT_EVENT, {
          detail: { order_group_id: "test-order-group", chat_id: 1 },
        }),
      );
    });
    await waitFor(() =>
      expect(spies.openChat, "the service-worker event did not open the chat").toHaveBeenCalled(),
    );
  });

  it(
    "BUG-settings-1: the address chat id for a second pack's return opens that return's chat, not the first return's status",
    async () => {
      orderService.getOrderDetails.mockResolvedValue([
        buildOrder({ id: 1, return_request_id: 50 } as any),
        buildOrder({ id: 2, return_request_id: 60 } as any),
      ]);
      orderService.GetReturnDetailsForOrderGroup.mockResolvedValue({
        return_requests_data: [
          returnEntry({ order_id: 1, return_request_id: 50, status: { name: "p", value: "pending" } }),
          returnEntry({ order_id: 2, return_request_id: 60, status: { name: "o", value: "out_for_return" } }),
        ],
      });
      fetchDataMock.mockResolvedValue({
        success: true,
        data: { chat_participant: { id: 1 }, recipient: { id: 8 } },
      });
      const { spies } = await renderPage({ order_id: 1, order_chat_id: 60 });
      await screen.findByTestId("order-items-list");

      await waitFor(() =>
        expect(
          spies.openChat,
          "the chat for pack 2's return, which is out for collection, did not open",
        ).toHaveBeenCalled(),
      );
    },
  );
});

describe("a delivered order", () => {
  it("fetches the ratings, shows the rate button instead of the address, and matches a comment to its line", async () => {
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ order_status: { value: "delivered", label: "Delivered" } }),
    ]);
    fetchDataMock.mockResolvedValue({
      data: { comments: [{ product_id: 1001, order_details_id: "1", comment: "good" }] },
    });
    await renderPage();
    await screen.findByTestId("order-items-list");

    const body = JSON.parse(fetchDataMock.mock.calls[0][0].body);
    expect(body, "the ratings request did not name every line and the user").toEqual({
      order_detail_ids: [1],
      user_id: 7,
    });
    await waitFor(() =>
      expect(
        JSON.parse(screen.getByTestId("product-comment").textContent!)?.comment,
        "the shopper's comment was not matched to the delivered line",
      ).toBe("good"),
    );
  });

  it("treats a ratings answer with no comments as none", async () => {
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ order_status: { value: "delivered", label: "Delivered" } }),
    ]);
    fetchDataMock.mockResolvedValue({ data: {} });
    await renderPage();
    await screen.findByTestId("order-items-list");
    expect(
      screen.getByTestId("product-comment").textContent,
      "a ratings answer with no comments still matched a comment",
    ).toBe("null");
  });

  it("the rate button keeps the details collapsed, and the list can ask for a reload", async () => {
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ order_status: { value: "delivered", label: "Delivered" } }),
    ]);
    fetchDataMock.mockResolvedValue({ data: { comments: [] } });
    await renderPage();
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();

    await user.click(screen.getByText("rate order"));
    expect(
      screen.getByText("rate order"),
      "the rate button disappeared, so the details were expanded",
    ).toBeInTheDocument();

    await user.click(screen.getByText("list refresh"));
    expect(
      orderService.getOrderDetails,
      "the items list reload did not fetch the order again",
    ).toHaveBeenCalledTimes(2);
  });
});

describe("return links that find no return ids", () => {
  it("offers no confirm when the returned line carries no return id, and cancel sends nothing", async () => {
    orderService.getOrderDetails.mockResolvedValue([
      buildOrder({ edit_return_request: true, order_has_return_request: true, return_request_id: 50 } as any),
    ]);
    orderService.GetReturnDetailsForOrderGroup.mockResolvedValue({
      return_requests_data: [
        returnEntry({
          status: { name: "x", value: null },
          order_details: [{ detail_id: 1, already_return: true, return_request_id: null }],
        }),
      ],
    });
    await renderPage();
    await screen.findByTestId("order-items-list");
    const user = userEvent.setup();
    await user.click(screen.getByText("expand"));

    expect(
      screen.queryByText("Confirm Return Request"),
      "confirm was offered for a return with no return id",
    ).not.toBeInTheDocument();
    await user.click(screen.getByText("Cancel Return Request"));
    expect(
      orderService.CancelReturnRequest,
      "a cancel was sent although there is no return id to cancel",
    ).not.toHaveBeenCalled();
  });
});
