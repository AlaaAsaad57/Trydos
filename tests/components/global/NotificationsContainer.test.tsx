// Where the notification message is painted, relative to an open overlay.
//
// THE BUG THIS FILE PINS
// Adding to the cart, or changing a quantity, can fail. The app then calls
// `showErrorNotification` and the message is drawn by `NotificationsContainer`.
// While the add-to-cart bottom sheet is open, that message was painted BEHIND
// the sheet, so the shopper never saw why the change did not go through.
//
// WHY IT HAPPENED — IT IS NOT "THE Z-INDEX IS TOO LOW"
// `z-index` is a 32-bit signed integer. Every value above 2147483647 is clamped
// down to it. Checked in a real Chromium (the one Playwright 1.62 ships):
// three fixed elements asking for
// 9999999999, 9999999999 and 99999999999999 all report a computed `z-index` of
// "2147483647", and the LAST one in the document is the one `elementFromPoint`
// returns.
//
// This app asks for numbers in the billions everywhere. The bottom sheet asks
// for 9999999999 (components/global/BottomSheet.tsx) and the message asks for
// 9999999999 (components/global/NotificationsContainer.tsx). Both clamp to the
// same number, so they share one layer and document order alone decides. The
// sheet portals itself into <body> when the shopper opens it, which is after the
// layout rendered the message container — so the sheet wins.
//
// So the test does not look at the raw numbers. It checks the two things the
// browser actually uses, in the order the browser uses them: the clamped layer,
// and then document order.
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BottomSheet from "components/global/BottomSheet";
import { fireEvent, renderWithProviders, screen } from "tests/render";
import NotificationsContainer from "components/global/NotificationsContainer";
import {
  showChatNotification,
  showErrorNotification,
  showSuccessNotification,
  useNotificationStore,
} from "store/notifications/reducer";

// The incoming-call widget is a `.js` file that contains JSX, and the test
// transform refuses to parse JSX out of a `.js` file. It has nothing to do with
// where a message is painted, so it is stood down for this file.
vi.mock("components/Chat/components/CallComponent", () => ({
  default: () => null,
}));

// Opening a chat from a message asks the chat backend to watch the channel.
// That call is replaced so no socket or request is made.
const chatSpies = vi.hoisted(() => ({ watchChannel: vi.fn() }));
vi.mock("store/chat/actions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  watchChannel: chatSpies.watchChannel,
}));

// next/link only follows a click inside a mounted App Router. The stand-in
// keeps the caller's onClick and stops jsdom from leaving the page.
vi.mock("next/link", () => ({
  default: ({ href, onClick, prefetch, children, ...rest }: any) => (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

/** The largest `z-index` a browser keeps. Anything above is clamped to it. */
const MAX_Z_INDEX = 2147483647;

/**
 * The layer the browser will really put this element on.
 *
 * Reads the number from the inline style when there is one, and otherwise from
 * the `z-<number>` utility class — jsdom loads no stylesheet, so the class name
 * is the only record of what Tailwind would have written.
 */
const paintLayer = (element: HTMLElement): number => {
  const inline = element.style.zIndex;
  const fromClass = Array.from(element.classList)
    .map((name) => /^z-\[?(\d+)\]?$/.exec(name)?.[1])
    .find(Boolean);
  const asked = Number(inline || fromClass);
  if (!Number.isFinite(asked)) return Number.NaN;
  return Math.min(asked, MAX_Z_INDEX);
};

/** True when `later` is painted after `earlier` on a shared layer. */
const comesAfterInDocument = (earlier: HTMLElement, later: HTMLElement) =>
  Boolean(
    earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

beforeEach(() => {
  useNotificationStore.getState().clearNotifications();
});

describe("a failure message shown while the add-to-cart sheet is open", () => {
  it("is painted above the sheet, not behind it", () => {
    // The order here is the order of the real flow, and it is the whole point.
    // The layout renders the message container on every page load; the sheet
    // only enters the page later, when the shopper opens it.
    render(<NotificationsContainer />);
    render(
      <BottomSheet isOpen onClose={() => {}}>
        <p>add to cart</p>
      </BottomSheet>,
    );

    act(() => {
      showErrorNotification("Could not update the cart");
    });

    const sheet = document.querySelector<HTMLElement>(
      "div.fixed.inset-0.z-9999999999",
    );
    expect(
      sheet,
      "the add-to-cart bottom sheet did not render its overlay, so this test never compared anything",
    ).not.toBeNull();

    // `data-pw` is this app's test hook. The unit runner leaves Testing
    // Library on its own `data-testid`, so the lookup is done by hand here.
    const message = document
      .querySelector('[data-pw="notification-text"]')
      ?.closest<HTMLElement>("div[style*='z-index']");
    expect(
      message,
      "the failure message did not reach the page at all — showErrorNotification produced nothing to look at",
    ).toBeInstanceOf(HTMLElement);

    expect(
      paintLayer(message!),
      `the message and the sheet no longer share a paint layer (message ${paintLayer(
        message!,
      )}, sheet ${paintLayer(
        sheet!,
      )}), so document order no longer decides and this test proves nothing — re-check both z-index values`,
    ).toBe(paintLayer(sheet!));

    expect(
      comesAfterInDocument(sheet!, message!),
      "the cart failure message is painted BEHIND the add-to-cart sheet: both sit on the same clamped z-index layer, and the message comes before the sheet in the document",
    ).toBe(true);
  });
});

describe("what the shopper can do with a message", () => {
  const messages = () => useNotificationStore.getState().notifications;

  /** The store actions a click on a message reaches, as spies. */
  const chatStore = (data: any[] = []) => ({
    data,
    openChat: vi.fn(),
    setChatOpen: vi.fn(),
    setMain: vi.fn(),
    setIsNavigating: vi.fn(),
    setOrderLoading: vi.fn(),
    setShouldUpdateOrders: vi.fn(),
    setShouldUpdateOrdersChat: vi.fn(),
    shouldUpdateOrders: 4,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    chatSpies.watchChannel.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides a message by itself after its time runs out", async () => {
    await renderWithProviders(<NotificationsContainer />);
    act(() => showErrorNotification("Out of stock"));
    expect(screen.getByText("Out of stock"), "the error message was not shown").toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(
      document.querySelector(".notification-slide-out"),
      "when its time runs out the message must start to slide out",
    ).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(messages(), "the message must be removed after it slid out").toEqual([]);
  });

  it("hides a message when it or its close button is pressed, sliding the Arabic way in Arabic", async () => {
    await renderWithProviders(<NotificationsContainer />, { store: { language: "ar" } });
    act(() => showErrorNotification("First"));
    fireEvent.click(screen.getByText("First"));
    expect(
      document.querySelector(".notification-slide-out-rtl"),
      "in Arabic a pressed message must slide out to the left",
    ).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(messages(), "a pressed message must be removed").toEqual([]);

    act(() => showErrorNotification("Second"));
    fireEvent.click(document.querySelector("button[aria-label='Close notification'] svg") as Element);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(messages(), "the close icon must remove the message").toEqual([]);

    act(() => showErrorNotification("Third"));
    fireEvent.click(screen.getByRole("button", { name: "Close notification" }));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(messages(), "the close button must remove the message").toEqual([]);
  });

  it("opens the linked page from a message with a link, and asks the orders to refresh", async () => {
    const store = chatStore();
    await renderWithProviders(<NotificationsContainer />, { store });
    act(() => showSuccessNotification("Order placed", undefined, "/gb-en/settings/orders/5", "order"));

    const link = screen.getByText("Order placed").closest("a") as HTMLAnchorElement;
    expect(link.getAttribute("href"), "the message must link to the page it names").toBe("/gb-en/settings/orders/5");
    fireEvent.click(link);

    expect(store.setShouldUpdateOrders, "the orders list must be asked to refresh").toHaveBeenCalledWith(6);
    expect(store.setShouldUpdateOrdersChat, "the order chat must be asked to refresh").toHaveBeenCalledWith(5);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(messages(), "a followed link must remove the message").toEqual([]);
  });

  it("shows a chat message with the sender's photo or initials", async () => {
    await renderWithProviders(<NotificationsContainer />);
    act(() => showChatNotification("Sara Ali", "Hello there", "11", undefined, "https://example.com/sara.png"));
    expect(screen.getByAltText("Sara Ali"), "a sender with a photo must show the photo").toBeInTheDocument();
    expect(screen.getByText("Hello there"), "the message preview must be shown").toBeInTheDocument();

    act(() => showChatNotification("", "No name here", "12"));
    expect(screen.getByText("Unknown"), "a sender with no name must be shown as Unknown").toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open chat with user" }),
      "a chat with no sender name must still have a name for screen readers",
    ).toBeInTheDocument();
  });

  it("opens the chat once the chat list is on the page", async () => {
    const channel = { id: "11", name: "Sara" };
    const store = chatStore([channel]);
    await renderWithProviders(<NotificationsContainer />, { store });
    act(() => showChatNotification("Sara", "Hi", "11"));

    fireEvent.click(screen.getByRole("button", { name: "Open chat with Sara" }));
    expect(store.setChatOpen, "the chat widget must open first").toHaveBeenCalledWith(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(store.openChat, "the chat must wait until the chat list exists").not.toHaveBeenCalled();

    const list = document.createElement("div");
    list.className = "chat-lists-class";
    document.body.appendChild(list);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    list.remove();

    expect(chatSpies.watchChannel, "the chat backend must be asked to watch the channel").toHaveBeenCalledWith("11");
    expect(store.openChat, "the chat with the sender must open").toHaveBeenCalledWith(channel);
    expect(store.setMain, "the chat view must be shown").toHaveBeenCalledWith("chat");
  });

  it("opens the channel the message carries when the store does not know it, and gives up waiting after 5 seconds", async () => {
    const channel = { id: "20" };
    const store = chatStore([{ id: "99" }]);
    await renderWithProviders(<NotificationsContainer />, { store });
    act(() => showChatNotification("Omar", "Hey", "20", channel));

    fireEvent.keyDown(screen.getByRole("button", { name: "Open chat with Omar" }), { key: "Enter" });
    expect(store.setChatOpen, "Enter must open the chat like a click").toHaveBeenCalledWith(true);

    act(() => {
      vi.advanceTimersByTime(50 + 500 * 100);
    });
    expect(store.openChat, "after 5 seconds the chat must open anyway").toHaveBeenCalledWith(channel);
    expect(store.setMain, "after 5 seconds the chat view must be shown anyway").toHaveBeenCalledWith("chat");
    expect(chatSpies.watchChannel, "with no chat list there is nothing to watch yet").not.toHaveBeenCalled();
  });

  it("opens with the space key, ignores other keys, and does nothing when the channel is unknown", async () => {
    const store = chatStore([]);
    await renderWithProviders(<NotificationsContainer />, { store });
    act(() => showChatNotification("Lina", "Yo", "30"));
    const card = screen.getByRole("button", { name: "Open chat with Lina" });

    fireEvent.keyDown(card, { key: "a" });
    expect(store.setChatOpen, "a letter key must not open the chat").not.toHaveBeenCalled();

    fireEvent.keyDown(card, { key: " " });
    expect(store.setChatOpen, "an unknown channel must not open the chat widget").not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(messages(), "the space key must still remove the message").toEqual([]);
  });

  it("goes to the private order chat page for a private chat message", async () => {
    const store = chatStore();
    await renderWithProviders(<NotificationsContainer />, { store });
    act(() =>
      showChatNotification("Shop", "Your order", "40", undefined, undefined, undefined, undefined, undefined, "#order-chat"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Open chat with Shop" }));
    expect(store.setOrderLoading, "the order page loader must start").toHaveBeenCalledWith(true);
    expect(store.setIsNavigating, "the settings loader must start").toHaveBeenCalledWith({ is_settings: true });
    expect(window.location.hash, "the browser must go to the private chat address").toBe("#order-chat");
    expect(store.setChatOpen, "a private chat must not open the chat widget").not.toHaveBeenCalled();
  });

  it("closes a chat message from its close button without opening the chat", async () => {
    const store = chatStore([{ id: "50" }]);
    await renderWithProviders(<NotificationsContainer />, { store });
    act(() => showChatNotification("Nour", "Bye", "50"));

    fireEvent.click(document.querySelector("button[aria-label='Close notification'] svg") as Element);
    fireEvent.click(screen.getByRole("button", { name: "Close notification" }));
    expect(store.setChatOpen, "closing a chat message must not open the chat").not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(messages(), "the close button must remove the chat message").toEqual([]);
  });

  it("shows the incoming call widget when a call is ringing", async () => {
    const { container } = await renderWithProviders(<NotificationsContainer />, { store: { isCallIncoming: true } });
    expect(
      document.querySelector('[data-pw="notifications-root"]'),
      "the message host must be on the page while a call rings",
    ).toBeInTheDocument();
    expect(container, "the container itself draws in a portal, not in place").toBeEmptyDOMElement();
  });
});
