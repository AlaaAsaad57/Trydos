// The colours sheet of a product card. It opens only for the card whose id the
// store names, so tapping one card never opens every card's sheet.
import { describe, expect, it, vi } from "vitest";

import ProductColorsBottomSheet from "components/ServerWrapper/ProductWrapper/ProductColorsBottomSheet";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../../render";

describe("the product colours sheet", () => {
  it("stays closed when the store names no card", async () => {
    await renderWithProviders(
      <ProductColorsBottomSheet id={7}>
        <div>colours</div>
      </ProductColorsBottomSheet>,
      { store: { ColorBottomSheet: false } },
    );
    expect(screen.queryByText("colours"), "no sheet should open when none was asked for").toBeNull();
  });

  it("stays closed for a card the store does not name", async () => {
    await renderWithProviders(
      <ProductColorsBottomSheet id={7}>
        <div>colours</div>
      </ProductColorsBottomSheet>,
      { store: { ColorBottomSheet: { id: 8 } } },
    );
    expect(screen.queryByText("colours"), "another card's sheet must not open").toBeNull();
  });

  it("opens for the card the store names, and Escape closes it through the store", async () => {
    const setColorBottomSheet = vi.fn();
    await renderWithProviders(
      <ProductColorsBottomSheet id={7}>
        <div>colours</div>
      </ProductColorsBottomSheet>,
      { store: { ColorBottomSheet: { id: 7, product_id: 7 }, setColorBottomSheet } },
    );
    expect(screen.getByText("colours"), "the sheet of the named card should open").toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() =>
      expect(setColorBottomSheet, "closing the sheet should clear the open card in the store").toHaveBeenCalledWith(false),
    );
  });
});
