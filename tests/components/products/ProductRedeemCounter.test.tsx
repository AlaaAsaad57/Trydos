// The "Luck! Add To Bag Within N seconds" badge on a luck product. It shows
// only while the luck window (hooks/useLuckTimer) is open.
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductRedeemCounter from "components/products/ProductRedeemCounter";

import { renderWithProviders, screen } from "../../render";

const { useLuckTimer } = vi.hoisted(() => ({ useLuckTimer: vi.fn() }));
vi.mock("hooks/useLuckTimer", () => ({ useLuckTimer }));

describe("ProductRedeemCounter", () => {
  beforeEach(() => useLuckTimer.mockReset());

  it("shows the seconds left while the luck window is open", async () => {
    useLuckTimer.mockReturnValue({ luckActive: true, secondsLeft: 42 });
    await renderWithProviders(<ProductRedeemCounter language="en" product_id={5} />);
    expect(screen.getByText("42"), "the seconds left are not shown").toBeInTheDocument();
    expect(useLuckTimer, "the timer was not read for this luck product").toHaveBeenCalledWith(5, { isLuck: true });
    expect(screen.getByText("Luck!").parentElement!.className, "the English badge is not on the left").toContain("left-0");
  });

  it("sits on the right in Arabic", async () => {
    useLuckTimer.mockReturnValue({ luckActive: true, secondsLeft: 3 });
    await renderWithProviders(<ProductRedeemCounter language="ar" product_id={5} />, { language: "ar" });
    expect(screen.getByText("3").parentElement!.className, "the Arabic badge is not on the right").toContain("right-0");
  });

  it("shows nothing once the window has closed", async () => {
    useLuckTimer.mockReturnValue({ luckActive: false, secondsLeft: 0 });
    const { container } = await renderWithProviders(<ProductRedeemCounter language="en" product_id={5} />);
    expect(container.innerHTML, "a closed luck window still shows a badge").toBe("");
  });
});
