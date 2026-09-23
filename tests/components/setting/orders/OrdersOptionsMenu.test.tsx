// The "three dots" sheet of the orders list (components/setting/orders/OrdersOptionsMenu.tsx).
import { describe, expect, it, vi } from "vitest";

import OrdersOptionsMenu from "components/setting/orders/OrdersOptionsMenu";
import { renderWithProviders, userEvent } from "../../../render";

describe("the orders options sheet", () => {
  it.each([false, true])("opens the hidden orders, and the backdrop closes it (right-to-left %s)", async (isRtl) => {
    const close = vi.fn();
    const onOpenHidden = vi.fn();
    await renderWithProviders(
      <OrdersOptionsMenu isRtl={isRtl} language="en" close={close} onOpenHidden={onOpenHidden} />,
    );
    const user = userEvent.setup();
    await user.click(document.querySelector('[data-pw="open-hidden-orders"]')!);
    expect(onOpenHidden, "the row did not open the hidden orders").toHaveBeenCalled();
    await user.click(document.querySelector(".opacity-40")!);
    expect(close, "the backdrop did not close the sheet").toHaveBeenCalled();
  });
});
