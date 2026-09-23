import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

const home = vi.hoisted(() => ({
  getNotificationPermissionStatus: vi.fn(),
  AllowNotifications: vi.fn(async () => {}),
}));
vi.mock("services/home", () => ({ default: home }));

const showErrorNotification = vi.fn();
vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showErrorNotification: (...a: any[]) => showErrorNotification(...a),
}));

const ChatConroller = vi.fn();
vi.mock("utils/tinyUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  ChatConroller: (...a: any[]) => ChatConroller(...a),
}));

// A chat counts as new when the test marks it `unread`. The real rule reads
// message flags, which is chatsFunctions' own business.
vi.mock("components/Chat/chatsFunctions", () => ({
  getNew: (chats: any[]) => chats.filter((c) => c.unread),
}));

const LogError = vi.fn();
vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => LogError(...a),
}));

import AuthNavSection from "components/Home/AuthNavSection";

const spies = () => ({
  setShouldAuthinticated: vi.fn(),
  setLoginOpen: vi.fn(),
  setNotificationModal: vi.fn(),
  setChatOpen: vi.fn(),
  setMain: vi.fn(),
});

const chatIcon = (c: HTMLElement) => c.querySelector(".nav-question-item") as HTMLElement;

describe("AuthNavSection", () => {
  beforeEach(() => {
    home.getNotificationPermissionStatus.mockReset();
    home.AllowNotifications.mockClear();
    showErrorNotification.mockReset();
    ChatConroller.mockReset();
    LogError.mockReset();
  });

  it("greets a named shopper, shows the plain chat icon and opens the menu from the avatar", async () => {
    const onClick = vi.fn();
    const { container } = await renderWithProviders(
      <AuthNavSection onClick={onClick} userData={{ name: "Sara", image: null } as any} />,
      { store: { data: [], chatVar: false, showNotificaionCircle: [] } },
    );
    expect(screen.getByText("Sara"), "the shopper's name is missing").toBeInTheDocument();
    expect(container.querySelector('[data-pw="Chat-Icon"]'), "the plain chat icon is missing").not.toBeNull();
    expect(chatIcon(container).style.marginRight, "an idle chat icon has the wrong gap").toBe("30px");
    fireEvent.click(container.querySelector('[data-pw="avatar-options"]')!);
    expect(onClick, "tapping the avatar did not open the menu").toHaveBeenCalled();
  });

  it("hides a guest name and shows the unread count", async () => {
    const { container } = await renderWithProviders(
      <AuthNavSection onClick={() => {}} userData={{ name: "guest" } as any} />,
      { store: { data: [{ id: 1, unread: true }, { id: 2 }], chatVar: false } },
    );
    expect(container.querySelector('[data-pw="NavUserName"]'), "a guest name was shown").toBeNull();
    expect(container.querySelector("tspan")!.textContent, "the unread count is wrong").toBe("1");
    expect(chatIcon(container).style.marginRight, "the unread icon has the wrong gap").toBe("20px");
  });

  it("marks the chat icon active while the chat is open, and hides it while logging out", async () => {
    const open = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], chatVar: true },
    });
    expect(chatIcon(open.container).className, "an open chat is not marked active").toContain("active-nav-item");
    open.unmount();
    const out = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], chatVar: false, LoggingOut: true },
    });
    expect(chatIcon(out.container).querySelector("img"), "the chat icon showed while logging out").toBeNull();
    expect(chatIcon(out.container).className, "the icon is not disabled while logging out").toContain("cursor-not-allowed");
  });

  it("asks for notification permission first when it was never asked", async () => {
    home.getNotificationPermissionStatus.mockReturnValue(-1);
    const s = spies();
    const { container } = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], ...s, userChat: { id: 3 } },
    });
    fireEvent.click(chatIcon(container));
    await waitFor(() => expect(s.setNotificationModal, "the permission prompt did not open").toHaveBeenCalledWith(true));
    expect(s.setChatOpen, "the chat opened before permission was asked").not.toHaveBeenCalled();
  });

  it("tells the shopper when notifications are blocked", async () => {
    home.getNotificationPermissionStatus.mockReturnValue(0);
    const s = spies();
    const { container } = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], ...s, userChat: { id: 3 } },
    });
    fireEvent.click(chatIcon(container));
    await waitFor(() =>
      expect(showErrorNotification, "the blocked-notifications message was not shown").toHaveBeenCalledWith(
        "Notification Is Not Enabled! please Allow Notification Access",
      ),
    );
    expect(s.setChatOpen, "the chat opened with notifications blocked").not.toHaveBeenCalled();
  });

  it("opens the chat on the main screen and turns notifications on when allowed", async () => {
    home.getNotificationPermissionStatus.mockReturnValue(1);
    const s = spies();
    const { container } = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], ...s, userChat: { id: 3 } },
    });
    fireEvent.click(chatIcon(container));
    await waitFor(() => expect(home.AllowNotifications, "notifications were not turned on").toHaveBeenCalled());
    expect(s.setMain, "the chat did not open on its main screen").toHaveBeenCalledWith("main");
    expect(ChatConroller, "the chat panel did not open").toHaveBeenCalledWith(true);
  });

  it("opens the chat without a permission step for any other permission answer", async () => {
    home.getNotificationPermissionStatus.mockReturnValue(2);
    const s = spies();
    const { container } = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], ...s, userChat: { id: 3 } },
    });
    fireEvent.click(chatIcon(container));
    await waitFor(() => expect(s.setChatOpen, "the chat did not open").toHaveBeenCalledWith(true));
    expect(home.AllowNotifications, "notifications were turned on without being allowed").not.toHaveBeenCalled();
  });

  it("asks a signed-in shopper with no chat account to verify the phone", async () => {
    const s = spies();
    const { container } = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], ...s, userChat: null, userProfile: { phone: "0999" } },
    });
    fireEvent.click(chatIcon(container));
    await waitFor(() =>
      expect(s.setShouldAuthinticated, "the phone check did not open for the chat").toHaveBeenCalledWith("open chat"),
    );
  });

  it("opens the login for a guest", async () => {
    const s = spies();
    const { container } = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], ...s, userChat: null, userProfile: { phone: "0" } },
    });
    fireEvent.click(chatIcon(container));
    await waitFor(() => expect(s.setLoginOpen, "the login did not open for a guest").toHaveBeenCalledWith(true));
  });

  it("logs a failure while opening the chat", async () => {
    home.getNotificationPermissionStatus.mockImplementation(() => {
      throw new Error("no Notification API");
    });
    const { container } = await renderWithProviders(<AuthNavSection onClick={() => {}} userData={{} as any} />, {
      store: { data: [], userChat: { id: 3 } },
    });
    fireEvent.click(chatIcon(container));
    await waitFor(() =>
      expect(LogError.mock.calls[0]?.[0].error?.message, "the failure was not logged").toBe("no Notification API"),
    );
  });
});
