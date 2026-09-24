// The quoted message shown above a reply
// (components/Chat/components/messages/RepliedMessage/index.tsx and the six
// Replied*Message bodies it picks from).
//
// ChatPhoto is a stand-in that records the `user` it was given, so the test can
// check each body gets the quoted author's user record.
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../../../render";

const h = vi.hoisted(() => ({ photoUser: undefined as any }));

vi.mock("components/Chat/components/ChatPhoto", () => ({
  default: (p: any) => {
    h.photoUser = p.user;
    return <div data-testid="photo" />;
  },
}));

import RepliedMessageWrapper from "components/Chat/components/messages/RepliedMessage";

const ME = 1;
const THEM = 2;
const MEMBER = { user_id: THEM, user: { name: "Them", photo_path: "/them.png" } };
const activeChat = { id: 7, channel_members: [{ user_id: ME, user: { name: "Me" } }] };

async function mount(
  type: string,
  { sender = ME, parentSender = THEM, isDeleted = false, chat = activeChat as any } = {},
) {
  const onClick = vi.fn();
  await renderWithProviders(
    <RepliedMessageWrapper
      parent_message={{ sender_user_id: parentSender, message_type: { name: type }, message_content: { content: "quoted text" } }}
      sender_user_id={sender}
      isDeleted={isDeleted}
      channel_member={MEMBER}
      onClick={onClick}
    />,
    { store: { userChat: { id: ME }, activeChat: chat } },
  );
  const container = document.querySelector(".replied-message-container") as HTMLElement;
  return { onClick, container };
}

beforeEach(() => {
  h.photoUser = undefined;
});

describe("RepliedMessage — which side the quote sits on", () => {
  it.each([
    [ME, ME, "me-to-me"],
    [THEM, THEM, "him-to-him"],
    [THEM, 3, "him-to-him"],
    [ME, THEM, "me-to-him"],
    [THEM, ME, "him-to-me"],
  ])("sender %s quoting %s is %s", async (sender, parentSender, cls) => {
    const { container } = await mount("TextMessage", { sender, parentSender });
    expect(container.className, `a reply from ${sender} to ${parentSender} was not laid out as ${cls}`).toContain(cls);
  });
});

describe("RepliedMessage — the quoted body", () => {
  it("shows the quoted text and jumps to it on a tap", async () => {
    const { onClick } = await mount("TextMessage");
    expect(screen.getByText("quoted text"), "the quoted text was not shown").toBeInTheDocument();
    fireEvent.click(document.querySelector(".message-hold")!);
    expect(onClick, "a tap on the quote did not jump to it").toHaveBeenCalled();
    expect(h.photoUser, "the quote avatar did not get the author").toEqual(MEMBER.user);
  });

  it.each([
    ["ImageMessage", "Image"],
    ["VideoMessage", "Video"],
    ["VoiceMessage", "Audio"],
    ["ShareProduct", "Product"],
    ["FileMessage", "File"],
  ])("names a quoted %s and jumps to it", async (type, label) => {
    const { onClick } = await mount(type);
    expect(document.querySelector(".message-hold")?.textContent, `a quoted ${type} was not named`).toContain(label);
    fireEvent.click(document.querySelector(".message-hold")!);
    expect(onClick, `a tap on a quoted ${type} did not jump to it`).toHaveBeenCalled();
  });

  it.each(["TextMessage", "ImageMessage", "VideoMessage", "VoiceMessage", "ShareProduct", "FileMessage"])(
    "a deleted quoted %s says so and does not jump",
    async (type) => {
      const { onClick } = await mount(type, { isDeleted: true, chat: null });
      expect(screen.getByText("this message was deleted"), `a deleted quoted ${type} was not labelled`).toBeInTheDocument();
      fireEvent.click(document.querySelector(".message-hold")!);
      expect(onClick, `a tap on a deleted quoted ${type} still jumped`).not.toHaveBeenCalled();
    },
  );

  it("shows nothing for a type it does not know", async () => {
    await mount("Sticker");
    expect(document.querySelector(".message-hold"), "an unknown quoted type showed a body").toBeNull();
  });

  it("BUG-chat-12: a quoted file shows its author's avatar", async () => {
    await mount("FileMessage");
    expect(h.photoUser, "the quoted file's avatar was given the member record instead of the user").toEqual(MEMBER.user);
  });

  it.each(["ImageMessage", "VoiceMessage"])("BUG-chat-13: a quoted %s keeps its bubble classes", async (type) => {
    await mount(type);
    const body = document.querySelector(".message-hold > div") as HTMLElement;
    expect(
      body.classList.contains("text-body") && body.classList.contains("first-chat"),
      `the quoted ${type} bubble's classes ran together: "${body.className}"`,
    ).toBe(true);
  });
});
