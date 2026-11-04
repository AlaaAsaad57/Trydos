import { beforeEach, describe, expect, it, vi } from "vitest";

// The chat pages' guest check on the server: a guest goes to the login page
// with the chat page (and its chat id) as the way back; a shopper with a phone
// gets through. The cookie read, the locale and `redirect` are stand-ins.

const server = vi.hoisted(() => ({
  user: null as unknown,
  redirect: vi.fn((to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`);
  }),
}));
vi.mock("utils/cookies/server-cookie-manager", () => ({
  getCookieServer: vi.fn(async () => server.user),
}));
vi.mock("next/root-params", () => ({ lang: vi.fn(async () => "sy-en") }));
vi.mock("next/navigation", () => ({ redirect: server.redirect }));

import { sendGuestToLogin } from "app/(client)/[lang]/chat/chatGuestGate";

beforeEach(() => {
  server.redirect.mockClear();
  server.user = null;
});

describe("the chat pages' guest check", () => {
  it("sends a visitor with no profile to the login, with the chat page as the way back", async () => {
    await expect(sendGuestToLogin("chat"), "a visitor with no profile was not redirected").rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(server.redirect, "the login's way back is not the chat list").toHaveBeenCalledWith(
      "/sy-en/login?next=%2Fsy-en%2Fchat",
    );
  });

  it("sends a guest (phone \"0\") to the login, keeping the chat id in the way back", async () => {
    server.user = { phone: "0" };
    await expect(sendGuestToLogin("chat/conversation", "12"), "a guest was not redirected").rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(server.redirect, "the login's way back lost the conversation's chat id").toHaveBeenCalledWith(
      "/sy-en/login?next=%2Fsy-en%2Fchat%2Fconversation%3Fid%3D12",
    );
  });

  it("lets a shopper with a phone through (the client asks a chat-less one to confirm it)", async () => {
    server.user = { phone: "0999000111" };
    await sendGuestToLogin("chat/conversation", "12");
    expect(server.redirect, "a shopper with a phone was sent to the login").not.toHaveBeenCalled();
  });
});
