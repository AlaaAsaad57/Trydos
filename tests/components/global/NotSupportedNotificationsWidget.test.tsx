// The "your browser cannot do push" card, and how it is closed.
import { describe, expect, it, vi } from "vitest";

import NotSupportedNotificationsWidget from "components/global/NotSupportedNotificationsWidget";

import { fireEvent, renderWithProviders, screen } from "../../render";

describe("the push-not-supported card", () => {
  it("closes on 'Got it', tells the caller, and ignores keys other than Escape", async () => {
    const onDismiss = vi.fn();
    const { store } = await renderWithProviders(<NotSupportedNotificationsWidget onDismiss={onDismiss} className="extra" />, {
      store: { isNotificationModal: true },
    });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Enter" });
    expect(onDismiss, "a key other than Escape must not close the card").not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect((store.getState() as any).isNotificationModal, "'Got it' must close the notification prompt").toBe(false);
    expect(onDismiss, "'Got it' must tell the caller the card was dismissed").toHaveBeenCalledTimes(1);
  });

  it("closes on Escape even with no dismiss handler", async () => {
    const { store } = await renderWithProviders(<NotSupportedNotificationsWidget />, {
      store: { isNotificationModal: true },
    });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect((store.getState() as any).isNotificationModal, "Escape must close the notification prompt").toBe(false);
  });
});
