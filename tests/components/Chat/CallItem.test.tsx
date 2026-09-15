// The call log row: does it name the right call?
//
// One row in the "Calls" tab comes from /api/v1/channels/my_calls. The row has
// to say two things, and both come from the same record:
//
//   direction  — who started it. `sender_user_id` against the signed-in chat
//                user. Only a call somebody else started, and nobody answered,
//                is a missed call.
//   media      — voice or video. `message_type.name` is "VoiceCall" or
//                "VideoCall".
//
// `duration_in_seconds` is 0 for every call that never connected, whichever
// side started it — so duration alone can never tell direction.
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import React from "react";

import CallItem from "components/Chat/components/CallItem";

import { renderWithProviders } from "../../render";

/** The signed-in chat user in these tests. Matches the sender in the sample. */
const ME = 657;
/** The person on the other end. */
const THEM = 672;

/**
 * Render one row the way CallList does — the same prop shape, so the test
 * breaks if the row stops being handed what it needs.
 */
async function renderCallRow({
  sender,
  duration,
  messageType,
}: {
  sender: number;
  duration: number;
  messageType: "VoiceCall" | "VideoCall";
}) {
  return renderWithProviders(
    <CallItem
      photo="customers/profile/test.jpg"
      name="Alaa Test123"
      date="15/09"
      duration={duration}
      Delete={() => {}}
      type={{ type: messageType, sender, duration }}
    />,
    { store: { userChat: { id: ME } } },
  );
}

describe("CallItem — the call log row", () => {
  it("does not call an outgoing voice call a missed call", async () => {
    await renderCallRow({ sender: ME, duration: 0, messageType: "VoiceCall" });

    expect(
      screen.queryByText(/Missed/i),
      "a call this user started was labelled as missed; only a call from the other side that nobody answered is missed",
    ).not.toBeInTheDocument();
  });

  it("names an outgoing voice call by direction and media", async () => {
    await renderCallRow({ sender: ME, duration: 0, messageType: "VoiceCall" });

    expect(
      screen.getByText("Outgoing Voice Call"),
      "the row did not say the call was outgoing and was a voice call",
    ).toBeInTheDocument();
  });

  it("names an outgoing video call by direction and media", async () => {
    await renderCallRow({ sender: ME, duration: 0, messageType: "VideoCall" });

    expect(
      screen.getByText("Outgoing Video Call"),
      "the row did not say the call was outgoing and was a video call",
    ).toBeInTheDocument();
  });

  it("names an answered incoming voice call", async () => {
    await renderCallRow({ sender: THEM, duration: 42, messageType: "VoiceCall" });

    expect(
      screen.getByText("Incoming Voice Call"),
      "an answered call from the other side was not labelled as an incoming voice call",
    ).toBeInTheDocument();
  });

  it("names an answered incoming video call", async () => {
    await renderCallRow({ sender: THEM, duration: 42, messageType: "VideoCall" });

    expect(
      screen.getByText("Incoming Video Call"),
      "an answered call from the other side was not labelled as an incoming video call",
    ).toBeInTheDocument();
  });

  it("says which media a missed call used", async () => {
    await renderCallRow({ sender: THEM, duration: 0, messageType: "VideoCall" });

    expect(
      screen.getByText("Missed Video Call"),
      "a call from the other side that nobody answered did not say it was a video call",
    ).toBeInTheDocument();
  });

  it("shows a camera icon for a video call, not a handset", async () => {
    const { container } = await renderCallRow({
      sender: ME,
      duration: 0,
      messageType: "VideoCall",
    });
    const icon = container.querySelector(".call-type img");

    expect(
      icon?.getAttribute("src"),
      `the video row showed "${icon?.getAttribute("src")}"; a video call has to be told apart from a voice call at a glance, not only by its label`,
    ).toBe("/icons/chat/outgoingVideoCall.svg");
  });

  it("keeps the handset icon for a voice call", async () => {
    const { container } = await renderCallRow({
      sender: ME,
      duration: 0,
      messageType: "VoiceCall",
    });
    const icon = container.querySelector(".call-type img");

    expect(
      icon?.getAttribute("src"),
      `the voice row showed "${icon?.getAttribute("src")}" instead of the outgoing handset icon`,
    ).toBe("/icons/chat/outgoingCall.svg");
  });

  it("gives each direction its own video icon", async () => {
    const incoming = await renderCallRow({
      sender: THEM,
      duration: 42,
      messageType: "VideoCall",
    });
    expect(
      incoming.container
        .querySelector(".call-type img")
        ?.getAttribute("src"),
      "an answered incoming video call did not get the incoming video icon",
    ).toBe("/icons/chat/IncomingVideoCall.svg");

    const missed = await renderCallRow({
      sender: THEM,
      duration: 0,
      messageType: "VideoCall",
    });
    expect(
      missed.container.querySelector(".call-type img")?.getAttribute("src"),
      "a video call nobody answered did not get the missed video icon",
    ).toBe("/icons/chat/missedVideoCall.svg");
  });

  it("marks the row with the direction the stylesheet colours", async () => {
    const { container } = await renderCallRow({
      sender: ME,
      duration: 0,
      messageType: "VoiceCall",
    });
    const row = container.querySelector(".call-conversation-item");

    expect(
      row?.className,
      `the row class was "${row?.className}"; chatcomponent.css colours the row through .missed / .incoming / .outgoing, so an outgoing row must carry "outgoing"`,
    ).toContain("outgoing");
  });

  it("never writes an object into the row class", async () => {
    const { container } = await renderCallRow({
      sender: ME,
      duration: 0,
      messageType: "VoiceCall",
    });
    const row = container.querySelector(".call-conversation-item");

    expect(
      row?.className,
      "the row class was built from an object, so it reads [object Object] and matches no stylesheet rule",
    ).not.toContain("[object Object]");
  });
});
