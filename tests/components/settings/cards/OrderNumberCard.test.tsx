// The order number card (components/settings/cards/OrderNumberCard.tsx).
//
// Tapping it copies the order number and confirms the copy.
import { afterEach, describe, expect, it, vi } from "vitest";

const showSuccessNotification = vi.hoisted(() => vi.fn());
vi.mock("@/store/notifications/reducer", () => ({ showSuccessNotification }));

import OrderNumberCard from "components/settings/cards/OrderNumberCard";
import { renderWithProviders, screen, fireEvent, waitFor } from "../../../render";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function stubClipboard(writeText: () => Promise<void>) {
  const spy = vi.fn(writeText);
  vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText: spy } });
  return spy;
}

describe("the order number card", () => {
  it("copies the number and confirms it", async () => {
    await renderWithProviders(<OrderNumberCard number="G-100" />);
    const writeText = stubClipboard(async () => {});
    fireEvent.click(screen.getByText("G-100"));
    expect(writeText, "the order number was not copied").toHaveBeenCalledWith("G-100");
    await waitFor(() =>
      expect(showSuccessNotification, "the copy was not confirmed").toHaveBeenCalledWith("Order Number has been Copied"),
    );
  });

  it("stays quiet when the copy is refused", async () => {
    await renderWithProviders(<OrderNumberCard number="G-100" />);
    const writeText = stubClipboard(async () => {
      throw new Error("denied");
    });
    fireEvent.click(screen.getByText("G-100"));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    await Promise.resolve();
    expect(showSuccessNotification, "a refused copy was confirmed as copied").not.toHaveBeenCalled();
  });
});
