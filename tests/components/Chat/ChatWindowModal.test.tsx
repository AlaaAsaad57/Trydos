// The chat window with its list and conversation
// (components/Chat/ChatWindowModal.tsx). Its three panes are stand-ins that
// record their props; jsdom has no Notification, so it is stubbed per test.
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../render";

const h = vi.hoisted(() => ({ got: {} as Record<string, any> }));

function stub(name: string) {
  return {
    default: (p: any) => {
      h.got[name] = p;
      return <div data-testid={name} />;
    },
  };
}

vi.mock("components/Chat/pages/ChatWindow", () => stub("ChatWindow"));
vi.mock("components/Chat/pages/ConversationContainer", () => stub("Conversation"));
vi.mock("components/Chat/components/NewChatsSide", () => stub("NewChatsSide"));

import Chat from "components/Chat/ChatWindowModal";

async function mount(permission: string | null, storePermission = true, props: Record<string, any> = {}) {
  if (permission === null) vi.stubGlobal("Notification", undefined);
  else vi.stubGlobal("Notification", { permission });
  const spies = {
    setNotificationPermission: vi.fn(),
    setForwardMessage: vi.fn(),
    setMain: vi.fn(),
    openChat: vi.fn(),
  };
  const close = vi.fn();
  const r = await renderWithProviders(<Chat close={close} open callInProgress={false} {...props} />, {
    store: { NotificationPremission: storePermission, main: "chat", activeChat: { id: 7 }, data: [], ...spies },
  });
  return { ...r, spies, close };
}

afterEach(() => {
  vi.unstubAllGlobals();
  h.got = {};
});

describe("ChatWindowModal", () => {
  it("shows the chat when notifications are allowed", async () => {
    const { spies } = await mount("granted");
    expect(spies.setNotificationPermission, "the allowed permission was not stored").toHaveBeenCalledWith(true);
    expect(screen.getByTestId("ChatWindow"), "the chat list was not shown").toBeInTheDocument();
    expect(h.got.Conversation.ViewedScreen, "the open chat was not shown").toBe(7);
    h.got.ChatWindow.setOpenContacts(true);
    h.got.ChatWindow.setSearch("x");
    h.got.Conversation.setSearch("y");
  });

  it("asks to allow notifications otherwise", async () => {
    const { spies } = await mount("denied", false);
    expect(spies.setNotificationPermission, "a denied permission was stored as allowed").toHaveBeenCalledWith(false);
    expect(screen.getByText("Please Enable Notification To Use Chat"), "the notification request was not shown").toBeInTheDocument();
  });

  it("treats a browser with no notifications as not allowed", async () => {
    const { spies } = await mount(null, true);
    expect(spies.setNotificationPermission, "a browser with no notifications was stored as allowed").toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("ChatWindow"), "the chat opened with no notifications").toBeNull();
  });

  it("the backdrop closes the chat, unless a call is running", async () => {
    const a = await mount("granted");
    fireEvent.click(document.querySelector(".fixed.inset-0")!);
    expect(a.close, "the backdrop did not close the chat").toHaveBeenCalled();
    expect(a.spies.openChat, "the open chat was not cleared").toHaveBeenCalledWith(null);
    a.unmount();
    const b = await mount("granted", true, { callInProgress: true });
    fireEvent.click(document.querySelector(".fixed.inset-0")!);
    expect(b.close, "the backdrop closed the chat during a call").not.toHaveBeenCalled();
  });
});
