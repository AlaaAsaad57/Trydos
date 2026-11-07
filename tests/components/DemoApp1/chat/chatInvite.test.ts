import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The invite to a phone-book contact who is not on Trydos. The words and the
// links are the old chat's (SearchResult.tsx).

import {
  inviteText,
  shareInvite,
  telegramInviteLink,
  whatsappInviteLink,
} from "components/DemoApp1/chat/chatInvite";

const STORE = "https://play.example/app";
const person = { id: "book-1", name: "Sam $1", phone: "0937288307", initials: "S", fullPhone: "963937288307" };

const setAgent = (agent: string) =>
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: agent });
const realAgent = navigator.userAgent;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_PLAY_STORE_URL", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  setAgent(realAgent);
  delete (navigator as { share?: unknown }).share;
});

describe("the invite's words", () => {
  it("names this site", () => {
    expect(inviteText(), "the invite does not carry the site's address").toContain(window.location.origin);
  });

  it("has no store line without NEXT_PUBLIC_PLAY_STORE_URL, not a dead link", () => {
    expect(inviteText(), "the invite shows a store line with no store link").not.toContain("Get the app");
  });

  it("has the store line with NEXT_PUBLIC_PLAY_STORE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_PLAY_STORE_URL", STORE);
    expect(inviteText(), "the invite does not carry the Play Store link").toContain(STORE);
  });
});

describe("the invite's links", () => {
  it("WhatsApp opens the contact's chat, by the full number, with the invite in it", () => {
    const link = whatsappInviteLink(person);
    expect(link.startsWith("https://wa.me/963937288307?text="), "the WhatsApp link does not go to the full number").toBe(true);
    expect(decodeURIComponent(link), "the WhatsApp link does not carry the invite").toContain(window.location.origin);
  });

  it("Telegram opens the contact's own chat when the number is a real one, and keeps a $ in the name", () => {
    const link = telegramInviteLink(person);
    expect(link.startsWith("https://t.me/+963937288307?text="), "the Telegram link does not go to the contact's chat").toBe(true);
    expect(decodeURIComponent(link), "the name was changed on its way into the invite").toContain("Sam $1");
  });

  it("Telegram falls back to its share page with no real number", () => {
    const link = telegramInviteLink({ ...person, fullPhone: "" });
    expect(link.startsWith("https://t.me/share/url?url="), "a contact with no real number did not get the share page").toBe(true);
  });
});

describe("sharing an invite", () => {
  it("uses the phone's own share on a phone", async () => {
    setAgent("Mozilla/5.0 (iPhone)");
    const share = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    expect(await shareInvite(person), "the phone's share did not count as done").toBe(true);
    expect(share, "the phone's share was not opened").toHaveBeenCalledOnce();
  });

  it("a shopper who cancels the phone's share is not asked again", async () => {
    setAgent("Mozilla/5.0 (iPhone)");
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: vi.fn(async () => Promise.reject(new Error("cancelled"))),
    });
    expect(await shareInvite(person), "a cancelled share opened the invite sheet too").toBe(true);
  });

  it("says no on a computer, so the screen shows its own choices", async () => {
    setAgent("Mozilla/5.0 (Windows NT 10.0)");
    Object.defineProperty(navigator, "share", { configurable: true, value: vi.fn() });
    expect(await shareInvite(person), "a computer used the phone's share").toBe(false);
  });
});
