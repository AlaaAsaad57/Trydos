// The return-progress box on an order line: four steps (requested, approved,
// out for return, returned) with the current one marked, a short red line for
// a closed return (cancelled / rejected / resolved), and "Cancel Return
// Request" when the order allows it (market backend, services/order).
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrderRetailsReturnInfo from "components/Orders/OrderRetailsReturnInfo";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const { order } = vi.hoisted(() => ({ order: { CancelReturn: vi.fn() } }));
vi.mock("services/order", () => ({ default: order }));
vi.mock("components/Login/Timer", () => ({ default: () => <span data-testid="timer" /> }));

async function renderInfo(status: string | undefined, store: any = {}) {
  const callback = vi.fn();
  await renderWithProviders(
    <OrderRetailsReturnInfo
      product={{ return_status: status ? { value: status } : undefined }}
      return_request_id={77}
      callback={callback}
      price="20 $"
    />,
    { store },
  );
  return { callback };
}

describe("OrderRetailsReturnInfo", () => {
  beforeEach(() => {
    order.CancelReturn.mockReset();
    order.CancelReturn.mockResolvedValue({ success: true });
  });

  it("marks the current step and runs its timer", async () => {
    await renderInfo("APPROVED", { language: "ar" });
    const title = screen.getByText("Product Return Request Approved");
    expect(title.className, "the current step is not dark").toContain("text-[#1D1D1D]");
    expect(screen.getByText("Out For Return", { selector: "div.text-\\[12px\\]" }).className, "a later step is not grey").toContain(
      "text-[#C4C2C2]",
    );
    expect(screen.getAllByTestId("timer").length === 1, "the current step has no timer, or more than one step has").toBe(true);
    expect(screen.getByText("Product Has Been Returned Successfully"), "the last step is missing").toBeInTheDocument();
  });

  it.each([
    ["cancelled", "Return Request Canceled"],
    ["rejected", "Return Request Rejected"],
    ["resolved", "Product Has Been Resolved Successfully"],
  ])("shows only the closed line for a %s return", async (status, title) => {
    await renderInfo(status);
    expect(screen.getByText(title), `the ${status} line is missing`).toBeInTheDocument();
    expect(screen.queryByText("Out For Return"), `a ${status} return still shows the steps`).not.toBeInTheDocument();
  });

  it("shows every step as upcoming with no status", async () => {
    await renderInfo(undefined);
    expect(screen.queryByTestId("timer"), "a step is active with no status").not.toBeInTheDocument();
  });

  it("cancels the return when the order allows it, and ignores a second click", async () => {
    let finish: (v?: any) => void = () => {};
    order.CancelReturn.mockReturnValue(new Promise((r) => (finish = r)));
    const { callback } = await renderInfo("pending", { ActivePacks: { edit_return_request: true } });
    const button = screen.getByText("Cancel Return Request").closest("p") as HTMLElement;
    fireEvent.click(button);
    fireEvent.click(button);
    expect(order.CancelReturn, "a second click sent a second cancel").toHaveBeenCalledTimes(1);
    expect(order.CancelReturn, "the wrong return was cancelled").toHaveBeenCalledWith({
      return_request_product_id: 77,
    });
    finish();
    await waitFor(() => expect(callback, "the order was not reloaded after the cancel").toHaveBeenCalled());
  });

  it("has no cancel link when the order does not allow it", async () => {
    await renderInfo("pending", { ActivePacks: { edit_return_request: false } });
    expect(screen.queryByText("Cancel Return Request"), "a cancel link showed when not allowed").not.toBeInTheDocument();
  });
});
