// One contact in the chat search (components/Chat/components/SearchResult.tsx):
// a contact on the app opens a new chat; anyone else gets an "Invite" button.
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ logError: null as any }));

vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => h.logError(...a),
}));

import SearchResult from "components/Chat/components/SearchResult";

const ME = 1;
const ITEM = { name: "Other Person", mobile_phone: "+10000000000", photo_path: "/p.png", contact_user_id: 9 };

async function mount(extra: Record<string, any> = {}, language: any = "en") {
  const handleClickChat = vi.fn();
  const setMain = vi.fn();
  await renderWithProviders(
    <SearchResult key="k" photo={null} SenderName="Other Person" isUser={false} handleClickChat={handleClickChat} item={ITEM} {...extra} />,
    { language, store: { setMain, userChat: { id: ME } } },
  );
  return { handleClickChat, setMain };
}

const originalUA = navigator.userAgent;

beforeEach(() => {
  h.logError = vi.fn();
  window.open = vi.fn() as any;
  window.alert = vi.fn();
});

afterEach(() => {
  Object.defineProperty(navigator, "userAgent", { value: originalUA, configurable: true });
  Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  vi.useRealTimers();
});

describe("SearchResult — a contact on the app", () => {
  it("opens a new chat with that contact after a short delay", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { handleClickChat, setMain } = await mount({ isUser: true, photo: "/p.png" });
    expect(screen.queryByText("Invite"), "a contact on the app was offered an invite").toBeNull();
    fireEvent.click(document.querySelector(".chat-conversation-item")!);
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    const chat = handleClickChat.mock.calls[0]?.[0];
    expect(chat?.id, "the new chat did not get a draft id for the contact").toBe("ch-9");
    expect(chat?.channel_members.map((m: any) => m.user_id), "the new chat did not hold both people").toEqual([9, ME]);
    expect(setMain, "the view did not switch to the chat").toHaveBeenCalledWith("chat");
    expect(document.querySelector("img")?.getAttribute("src"), "the contact photo was not shown").toContain("/p.png");
  });
});

describe("SearchResult — inviting someone", () => {
  it("shows initials and does nothing on a tap on the row", async () => {
    const { handleClickChat } = await mount({}, "ar");
    expect(document.querySelector(".text-avatar")?.textContent, "the initials were not shown").toBe("OP");
    fireEvent.click(document.querySelector(".chat-conversation-item")!);
    expect(handleClickChat, "a contact not on the app opened a chat").not.toHaveBeenCalled();
  });

  it("uses the phone's share sheet on a mobile browser", async () => {
    const share = vi.fn(async (..._a: any[]) => {});
    Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone)", configurable: true });
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    await mount();
    await act(async () => {
      fireEvent.click(screen.getByText("Invite"));
    });
    expect(share.mock.calls[0]?.[0]?.title, "the share sheet was not opened with the invite").toBe("Join Other Person on Trydos");
    share.mockRejectedValueOnce(new Error("cancelled"));
    await act(async () => {
      fireEvent.click(screen.getByText("Invite"));
    });
    expect(screen.queryByText("Choose how to send the invitation"), "a cancelled share opened the desktop window").toBeNull();
  });

  it("offers WhatsApp, Telegram and copy on a desktop browser", async () => {
    await mount();
    const open = () => act(() => fireEvent.click(screen.getByText("Invite")));
    open();
    fireEvent.click(screen.getByText("WhatsApp"));
    expect((window.open as any).mock.calls[0][0], "WhatsApp was not opened to the contact").toMatch(/^https:\/\/wa\.me\/\+10000000000\?text=/);
    open();
    fireEvent.click(screen.getByText("Telegram"));
    expect((window.open as any).mock.calls[1][0], "Telegram was not opened").toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
    open();
    fireEvent.click(screen.getByText("×"));
    expect(screen.queryByText("Choose how to send the invitation"), "the close button did not close the window").toBeNull();
  });

  it("copies the invite, and logs a copy that fails", async () => {
    const writeText = vi.fn(async (..._a: any[]) => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await mount();
    act(() => fireEvent.click(screen.getByText("Invite")));
    await act(async () => {
      fireEvent.click(screen.getByText("Copy Invite"));
    });
    expect(writeText.mock.calls[0]?.[0], "the invite text was not copied").toContain("Join us at");
    expect(window.alert, "the copy was not confirmed").toHaveBeenCalledWith("Link copied to clipboard!");
    writeText.mockRejectedValueOnce(new Error("denied"));
    act(() => fireEvent.click(screen.getByText("Invite")));
    await act(async () => {
      fireEvent.click(screen.getByText("Copy Invite"));
    });
    expect(h.logError.mock.calls[0]?.[0]?.scenario, "a failed copy was not logged").toBe("chat SearchResult: copy to clipboard failed");
  });

  it.fails("BUG-chat-8: the invite links to the real app, not a placeholder store id", async () => {
    const writeText = vi.fn(async (..._a: any[]) => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await mount();
    act(() => fireEvent.click(screen.getByText("Invite")));
    await act(async () => {
      fireEvent.click(screen.getByText("Copy Invite"));
    });
    expect(writeText.mock.calls[0]?.[0], "the invite still points at the Play Store placeholder id 'your.app.id'").not.toContain("your.app.id");
  });
});
