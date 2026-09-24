// The return confirmation (components/setting/orders/confirmations/OrderItemReturnConfirmationWindow.tsx).
//
// It lists the products in the return (the one being added plus those already
// in a draft request), and after the terms are ticked either confirms the
// return now or saves it and waits for more products. A new product is added
// with ReturnProduct; a product already in the request is updated with only
// its new photos.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const orderService = vi.hoisted(() => ({
  ReturnProduct: vi.fn(),
  UpdateReturnedProduct: vi.fn(),
  ConfirmReturnRequest: vi.fn(),
}));
vi.mock("services/order", () => ({ default: orderService }));

const trackOrderMgmt = vi.hoisted(() => vi.fn());
vi.mock("utils/orderFunnel", () => ({
  ORDER_MGMT_EVENTS: { ORDER_RETURN_REQUESTED: "return_requested" },
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
vi.mock("components/global/HortiznalScrollBar", () => ({
  default: ({ children }: any) => <div data-testid="returned-items">{children}</div>,
}));

import OrderItemReturnConfirmationWindow from "components/setting/orders/confirmations/OrderItemReturnConfirmationWindow";
import { buildOrder, buildOrderLine } from "../../../../fixtures/order";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../../render";

const REASON = { id: 2, reason_ae_en: "Changed mind" };

beforeEach(() => {
  orderService.ReturnProduct.mockReset().mockResolvedValue(50);
  orderService.UpdateReturnedProduct.mockReset().mockResolvedValue(undefined);
  orderService.ConfirmReturnRequest.mockReset().mockResolvedValue(undefined);
});
afterEach(() => vi.clearAllMocks());

function draftReturn(details: any[], status: any = { name: "draft", value: "draft" }) {
  return { return_requests_data: [{ order_id: 1, return_request_id: 50, status, order_details: details }] } as any;
}

async function renderWindow(extra: any = {}) {
  const props = {
    close: vi.fn(),
    setShouldConfirmReturn: vi.fn(),
    callback: vi.fn(async () => {}),
    orderData: [buildOrder({ id: 1, details: [buildOrderLine({ id: 1001, product_details: { name: "From order" } as any })] })],
    returnDetails: null as any,
    orderItem: buildOrder({ id: 1, return_request_id: 50 } as any),
    confirmationData: {
      item: { ...buildOrderLine({ id: 7, qty: 2, variant: "M-red" }), quantity: 2, name: "" },
      images: ["a.png", "b.png"],
      reasons: REASON,
      qty: 2,
      additon_cost: false,
    },
    ...extra,
  };
  const r = await renderWithProviders(<OrderItemReturnConfirmationWindow {...props} />, {
    store: { setOrderOptions: vi.fn(), currency: { symbol: "$" } },
  });
  return { ...props, store: r.store };
}

const agree = () => screen.getByTestId("agree-box").parentElement as HTMLElement;

describe("the returned products list", () => {
  it("lists the product being added and the draft ones, once each", async () => {
    await renderWindow({
      returnDetails: draftReturn([
        { detail_id: 7, product_id: 1001, already_return: true, return_request_product_quantity: "1" },
        { detail_id: 8, product_id: 1001, already_return: true, return_request_product_quantity: "1", name: "Draft item" },
        { detail_id: 9, product_id: 1001, already_return: false },
      ]),
    });
    const items = screen.getByTestId("returned-items");
    expect(items.querySelectorAll("h3").length, "the returned products are not listed once each").toBe(2);
    expect(screen.getByText("Draft item"), "a draft product is not listed").toBeInTheDocument();
    expect(screen.getByText("Test Product"), "the product being added is not listed by its name").toBeInTheDocument();
    expect(screen.getByText("You Will Not Be Charged Any Fees."), "a free return did not say so").toBeInTheDocument();
  });

  it("leaves out products of a request that is no longer a draft, and warns about fees", async () => {
    await renderWindow({
      confirmationData: { additon_cost: true },
      returnDetails: draftReturn(
        [{ detail_id: 8, product_id: 1001, already_return: true }],
        { name: "confirmed", value: "confirmed" },
      ),
    });
    expect(screen.getByTestId("returned-items").querySelectorAll("h3").length, "a confirmed request was listed").toBe(0);
    expect(screen.queryByText("You Will Not Be Charged Any Fees."), "a paid return said it is free").not.toBeInTheDocument();
  });

  it("lists a product of a request with no status yet", async () => {
    await renderWindow({
      confirmationData: {},
      returnDetails: draftReturn([{ detail_id: 8, product_id: 1001, already_return: true, quantity: 3 }], null),
    });
    expect(
      screen.getByTestId("returned-items").querySelectorAll("h3").length,
      "a request with no status did not list its product",
    ).toBe(1);
  });
});

describe("sending the return", () => {
  it("does nothing before the terms are ticked; I Disagree closes", async () => {
    const props = await renderWindow({ isRtl: true });
    const user = userEvent.setup();
    await user.click(screen.getByText("I Agree & Return"));
    await user.click(screen.getByText("Delay Confirmation. I want to Return more product"));
    expect(orderService.ReturnProduct, "the return was sent before the terms were ticked").not.toHaveBeenCalled();
    await user.click(screen.getByText("I Disagree"));
    expect(props.setShouldConfirmReturn, "I Disagree did not close").toHaveBeenCalledWith(false);
    expect((props.store.getState() as any).setOrderOptions, "I Disagree did not close the options").toHaveBeenCalledWith(false);
  });

  it("adds a new product and confirms the whole request", async () => {
    const props = await renderWindow({
      returnDetails: draftReturn([
        { detail_id: 8, product_id: 1001, already_return: true, return_request_id: 50 },
        { detail_id: 9, product_id: 1001, already_return: true, return_request_id: 50 },
      ]),
    });
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(screen.getByText("I Agree & Return"));
    await waitFor(() => expect(props.close, "a sent return did not close").toHaveBeenCalled());
    expect(orderService.ReturnProduct, "the new product was not added with its details").toHaveBeenCalledWith({
      images: ["a.png", "b.png"],
      order_detail_id: 7,
      product_id: 1001,
      quantity: 2,
      reason_id: REASON,
      return_request_id: 50,
      order_id: 1,
    });
    expect(orderService.ConfirmReturnRequest, "the request was not confirmed with its id").toHaveBeenCalledWith({
      return_request_id: [50],
    });
    expect(trackOrderMgmt, "the return was not recorded").toHaveBeenCalledWith("return_requested", {
      order_id: 1,
      item_id: 7,
      product_id: 1001,
      return_reason: 2,
      is_update: false,
      qty: 2,
      image_count: 2,
    });
    expect(props.setShouldConfirmReturn, "the confirmation was not closed").toHaveBeenCalledWith(false);
  });

  it("updates a product already in the request with only its new photos, and delays confirmation", async () => {
    await renderWindow({
      confirmationData: {
        item: { ...buildOrderLine({ id: 7, qty: 1 }), quantity: 1 },
        images: ["a.png", "new.png"],
        reasons: 3,
        update: true,
        return_request_product_id: 90,
      },
      returnDetails: draftReturn([{ detail_id: 7, product_id: 1001, already_return: true, img: ["a.png"] }]),
    });
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(screen.getByText("Delay Confirmation. I want to Return more product"));
    await waitFor(() =>
      expect(orderService.UpdateReturnedProduct, "only the new photo was not sent").toHaveBeenCalledWith({
        images: ["new.png"],
        quantity: 1,
        reason_id: 3,
        id: 90,
      }),
    );
    expect(orderService.ConfirmReturnRequest, "a delayed return was confirmed").not.toHaveBeenCalled();
    expect(trackOrderMgmt.mock.calls[0][1].return_reason, "a reason given as an id was not recorded").toBe(3);
  });

  it.each([
    ["no photos at all", undefined, [], []],
    ["no saved photos", ["x.png"], [], ["x.png"]],
  ])("an update with %s sends the right photos", async (_, images, saved, sent) => {
    await renderWindow({
      confirmationData: { item: { id: 7, qty: 1 }, images, reasons: REASON, update: true },
      returnDetails: draftReturn([{ detail_id: 7, already_return: true, img: saved }]),
    });
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(screen.getByText("I Agree & Return"));
    await waitFor(() =>
      expect(orderService.UpdateReturnedProduct.mock.calls[0]?.[0]?.images, "the wrong photos were sent").toEqual(sent),
    );
  });

  it("confirms with only the draft request when nothing new is added, and none when there is nothing", async () => {
    await renderWindow({ confirmationData: {}, returnDetails: null });
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(screen.getByText("I Agree & Return"));
    await waitFor(() =>
      expect(orderService.ConfirmReturnRequest, "an empty confirm did not say there is no request").toHaveBeenCalledWith({
        return_request_id: false,
      }),
    );
    expect(orderService.ReturnProduct, "a product was added with nothing to add").not.toHaveBeenCalled();
  });

  it("logs a failure and stays open, and ignores taps while sending", async () => {
    const props = await renderWindow({
      callback: async () => {
        throw new Error("refresh refused");
      },
    });
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(screen.getByText("I Agree & Return"));
    await waitFor(() =>
      expect(logError.mock.calls[0]?.[0]?.scenario, "the failure was not logged").toBe(
        "Error In ReturnRequest in OrdreItemReturnConfirmation",
      ),
    );
    expect(props.close, "a failed return closed the window").not.toHaveBeenCalled();

    orderService.ReturnProduct.mockReturnValue(new Promise(() => {}));
    const button = screen.getByText("I Agree & Return");
    await user.click(button);
    await user.click(button);
    expect(orderService.ReturnProduct, "a tap while sending sent the return again").toHaveBeenCalledTimes(2);
    expect(screen.queryByText("I Disagree"), "I Disagree showed while sending").not.toBeInTheDocument();
  });
});
