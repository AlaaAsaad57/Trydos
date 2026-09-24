// The colour circles on a product card open the colour bottom sheet.
import { describe, expect, it } from "vitest";

import ProductColorsWrapper from "components/clientWrapper/product/ProductColorsWrapper";

import { act, fireEvent, renderWithProviders, screen } from "../../../render";

describe("the product colours wrapper", () => {
  it("opens the colour sheet for this product and does not follow the card link", async () => {
    const product = { id: 7, name: "Shirt" };
    const { store } = await renderWithProviders(
      <ProductColorsWrapper product={product}>
        <span>colours</span>
      </ProductColorsWrapper>,
      { store: { ColorBottomSheet: false } },
    );

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      screen.getByText("colours").dispatchEvent(event);
    });
    expect((store.getState() as any).ColorBottomSheet, "a tap on the colours must open the sheet for this product").toBe(product);
    expect(event.defaultPrevented, "the tap must not also follow the product card's link").toBe(true);

    store.setState({ ColorBottomSheet: false } as any);
    fireEvent.touchEnd(screen.getByText("colours"));
    expect((store.getState() as any).ColorBottomSheet, "a touch on the colours must open the sheet too").toBe(product);
  });
});
