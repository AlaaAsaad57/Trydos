// A photo bubble (components/Chat/components/messages/Types/ImageMessage.tsx):
// the photo, its viewer, and the options it hands to its menu.
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

import ImageMessage from "components/Chat/components/messages/Types/ImageMessage";

const ME = 1;
const activeChat = { id: 7, channel_members: [{ user_id: ME, user: { name: "Me", photo_path: "/real.png" } }] };

async function mount(extra: Record<string, any> = {}, chat: any = activeChat) {
  const p = {
    setOpen: vi.fn(),
    setDelete: vi.fn(),
    openMenu: true,
    type: "first-chat",
    is_forward: 0,
    message_content: [],
    isPrivate: null,
    message_status: [],
    created_at: "2030-01-15T08:05:00",
    mid: null,
    id: 5,
    DeleteModal: false,
    parent_message: null,
    GetMessage: vi.fn(),
    parent_message_id: null,
    setImg: vi.fn(),
    message_files: [{ file_path: "https://example.com/p.png" }],
    channel_id: 7,
    channel_member: { name: "Me" },
    is_from_sender: true,
    sender_user_id: ME,
    ...extra,
  };
  const spies = { setForwardMessage: vi.fn(), setReplyMessage: vi.fn() };
  await renderWithProviders(<ImageMessage {...(p as any)} />, {
    store: { userChat: { id: ME }, activeChat: chat, ...spies },
  });
  return { p, spies };
}

beforeEach(() => {
  h.deleteMessage = vi.fn();
});

describe("ImageMessage", () => {
  it("shows the photo, opens it in the viewer and opens the menu on a tap", async () => {
    const { p } = await mount({ is_forward: 1 });
    fireEvent.click(screen.getByAltText("user"));
    expect(p.setImg, "the photo did not open in the viewer").toHaveBeenCalledWith("https://example.com/p.png");
    expect(p.setOpen, "a tap did not open the menu for this photo").toHaveBeenCalledWith(5);
    expect(document.querySelector(".forwarded-message-icon"), "the forward mark was not shown").not.toBeNull();
    expect(document.querySelector(".absolute-avatar")!.className, "a member with a real photo got a text avatar").not.toContain("text-avatar");
    fireEvent.mouseLeave(document.querySelector(".message-hold")!);
    expect(p.setOpen, "leaving did not close the menu").toHaveBeenLastCalledWith(false);
  });

  it("shows the receive time on someone else's photo and no avatar mid-run", async () => {
    await mount({ is_from_sender: false, type: "middle-chat", openMenu: false }, null);
    expect(document.querySelector(".other-date")?.textContent, "the time was not shown").toBe("08:05");
    expect(screen.queryByTestId("avatar"), "a middle bubble showed an avatar").toBeNull();
  });

  it("the menu opens the photo, replies, forwards and deletes", async () => {
    const { p, spies } = await mount();
    h.menu.setImg();
    expect(p.setImg, "the menu's eye did not open the photo").toHaveBeenCalledWith("https://example.com/p.png");
    h.menu.click();
    expect(spies.setReplyMessage.mock.calls[0][0].message_type, "the reply was not a photo").toEqual({ name: "ImageMessage" });
    h.menu.forward();
    expect(spies.setForwardMessage.mock.calls[0][0].message_files, "the forward did not carry the photo").toEqual(p.message_files);
    h.menu.deleteMessage(true);
    expect(h.deleteMessage, "the photo was not deleted").toHaveBeenCalledWith(7, 5, true);
    h.menu.setDelete(true);
    expect(p.setDelete, "the delete box was not opened").toHaveBeenCalledWith(true);
    h.menu.copy();
  });
});
