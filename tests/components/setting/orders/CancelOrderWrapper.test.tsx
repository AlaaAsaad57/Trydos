// The cancel-reasons screen for a pack (components/setting/orders/CancelOrderWrapper.tsx).
//
// The shopper picks one or more reasons (a second tap removes one). Cancel
// Order passes the reasons up, or asks for a reason when none is picked.
import { afterEach, describe, expect, it, vi } from "vitest";

const showErrorNotification = vi.hoisted(() => vi.fn());
vi.mock("store/notifications/reducer", () => ({ showErrorNotification }));

import CancelOrderWrapper from "components/setting/orders/CancelOrderWrapper";
import { buildOrder } from "../../../fixtures/order";
import { renderWithProviders, userEvent } from "../../../render";

afterEach(() => vi.clearAllMocks());

const reasons = () => document.querySelectorAll<HTMLElement>('[data-pw="cancel-order-reason"]');
const submit = () => document.querySelector('[data-pw="cancel-order-submit"]') as HTMLElement;

describe("the cancel reasons", () => {
  it("asks for a reason when none is picked", async () => {
    const setShouldConfirmCancel = vi.fn();
    await renderWithProviders(
      <CancelOrderWrapper order={buildOrder()} isRtl setShouldConfirmCancel={setShouldConfirmCancel} />,
      { store: { currency: { symbol: "$" } } },
    );
    await userEvent.setup().click(submit());
    expect(showErrorNotification, "no reason was asked for").toHaveBeenCalledWith(
      "Please select a reason for canceling this order",
    );
    expect(setShouldConfirmCancel, "the cancel went ahead with no reason").not.toHaveBeenCalled();
  });

  it("passes the picked reasons up, and a second tap removes a reason", async () => {
    const setShouldConfirmCancel = vi.fn();
    await renderWithProviders(
      <CancelOrderWrapper order={buildOrder()} isRtl={false} setShouldConfirmCancel={setShouldConfirmCancel} />,
    );
    const user = userEvent.setup();
    await user.click(reasons()[0]);
    await user.click(reasons()[1]);
    await user.click(reasons()[1]);
    expect(submit().className, "the cancel button is not active with a reason picked").toContain("bg-[#FF5F61]");
    await user.click(submit());
    expect(setShouldConfirmCancel, "the picked reasons were not passed up").toHaveBeenCalledWith(["I Changed My Mind"]);
  });
});
