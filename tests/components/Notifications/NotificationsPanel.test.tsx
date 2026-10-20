// The notifications side panel: a page-by-page list from the market backend,
// and the link to notification settings.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spies = vi.hoisted(() => ({
  fetch: vi.fn(),
  ga: vi.fn(),
  logError: vi.fn(),
  userId: vi.fn(() => 77),
  requestToken: vi.fn(),
  isSupported: vi.fn(),
}));

vi.mock("services/notifications", () => ({ fetchNotifications: spies.fetch }));
vi.mock("services/auth", () => ({ default: { UserID: spies.userId } }));
vi.mock("utils/gtag", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  GAevent: spies.ga,
}));
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: spies.logError,
}));
vi.mock("utils/firebaseInitv1", () => ({
  requestFirebaseNotificationPermission: spies.requestToken,
}));
vi.mock("firebase/messaging", () => ({ isSupported: spies.isSupported }));
vi.mock("components/global/NextLink", () => ({
  default: ({ href, children }: any) => (
    <a href={href} onClick={(event) => event.preventDefault()}>
      {children}
    </a>
  ),
}));
vi.mock("components/Notifications/NotificationItem", () => ({
  default: ({ notification }: any) => <p>{`notice ${notification.id}`}</p>,
}));

import NotificationsPanel from "components/Notifications/NotificationsPanel";
import { MARKET_NOTIFICATION_RECEIVED_EVENT } from "utils/notificationEvents";

import { act, fireEvent, renderWithProviders, screen, waitFor } from "../../render";

const page = (ids: number[], next: string | null) => ({
  isSuccessful: true,
  hasContent: true,
  success: true,
  data: { data: ids.map((id) => ({ id })), next_page_url: next },
});

const setup = async () => {
  const onClose = vi.fn();
  const closeWindow = vi.fn();
  const result = await renderWithProviders(<NotificationsPanel onClose={onClose} closeWindow={closeWindow} />, {
    country: "sy",
  });
  const body = () => document.querySelector('[data-pw="notification-body"]') as HTMLElement;
  return { onClose, closeWindow, body, ...result };
};

/** Put the list's scroll box at the bottom and tell it it scrolled. */
const scrollToBottom = async (box: HTMLElement) => {
  Object.defineProperty(box, "scrollHeight", { value: 1000, configurable: true });
  Object.defineProperty(box, "clientHeight", { value: 400, configurable: true });
  Object.defineProperty(box, "scrollTop", { value: 580, configurable: true });
  await act(async () => {
    box.dispatchEvent(new Event("scroll"));
  });
};

beforeEach(() => {
  spies.fetch.mockReset();
  spies.ga.mockClear();
  spies.logError.mockClear();
  spies.requestToken.mockReset();
  spies.isSupported.mockReset();
  window.scrollTo = vi.fn() as any;
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the notifications panel list", () => {
  it("loads the first page on open, more on scroll, and says when there is no more", async () => {
    spies.fetch.mockResolvedValueOnce(page([1, 2], "page2")).mockResolvedValueOnce(page([3], null));
    const { body } = await setup();

    expect(await screen.findByText("notice 1"), "the first page of notifications was not shown").toBeInTheDocument();
    expect(spies.fetch, "the first request must ask for page 1").toHaveBeenCalledWith(1);
    expect(spies.ga, "opening the panel must send the notifications screen view").toHaveBeenCalledWith({
      action: "screen_view_event",
      params: { screen_name: "notifications_screen", screen_path: "/sy-en" },
    });

    // The panel puts its scroll listener back in an effect after each render.
    // The list can show before that effect runs, and until then the old
    // listener still sees `loading: true` and ignores the scroll. On a busy
    // machine that gap is long enough to lose the scroll, so repeat it until
    // page 2 is asked for.
    await waitFor(async () => {
      await scrollToBottom(body());
      expect(spies.fetch, "scrolling to the bottom must ask for page 2").toHaveBeenLastCalledWith(2);
    });
    expect(await screen.findByText("notice 3"), "scrolling to the bottom must load the next page").toBeInTheDocument();
    expect(screen.getByText("No More Notifications"), "after the last page the panel must say there is no more").toBeInTheDocument();

    // Let the listener catch up with the last page first, so the check below
    // tests `hasMore` and not an old listener that would ignore any scroll.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    await scrollToBottom(body());
    expect(spies.fetch, "after the last page no more requests must be sent").toHaveBeenCalledTimes(2);
  });

  it("does not load when the scroll is far from the bottom", async () => {
    spies.fetch.mockResolvedValueOnce(page([1], "page2"));
    const { body } = await setup();
    await screen.findByText("notice 1");

    Object.defineProperty(body(), "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(body(), "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(body(), "scrollTop", { value: 0, configurable: true });
    await act(async () => {
      body().dispatchEvent(new Event("scroll"));
    });
    expect(spies.fetch, "a scroll near the top must not load another page").toHaveBeenCalledTimes(1);
  });

  it("shows a loading line while a page is on its way, and ignores a scroll then", async () => {
    let finish: (value: any) => void = () => {};
    spies.fetch.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const { body } = await setup();

    expect(document.querySelector('[data-pw="notification-loading"]'), "a loading line must show during the first load").toBeInTheDocument();
    await scrollToBottom(body());
    expect(spies.fetch, "a scroll during a load must not send a second request").toHaveBeenCalledTimes(1);

    await act(async () => finish(page([], null)));
    expect(document.querySelector('[data-pw="notification-loading"]'), "the loading line must go after the load").toBeNull();
    expect(screen.queryByText("No More Notifications"), "an empty list must not say 'no more'").not.toBeInTheDocument();
  });

  it("logs a refused page with the backend's message", async () => {
    spies.fetch.mockResolvedValueOnce({ isSuccessful: false, message: "market refused" });
    await setup();
    await waitFor(() =>
      expect(spies.logError, "a refused notifications page must be logged").toHaveBeenCalledWith({
        error: new Error("market refused"),
        scenario: "Error in loadMoreNotifications in Notifications Panel",
      }),
    );
  });

  it("reloads from page 1 when a market notification arrives", async () => {
    spies.fetch
      .mockResolvedValueOnce(page([1], "page2"))
      .mockResolvedValueOnce(page([9], "page2"))
      .mockResolvedValueOnce({ isSuccessful: false, message: "reload refused" });
    await setup();
    await screen.findByText("notice 1");

    await act(async () => {
      window.dispatchEvent(new Event(MARKET_NOTIFICATION_RECEIVED_EVENT));
    });
    expect(await screen.findByText("notice 9"), "a new market notification must reload the list").toBeInTheDocument();
    expect(screen.queryByText("notice 1"), "the reload must replace the old list, not add to it").not.toBeInTheDocument();
    expect(spies.fetch, "the reload must ask for page 1").toHaveBeenLastCalledWith(1);

    await act(async () => {
      window.dispatchEvent(new Event(MARKET_NOTIFICATION_RECEIVED_EVENT));
    });
    await waitFor(() =>
      expect(spies.logError, "a refused reload must be logged").toHaveBeenCalledWith({
        error: new Error("reload refused"),
        scenario: "Error in reloadNotifications in Notifications Panel",
      }),
    );
  });
});

describe("closing the notifications panel", () => {
  it("closes on a press outside the panel or on the close button, not on a press inside", async () => {
    spies.fetch.mockResolvedValue(page([], null));
    const { onClose } = await setup();

    fireEvent.mouseDown(document.querySelector('[data-pw="notification-header"]') as HTMLElement);
    expect(onClose, "a press inside the panel must not close it").not.toHaveBeenCalled();

    fireEvent.mouseDown(document.body);
    expect(onClose, "a press outside the panel must close it").toHaveBeenCalledTimes(1);

    fireEvent.click(document.querySelector('[data-pw="button-close"]') as HTMLElement);
    expect(onClose, "the close button must close the panel").toHaveBeenCalledTimes(2);
  });

  it("locks the page scroll while open and gives it back on close", async () => {
    spies.fetch.mockResolvedValue(page([], null));
    const { unmount } = await setup();
    expect(document.body.style.position, "the page behind the panel must not scroll").toBe("fixed");

    unmount();
    expect(document.body.style.position, "closing the panel must unlock the page").not.toBe("fixed");
    expect(window.scrollTo, "closing the panel must move the window back").toHaveBeenCalled();
  });

  it(
    "BUG-global-3: closing the panel puts the page back where the shopper was",
    async () => {
      spies.fetch.mockResolvedValue(page([], null));
      Object.defineProperty(window, "scrollY", { value: 300, configurable: true });
      try {
        const { unmount } = await setup();
        expect(document.body.style.top, "the lock must pin the page at its scroll position").toBe("-300px");
        unmount();
        expect(window.scrollTo, "closing must put the page back at 300px").toHaveBeenCalledWith(0, 300);
      } finally {
        Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
      }
    },
  );
});

describe("the notification settings link", () => {
  it("shows no push debug data and asks for no push token", async () => {
    spies.fetch.mockResolvedValue(page([], null));
    vi.stubGlobal("Notification", { permission: "granted", requestPermission: vi.fn(async () => "granted") });
    spies.isSupported.mockResolvedValue(true);
    spies.requestToken.mockResolvedValue("abcdefghijklmnopqrstuvwxyz0123456789");
    await setup();
    await waitFor(() => expect(spies.fetch, "the panel did not load its first page").toHaveBeenCalled());
    await act(async () => {});

    for (const label of ["Notification Permission:", "FireBase Supported", "User ID:", "FCM Token:", "FCM Error:"]) {
      expect(screen.queryByText(label), `the debug line "${label}" is shown to the shopper`).toBeNull();
    }
    expect(screen.queryByText("77"), "the shopper's user id is shown").toBeNull();
    expect(document.body.textContent, "part of the push token is shown").not.toContain("abcdefghij");
    expect(spies.requestToken, "opening the panel asked for a push token").not.toHaveBeenCalled();
  });

  it("closes the window when the settings link is pressed", async () => {
    spies.fetch.mockResolvedValue(page([], null));
    const { closeWindow } = await setup();
    const link = screen.getByText("Notification Settings").closest("a") as HTMLAnchorElement;

    expect(link.getAttribute("href"), "the link must open this locale's notification settings").toBe(
      "/sy-en/settings/prefferences",
    );
    fireEvent.click(link);
    expect(closeWindow, "opening settings must close the notifications window").toHaveBeenCalled();
  });
});
