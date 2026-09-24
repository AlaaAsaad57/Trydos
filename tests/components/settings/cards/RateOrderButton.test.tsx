// The "Rate & Get Money" button (components/settings/cards/RateOrderButton.tsx).
//
// A tap calls `setExpanded`, then after half a second scrolls the first
// rating stars into view and shakes every set of stars for one second.
import { afterEach, describe, expect, it, vi } from "vitest";

import RateOrderButton from "components/settings/cards/RateOrderButton";
import { act, fireEvent, renderWithProviders, screen } from "../../../render";

afterEach(() => vi.useRealTimers());

describe("the rate button", () => {
  it("expands, then scrolls to the stars and shakes them for one second", async () => {
    const setExpanded = vi.fn();
    await renderWithProviders(<RateOrderButton setExpanded={setExpanded} />, { store: { language: "ar" } });
    const stars = [document.createElement("div"), document.createElement("div")];
    stars.forEach((s) => {
      s.className = "rating-star-container";
      s.scrollIntoView = vi.fn();
      document.body.appendChild(s);
    });

    vi.useFakeTimers();
    fireEvent.click(screen.getAllByText("Rate & Get Money")[0]);
    expect(setExpanded, "the tap did not expand the details").toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(500));
    expect(stars[0].scrollIntoView, "the first stars were not scrolled into view").toHaveBeenCalled();
    expect(stars.every((s) => s.classList.contains("shake-anim")), "not every set of stars was shaken").toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(stars.some((s) => s.classList.contains("shake-anim")), "the stars kept shaking after one second").toBe(false);
    stars.forEach((s) => s.remove());
  });
});
