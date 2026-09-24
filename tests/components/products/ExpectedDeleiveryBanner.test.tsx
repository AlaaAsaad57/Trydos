// The delivery line on a product. Tapping it opens the expected-delivery sheet.
import { describe, expect, it, vi } from "vitest";

import ExpectedDeleiveryBanner from "components/products/ExpectedDeleiveryBanner";

import { fireEvent, renderWithProviders, screen } from "../../render";

vi.mock("components/products/ExpectedDeleiveryModal", () => ({
  default: ({ allow_return_in_days }: any) => (
    <div data-testid="modal" data-return={allow_return_in_days} />
  ),
}));

describe("ExpectedDeleiveryBanner", () => {
  it("opens the delivery sheet on tap", async () => {
    const { store } = await renderWithProviders(
      <ExpectedDeleiveryBanner language="en" country="sy" product_id={1} shipping_days={2}>
        <span>Arrives Monday</span>
      </ExpectedDeleiveryBanner>,
    );
    expect(screen.getByTestId("modal").dataset.return, "no-return is not the default").toBe("0");
    fireEvent.click(screen.getByText("Arrives Monday"));
    expect(store.getState().ColorBottomSheet, "the delivery sheet was not opened").toEqual({
      is_for_deleviery: true,
    });
  });

  it("aligns to the right in Arabic", async () => {
    await renderWithProviders(
      <ExpectedDeleiveryBanner language="ar" country="sy" product_id={1} shipping_days={2} allow_return_in_days={3}>
        <span>line</span>
      </ExpectedDeleiveryBanner>,
    );
    expect(screen.getByText("line").parentElement!.className, "the Arabic line is not aligned right").toContain(
      "items-end",
    );
  });
});
