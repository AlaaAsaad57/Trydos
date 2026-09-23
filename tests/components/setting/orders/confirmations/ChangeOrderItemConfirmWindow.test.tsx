// The change colour / size confirmation for one product
// (components/setting/orders/confirmations/ChangeOrderItemConfirmWindow.tsx,
// export ModifyOrderItemModal).
//
// The shopper picks a new colour or size (options without enough stock are
// refused), ticks the terms, and confirms. The change request carries the new
// size, the colour option and the image file name of the new colour.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const changeOrderItemVariant = vi.hoisted(() => vi.fn());
vi.mock("services/order", () => ({ default: { changeOrderItemVariant } }));

const showErrorNotification = vi.hoisted(() => vi.fn());
vi.mock("store/notifications/reducer", () => ({ showErrorNotification }));

const trackOrderMgmt = vi.hoisted(() => vi.fn());
vi.mock("utils/orderFunnel", () => ({
  ORDER_MGMT_EVENTS: { ORDER_ITEM_CHANGE_REQUESTED: "change_requested" },
  trackOrderMgmt,
}));

vi.mock("components/Cart/PlaceOrderButtons", () => ({
  CheckBoxElement: ({ active }: any) => <span data-testid="agree-box" data-active={String(active)} />,
}));

vi.mock("components/global/HortiznalScrollBar", () => ({
  default: ({ children }: any) => <div data-testid="scroller">{children}</div>,
}));

import { useState } from "react";
import { ModifyOrderItemModal } from "components/setting/orders/confirmations/ChangeOrderItemConfirmWindow";
import { buildOrderLine } from "../../../../fixtures/order";
import { renderWithProviders, screen, userEvent, waitFor, within } from "../../../../render";

const PRODUCT = {
  sync_color_images: [
    { color_name: "Red", color_option: "red", images: ["/p/red.jpg"] },
    { color_name: "Blue", color_option: "blue", images: ["/p/blue.jpg"] },
    { color_name: "Green", color_option: "green", images: ["/p/green.jpg"] },
  ],
  colors: [
    { name: "Red", option: "red" },
    { name: "Blue", option: "blue" },
  ],
  sizes: ["M", "L", "XL"],
  variations: [
    { type: "red-M", qty: 5 },
    { type: "red-L", qty: 0 },
    { type: "red-XL", qty: 5 },
    { type: "blue-M", qty: 5 },
    { type: "green-M", qty: 0 },
  ],
};

beforeEach(() => {
  changeOrderItemVariant.mockReset();
  changeOrderItemVariant.mockResolvedValue({});
});
afterEach(() => vi.clearAllMocks());

/** Holds the confirmation data in state, the way OrderItemOptions does. */
function Harness({ initial, type, getOrderDetails, close, onData }: any) {
  const [data, setData] = useState<any>(initial);
  onData?.(data);
  if (!data) return <div data-testid="closed" />;
  return (
    <ModifyOrderItemModal
      type={type}
      confirmationData={data}
      setConfirmationData={setData}
      orderItem={buildOrderLine({ qty: 1, image: "/p/current.jpg" })}
      getOrderDetails={getOrderDetails}
      close={close}
    />
  );
}

async function renderModal(type: "Color" | "Size", extra: any = {}, language: any = "en") {
  const props = { getOrderDetails: vi.fn(), close: vi.fn(), onData: vi.fn() };
  await renderWithProviders(
    <Harness
      type={type}
      initial={{ currentColor: "Red", currentSize: "M", productDetails: PRODUCT, detail_id: 8, ...extra }}
      {...props}
    />,
    { store: { language } },
  );
  return props;
}

const agree = () => screen.getByTestId("agree-box").parentElement as HTMLElement;
const lastData = (onData: any) => onData.mock.calls.at(-1)[0];

describe("while the product loads", () => {
  it("shows only a spinner", async () => {
    await renderModal("Color", { loading: true });
    expect(screen.queryByText("Yes, I Agree"), "the confirmation showed while loading").not.toBeInTheDocument();
  });
});

describe("changing the colour", () => {
  it("lists the other colours, refuses one without stock, and confirms a new colour", async () => {
    const props = await renderModal("Color", {}, "ar");
    const user = userEvent.setup();
    expect(within(screen.getByTestId("scroller")).queryByText("Red"), "the current colour is offered as a new one").toBeNull();

    await user.click(screen.getByText("Green"));
    expect(showErrorNotification, "a colour without stock was not refused").toHaveBeenCalledWith(
      "this option dosent have enough quantity",
    );

    await user.click(screen.getByText("Yes, I Agree"));
    expect(changeOrderItemVariant, "the change was sent before a new colour and the terms").not.toHaveBeenCalled();

    await user.click(screen.getByText("Blue"));
    expect(lastData(props.onData).newColor, "picking a colour did not store it").toBe("blue");
    await user.click(screen.getByText("Yes, I Agree"));
    expect(changeOrderItemVariant, "the change was sent before the terms were ticked").not.toHaveBeenCalled();

    await user.click(agree());
    await user.click(screen.getByText("Yes, I Agree"));
    await waitFor(() => expect(props.close, "a sent change did not close").toHaveBeenCalled());
    expect(changeOrderItemVariant, "the change did not carry the new colour and its image").toHaveBeenCalledWith({
      choice_1: "",
      color: "blue",
      image: "blue.jpg",
      order_detail_id: 8,
    });
    expect(trackOrderMgmt, "the change was not recorded").toHaveBeenCalledWith("change_requested", {
      change_type: "Color",
      order_detail_id: 8,
      product_id: 1001,
      from_variant: "Red",
      to_variant: "blue",
    });
    expect(props.getOrderDetails, "the order was not refreshed").toHaveBeenCalled();
    expect(screen.getByTestId("closed"), "the confirmation did not close itself").toBeInTheDocument();
  });

  it("Cancel closes the confirmation", async () => {
    await renderModal("Color");
    await userEvent.setup().click(screen.getByText("Cancel"));
    expect(screen.getByTestId("closed"), "Cancel did not close the confirmation").toBeInTheDocument();
  });
});

describe("changing the size", () => {
  it("confirms a new size with the item image when the colour has no picture", async () => {
    const props = await renderModal("Size", { newColor: "purple" });
    const user = userEvent.setup();
    await user.click(screen.getByText("XL"));
    expect(lastData(props.onData).newSize, "picking a size did not store it").toBe("XL");
    await user.click(agree());
    await user.click(screen.getByText("Yes, I Agree"));
    await waitFor(() => expect(props.close).toHaveBeenCalled());
    expect(changeOrderItemVariant, "the change did not carry the new size and the item image").toHaveBeenCalledWith({
      choice_1: "XL",
      color: undefined,
      image: "current.jpg",
      order_detail_id: 8,
    });
    expect(trackOrderMgmt.mock.calls[0][1].to_variant, "the size change was not recorded").toBe("XL");
  });

  it("ignores a second confirm while sending, and Cancel does nothing while sending", async () => {
    changeOrderItemVariant.mockReturnValue(new Promise(() => {}));
    await renderModal("Size", { newSize: "XL" });
    const user = userEvent.setup();
    await user.click(agree());
    const yes = screen.getByText("Yes, I Agree");
    await user.click(yes);
    await user.click(yes);
    await user.click(screen.getByText("Cancel"));
    expect(changeOrderItemVariant, "a second confirm sent the change twice").toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("closed"), "Cancel closed the confirmation while sending").not.toBeInTheDocument();
  });

  it("does not send when the size is unchanged", async () => {
    await renderModal("Size", { newSize: "m" });
    const user = userEvent.setup();
    await user.click(agree());
    await user.click(screen.getByText("Yes, I Agree"));
    expect(changeOrderItemVariant, "an unchanged size was sent").not.toHaveBeenCalled();
  });

  it(
    "BUG-settings-3: a size with no stock in the current colour is refused",
    async () => {
      const props = await renderModal("Size");
      await userEvent.setup().click(screen.getByText("L"));
      expect(
        showErrorNotification,
        "size L has no stock in red (variation red-L, qty 0) but was not refused",
      ).toHaveBeenCalledWith("this option dosent have enough quantity");
      expect(lastData(props.onData).newSize, "a size with no stock was stored as the new size").toBeUndefined();
    },
  );
});
