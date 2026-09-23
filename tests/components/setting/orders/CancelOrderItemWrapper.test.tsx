// The cancel-reasons screen for one product
// (components/setting/orders/CancelOrderItemWrapper.tsx).
//
// With no reason picked the button reads Close and goes back; with a reason it
// reads Cancel Request and asks to cancel the line.
import { afterEach, describe, expect, it, vi } from "vitest";

import CancelOrderItemWrapper from "components/setting/orders/CancelOrderItemWrapper";
import { buildOrderLine } from "../../../fixtures/order";
import { renderWithProviders, screen, userEvent } from "../../../render";

afterEach(() => vi.clearAllMocks());

const reason = (text: string) => screen.getByText(text).parentElement as HTMLElement;

describe("cancelling one product", () => {
  it("goes back when no reason is picked", async () => {
    const backToMain = vi.fn();
    const cancelOrderItem = vi.fn();
    await renderWithProviders(
      <CancelOrderItemWrapper item={buildOrderLine({ offer_price: 0 })} backToMain={backToMain} cancelOrderItem={cancelOrderItem} />,
    );
    await userEvent.setup().click(screen.getByText("Close"));
    expect(backToMain, "Close with no reason did not go back").toHaveBeenCalled();
    expect(cancelOrderItem, "the line was cancelled with no reason").not.toHaveBeenCalled();
  });

  it("cancels the line once a reason is picked, and a second tap removes a reason", async () => {
    const cancelOrderItem = vi.fn();
    await renderWithProviders(
      <CancelOrderItemWrapper item={buildOrderLine({ id: 5 })} backToMain={vi.fn()} cancelOrderItem={cancelOrderItem} />,
    );
    const user = userEvent.setup();
    await user.click(reason("I Fear Quality"));
    await user.click(reason("I Fear Quality"));
    expect(screen.getByText("Close"), "removing the only reason did not go back to Close").toBeInTheDocument();
    await user.click(reason("I Saw A Better Price"));
    await user.click(screen.getByText("Cancel Request"));
    expect(cancelOrderItem, "the line was not cancelled").toHaveBeenCalledWith(5);
  });
});
