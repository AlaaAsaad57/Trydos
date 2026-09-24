// The order time on an order card (components/setting/orders/OrderItemTime.tsx).
import { describe, expect, it } from "vitest";

import OrderItemTime from "components/setting/orders/OrderItemTime";
import { renderWithProviders, screen } from "../../../render";

describe("the order time", () => {
  it.each([false, true])("shows day/month/year | hh:mm:ss in local time (right-to-left %s)", async (isRtl) => {
    await renderWithProviders(<OrderItemTime time="2030-03-04T05:06:07" isRtl={isRtl} />);
    expect(screen.getByText("04/03/2030 | 05:06:07"), "the order time is not formatted as expected").toBeInTheDocument();
  });
});
