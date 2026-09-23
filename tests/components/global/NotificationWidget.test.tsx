// The "allow notifications" prompt must read right-to-left in Arabic and
// Kurdish.
//
// The prompt is a card of its own: a heading, a sentence, a bullet list and two
// buttons. Nothing above it sets the direction — `<html dir>` is commented out
// in app/(client)/[lang]/layout.tsx — so the card has to say it itself, the same
// way every card in components/global/NotificationsContainer.tsx already does.
//
// The card is what carries `dir`, not the full-screen backdrop around it. The
// backdrop only centres the card, and giving it a direction would move nothing
// while risking the overlay's own placement.
//
// Two cards, because the prompt has two states: the normal ask, and the
// "your browser cannot do push" message that replaces it.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";

import NotificationWidget from "components/global/NotificationWidget";

import { fireEvent, renderWithProviders, screen, waitFor } from "../../render";

// The widget asks Firebase whether this browser can take push before it decides
// which of its two cards to show. Answered here so the test picks the card it
// means to look at.
const firebaseSupported = vi.fn(async () => true);
vi.mock("firebase/messaging", () => ({
  isSupported: () => firebaseSupported(),
}));

const spies = vi.hoisted(() => ({ showError: vi.fn(), logError: vi.fn() }));
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: spies.showError,
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: spies.logError,
}));

/**
 * Give jsdom the three browser APIs the widget checks for. Without them it
 * decides push is unsupported and shows the other card.
 */
function givePushSupport() {
  (globalThis as any).Notification = {
    permission: "default",
    requestPermission: async () => "granted",
  };
  (globalThis as any).PushManager = function PushManager() {};
  Object.defineProperty(navigator, "serviceWorker", {
    value: {},
    configurable: true,
  });
}

function takePushSupportAway() {
  delete (globalThis as any).Notification;
  delete (globalThis as any).PushManager;
}

/** The white card itself — the element that has to carry the direction. */
const promptCard = async () =>
  (await screen.findByRole("dialog")).firstElementChild;

describe("the notification permission prompt and right-to-left languages", () => {
  beforeEach(() => {
    firebaseSupported.mockResolvedValue(true);
  });

  afterEach(() => {
    takePushSupportAway();
  });

  it("reads right to left in Arabic", async () => {
    givePushSupport();
    await renderWithProviders(<NotificationWidget />, {
      store: { language: "ar" },
      language: "ar",
      country: "sy",
    });

    expect(
      (await promptCard())?.getAttribute("dir"),
      "the Arabic prompt card does not say it reads right to left, so its text, its bullet list and its two buttons all stay left to right",
    ).toBe("rtl");
  });

  it("reads right to left in Kurdish", async () => {
    givePushSupport();
    await renderWithProviders(<NotificationWidget />, {
      store: { language: "ku" },
      language: "ku",
      country: "sy",
    });

    expect(
      (await promptCard())?.getAttribute("dir"),
      "the Kurdish prompt card does not say it reads right to left; Kurdish is one of this app's two right-to-left languages, alongside Arabic",
    ).toBe("rtl");
  });

  it("still reads left to right in English", async () => {
    givePushSupport();
    await renderWithProviders(<NotificationWidget />, {
      store: { language: "en" },
      language: "en",
    });

    expect(
      (await promptCard())?.getAttribute("dir"),
      "the English prompt card was turned right to left, so the direction is being set for every language instead of only Arabic and Kurdish",
    ).toBe("ltr");
  });

  it("reads right to left in Arabic on the browser-not-supported card too", async () => {
    // No Notification API in jsdom, so the widget shows its other card.
    await renderWithProviders(<NotificationWidget />, {
      store: { language: "ar" },
      language: "ar",
      country: "sy",
    });

    expect(
      screen.getByRole("dialog").getAttribute("aria-label"),
      "this test is looking at the wrong card — it wanted the browser-not-supported one",
    ).toBe("Notifications not supported prompt");
    expect(
      (await promptCard())?.getAttribute("dir"),
      "the Arabic browser-not-supported card does not say it reads right to left, so its message and its close button stay left to right",
    ).toBe("rtl");
  });
});

describe("what the notification permission prompt does", () => {
  const BLOCKED =
    "Notification is Blocked in This Browser Please Enable Notification premission and refresh";

  /** Put the prompt up with a given Notification stand-in. */
  const openPrompt = async (notification: Record<string, any>) => {
    givePushSupport();
    (globalThis as any).Notification = notification;
    const onAllow = vi.fn();
    const onDismiss = vi.fn();
    const result = await renderWithProviders(<NotificationWidget onAllow={onAllow} onDismiss={onDismiss} />, {
      store: { isNotificationModal: true },
    });
    await screen.findByRole("button", { name: "Allow notifications" });
    const closed = () => (result.store.getState() as any).isNotificationModal === false;
    return { onAllow, onDismiss, closed, ...result };
  };

  const allow = () => fireEvent.click(screen.getByRole("button", { name: "Allow notifications" }));

  beforeEach(() => {
    firebaseSupported.mockResolvedValue(true);
    spies.showError.mockClear();
    spies.logError.mockClear();
  });

  afterEach(() => {
    takePushSupportAway();
  });

  it("shows the not-supported card when the firebase check throws", async () => {
    givePushSupport();
    firebaseSupported.mockRejectedValueOnce(new Error("no messaging"));
    await renderWithProviders(<NotificationWidget />);

    expect(
      (await screen.findByRole("dialog")).getAttribute("aria-label"),
      "a failed firebase check must fall back to the not-supported card",
    ).toBe("Notifications not supported prompt");
  });

  it("closes and allows at once when permission is already granted", async () => {
    const { onAllow, closed } = await openPrompt({ permission: "granted", requestPermission: vi.fn() });
    allow();
    await waitFor(() => expect(closed(), "the prompt must close").toBe(true));
    expect(onAllow, "an already-granted permission must count as allowed").toHaveBeenCalled();
  });

  it("says push is blocked when permission is already denied", async () => {
    const { onDismiss, closed } = await openPrompt({ permission: "denied", requestPermission: vi.fn() });
    allow();
    await waitFor(() => expect(closed(), "the prompt must close").toBe(true));
    expect(spies.showError, "a blocked browser must be told how to unblock push").toHaveBeenCalledWith(BLOCKED);
    expect(onDismiss, "a blocked permission must count as dismissed").toHaveBeenCalled();
  });

  it("allows when the browser answers granted straight away, as a plain string", async () => {
    const { onAllow, closed } = await openPrompt({ permission: "default", requestPermission: () => "granted" });
    allow();
    await waitFor(() => expect(closed(), "the prompt must close").toBe(true));
    expect(onAllow, "a granted answer must count as allowed").toHaveBeenCalled();
  });

  it("says push is blocked when the shopper refuses in the browser prompt", async () => {
    const { onDismiss, onAllow, closed } = await openPrompt({
      permission: "default",
      requestPermission: async () => "denied",
    });
    allow();
    await waitFor(() => expect(closed(), "the prompt must close").toBe(true));
    expect(spies.showError, "a refused prompt must say push is blocked").toHaveBeenCalledWith(BLOCKED);
    expect(onDismiss, "a refused prompt must count as dismissed").toHaveBeenCalled();
    expect(onAllow, "a refused prompt must not count as allowed").not.toHaveBeenCalled();
  });

  it("only dismisses when the shopper closes the browser prompt without an answer", async () => {
    const { onDismiss, closed } = await openPrompt({ permission: "default", requestPermission: async () => "default" });
    allow();
    await waitFor(() => expect(closed(), "the prompt must close").toBe(true));
    expect(onDismiss, "an unanswered prompt must count as dismissed").toHaveBeenCalled();
    expect(spies.showError, "an unanswered prompt is not a block").not.toHaveBeenCalled();
  });

  it("logs a request that throws and falls back to the current permission", async () => {
    const failure = new Error("already asked");
    const { onDismiss, closed } = await openPrompt({
      permission: "default",
      requestPermission: () => {
        throw failure;
      },
    });
    allow();
    await waitFor(() => expect(closed(), "the prompt must close").toBe(true));
    expect(spies.logError, "the throwing permission request must be logged").toHaveBeenCalledWith({
      error: failure,
      scenario: "handleAllowClick in block 1 Notification Modal",
    });
    expect(onDismiss, "falling back to default must count as dismissed").toHaveBeenCalled();
  });

  it("logs and reports blocked when reading the permission itself fails", async () => {
    const failure = new Error("permission unreadable");
    const { onDismiss, closed } = await openPrompt({
      get permission() {
        throw failure;
      },
      requestPermission: vi.fn(),
    });
    allow();
    await waitFor(() => expect(closed(), "the prompt must close").toBe(true));
    expect(spies.logError, "the failure must be logged").toHaveBeenCalledWith({
      error: failure,
      scenario: "handleAllowClick in block 2 Notification Modal",
    });
    expect(spies.showError, "the shopper must be told push is blocked").toHaveBeenCalledWith(BLOCKED);
    expect(onDismiss, "the failure must count as dismissed").toHaveBeenCalled();
  });

  it("allows and closes when the Notification API went away before the click", async () => {
    const { onAllow, closed } = await openPrompt({ permission: "default", requestPermission: vi.fn() });
    delete (globalThis as any).Notification;
    allow();
    await waitFor(() => expect(closed(), "the prompt must close").toBe(true));
    expect(onAllow, "with no Notification API the click must still count as allowed").toHaveBeenCalled();
  });

  it("dismisses on Not now and on Escape, but not on other keys", async () => {
    const { onDismiss, closed, store } = await openPrompt({ permission: "default", requestPermission: vi.fn() });

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(onDismiss, "a key other than Escape must not dismiss").not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onDismiss, "Escape must dismiss the prompt").toHaveBeenCalledTimes(1);
    expect(closed(), "Escape must close the prompt").toBe(true);

    store.setState({ isNotificationModal: true } as any);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onDismiss, "Not now must dismiss the prompt").toHaveBeenCalledTimes(2);
    expect(closed(), "Not now must close the prompt").toBe(true);
  });
});
