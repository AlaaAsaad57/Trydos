// The options sheet for one product in an order
// (components/setting/orders/OrderItemOptions.tsx).
//
// Which actions show depends on the order: change (not delivered, variant
// change allowed, qty > 0), cancel (cancel allowed, qty > 0), return
// (delivered, with the return-request rules), report (delivered) and hide
// (always). Each action opens a sub-screen, which is stubbed here with the
// callbacks the sheet hands it exposed as buttons.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orderService = vi.hoisted(() => ({
  HideOrderDetail: vi.fn(),
  CreateReturnRequest: vi.fn(),
  getReturnRequestDetails: vi.fn(),
}));
vi.mock("services/order", () => ({ default: orderService }));

const showErrorNotification = vi.hoisted(() => vi.fn());
vi.mock("store/notifications/reducer", () => ({ showErrorNotification }));

const trackOrderMgmt = vi.hoisted(() => vi.fn());
vi.mock("utils/orderFunnel", () => ({
  ORDER_MGMT_EVENTS: {
    ORDER_ITEM_OPTIONS_OPENED: "opened",
    ORDER_ITEM_REPORTED: "reported",
    ORDER_ITEM_HIDDEN: "hidden",
  },
  trackOrderMgmt,
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

vi.mock("components/Orders/ChangeOrderItem", () => ({
  default: ({ backToMain, setShouldConfirmChange }: any) => (
    <div data-testid="change-screen">
      <button onClick={backToMain}>change back</button>
      <button onClick={() => setShouldConfirmChange({ type: "ChangeVariant" })}>
        change confirm
      </button>
    </div>
  ),
}));

vi.mock("components/setting/orders/confirmations/ChangeOrderItemConfirmWindow", () => ({
  ModifyOrderItemModal: ({ close, type }: any) => (
    <div data-testid="modify-modal" data-type={type}>
      <button onClick={close}>modify close</button>
    </div>
  ),
}));

vi.mock("components/setting/orders/confirmations/CancelOrderItemConfirmationWindow", () => ({
  default: ({ close, qty }: any) => (
    <div data-testid="cancel-confirm" data-qty={qty}>
      <button onClick={close}>cancel confirm close</button>
    </div>
  ),
}));

vi.mock("components/setting/orders/CancelOrderItemWrapper", () => ({
  default: ({ backToMain, cancelOrderItem }: any) => (
    <div data-testid="cancel-screen">
      <button onClick={backToMain}>cancel back</button>
      <button onClick={() => cancelOrderItem(1)}>cancel go</button>
    </div>
  ),
}));

vi.mock("components/setting/orders/ReturnOrderItemWrapper", () => ({
  default: ({ backToMain, setShouldConfirmReturn }: any) => (
    <div data-testid="return-screen">
      <button onClick={backToMain}>return back</button>
      <button onClick={() => setShouldConfirmReturn(true)}>return confirm</button>
    </div>
  ),
}));

vi.mock("components/setting/orders/ReportOrderItemWrapper", () => ({
  default: ({ backToMain }: any) => (
    <div data-testid="report-screen">
      <button onClick={backToMain}>report back</button>
    </div>
  ),
}));

vi.mock("components/global/ConfirmModal", () => ({
  ConfirmModal: ({ onCancel, onConfirm, confirmMessage, loading }: any) => (
    <div data-testid="hide-confirm" data-loading={String(loading)}>
      <span>{confirmMessage}</span>
      <button onClick={onCancel}>hide cancel</button>
      <button onClick={onConfirm}>hide confirm</button>
    </div>
  ),
}));

import OrderItemOptions from "components/setting/orders/OrderItemOptions";
import { buildOrder, buildOrderLine } from "../../../fixtures/order";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

type Props = Parameters<typeof OrderItemOptions>[0];

function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    orderItem: buildOrderLine(),
    parentOrder: buildOrder(),
    isRtl: false,
    update: vi.fn(async () => {}),
    close: vi.fn(),
    returnDetails: null as any,
    setActivePack: vi.fn(),
    shouldShowConfirmReturn: false,
    setShouldConfirmReturn: vi.fn(),
    orderData: [buildOrder()],
    onOrderEmptied: vi.fn(),
    ...overrides,
  };
  return renderWithProviders(<OrderItemOptions {...props} />).then((r) => ({ ...r, props }));
}

const delivered = (overrides: any = {}) =>
  buildOrder({ order_status: { value: "delivered", label: "Delivered" }, ...overrides });

beforeEach(() => {
  orderService.HideOrderDetail.mockReset();
  orderService.CreateReturnRequest.mockReset();
  orderService.getReturnRequestDetails.mockReset();
});
afterEach(() => vi.clearAllMocks());

describe("which actions are offered", () => {
  it("a pending order that allows changes and cancels offers change, cancel and hide", async () => {
    await setup({ parentOrder: buildOrder({ can_change_variant: true, can_cancele_order: true }), isRtl: true });
    expect(screen.getByText("Change Product Request"), "change was not offered").toBeInTheDocument();
    expect(screen.getByText("Cancel This Product"), "cancel was not offered").toBeInTheDocument();
    expect(screen.getByText("Hide This Product"), "hide was not offered").toBeInTheDocument();
    expect(screen.queryByText("Report This Product"), "report was offered on an order not delivered").not.toBeInTheDocument();
    expect(trackOrderMgmt, "opening the sheet was not recorded").toHaveBeenCalledWith("opened", {
      order_id: 1,
      item_id: 1,
      product_id: 1001,
      order_status: "pending",
    });
  });

  it("a cancelled line (qty 0) offers neither change nor cancel", async () => {
    await setup({
      parentOrder: buildOrder({ can_change_variant: true, can_cancele_order: true }),
      orderItem: buildOrderLine({ qty: 0 }),
    });
    expect(screen.queryByText("Change Product Request"), "change was offered on a cancelled line").not.toBeInTheDocument();
    expect(screen.queryByText("Cancel This Product"), "cancel was offered on a cancelled line").not.toBeInTheDocument();
  });

  it("a pending order that forbids variant changes offers no change", async () => {
    await setup({ parentOrder: buildOrder({ can_change_variant: false }) });
    expect(screen.queryByText("Change Product Request"), "change was offered although the order forbids it").not.toBeInTheDocument();
  });

  it("a delivered, returnable line offers return with a 24-hour window, and report", async () => {
    await setup({ parentOrder: delivered({ can_return_order: true, can_change_variant: true }) });
    expect(screen.getByText("Return This Product"), "return was not offered on a delivered line").toBeInTheDocument();
    expect(screen.getByText("24 Hours"), "a one-day return window did not read 24 Hours").toBeInTheDocument();
    expect(screen.getByText("Report This Product"), "report was not offered on a delivered order").toBeInTheDocument();
    expect(screen.queryByText("Change Product Request"), "change was offered on a delivered order").not.toBeInTheDocument();
  });

  it("a longer return window reads in days, and a reported line says so", async () => {
    await setup({
      parentOrder: delivered({ can_return_order: true }),
      orderItem: buildOrderLine({ allow_return_in_days: 7, is_reported: true }),
      isRtl: true,
    });
    expect(screen.getByText("7 Days"), "a seven-day return window did not read 7 Days").toBeInTheDocument();
    expect(screen.getByText("We Received Your Report"), "a reported line did not say the report arrived").toBeInTheDocument();
  });

  it("a delivered line with qty 0 offers no return", async () => {
    await setup({ parentOrder: delivered({ can_return_order: true }), orderItem: buildOrderLine({ qty: 0 }) });
    expect(screen.queryByText("Return This Product"), "return was offered on a cancelled line").not.toBeInTheDocument();
  });

  it("a locked return request stops a new product being added", async () => {
    await setup({
      parentOrder: delivered({ can_return_order: true, order_has_return_request: true, edit_return_request: false }),
    });
    expect(screen.queryByText("Return This Product"), "a product could be added to a locked return").not.toBeInTheDocument();
  });

  it.each([
    [true, true],
    [false, false],
  ])("a product already in the return is offered an update only while the return is editable (%s)", async (editable, shown) => {
    await setup({
      parentOrder: delivered({ edit_return_request: editable }),
      returnDetails: {
        return_requests_data: [{ order_id: 1, order_details: [{ detail_id: 1, already_return: true }] }],
      } as any,
    });
    expect(
      !!screen.queryByText("Update Return Request For This Product"),
      `the update-return action visibility was wrong for editable=${editable}`,
    ).toBe(shown);
  });
});

describe("opening each sub-screen", () => {
  it("change opens its screen, back returns, and a confirmed change opens the modify modal", async () => {
    const { props } = await setup({ parentOrder: buildOrder({ can_change_variant: true }) });
    const user = userEvent.setup();
    await user.click(screen.getByText("Change Product Request"));
    await user.click(screen.getByText("change back"));
    expect(screen.getByText("Change Product Request"), "back from change did not return to the options").toBeInTheDocument();

    await user.click(screen.getByText("Change Product Request"));
    await user.click(screen.getByText("change confirm"));
    expect(screen.getByTestId("modify-modal").dataset.type, "the modify modal did not get the change type").toBe("ChangeVariant");
    await user.click(screen.getByText("modify close"));
    expect(props.close, "closing the modify modal did not close the sheet").toHaveBeenCalled();
    expect(screen.queryByTestId("modify-modal"), "the modify modal stayed open").not.toBeInTheDocument();
  });

  it("cancel opens its screen, back returns, and going ahead opens the cancel confirmation with the qty", async () => {
    const { props } = await setup({ parentOrder: buildOrder({ can_cancele_order: true }), orderItem: buildOrderLine({ qty: 2 }) });
    const user = userEvent.setup();
    await user.click(screen.getByText("Cancel This Product"));
    await user.click(screen.getByText("cancel back"));
    await user.click(screen.getByText("Cancel This Product"));
    await user.click(screen.getByText("cancel go"));
    expect(screen.getByTestId("cancel-confirm").dataset.qty, "the cancel confirmation did not get the line qty").toBe("2");
    await user.click(screen.getByText("cancel confirm close"));
    expect(props.close, "closing the cancel confirmation did not close the sheet").toHaveBeenCalled();
  });

  it("report records the event and opens the report sheet, and back returns", async () => {
    await setup({ parentOrder: delivered() });
    const user = userEvent.setup();
    await user.click(screen.getByText("Report This Product"));
    expect(trackOrderMgmt, "the report tap was not recorded").toHaveBeenCalledWith("reported", {
      order_id: 1,
      item_id: 1,
      product_id: 1001,
    });
    await user.click(screen.getByText("report back"));
    expect(screen.getByText("Report This Product"), "back from report did not return to the options").toBeInTheDocument();
  });

  it("tapping the backdrop closes the sheet", async () => {
    const { props } = await setup();
    await userEvent.setup().click(document.querySelector(".opacity-40")!);
    expect(props.close, "the backdrop did not close the sheet").toHaveBeenCalled();
  });
});

describe("starting a return", () => {
  it("creates the request, refreshes, and opens the return screen when the product is returnable", async () => {
    orderService.CreateReturnRequest.mockResolvedValue(50);
    orderService.getReturnRequestDetails.mockResolvedValue({ order_details: [{ detail_id: 1 }] });
    let finishUpdate: () => void = () => {};
    const update = vi.fn(() => new Promise<void>((r) => (finishUpdate = r)));
    const { props } = await setup({ parentOrder: delivered({ can_return_order: true }), update });
    const user = userEvent.setup();
    await user.click(screen.getByText("Return This Product"));
    expect(screen.getByText("Initializing Return"), "no progress was shown while the return starts").toBeInTheDocument();
    await user.click(screen.getByText("Initializing Return"));
    expect(orderService.CreateReturnRequest, "a second tap started a second return").toHaveBeenCalledTimes(1);
    finishUpdate();

    expect(await screen.findByTestId("return-screen"), "the return screen did not open").toBeInTheDocument();
    expect(props.setActivePack, "the pack was not given the new return id").toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, return_request_id: 50 }),
    );
    await user.click(screen.getByText("return confirm"));
    expect(props.setShouldConfirmReturn, "the return screen could not ask for the confirmation").toHaveBeenCalledWith(true);
    await user.click(screen.getByText("return back"));
    expect(screen.getByText("Return This Product"), "back from the return screen did not return to the options").toBeInTheDocument();
  });

  it("says the product cannot be returned when the request does not include it", async () => {
    orderService.CreateReturnRequest.mockResolvedValue(50);
    orderService.getReturnRequestDetails.mockResolvedValue({ order_details: [{ detail_id: 99 }] });
    await setup({ parentOrder: delivered({ can_return_order: true }) });
    await userEvent.setup().click(screen.getByText("Return This Product"));
    await waitFor(() =>
      expect(showErrorNotification, "the shopper was not told the product cannot be returned").toHaveBeenCalledWith(
        "return this product is not allowed",
      ),
    );
    expect(screen.queryByTestId("return-screen"), "the return screen opened for a product not in the request").not.toBeInTheDocument();
  });

  it("jumps straight to the return screen for a pack that already has a request, and logs a failed create", async () => {
    orderService.CreateReturnRequest.mockResolvedValue(null);
    await setup({ parentOrder: delivered({ can_return_order: true, return_request_id: 50 } as any) });
    await userEvent.setup().click(screen.getByText("Return This Product"));
    expect(screen.getByTestId("return-screen"), "a pack with a request did not open the return screen").toBeInTheDocument();
    await waitFor(() =>
      expect(logError, "a return that could not be created was not logged").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In initializeReturn in OrderItemOptions" }),
      ),
    );
  });
});

describe("hiding the product", () => {
  it("asks first, and cancelling keeps it", async () => {
    await setup({ parentOrder: buildOrder({ details: [buildOrderLine(), buildOrderLine({ id: 2 })] }) });
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Product"));
    expect(trackOrderMgmt, "the hide tap was not recorded").toHaveBeenCalledWith("hidden", {
      order_id: 1,
      item_id: 1,
      product_id: 1001,
    });
    expect(
      screen.getByText("Are you sure you want to hide this product?"),
      "the hide confirmation did not ask the plain question",
    ).toBeInTheDocument();
    await user.click(screen.getByText("hide cancel"));
    expect(screen.queryByTestId("hide-confirm"), "cancelling the hide left the confirmation open").not.toBeInTheDocument();
  });

  it("hides one of several products and refreshes the page", async () => {
    orderService.HideOrderDetail.mockResolvedValue(undefined);
    const { props } = await setup({ parentOrder: buildOrder({ details: [buildOrderLine(), buildOrderLine({ id: 2 })] }) });
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Product"));
    await user.click(screen.getByText("hide confirm"));
    await waitFor(() => expect(props.update, "hiding one of several products did not refresh the order").toHaveBeenCalled());
    expect(orderService.HideOrderDetail, "the hide did not name the line").toHaveBeenCalledWith({ detail_id: 1 });
    expect(props.onOrderEmptied, "hiding one of several products left the page").not.toHaveBeenCalled();
  });

  it("hiding the only product of a single-pack group leaves the page", async () => {
    orderService.HideOrderDetail.mockResolvedValue(undefined);
    const { props } = await setup({ orderData: undefined as any });
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Product"));
    expect(
      screen.getByText("This is the only product in this order, so hiding it will hide the whole order."),
      "hiding the last product did not warn that the whole order goes",
    ).toBeInTheDocument();
    await user.click(screen.getByText("hide confirm"));
    await waitFor(() => expect(props.onOrderEmptied, "emptying the only pack did not leave the page").toHaveBeenCalled());
    expect(props.update, "emptying the only pack refreshed instead of leaving").not.toHaveBeenCalled();
  });

  it("hiding the only product while other packs remain refreshes and stays", async () => {
    orderService.HideOrderDetail.mockResolvedValue(undefined);
    const { props } = await setup({ orderData: [buildOrder(), buildOrder({ id: 2 })], parentOrder: { ...buildOrder(), details: undefined } as any });
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Product"));
    await user.click(screen.getByText("hide confirm"));
    await waitFor(() => expect(props.update, "hiding the last product of one pack did not refresh the group").toHaveBeenCalled());
  });

  it("logs a failed hide and keeps the sheet open", async () => {
    orderService.HideOrderDetail.mockRejectedValue(new Error("refused"));
    const { props } = await setup({ onOrderEmptied: undefined });
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Product"));
    await user.click(screen.getByText("hide confirm"));
    await waitFor(() =>
      expect(logError, "a refused hide was not logged").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In handleHideProduct in OrderItemOptions" }),
      ),
    );
    expect(props.close, "a refused hide closed the sheet").not.toHaveBeenCalled();
    expect(screen.getByTestId("hide-confirm").dataset.loading, "the hide confirmation stayed busy").toBe("false");
  });

  it("does not break when the empty-order callback is missing", async () => {
    orderService.HideOrderDetail.mockResolvedValue(undefined);
    const { props } = await setup({ onOrderEmptied: undefined, orderData: [] });
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Product"));
    await user.click(screen.getByText("hide confirm"));
    await waitFor(() => expect(props.close, "the sheet did not close after the hide").toHaveBeenCalled());
  });
});
