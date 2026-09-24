// A hidden-order card in the "hidden orders" list. A fully hidden order has one
// eye that restores all of its packs; a partly hidden order restores one
// product at a time. Both ask for confirmation, then call the market backend
// (services/order) and tell the parent to reload.
import { beforeEach, describe, expect, it, vi } from "vitest";

import HiddenOrderItem from "components/Orders/HiddenOrderItem";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { Order } = vi.hoisted(() => ({ Order: { HideOrder: vi.fn(), HideOrderDetail: vi.fn() } }));
vi.mock("services/order", () => ({ default: Order }));

const trackOrderMgmt = vi.fn();
vi.mock("utils/orderFunnel", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  trackOrderMgmt: (...a: any[]) => trackOrderMgmt(...a),
}));
const logError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => logError(...a),
}));

vi.mock("components/setting/orders/OrderItemTime", () => ({ default: () => <span>time</span> }));
vi.mock("components/setting/orders/OrderItemId", () => ({ default: ({ id }: any) => <span>id {id}</span> }));
vi.mock("components/setting/orders/OrderStatus", () => ({ default: () => <span>status</span> }));
vi.mock("components/setting/orders/OrderInvoice", () => ({
  default: ({ invoice }: any) => <span>{`items ${invoice.items}`}</span>,
}));
vi.mock("components/setting/orders/OrderProductSlider", () => ({
  default: ({ hiddenDetailIds, onRestoreProduct }: any) => (
    <div data-testid="slider" data-hidden={hiddenDetailIds ? [...hiddenDetailIds].join(",") : "none"}>
      {onRestoreProduct && <button onClick={() => onRestoreProduct(11)}>restore product 11</button>}
    </div>
  ),
}));
vi.mock("components/global/ConfirmModal", () => ({
  ConfirmModal: ({ confirmTilte, onCancel, onConfirm, loading }: any) => (
    <div data-testid="confirm" data-loading={String(loading)}>
      <span>{confirmTilte}</span>
      <button onClick={onConfirm}>confirm</button>
      <button onClick={onCancel}>cancel</button>
    </div>
  ),
}));

const card = (fully: boolean) => ({
  order_group_id: "G-1",
  order_group_status: { value: "hidden", label: "Hidden" },
  created_at: "2026-01-01",
  order_amount: 10,
  details: [
    { id: 11, is_hidden: true },
    { id: 12, is_hidden: false },
  ],
  pack_ids: [1, 2],
  is_fully_hidden: fully,
});

async function renderCard(fully: boolean, isRtl = false) {
  const onRestored = vi.fn();
  await renderWithProviders(<HiddenOrderItem order={card(fully)} isRtl={isRtl} onRestored={onRestored} />);
  return { onRestored };
}

describe("HiddenOrderItem", () => {
  beforeEach(() => {
    Order.HideOrder.mockReset();
    Order.HideOrder.mockResolvedValue({});
    Order.HideOrderDetail.mockReset();
    Order.HideOrderDetail.mockResolvedValue({});
    trackOrderMgmt.mockReset();
    logError.mockReset();
  });

  it("restores every pack of a fully hidden order after confirming", async () => {
    const { onRestored } = await renderCard(true, true);
    const cardEl = document.querySelector('[data-pw="hidden-order-card"]') as HTMLElement;
    expect(cardEl.className, "a fully hidden order is not dimmed").toContain("opacity-40");
    expect(screen.getByTestId("slider").dataset.hidden, "a fully hidden order has per-product eyes").toBe("none");

    fireEvent.click(document.querySelector('[data-pw="restore-hidden-order"]') as HTMLElement);
    expect(screen.getByText("Restore This Order"), "the order confirmation did not open").toBeInTheDocument();
    fireEvent.click(screen.getByText("confirm"));
    await waitFor(() => expect(onRestored, "the parent was not told to reload").toHaveBeenCalled());
    expect(Order.HideOrder.mock.calls.map(([a]: any) => a), "not every pack was restored").toEqual([
      { order_id: 1, is_hidden: false },
      { order_id: 2, is_hidden: false },
    ]);
    expect(trackOrderMgmt, "the restore was not tracked").toHaveBeenCalledWith(expect.any(String), {
      order_group_id: "G-1",
      pack_count: 2,
    });
    expect(screen.queryByTestId("confirm"), "the confirmation stayed open").not.toBeInTheDocument();
  });

  it("restores one hidden product of a partly hidden order", async () => {
    const { onRestored } = await renderCard(false);
    expect(screen.getByTestId("slider").dataset.hidden, "the hidden product is not marked").toBe("11");
    expect(document.querySelector('[data-pw="restore-hidden-order"]'), "a partly hidden order has the order eye").toBeNull();
    fireEvent.click(screen.getByText("restore product 11"));
    expect(screen.getByText("Restore This Product"), "the product confirmation did not open").toBeInTheDocument();
    fireEvent.click(screen.getByText("confirm"));
    await waitFor(() => expect(onRestored, "the parent was not told to reload").toHaveBeenCalled());
    expect(Order.HideOrderDetail, "the product was not restored").toHaveBeenCalledWith({ detail_id: 11, is_hidden: false });
  });

  it("cancel closes the confirmation without restoring", async () => {
    await renderCard(false);
    fireEvent.click(screen.getByText("restore product 11"));
    fireEvent.click(screen.getByText("cancel"));
    expect(screen.queryByTestId("confirm"), "cancel did not close").not.toBeInTheDocument();
    expect(Order.HideOrderDetail, "cancel restored the product").not.toHaveBeenCalled();
  });

  it("logs and closes when the market backend refuses the restore", async () => {
    Order.HideOrderDetail.mockRejectedValue(new Error("refused"));
    const { onRestored } = await renderCard(false);
    fireEvent.click(screen.getByText("restore product 11"));
    fireEvent.click(screen.getByText("confirm"));
    await waitFor(() => expect(logError, "the refusal was not logged").toHaveBeenCalled());
    expect(onRestored, "a refused restore reloaded the list").not.toHaveBeenCalled();
    expect(screen.queryByTestId("confirm"), "the confirmation stayed after the refusal").not.toBeInTheDocument();
  });
});
