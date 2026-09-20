// The incoming-call bar must not ring for a muted chat.
//
// The bar is the only thing in the app that plays a sound: it renders
// `<audio loop autoPlay src="/default.mp3">`, which starts ringing the moment
// the element is on the page. There is no play/pause switch to check — the
// element being there IS the ring. So the test asks whether the element exists.
//
// Mute is per member. The bar already holds the whole chat in
// `callerChannel`, so it can read the signed-in user's own `mute` row without
// any extra data from the push. See store/chat/reducer.ts -> setIncomingCall.
//
// The bar itself still has to appear. A muted chat is silent, not blocked: the
// caller's name must still be on screen so the user can answer. Each test
// checks that too, so "no ring" can never be satisfied by rendering nothing.
import { describe, expect, it } from "vitest";
import React from "react";

import CallComponent from "components/Chat/components/CallComponent";

import { renderWithProviders, screen } from "../../render";

/** The signed-in chat user. */
const ME = 657;
/** The person calling. */
const THEM = 672;
/** The chat the call comes through. */
const CHANNEL_ID = "652";

/** The chat the call belongs to, with the signed-in user's own mute setting. */
const buildCallerChannel = (mute: 0 | 1) => ({
  id: CHANNEL_ID,
  channel_name: "Alaa Test123",
  messages: [],
  channel_members: [
    { id: 1, user_id: ME, mute, pin: 0, archived: 0, user: { id: ME } },
    { id: 2, user_id: THEM, mute: 0, pin: 0, archived: 0, user: { id: THEM } },
  ],
});

/** Put the bar on the page for an incoming voice call. */
async function renderIncomingCall(mute: 0 | 1) {
  return renderWithProviders(<CallComponent reply={() => {}} />, {
    store: {
      userChat: { id: ME },
      isCallIncoming: true,
      incomeCallType: "audio",
      MessageActiveCall: 101,
      incomeCallData: { channelId: CHANNEL_ID, message_id: 101 },
      caller: { channel_name: "Alaa Test123", photo_path: null },
      callerChannel: buildCallerChannel(mute),
    },
  });
}

describe("the incoming call bar and a muted chat", () => {
  it("plays no ring when the chat is muted", async () => {
    const { container } = await renderIncomingCall(1);

    expect(
      screen.getByText("Alaa Test123"),
      "the call bar did not name the caller, so this test cannot tell a silent call from no call at all",
    ).toBeInTheDocument();
    expect(
      container.querySelector("audio"),
      `the chat is muted for user ${ME} yet the ringing audio element is on the page, so /default.mp3 plays on loop`,
    ).toBeNull();
  });

  it("still plays the ring when the chat is not muted", async () => {
    const { container } = await renderIncomingCall(0);

    expect(
      screen.getByText("Alaa Test123"),
      "the call bar did not name the caller, so the missing ring below says nothing about mute",
    ).toBeInTheDocument();
    expect(
      container.querySelector("audio"),
      "an unmuted chat has no ringing audio element, so the mute check is silencing every call",
    ).not.toBeNull();
  });
});
