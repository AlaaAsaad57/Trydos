// One chat message (components/Chat/components/ChatMessage.tsx): it picks the
// sent or received frame and the body for the message type.
//
// Every frame and body is a stand-in that records its props, so the test reads
// exactly what ChatMessage handed to each one.
import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

const h = vi.hoisted(() => ({ got: {} as Record<string, any> }));

function stub(name: string, withChildren = false) {
  return {
    default: (p: any) => {
      h.got[name] = p;
      return (
        <div data-testid={name}>
          {withChildren ? p.children : null}
        </div>
      );
    },
  };
}

vi.mock("components/Chat/components/messages/SentMessage", () => stub("Sent", true));
vi.mock("components/Chat/components/messages/ReceivedMessage", () => stub("Received", true));
vi.mock("components/Chat/components/messages/DeletedMessage", () => stub("Deleted"));
vi.mock("components/Chat/components/messages/Types/TextMessage", () => stub("TextMessage"));
vi.mock("components/Chat/components/messages/Types/ImageMessage", () => stub("ImageMessage"));
vi.mock("components/Chat/components/messages/Types/VideoMessage", () => stub("VideoMessage"));
vi.mock("components/Chat/components/messages/Types/AudioMessage", () => stub("VoiceMessage"));
vi.mock("components/Chat/components/messages/Types/FileMessage", () => stub("FileMessage"));
vi.mock("components/Chat/components/messages/Types/ProductMessage", () => stub("ShareProduct"));
vi.mock("components/Chat/components/messages/Types/CallMessage", () => stub("Call"));

import ChatMessage from "components/Chat/components/ChatMessage";

const ME = 1;
const THEM = 2;
const activeChat = {
  id: 7,
  channel_members: [
    { user_id: ME, user: { name: "Me" } },
    { user_id: THEM, user: { name: "Them" } },
  ],
};

async function mount(extra: Record<string, any> = {}, chat: any = activeChat) {
  const props = {
    isPrivate: null,
    setVid: vi.fn(),
    setImg: vi.fn(),
    GetMessage: vi.fn(),
    type: "lonely",
    message_content: { content: "hi" },
    message_files: [],
    message_type: { name: "TextMessage", event_name: "message", created_at: null },
    message_status: [],
    mid: null,
    id: 5,
    created_at: "2030-01-15T10:00:00",
    auth_message_status: { is_deleted: 0 },
    is_forward: 0,
    sender_user_id: ME,
    parent_message: { id: 3, sender_user_id: THEM, auth_message_status: { is_deleted: 1 } },
    parent_message_id: 3,
    duration_in_seconds: null,
    ...extra,
  };
  const r = await renderWithProviders(<ChatMessage {...(props as any)} />, {
    store: { userChat: { id: ME }, activeChat: chat },
  });
  return { ...r, props };
}

beforeEach(() => {
  h.got = {};
});

describe("ChatMessage", () => {
  it("renders nothing with no open chat", async () => {
    const { container } = await mount({}, null);
    expect(container.innerHTML, "a message rendered with no open chat").toBe("");
  });

  it("frames my message as sent, with the quoted message's author and state", async () => {
    const { props } = await mount();
    expect(screen.getByTestId("Sent"), "my message was not in the sent frame").toBeInTheDocument();
    expect(h.got.Sent.channel_member.user.name, "the quoted author was not found").toBe("Them");
    expect(h.got.Sent.isDeleted, "a deleted quote was not marked deleted").toBe(true);
    h.got.Sent.onClick();
    expect(props.GetMessage, "tapping the quote did not jump to it").toHaveBeenCalledWith(5, 3);
    expect(h.got.TextMessage.channel_member.name, "my own bubble did not get my member").toBe("Me");
  });

  it("frames someone else's message as received and gives their member", async () => {
    await mount({ sender_user_id: THEM, parent_message: null, id: null, mid: "m9" });
    expect(screen.getByTestId("Received"), "their message was not in the received frame").toBeInTheDocument();
    expect(h.got.Received.id, "a pending message did not fall back to its local id").toBe("m9");
    expect(h.got.TextMessage.channel_member.name, "their bubble did not get their member").toBe("Them");
  });

  it("shows the deleted body for a deleted message", async () => {
    await mount({ auth_message_status: { is_deleted: 1 } });
    expect(screen.getByTestId("Deleted"), "a deleted message did not show as deleted").toBeInTheDocument();
    expect(screen.queryByTestId("TextMessage"), "a deleted message still showed its text").toBeNull();
  });

  it.each([
    ["ImageMessage", "ImageMessage"],
    ["VideoMessage", "VideoMessage"],
    ["VoiceMessage", "VoiceMessage"],
    ["FileMessage", "FileMessage"],
    ["ShareProduct", "ShareProduct"],
    ["VideoCall", "Call"],
  ])("a %s gets its own body, for me and for them", async (typeName, body) => {
    await mount({ message_type: { name: typeName } });
    expect(screen.getByTestId(body), `a ${typeName} did not get its body`).toBeInTheDocument();
    expect(h.got[body].channel_member.name, `my ${typeName} did not get my member`).toBe("Me");
    h.got = {};
    await mount({ message_type: { name: typeName }, sender_user_id: THEM });
    expect(h.got[body].channel_member.name, `their ${typeName} did not get their member`).toBe("Them");
  });

  it("opens and closes the menu for this message", async () => {
    await mount();
    act(() => h.got.TextMessage.setOpen(5));
    expect(h.got.Sent.isMenuOpen, "the frame was not told the menu is open").toBe(true);
    expect(h.got.TextMessage.openMenu, "the body was not told the menu is open").toBe(true);
    act(() => h.got.Sent.closeMenu());
    expect(h.got.Sent.isMenuOpen, "closing the menu did not reach the frame").toBe(false);
    act(() => h.got.TextMessage.setDelete(true));
    expect(h.got.TextMessage.DeleteModal, "the delete box state did not reach the body").toBe(true);
  });
});

describe("ChatMessage — tags and my reminder", () => {
  const tags = [{ tag: "urgent", count: 1, user_ids: [ME] }];
  const reminder = { id: "r-1", remind_at: "2030-01-15T12:30:00", created_at: "2030-01-15T10:00:00" };

  it("hands the tags, my reminder and the edit mark to a text message", async () => {
    await mount({ tags, reminder, is_edited: 1 });
    expect(h.got.TextMessage?.tags, "the text message did not get its tags").toEqual(tags);
    expect(h.got.TextMessage?.reminder, "the text message did not get my reminder").toEqual(reminder);
    expect(h.got.TextMessage?.is_edited, "the text message did not get its edit mark").toBe(1);
  });

  it("hands the tags and my reminder to every other type that can carry them", async () => {
    for (const name of ["ImageMessage", "VideoMessage", "VoiceMessage", "FileMessage", "ShareProduct"]) {
      h.got = {};
      await mount({ tags, reminder, message_type: { name, event_name: "message", created_at: null } });
      expect(h.got[name]?.tags, `a ${name} did not get its tags`).toEqual(tags);
      expect(h.got[name]?.reminder, `a ${name} did not get my reminder`).toEqual(reminder);
    }
  });
});
