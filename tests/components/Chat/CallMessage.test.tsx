// The call bubble inside a conversation.
//
// Same record as the call log row, shown in the thread instead of the Calls
// tab. It has to answer the same two questions: who started the call, and was
// it voice or video. `duration_in_seconds` is 0 for every call that never
// connected, so only `sender_user_id` says which side started it.
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
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

// The incoming-call push puts the call into the conversation at once, while
// the phone is still ringing (utils/NotificationHandler.ts, handleIncomingCall).
// Its duration is 0 at that moment, as it is for a call nobody answered. So the
// bubble must look at the store too: the call that is ringing or running now is
// `MessageActiveCall`, and it is live while `isCallIncoming` (ringing) or
// `callInProgress` (answered) is set.
describe("CallMessage — a call that is ringing now", () => {
  const CALL_ID = 339309;

  async function renderLive(store: Record<string, any>) {
    return renderWithProviders(
      <CallMessage
        setOpen={() => {}}
        setDelete={() => {}}
        openMenu={false}
        type="call"
        isPrivate={false}
        created_at="2026-09-15T10:20:40.000Z"
        id={CALL_ID}
        DeleteModal={false}
        channel_id={539}
        channel_member={{ id: THEM, name: "Alaa Test123", photo_path: null }}
        message_type={{ name: "VoiceCall" }}
        duration_in_seconds={0}
        sender_user_id={THEM}
      />,
      { store: { userChat: { id: ME }, activeChat: null, ...store } },
    );
  }

  it("shows a ringing voice call as incoming, not missed", async () => {
    await renderLive({ MessageActiveCall: CALL_ID, isCallIncoming: true });

    expect(
      screen.queryByText(/Missed/),
      "the call was shown as missed while the phone was still ringing",
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Incoming Voice Call/),
      "a ringing voice call was not shown as an incoming voice call",
    ).toBeInTheDocument();
    expect(
      document.querySelector('img[src="/icons/chat/call.svg"]'),
      "a ringing voice call did not get the normal call icon",
    ).not.toBeNull();
  });

  it("keeps an answered call as incoming while the two people talk", async () => {
    await renderLive({ MessageActiveCall: CALL_ID, callInProgress: true });

    expect(
      screen.getByText(/Incoming Voice Call/),
      "an answered call was shown as missed before it ended",
    ).toBeInTheDocument();
  });

  it("turns into a missed call when this user declines it", async () => {
    const { store } = await renderLive({ MessageActiveCall: CALL_ID, isCallIncoming: true });

    // The decline button in CallComponent.jsx calls the store's refuseCall first.
    await act(async () => store.getState().refuseCall(CALL_ID));

    expect(
      screen.getByText(/Missed Voice Call At/),
      "a declined call did not change from incoming to missed",
    ).toBeInTheDocument();
  });

  it("turns into a missed call when the caller gives up", async () => {
    const { store } = await renderLive({ MessageActiveCall: CALL_ID, isCallIncoming: true });

    // The caller ends the call after 60 s with no answer. The push that follows
    // (RefuseCallEvent) runs the store's endCall with this call's id.
    await act(async () => store.getState().endCall(CALL_ID));

    expect(
      screen.getByText(/Missed Voice Call At/),
      "a call nobody answered did not change from incoming to missed",
    ).toBeInTheDocument();
  });

  it("does not mark an older missed call as live when another call rings", async () => {
    await renderLive({ MessageActiveCall: CALL_ID + 1, isCallIncoming: true });

    expect(
      screen.getByText(/Missed Voice Call At/),
      "an old missed call looked live because a different call was ringing",
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
