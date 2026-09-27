// The details drawer of an open chat (components/Chat/components/ChatInfo.tsx):
// the chat's name and picture on top.
//
// The mobile app names a chat after `channel_name` and shows the other
// person's own picture. The drawer must show the same name and picture as the
// chat list and the header.
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
