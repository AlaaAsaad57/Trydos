"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "store";
import CallFace, { type CallPerson } from "../chat/CallFace";
import { useChat } from "../chat/chatContext";
import { chatOnScreen, contactOf } from "../chat/chatModel";
import { useDemoNav } from "../screenNav";

/**
 * The call page of the real app (`/[lang]/chat/call?id=<chat id>`). Stage 6,
 * step 5. The `/demo` preview keeps its mock call (CallScreen).
 *
 * The page shows the store's call: one the shopper started (startCall) or
 * answered (the incoming call sheet). AuthSections opens this page when the
 * store gets a call. When the call ends — or the page opens with no call, as
 * on a reload — it goes back.
 */
const LiveCall = dynamic(() => import("../chat/LiveCall"), {
  ssr: false,
  // The page as it looks while the call is dialled.
  loading: () => <Dialling />,
});

const NOBODY: CallPerson = { name: "", phone: "", initials: "" };

/** The person on the call: the chat's contact. */
function usePerson(): CallPerson {
  const { state } = useChat();
  const chat = chatOnScreen(state);
  return chat ? contactOf(state, chat) : NOBODY;
}

export default function LiveCallScreen() {
  const { back } = useDemoNav();
  const call = useAppStore((s) => s.call);
  const token = useAppStore((s) => s.AgoraToken);
  const channel = useAppStore((s) => s.activeChat?.id);
  const callId = useAppStore((s) => s.MessageActiveCall);
  const person = usePerson();

  useEffect(() => {
    if (!call) back();
  }, [call]);

  if (!call || !token || channel == null) return <Dialling />;
  return (
    <LiveCall
      key={String(callId)}
      token={token}
      video={String(call).includes("vid")}
      channel={String(channel)}
      person={person}
    />
  );
}

/** The call page before the call runs: "Calling …", the switches doing nothing. */
function Dialling() {
  const { t } = useDemoNav();
  const person = usePerson();
  const none = () => {};
  return (
    <CallFace
      people={[person]}
      phase="calling"
      seconds={0}
      mic
      camera={false}
      added={false}
      onBack={none}
      onEnd={none}
      onMic={none}
      onCamera={none}
      onAddPerson={none}
      t={t}
    />
  );
}
