// The details drawer of an open chat (components/Chat/components/ChatInfo.tsx):
// the chat's name and picture on top.
//
// The mobile app names a chat after `channel_name` and shows the other
// person's own picture. The drawer must show the same name and picture as the
// chat list and the header.
import { readFileSync } from "node:fs";
import path from "node:path";

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

vi.mock("components/Chat/components/MediaContainer", () => ({ default: () => null }));
vi.mock("components/Chat/components/TaggedMessages", () => ({ default: () => null }));
vi.mock("components/Chat/components/ChatPhoto", () => ({
  default: (p: any) => <div data-testid="photo" data-photo={p.user?.photo_path} />,
}));
vi.mock("store/chat/actions", () => ({ deleteChat: vi.fn() }));
vi.mock("utils/fetchData", () => ({ fetchData: vi.fn() }));

import ChatInfo from "components/Chat/components/ChatInfo";

const ME = 1;

function chat(extra: Record<string, any> = {}) {
  return {
    id: 7,
    messages: [],
    channel_members: [
      { user_id: ME, user: { name: "Me", photo_path: "/me.png" } },
      { user_id: 2, user: { id: 2, name: "Other Person", photo_path: "/p.png", mobile_phone: "p-0" } },
    ],
    ...extra,
  };
}

async function mount(activeChat: any) {
  await renderWithProviders(
    <ChatInfo
      activeChat={activeChat}
      cancel={vi.fn()}
      callLoading={null}
      makeAudioCall={vi.fn()}
      makeVideoCall={vi.fn()}
      enableSearch={vi.fn()}
    />,
    { store: { userChat: { id: ME }, deleteChat: vi.fn(), updateChannelBlockStatus: vi.fn() } },
  );
}

describe("ChatInfo — the chat's name and picture", () => {
  it("names the chat after channel_name, with the other person's own picture", async () => {
    await mount(chat({ channel_name: "Shop Name", photo_path: "/channel.png" }));
    expect(document.querySelector(".chat-info-user-name")?.textContent, "the drawer did not use the chat's channel_name").toBe(
      "Shop Name",
    );
    expect(screen.getByTestId("photo").dataset.photo, "the drawer did not show the other person's own picture").toBe("/p.png");
  });

  it("falls back to the other person's name when channel_name is empty", async () => {
    await mount(chat({ channel_name: "" }));
    expect(
      document.querySelector(".chat-info-user-name")?.textContent,
      "a chat with no channel_name did not fall back to the other person's name",
    ).toBe("Other Person");
  });

  it("takes the initials from channel_name when the other person has no picture", async () => {
    const noPicture = chat({ channel_name: "Shop Name" });
    noPicture.channel_members[1].user.photo_path = null as any;
    await mount(noPicture);
    expect(
      document.querySelector(".chat-info-user-avatar .text-avatar")?.textContent,
      "the initials did not come from the chat's channel_name",
    ).toBe("SN");
  });
});

// How the drawer is laid out lives in public/styles/chatcomponent.css. jsdom
// does not do layout, so these cases read the rules themselves.
describe("ChatInfo — the layout on a phone", () => {
  // Comments removed, so a comment above a rule is not read as its selector.
  const css = readFileSync(path.resolve(process.cwd(), "public/styles/chatcomponent.css"), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
  /** The declarations of the rule whose selector is exactly `selector`. */
  const rule = (selector: string) =>
    css
      .split("}")
      .map((chunk) => chunk.split("{"))
      .find(([sel]) => sel.trim() === selector)?.[1] ?? "";
  /** One declaration's value in a rule, or undefined. */
  const value = (block: string, prop: string) =>
    block
      .split(";")
      .map((d) => d.split(":"))
      .find(([name]) => name.trim() === prop)
      ?.slice(1)
      .join(":")
      .trim();

  // The drawer is a flex column. Its parts may shrink by default, so on a
  // short phone (568 px tall) the column squashed them to fit: the image strip
  // fell from 200 px to 6 px and nothing overflowed, so there was nothing to
  // scroll.
  it("keeps every part at its own height, so a short screen scrolls", () => {
    expect(
      value(rule(".chat-user-info-container > *"), "flex-shrink"),
      "the drawer's parts can shrink, so a short phone squashes them instead of scrolling",
    ).toBe("0");
  });

  // The icons are <img>, so the old `svg { margin-right }` rule never applied
  // and each number touched its icon.
  it("puts space between each media icon and its count", () => {
    const gap = value(rule(".chat-user-files-info-content-item"), "gap");
    expect(gap, "the media counts have no gap, so each number touches its icon").toBeDefined();
    expect(parseFloat(gap!), `the media counts' gap is "${gap}", so each number touches its icon`).toBeGreaterThan(0);
  });

  // On a phone the chat screen keeps its bottom 50 px free, because the
  // browser's bottom bar covers that strip (public/styles/ChatWindow.css,
  // the 780 px block). The drawer is absolute and covers the whole screen,
  // that strip too. With no padding of its own, a full scroll left the last
  // row (Delete Chat / Block) inside the strip, under the browser bar.
  it("on a phone, scrolls the last row clear of the strip the browser bar covers", () => {
    const phoneCss = readFileSync(path.resolve(process.cwd(), "public/styles/ChatWindow.css"), "utf8").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );
    const start = phoneCss.indexOf("@media screen and (max-width: 780px)");
    expect(start, "ChatWindow.css has no 780 px phone block").toBeGreaterThan(-1);
    let depth = 0;
    let end = phoneCss.indexOf("{", start);
    do {
      if (phoneCss[end] === "{") depth++;
      if (phoneCss[end] === "}") depth--;
      end++;
    } while (depth > 0);
    const phone = phoneCss.slice(phoneCss.indexOf("{", start) + 1, end - 1);
    const phoneRule = (selector: string) =>
      phone
        .split("}")
        .map((chunk) => chunk.split("{"))
        .find(([sel]) => sel.trim() === selector)?.[1] ?? "";

    const strip = parseFloat(value(phoneRule(".chat-screen"), "padding-bottom") ?? "");
    expect(strip, "the phone block no longer gives .chat-screen a bottom padding to compare with").toBeGreaterThan(0);
    const room = value(phoneRule(".chat-user-info-container"), "padding-bottom");
    expect(
      parseFloat(room ?? "0"),
      `the drawer's bottom padding on a phone is "${room ?? "none"}", not more than the ${strip}px the browser bar covers, so the last row stays under the bar`,
    ).toBeGreaterThan(strip);
  });
});
