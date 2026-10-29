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
    expect(share.mock.calls[0]?.[0]?.title, "the share sheet was not opened with the invite").toBe("Join Other Person On Trydos");
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
    const share = (window.open as any).mock.calls[1][0];
    expect(share, "Telegram's share page was not opened for a contact with no real number").toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
    expect(new URL(share).searchParams.get("text"), "Telegram's share page did not get the invite text").toContain("Join Us At");
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
    expect(writeText.mock.calls[0]?.[0], "the invite text was not copied").toContain("Join Us At");
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

    // Telegram fills the chat's text box from the link's `text` parameter
    // (core.telegram.org/api/links, "Phone number links"). Without it the
    // chat opened with an empty text box.
    it("opens the contact's own chat with the invite already in the text box", async () => {
      await mount({ item: { ...ITEM, mobile_phone: "+963937288307" } });
      act(() => fireEvent.click(screen.getByText("Invite")));
      expect(screen.queryByText(/pick a telegram chat instead/i), "the removed 'Pick a Telegram chat instead' link is shown again").toBeNull();
      fireEvent.click(screen.getByText("×"));
      await tapTelegram();
      const url = new URL((window.open as any).mock.calls[0]?.[0] ?? "about:blank");
      expect(`${url.origin}${url.pathname}`, "Telegram was not opened at the contact's chat").toBe("https://t.me/+963937288307");
      expect(url.searchParams.get("text"), "the Telegram chat opened with an empty text box: the link carried no invite").toContain("Join Us At");
      expect(writeText, "the invite was copied, but the link fills it in itself").not.toHaveBeenCalled();
      expect(screen.queryByText("Choose how to send the invitation"), "the invite window stayed open").toBeNull();
    });

    it("reads a local phone-book number in the region of the shopper's own phone", async () => {
      await mount({ item: { ...ITEM, mobile_phone: "0937 288 307" } }, "en", { userChat: { id: ME, mobile_phone: "963944123456" } });
      await tapTelegram();
      const url = new URL((window.open as any).mock.calls[0]?.[0] ?? "about:blank");
      expect(`${url.origin}${url.pathname}`, "a local Syrian number was not turned into the full +963 number").toBe("https://t.me/+963937288307");
    });
  });

  // The invite goes to a friend who reads the shopper's language. Every path
  // sent the same English sentence, whatever the app language was.
  describe("the invite is in the app language", () => {
    const STORE = "https://play.google.com/store/apps/details?id=com.trydos.www";
    afterEach(() => vi.unstubAllEnvs());

    it("copies, WhatsApps and Telegrams the invite in Arabic", async () => {
      vi.stubEnv("NEXT_PUBLIC_PLAY_STORE_URL", STORE);
      const writeText = vi.fn(async (..._a: any[]) => {});
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      await mount({ item: { ...ITEM, mobile_phone: "+963937288307" } }, "ar");
      const open = () => act(() => fireEvent.click(screen.getByText("دعوة")));
      const invite = `مرحباً! انضم إلينا على ${window.location.origin} \n حمّل التطبيق: ${STORE}`;
      open();
      await act(async () => {
        fireEvent.click(screen.getByText("نسخ الدعوة"));
      });
      expect(writeText.mock.calls[0]?.[0], "the copied invite is not in Arabic").toBe(invite);
      open();
      fireEvent.click(screen.getByText("واتساب"));
      expect(new URL((window.open as any).mock.calls[0][0]).searchParams.get("text"), "the WhatsApp invite is not in Arabic").toBe(invite);
      open();
      fireEvent.click(screen.getByText("تيليجرام"));
      expect(new URL((window.open as any).mock.calls[1][0]).searchParams.get("text"), "the Telegram invite is not in Arabic").toBe(
        `مرحباً Other Person! انضم إلينا على ${window.location.origin} \n حمّل التطبيق: ${STORE}`,
      );
    });

    it("opens the phone's share sheet with an Arabic invite", async () => {
      vi.stubEnv("NEXT_PUBLIC_PLAY_STORE_URL", STORE);
      const share = vi.fn(async (..._a: any[]) => {});
      Object.defineProperty(navigator, "userAgent", { value: "Mozilla/5.0 (iPhone)", configurable: true });
      Object.defineProperty(navigator, "share", { value: share, configurable: true });
      await mount({}, "ar");
      await act(async () => {
        fireEvent.click(screen.getByText("دعوة"));
      });
      expect(share.mock.calls[0]?.[0]?.title, "the share sheet title is not in Arabic").toBe("انضم إلى Other Person على تريدوس");
      expect(share.mock.calls[0]?.[0]?.text, "the share sheet invite is not in Arabic").toBe(
        `مرحباً! انضم إلينا على ${window.location.origin} \n حمّل التطبيق: ${STORE}`,
      );
    });
  });

  // The Play Store link comes from NEXT_PUBLIC_PLAY_STORE_URL. It was the
  // placeholder `id=your.app.id`, a page for an app that does not exist.
  describe("BUG-chat-8: the invite links to the real app", () => {
    const STORE = "https://play.google.com/store/apps/details?id=com.trydos.www";
    afterEach(() => vi.unstubAllEnvs());

    it("puts the Play Store link from the env in every invite", async () => {
      vi.stubEnv("NEXT_PUBLIC_PLAY_STORE_URL", STORE);
      const writeText = vi.fn(async (..._a: any[]) => {});
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      await mount({ item: { ...ITEM, mobile_phone: "+963937288307" } });
      const open = () => act(() => fireEvent.click(screen.getByText("Invite")));
      open();
      await act(async () => {
        fireEvent.click(screen.getByText("Copy Invite"));
      });
      expect(writeText.mock.calls[0]?.[0], "the copied invite does not link to the real Play Store page").toContain(`Get The App: ${STORE}`);
      open();
      fireEvent.click(screen.getByText("WhatsApp"));
      expect(new URL((window.open as any).mock.calls[0][0]).searchParams.get("text"), "the WhatsApp invite does not link to the real Play Store page").toContain(`Get The App: ${STORE}`);
      open();
      fireEvent.click(screen.getByText("Telegram"));
      expect(new URL((window.open as any).mock.calls[1][0]).searchParams.get("text"), "the Telegram invite does not link to the real Play Store page").toContain(`Get The App: ${STORE}`);
    });

    it("leaves out the store line when the env has no Play Store link", async () => {
      vi.stubEnv("NEXT_PUBLIC_PLAY_STORE_URL", "");
      const writeText = vi.fn(async (..._a: any[]) => {});
      Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
      await mount();
      act(() => fireEvent.click(screen.getByText("Invite")));
      await act(async () => {
        fireEvent.click(screen.getByText("Copy Invite"));
      });
      expect(writeText.mock.calls[0]?.[0], "the invite text was not copied").toContain("Join Us At");
      expect(writeText.mock.calls[0]?.[0], "the invite carries a store line with no real link behind it").not.toContain("Get The App");
    });
  });
});
