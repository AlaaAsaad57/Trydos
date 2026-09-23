// The call bubble inside a conversation.
//
// Same record as the call log row, shown in the thread instead of the Calls
// tab. It has to answer the same two questions: who started the call, and was
// it voice or video. `duration_in_seconds` is 0 for every call that never
// connected, so only `sender_user_id` says which side started it.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import React from "react";

// The delete call and the menu props, for the menu cases at the end of this file.
const callBubble = vi.hoisted(() => ({ deleteMessage: vi.fn(), menu: null as any }));
vi.mock("store/chat/chatUtils", async (importOriginal) => ({
  ...(await importOriginal<any>()),
  DeleteMessage: (...a: any[]) => callBubble.deleteMessage(...a),
}));

import CallMessage from "components/Chat/components/messages/Types/CallMessage";

import { renderWithProviders } from "../../render";

/** The signed-in chat user in these tests. */
const ME = 657;
/** The person on the other end. */
const THEM = 672;

async function renderBubble({
  sender,
  duration,
  messageType,
}: {
  sender: number;
  duration: number;
  messageType: "VoiceCall" | "VideoCall";
}) {
  return renderWithProviders(
    <CallMessage
      setOpen={() => {}}
      setDelete={() => {}}
      openMenu={false}
      type="call"
      isPrivate={false}
      created_at="2026-09-15T10:20:40.000Z"
      id={339309}
      DeleteModal={false}
      channel_id={539}
      channel_member={{ id: THEM, name: "Alaa Test123", photo_path: null }}
      message_type={{ name: messageType }}
      duration_in_seconds={duration}
      sender_user_id={sender}
    />,
    {
      store: {
        userChat: { id: ME },
        activeChat: {
          id: 539,
          channel_members: [
            { user_id: ME, user: { name: "Me", photo_path: null } },
            { user_id: THEM, user: { name: "Alaa Test123", photo_path: null } },
          ],
        },
      },
    },
  );
}

describe("CallMessage — the call bubble in a conversation", () => {
  it("does not call an outgoing voice call a missed call", async () => {
    await renderBubble({ sender: ME, duration: 0, messageType: "VoiceCall" });

    expect(
      screen.queryByText(/Missed/i),
      "a call this user started was labelled as missed; only a call from the other side that nobody answered is missed",
    ).not.toBeInTheDocument();
  });

  it("names an outgoing voice call nobody answered", async () => {
    await renderBubble({ sender: ME, duration: 0, messageType: "VoiceCall" });

    expect(
      screen.getByText(/Outgoing Voice Call/),
      "the bubble did not say the call was outgoing and was a voice call",
    ).toBeInTheDocument();
  });

  it("names an outgoing video call nobody answered", async () => {
    await renderBubble({ sender: ME, duration: 0, messageType: "VideoCall" });

    expect(
      screen.getByText(/Outgoing Video Call/),
      "the bubble did not say the call was outgoing and was a video call",
    ).toBeInTheDocument();
  });

  it("still calls an unanswered incoming voice call a missed call", async () => {
    await renderBubble({ sender: THEM, duration: 0, messageType: "VoiceCall" });

    expect(
      screen.getByText(/Missed Voice Call At/),
      "a voice call from the other side that nobody answered was not labelled as missed",
    ).toBeInTheDocument();
  });
});

describe("CallMessage — the rest of the bubble", () => {
  async function mountCall(extra: Record<string, any> = {}, activeChat: any = null) {
    const p = {
      setOpen: vi.fn(),
      setDelete: vi.fn(),
      openMenu: true,
      type: "call",
      isPrivate: false,
      created_at: "2026-09-15T10:20:40",
      id: 339309,
      DeleteModal: false,
      channel_id: 539,
      channel_member: null,
      message_type: { name: "VideoCall" },
      duration_in_seconds: 75,
      sender_user_id: THEM,
      ...extra,
    };
    await renderWithProviders(<CallMessage {...(p as any)} />, { store: { userChat: { id: ME }, activeChat } });
    return p;
  }

  it("names an answered incoming video call and shows how long it lasted", async () => {
    await mountCall();
    expect(document.querySelector(".missed-body")?.textContent, "an answered video call was not named with its length").toContain(
      "Incoming Video Call (01:15)",
    );
    expect(document.querySelector('img[src="/icons/chat/videocall.svg"]'), "the video call icon was not shown").not.toBeNull();
  });

  it("names an answered incoming voice call, and a missed video call", async () => {
    await mountCall({ message_type: { name: "VoiceCall" } });
    expect(screen.getByText(/Incoming Voice Call/), "an answered voice call was not named").toBeInTheDocument();
    await mountCall({ duration_in_seconds: 0 });
    expect(screen.getByText(/Missed Video Call At/), "a missed video call was not named").toBeInTheDocument();
    expect(document.querySelector('img[src="/icons/chat/VideoMissed.svg"]'), "the missed video icon was not shown").not.toBeNull();
  });

  it("opens the menu on a tap and deletes the call from it", async () => {
    const p = await mountCall({ DeleteModal: true });
    fireEvent.click(document.querySelector(".call-body")!);
    expect(p.setOpen, "a tap did not open the menu for this call").toHaveBeenCalledWith(339309);
    fireEvent.click(screen.getByText("Delete").parentElement!);
    expect(p.setDelete, "the delete box was not opened").toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByText("For Me"));
    expect(callBubble.deleteMessage, "the call was not deleted for me").toHaveBeenCalledWith(539, 339309, false);
  });
});
