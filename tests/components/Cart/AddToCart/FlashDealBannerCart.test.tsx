// The flash deal countdown inside the add-to-cart sheet.
import { afterEach, describe, expect, it, vi } from "vitest";

import FlashDealBannerCart from "components/Cart/AddToCart/FlashDealBannerCart";

import { act, renderWithProviders, screen } from "../../../render";

describe("the flash deal countdown in the add-to-cart sheet", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down to the end of the deal day and ticks every second", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(new Date(2030, 0, 1, 23, 59, 50));

    await renderWithProviders(<FlashDealBannerCart end_data="2030-01-03" />);

    expect(
      screen.getByText("| 02 d |"),
      "two days are left and the banner did not say so",
    ).toBeInTheDocument();
    expect(
      screen.getByText(/00:\s*00:\s*09/),
      "the hours, minutes and seconds are wrong",
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getByText(/00:\s*00:\s*08/),
      "the countdown did not tick after one second",
    ).toBeInTheDocument();
  });

  it("shows nothing once the deal is over", async () => {
    const { container } = await renderWithProviders(
      <FlashDealBannerCart end_data="2000-01-01" />,
    );

    expect(
      screen.queryByText("Flash Deal"),
      "an ended deal still shows its banner",
    ).toBeNull();
    expect(container.textContent, "an ended deal must draw nothing").toBe("");
  });
});
