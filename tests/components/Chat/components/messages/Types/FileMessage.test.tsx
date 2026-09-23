// A file bubble (components/Chat/components/messages/Types/FileMessage.tsx):
// the download link, the upload spinner, and the options it hands to its menu.
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../../render";

const h = vi.hoisted(() => ({ menu: null as any, deleteMessage: null as any }));

vi.mock("components/Chat/components/OptionsMenu", () => ({
  default: (p: any) => {
    h.menu = p;
    return <div data-testid="menu" />;
  },
}));
vi.mock("components/Chat/components/ChatPhoto", () => ({ default: () => <div data-testid="avatar" /> }));
vi.mock("store/chat/chatUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  DeleteMessage: (...a: any[]) => h.deleteMessage(...a),
}));

import FileMessage from "components/Chat/components/messages/Types/FileMessage";

const ME = 1;
const activeChat = { id: 7, channel_members: [{ user_id: ME, user: { name: "Me" } }] };

async function mount(extra: Record<string, any> = {}, chat: any = activeChat) {
  const p = {
    setOpen: vi.fn(),
    setDelete: vi.fn(),
    openMenu: false,
    type: "lonely",
    is_forward: 0,
    isPrivate: null,
    message_status: [],
    created_at: "2030-01-15T08:05:00",
    mid: null,
    id: 5,
    DeleteModal: false,
    parent_message: null,
    GetMessage: vi.fn(),
    parent_message_id: null,
    message_files: [{ file_path: "https://example.com/f.pdf" }],
    channel_id: 7,
    channel_member: { name: "Me" },
    is_from_sender: true,
    sender_user_id: ME,
    ...extra,
  };
  const spies = { setForwardMessage: vi.fn(), setReplyMessage: vi.fn() };
  await renderWithProviders(<FileMessage {...(p as any)} />, {
    store: { userChat: { id: ME }, activeChat: chat, ...spies },
  });
  return { p, spies };
}

beforeEach(() => {
  h.deleteMessage = vi.fn();
});

describe("FileMessage", () => {
  it("links to the file for download and opens the menu on a tap", async () => {
    const { p } = await mount({ is_forward: 1 });
    const link = document.querySelector("a.file-msg") as HTMLAnchorElement;
    expect(link.getAttribute("href"), "the download link was wrong").toBe("https://example.com/f.pdf");
    expect(link.hasAttribute("download"), "the link did not ask for a download").toBe(true);
    expect(document.querySelector('img[src="/icons/chat/down.svg"]'), "a sent file showed no download arrow").not.toBeNull();
    expect(document.querySelector(".forwarded-message-icon"), "the forward mark was not shown").not.toBeNull();
    fireEvent.click(document.querySelector(".text-body")!);
    expect(p.setOpen, "a tap did not open the menu for this file").toHaveBeenCalledWith(5);
    fireEvent.mouseLeave(document.querySelector(".message-hold")!);
    expect(p.setOpen, "leaving did not close the menu").toHaveBeenLastCalledWith(false);
  });

  it("shows a spinner while the file is still uploading", async () => {
    await mount({ mid: "m1" });
    expect(document.querySelector('img[src="/icons/chat/down.svg"]'), "an uploading file showed the download arrow").toBeNull();
  });

  it("shows the receive time on someone else's file, nothing with no file, no avatar mid-run", async () => {
    await mount({ is_from_sender: false, type: "middle-chat", message_files: [] }, null);
    expect(document.querySelector(".other-date")?.textContent, "the time was not shown").toBe("08:05");
    expect(document.querySelector("a.file-msg"), "a message with no file showed a link").toBeNull();
    expect(screen.queryByTestId("avatar"), "a middle bubble showed an avatar").toBeNull();
  });

  it("the menu replies, forwards and deletes", async () => {
    const { p, spies } = await mount();
    h.menu.click();
    expect(spies.setReplyMessage.mock.calls[0][0].message_type, "the reply was not a file").toEqual({ name: "FileMessage" });
    h.menu.forward();
    expect(spies.setForwardMessage.mock.calls[0][0].id, "the forward was not this file").toBe(5);
    h.menu.deleteMessage(false);
    expect(h.deleteMessage, "the file was not deleted").toHaveBeenCalledWith(7, 5, false);
    h.menu.setDelete(true);
    expect(p.setDelete, "the delete box was not opened").toHaveBeenCalledWith(true);
    h.menu.copy();
  });
});
