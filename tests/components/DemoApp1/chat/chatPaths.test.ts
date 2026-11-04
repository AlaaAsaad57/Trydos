import { describe, expect, it } from "vitest";
import { chatHref, chatIdFrom, isChatScreen, isOneChatScreen } from "components/DemoApp1/chat/chatPaths";

// The chat's URLs: the list has none, one chat's screens carry `?id=` so a
// reload, a push link and the order page open the right chat.

describe("chat URLs", () => {
  it("the list is /[lang]/chat, with no id even when one is given", () => {
    expect(chatHref("sy-en"), "the chat list URL is wrong").toBe("/sy-en/chat");
    expect(chatHref("sy-en", "chat", "12"), "the chat list URL took a chat id").toBe("/sy-en/chat");
  });

  it("one chat's screens carry its id, written safely", () => {
    expect(chatHref("sy-ar", "chat/conversation", "12"), "the conversation URL lost the chat id").toBe(
      "/sy-ar/chat/conversation?id=12",
    );
    expect(chatHref("sy-en", "chat/contact", "ch-9"), "the contact URL lost a new chat's id").toBe(
      "/sy-en/chat/contact?id=ch-9",
    );
    expect(chatHref("sy-en", "chat/call", "a&b"), "a chat id was not escaped in the URL").toBe(
      "/sy-en/chat/call?id=a%26b",
    );
  });

  it("reads the chat id from a query, and none from an empty one", () => {
    expect(chatIdFrom("?id=12&x=1"), "the chat id was not read from the query").toBe("12");
    expect(chatIdFrom(""), "an empty query gave a chat id").toBeNull();
    expect(chatIdFrom("?id="), "an empty id was taken as a chat").toBeNull();
  });

  it("knows the chat screens, and which of them show one chat", () => {
    expect(isChatScreen("chat/call"), "the call screen is not a chat screen").toBe(true);
    expect(isChatScreen("settings"), "settings was taken for a chat screen").toBe(false);
    expect(isOneChatScreen("chat"), "the list was taken for one chat's screen").toBe(false);
    expect(isOneChatScreen("chat/conversation"), "the conversation is not one chat's screen").toBe(true);
  });
});
