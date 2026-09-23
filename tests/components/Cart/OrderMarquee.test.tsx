// The moving tape under the order button: delivery date, and "Free Shipping"
// only when the order costs nothing to ship.
import { describe, expect, it } from "vitest";

import OrderMarquee from "components/Cart/OrderMarquee";

import { renderWithProviders, screen } from "../../render";

describe("the tape under the order button", () => {
  it("says Free Shipping when the shipping cost is 0", async () => {
    await renderWithProviders(<OrderMarquee shippingCost={0} />);

    expect(
      screen.queryByText("Free Shipping"),
      "shipping costs 0 and the tape did not say Free Shipping",
    ).not.toBeNull();
  });

  it("does not say Free Shipping when shipping costs money", async () => {
    await renderWithProviders(<OrderMarquee shippingCost={5} />);

    expect(
      screen.queryByText("Free Shipping"),
      "shipping costs 5 and the tape still said Free Shipping",
    ).toBeNull();
    expect(
      screen.queryByText("Delivery"),
      "the delivery line must always be on the tape",
    ).not.toBeNull();
  });
});
