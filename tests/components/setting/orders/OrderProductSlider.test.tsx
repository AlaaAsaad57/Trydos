// The product pictures on an order card (components/setting/orders/OrderProductSlider.tsx).
//
// On the Hidden-Orders view a hidden product is dimmed and gets an eye button
// that restores it.
import { describe, expect, it, vi } from "vitest";

import OrderProductSlider from "components/setting/orders/OrderProductSlider";
import { buildOrderLine } from "../../../fixtures/order";
import { renderWithProviders, userEvent } from "../../../render";

const restoreButtons = () => document.querySelectorAll('[data-pw="restore-hidden-product"]');

describe("the order product pictures", () => {
  it("shows one picture per product, with no restore button on the live list", async () => {
    await renderWithProviders(
      <OrderProductSlider isRtl products={[buildOrderLine({ id: 1 }), buildOrderLine({ id: 2 })]} />,
    );
    expect(document.querySelectorAll('img[alt="OrderImage"]').length, "not every product has a picture").toBe(2);
    expect(restoreButtons().length, "the live list offered to restore a product").toBe(0);
  });

  it("dims a hidden product and its eye button restores it", async () => {
    const onRestoreProduct = vi.fn();
    await renderWithProviders(
      <OrderProductSlider
        isRtl={false}
        products={[buildOrderLine({ id: 1 }), buildOrderLine({ id: 2 })]}
        hiddenDetailIds={new Set([2])}
        onRestoreProduct={onRestoreProduct}
      />,
    );
    const pictures = document.querySelectorAll('img[alt="OrderImage"]');
    expect(pictures[1].className, "the hidden product is not dimmed").toContain("opacity-40");
    expect(pictures[0].className, "a visible product is dimmed").not.toContain("opacity-40");
    await userEvent.setup().click(restoreButtons()[0]);
    expect(onRestoreProduct, "the eye button did not restore the hidden product").toHaveBeenCalledWith(2);
  });
});
