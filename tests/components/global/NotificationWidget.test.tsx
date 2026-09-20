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

import { renderWithProviders, screen } from "../../render";

// The widget asks Firebase whether this browser can take push before it decides
// which of its two cards to show. Answered here so the test picks the card it
// means to look at.
const firebaseSupported = vi.fn(async () => true);
vi.mock("firebase/messaging", () => ({
  isSupported: () => firebaseSupported(),
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
