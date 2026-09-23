// The options sheet for one pack on the order details page
// (components/setting/orders/OrderOptionsMenu.tsx).
//
// It offers change address (when allowed), hide (always) and cancel (when
// allowed). Change address and the cancel confirmation are stubbed with their
// callbacks exposed as buttons; the cancel-reasons screen is the real one.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hideOrder = vi.hoisted(() => vi.fn());
vi.mock("services/order", () => ({ default: { HideOrder: hideOrder } }));

const trackOrderMgmt = vi.hoisted(() => vi.fn());
vi.mock("utils/orderFunnel", () => ({
  ORDER_MGMT_EVENTS: { ORDER_OPTIONS_OPENED: "opened", ORDER_PACK_HIDDEN: "hidden" },
  trackOrderMgmt,
}));

const logError = vi.hoisted(() => vi.fn());
vi.mock("utils/functions", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, LogError: logError };
});

vi.mock("store/notifications/reducer", () => ({ showErrorNotification: vi.fn() }));

vi.mock("components/Orders/ChangeAddressWidget", () => ({
  default: ({ close }: any) => (
    <div data-testid="change-address">
      <button onClick={close}>address close</button>
    </div>
  ),
}));

vi.mock("components/setting/orders/confirmations/OrderCancelConfirmationWindow", () => ({
  default: ({ close, callback, cancelReasons }: any) => (
    <div data-testid="cancel-confirmation" data-reasons={cancelReasons.join("|")}>
      <button onClick={() => callback()}>confirm cancel</button>
      <button onClick={close}>confirm close</button>
    </div>
  ),
}));

vi.mock("components/global/ConfirmModal", () => ({
  ConfirmModal: ({ onCancel, onConfirm, loading }: any) => (
    <div data-testid="hide-confirm" data-loading={String(loading)}>
      <button onClick={onCancel}>hide cancel</button>
      <button onClick={onConfirm}>hide confirm</button>
    </div>
  ),
}));

import OrderOptionsMenu from "components/setting/orders/OrderOptionsMenu";
import { buildOrder } from "../../../fixtures/order";
import { renderWithProviders, screen, userEvent, waitFor } from "../../../render";

beforeEach(() => hideOrder.mockReset());
afterEach(() => vi.clearAllMocks());

async function renderMenu(orderOverrides: any = {}, extra: any = {}) {
  const props = {
    order: buildOrder(orderOverrides),
    close: vi.fn(),
    update: vi.fn(async () => {}),
    onHidden: vi.fn(),
    isRtl: false,
    ...extra,
  };
  await renderWithProviders(<OrderOptionsMenu {...props} />);
  return props;
}

describe("the pack options", () => {
  it("records the opening and offers only hide when nothing else is allowed", async () => {
    const props = await renderMenu();
    expect(trackOrderMgmt, "opening the menu was not recorded").toHaveBeenCalledWith("opened", {
      order_id: 1,
      order_group_id: "test-order-group",
      order_status: "pending",
    });
    expect(screen.getByText("Hide This Pack"), "hide is not offered").toBeInTheDocument();
    expect(screen.queryByText("Change Delivery Address & Note"), "change address offered when not allowed").not.toBeInTheDocument();
    expect(document.querySelector('[data-pw="cancel-order-option"]'), "cancel offered when not allowed").toBeNull();
    await userEvent.setup().click(document.querySelector(".opacity-40")!);
    expect(props.close, "the backdrop did not close the menu").toHaveBeenCalled();
  });

  it("opens change address and its close returns to the options", async () => {
    const props = await renderMenu({ can_update_address: true }, { isRtl: true });
    const user = userEvent.setup();
    await user.click(screen.getByText("Change Delivery Address & Note"));
    expect(screen.getByTestId("change-address"), "change address did not open").toBeInTheDocument();
    await user.click(screen.getByText("address close"));
    expect(props.close, "closing change address did not close the menu").toHaveBeenCalled();
    expect(screen.getByText("Hide This Pack"), "closing change address did not return to the options").toBeInTheDocument();
  });
});

describe("cancelling the pack", () => {
  it("asks for reasons, confirms with them, and the confirmation can refresh and close", async () => {
    const props = await renderMenu({ can_cancele_order: true });
    const user = userEvent.setup();
    await user.click(document.querySelector('[data-pw="cancel-order-option"]')!);
    const reasons = document.querySelectorAll('[data-pw="cancel-order-reason"]');
    await user.click(reasons[0]);
    await user.click(document.querySelector('[data-pw="cancel-order-submit"]')!);
    expect(
      screen.getByTestId("cancel-confirmation").dataset.reasons,
      "the confirmation did not get the chosen reason",
    ).toBe("I Changed My Mind");

    await user.click(screen.getByText("confirm cancel"));
    expect(props.update, "the confirmation did not refresh the order").toHaveBeenCalled();
    await user.click(screen.getByText("confirm close"));
    expect(screen.queryByTestId("cancel-confirmation"), "closing the confirmation left it open").not.toBeInTheDocument();
    expect(screen.getByText("Hide This Pack"), "closing the confirmation did not return to the options").toBeInTheDocument();
  });
});

describe("hiding the pack", () => {
  it("asks first; cancel keeps it", async () => {
    await renderMenu();
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Pack"));
    expect(trackOrderMgmt, "the hide tap was not recorded").toHaveBeenCalledWith("hidden", {
      order_id: 1,
      order_group_id: "test-order-group",
    });
    await user.click(screen.getByText("hide cancel"));
    expect(screen.queryByTestId("hide-confirm"), "cancel left the hide confirmation open").not.toBeInTheDocument();
  });

  it("hides the pack, closes the menu and leaves the page", async () => {
    hideOrder.mockResolvedValue(undefined);
    const props = await renderMenu();
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Pack"));
    await user.click(screen.getByText("hide confirm"));
    await waitFor(() => expect(props.onHidden, "hiding the pack did not leave the page").toHaveBeenCalled());
    expect(hideOrder, "the hide did not name the pack").toHaveBeenCalledWith({ order_id: 1 });
    expect(props.close, "hiding the pack did not close the menu").toHaveBeenCalled();
  });

  it("works without an onHidden callback, and logs a refused hide", async () => {
    hideOrder.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("refused"));
    const props = await renderMenu({}, { onHidden: undefined });
    const user = userEvent.setup();
    await user.click(screen.getByText("Hide This Pack"));
    await user.click(screen.getByText("hide confirm"));
    await waitFor(() => expect(props.close).toHaveBeenCalled());

    await user.click(screen.getByText("Hide This Pack"));
    await user.click(screen.getByText("hide confirm"));
    await waitFor(() =>
      expect(logError, "a refused hide was not logged").toHaveBeenCalledWith(
        expect.objectContaining({ scenario: "Error In handleHideOrder in OrderOptionsMenu" }),
      ),
    );
    expect(screen.getByTestId("hide-confirm").dataset.loading, "the hide stayed busy after a refusal").toBe("false");
  });
});
