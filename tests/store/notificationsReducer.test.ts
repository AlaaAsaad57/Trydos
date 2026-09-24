// store/notifications/reducer.ts — the toast list and the three helpers that
// add to it (success, error, chat).
import { beforeEach, describe, expect, it } from "vitest";

import {
  showChatNotification,
  showErrorNotification,
  showSuccessNotification,
  useNotificationStore,
} from "store/notifications/reducer";

const list = () => useNotificationStore.getState().notifications;

beforeEach(() => useNotificationStore.getState().clearNotifications());

describe("showErrorNotification", () => {
  it("shows no toast for an authorization message, because the session flow handles it", () => {
    showErrorNotification("Unauthorized");
    expect(list(), "an authorization message raised a toast").toEqual([]);
  });

  it("shows an error toast with its code and a 10 second default", () => {
    showErrorNotification("Out of stock", undefined, "/cart", undefined, 422);
    expect(list()[0], "the error toast is wrong").toMatchObject({
      type: "error",
      message: "Out of stock",
      href: "/cart",
      error_code: 422,
      duration: 10000,
    });
  });
});

describe("chat toasts", () => {
  it("keep one toast per chat, the newest", () => {
    showChatNotification("A", "first", "1");
    showChatNotification("A", "second", "1");
    showChatNotification("B", "other", "2");
    expect(list().map((n) => n.message), "the chat toasts were not kept one per chat").toEqual(["second", "other"]);
  });
});

describe("removeNotification", () => {
  it("removes one toast by id", () => {
    showChatNotification("A", "first", "1");
    showChatNotification("B", "other", "2");
    useNotificationStore.getState().removeNotification(list()[0].id);
    expect(list().map((n) => n.message), "the wrong toast was removed").toEqual(["other"]);
  });
});

describe("toasts without a chat", () => {
  it("BUG-utils-5: a new error toast does not remove the success toast already on screen", () => {
    showSuccessNotification("Saved");
    showErrorNotification("Payment failed");
    expect(
      list().map((n) => n.message),
      "the per-chat de-duplication also matched two toasts that both have no chat, so the first toast vanished",
    ).toEqual(["Saved", "Payment failed"]);
  });
});
