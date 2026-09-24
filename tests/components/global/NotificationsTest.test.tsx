// The tester panel in the settings modal: each "Test" button asks the backend
// to send one kind of push notification.
import { describe, expect, it, vi } from "vitest";

const home = vi.hoisted(() => ({
  TestNotificationBoutique: vi.fn(),
  TestNotificationProductDiscount: vi.fn(),
  TestNotificationProductAvailable: vi.fn(),
  TestNotificationProductToOldCart: vi.fn(),
  TestNotificationProductComment: vi.fn(),
  TestNotificationCategoryCreated: vi.fn(),
  TestNotificationBeforeStockOut: vi.fn(),
  TestNotificationChangeInPrice: vi.fn(),
}));
vi.mock("services/home", () => ({ default: home }));

import NotificationsTest from "components/global/NotificationsTest";

import { fireEvent, renderWithProviders, screen } from "../../render";

describe("the notifications tester panel", () => {
  it("sends the matching test notification for every button", async () => {
    await renderWithProviders(<NotificationsTest />);
    const buttons = screen.getAllByText("Test");
    const expected: Array<[string, keyof typeof home]> = [
      ["new boutique", "TestNotificationBoutique"],
      ["product has discount", "TestNotificationProductDiscount"],
      ["product available", "TestNotificationProductAvailable"],
      ["product moved to old cart", "TestNotificationProductToOldCart"],
      ["wishlist discount", "TestNotificationProductDiscount"],
      ["new comment", "TestNotificationProductComment"],
      ["new category", "TestNotificationCategoryCreated"],
      ["before stock out", "TestNotificationBeforeStockOut"],
      ["change in price", "TestNotificationChangeInPrice"],
    ];

    expected.forEach(([name, call], index) => {
      home[call].mockClear();
      fireEvent.click(buttons[index]);
      expect(home[call], `the "${name}" button did not ask for its test notification`).toHaveBeenCalledTimes(1);
    });
    expect(home.TestNotificationBoutique, "the boutique test must name boutique 66").toHaveBeenCalledWith({
      boutique_id: 66,
    });
  });
});
