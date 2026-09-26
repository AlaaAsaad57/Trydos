// The one-line preview of a chat's last message
// (components/Chat/components/LastMessageBody.tsx).
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../../render";

import LastMessageBody from "components/Chat/components/LastMessageBody";

const ME = 1;
const THEM = 2;

async function mount(message: Record<string, any>, status: any = null) {
  const full = {
    sender_user_id: ME,
    mid: null,
    message_status: [{ user_id: THEM, is_watched: true }],
    ...message,
  };
  return renderWithProviders(<LastMessageBody message={full} status={status} />, { store: { userChat: { id: ME } } });
}

const tick = () => document.querySelector("img.status-icon")?.getAttribute("src") ?? null;

describe("LastMessageBody", () => {
  it("shows the text of my last message with its read tick", async () => {
    await mount({ message_type: { name: "TextMessage" }, message_content: { content: "hello" } });
    expect(screen.getByText("hello"), "the last text was not shown").toBeInTheDocument();
    expect(tick(), "my last message had no read tick").toBe("/icons/chat/read.svg");
    expect(document.querySelector(".last-message-body")!.className, "a text preview was laid out inline").not.toContain("inline-flex");
  });

  it("shows no tick on someone else's message, and a short box while typing", async () => {
    await mount({ sender_user_id: THEM, message_type: { name: "TextMessage" }, message_content: null }, "Typing...");
    expect(tick(), "their message showed my tick").toBeNull();
    expect((document.querySelector(".last-message-body") as HTMLElement).style.maxHeight, "the box was not short while typing").toBe("15px");
  });

  it("says a deleted message was deleted", async () => {
    await mount({ auth_message_status: { is_deleted: 1 }, message_type: { name: "TextMessage" } });
    expect(screen.getByText("This Message Was Deleted"), "a deleted last message was not labelled").toBeInTheDocument();
    await mount({ sender_user_id: THEM, auth_message_status: { is_deleted: 1 }, message_type: { name: "TextMessage" } });
  });

  it.each([
    ["ImageMessage", "Image"],
    ["ShareProduct", "Product"],
    ["VoiceMessage", "Audio"],
    ["VideoMessage", "Video"],
    ["FileMessage", "File"],
    ["VoiceCall", "Voice Call"],
    ["VideoCall", "Video Call"],
  ])("names a %s", async (type, label) => {
    await mount({ message_type: { name: type } });
    expect(document.querySelector(".last-message-body")?.textContent, `a ${type} was not named`).toContain(label);
    await mount({ sender_user_id: THEM, message_type: { name: type } });
  });

  it("shows nothing for a type it does not know", async () => {
    await mount({ message_type: { name: "Sticker" } });
    expect(document.querySelector(".last-message-body")?.textContent, "an unknown type showed text").toBe("");
  });
});
