// One contact in the chat search (components/Chat/components/SearchResult.tsx):
// a contact on the app opens a new chat; anyone else gets an "Invite" button.
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ logError: null as any, notify: null as any }));

vi.mock("utils/functions", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  LogError: (...a: any[]) => h.logError(...a),
}));

vi.mock("store/notifications/reducer", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  showSuccessNotification: (...a: any[]) => h.notify(...a),
}));

import SearchResult from "components/Chat/components/SearchResult";
import { getChatName, getChatPhoto } from "components/Chat/chatsFunctions";

const ME = 1;
const ITEM = { name: "Other Person", mobile_phone: "+10000000000", photo_path: "/p.png", contact_user_id: 9 };

async function mount(extra: Record<string, any> = {}, language: any = "en", store: Record<string, any> = {}) {
  const handleClickChat = vi.fn();
  const setMain = vi.fn();
  await renderWithProviders(
    <SearchResult key="k" photo={null} SenderName="Other Person" isUser={false} handleClickChat={handleClickChat} item={ITEM} {...extra} />,
    { language, store: { setMain, userChat: { id: ME }, ...store } },
  );
  return { handleClickChat, setMain };
}

const originalUA = navigator.userAgent;

beforeEach(() => {
  h.logError = vi.fn();
  h.notify = vi.fn();
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

  // A saved contact keeps the account's name and photo in `contact_user`, and
  // the name I saved in `name`. The row shows the account's name and photo
  // (ContactLists.jsx, ChatSearchResults.tsx). The chat it opened showed the
  // saved name and no photo, because it read the contact record itself.
  it("opens a chat with the same name and photo as the row", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const contact = {
      id: 55,
      contact_user_id: "9",
      contact_user: { id: 9, name: "Account Name", photo_path: "/account.png" },
      name: "Saved Name",
      mobile_phone: "0999111222",
    };
    const { handleClickChat } = await mount({
      isUser: true,
      item: contact,
      SenderName: contact.contact_user.name,
      photo: contact.contact_user.photo_path,
    });
    fireEvent.click(document.querySelector(".chat-conversation-item")!);
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    const chat = handleClickChat.mock.calls[0]?.[0];
    expect(getChatName(chat), "the opened chat did not show the row's name").toBe("Account Name");
    expect(getChatPhoto(chat), "the opened chat did not show the row's photo").toBe("/account.png");
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
    // "+10000000000" is not a real number, so Telegram's share page is used.
    expect((window.open as any).mock.calls[1][0], "Telegram's share page was not opened for a contact with no real number").toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
    open();
    expect(screen.queryByText(/pick a telegram chat instead/i),"the share fallback was offered when the Telegram button is already the share page").toBeNull();
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
    expect(window.alert, "the copy was not confirmed").toHaveBeenCalledWith("Link Copied To Clipboard!");
    writeText.mockRejectedValueOnce(new Error("denied"));
    act(() => fireEvent.click(screen.getByText("Invite")));
    await act(async () => {
      fireEvent.click(screen.getByText("Copy Invite"));
    });
    expect(h.logError.mock.calls[0]?.[0]?.scenario, "a failed copy was not logged").toBe("chat SearchResult: copy to clipboard failed");
  });

  describe("Telegram, for a contact with a real number", () => {
    let writeText: ReturnType<typeof vi.fn>;
    beforeEach(() => {
      writeText = vi.fn(async (..._a: any[]) => {});
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    });

    const tapTelegram = async () => {
      act(() => fireEvent.click(screen.getByText("Invite")));
      await act(async () => {
        fireEvent.click(screen.getByText("Telegram"));
      });
    };

    it("opens the contact's own chat and copies the invite for pasting", async () => {
      await mount({ item: { ...ITEM, mobile_phone: "+963937288307" } });
      await tapTelegram();
      expect((window.open as any).mock.calls[0]?.[0], "Telegram was not opened at the contact's chat").toBe("https://t.me/+963937288307");
      expect(writeText.mock.calls[0]?.[0], "the invite was not copied, so the Telegram chat opens empty").toContain("Join us at");
      expect(h.notify.mock.calls[0]?.[0], "the shopper was not told to paste the invite").toMatch(/invite copied\. paste it in telegram\./i);
      expect(screen.queryByText("Choose how to send the invitation"), "the invite window stayed open").toBeNull();
    });

    it("reads a local phone-book number in the region of the shopper's own phone", async () => {
      await mount({ item: { ...ITEM, mobile_phone: "0937 288 307" } }, "en", { userChat: { id: ME, mobile_phone: "963944123456" } });
      await tapTelegram();
      expect((window.open as any).mock.calls[0]?.[0], "a local Syrian number was not turned into the full +963 number").toBe("https://t.me/+963937288307");
    });

    it("still offers Telegram's share page, for a contact the number link cannot reach", async () => {
      await mount({ item: { ...ITEM, mobile_phone: "+963937288307" } });
      act(() => fireEvent.click(screen.getByText("Invite")));
      fireEvent.click(screen.getByText(/pick a telegram chat instead/i));
      const url = (window.open as any).mock.calls[0]?.[0] ?? "";
      expect(url, "the fallback did not open Telegram's share page").toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
      expect(new URL(url).searchParams.get("text"), "the share page did not get the invite text").toContain("Join us at");
      expect(writeText, "the share page copied the invite, but it fills the text in itself").not.toHaveBeenCalled();
    });

    it("logs a copy that fails, and says nothing about pasting", async () => {
      writeText.mockRejectedValueOnce(new Error("denied"));
      await mount({ item: { ...ITEM, mobile_phone: "+963937288307" } });
      await tapTelegram();
      expect((window.open as any).mock.calls[0]?.[0], "a failed copy stopped Telegram from opening").toBe("https://t.me/+963937288307");
      expect(h.logError.mock.calls[0]?.[0]?.scenario, "a failed copy was not logged").toBe("chat SearchResult: copy Telegram invite failed");
      expect(h.notify, "the shopper was told to paste an invite that was never copied").not.toHaveBeenCalled();
    });
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
