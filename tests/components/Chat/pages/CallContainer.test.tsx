// The full-screen call layer (components/Chat/pages/CallContainer.tsx): a
// spinner until the call is ready, then the video or the voice call screen.
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../../render";

vi.mock("components/Chat/components/ChatVideoCall", () => ({
  default: (p: any) => <div data-testid="video-call">{p.token}</div>,
}));
vi.mock("components/Chat/components/ChatVoiceCall", () => ({
  default: (p: any) => <div data-testid="voice-call">{p.token}</div>,
}));

import CallContainer from "components/Chat/pages/CallContainer";

const chat = { id: 7, channel_members: [{ user_id: 1 }, { user_id: 2 }] };

async function mount(store: Record<string, any>) {
  return renderWithProviders(<CallContainer />, { store: { userChat: { id: 1 }, ...store } });
}

describe("CallContainer", () => {
  it("waits with a spinner until the chat, the call and the token are there", async () => {
    await mount({ activeChat: chat, call: "vid-outgoing", AgoraToken: null });
    expect(screen.queryByTestId("video-call"), "a call screen opened without a token").toBeNull();
    expect(screen.queryByTestId("voice-call"), "a call screen opened without a token").toBeNull();
    await mount({ activeChat: null, call: null, AgoraToken: null });
    expect(screen.queryByTestId("video-call"), "a call screen opened with no chat").toBeNull();
  });

  it("opens the video call screen for a video call", async () => {
    await mount({ activeChat: chat, call: "vid-incoming", AgoraToken: "tok" });
    expect(screen.getByTestId("video-call").textContent, "the video call did not get its token").toBe("tok");
    expect(screen.queryByTestId("voice-call"), "a video call also opened the voice screen").toBeNull();
  });

  it("opens the voice call screen for a voice call", async () => {
    await mount({ activeChat: chat, call: "aud-outgoing", AgoraToken: "tok" });
    expect(screen.getByTestId("voice-call").textContent, "the voice call did not get its token").toBe("tok");
  });
});
