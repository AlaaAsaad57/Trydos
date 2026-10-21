"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import type { DemoKey } from "./demoKeys";
import {
  clockNow,
  newId,
  reduceChat,
  seedState,
  type ChatAction,
  type ChatState,
  type Openable,
} from "./demoChatModel";

/**
 * The chat the demo shows, as React state.
 *
 * One `ChatState` (demoChatModel.ts) lives in the demo shell, so it stays
 * while the shopper moves between the list, a conversation and a contact.
 * Nothing talks to a backend: a sent message gets its ticks from timers, and
 * the contact answers with a mock reply after a moment of "typing". The
 * screens call the helpers below; `reduceChat` holds the rules.
 */

/** How long a sent message takes to be delivered, read, and answered, in ms. */
export const MOCK_TIMING = {
  delivered: 700,
  read: 1600,
  typingStarts: 2300,
  typingLasts: 1700,
} as const;

/** What the contact answers with, in turn. Sample words, not UI copy. */
export const MOCK_REPLIES = [
  "Hello World !",
  "When I let go of what I am, I become what I might be.",
  "Sounds good, let's talk about the project tomorrow.",
  "Thank you !",
] as const;

type DemoChat = {
  state: ChatState;
  dispatch: (action: ChatAction) => void;
  /** Sends a text I typed, answering `replyTo` when given. */
  sendText: (chat: string, text: string, replyTo?: { id: string; text: string }) => void;
  sendPhoto: (chat: string, src: string) => void;
  sendVoice: (chat: string, seconds: number) => void;
  forward: (from: string, id: string, to: string) => void;
};

const Ctx = createContext<DemoChat | null>(null);

export function DemoChatProvider({
  children,
  t,
}: {
  children: React.ReactNode;
  t: (key: DemoKey) => string;
}) {
  const words = { photo: t("Photo"), voice: t("voice message") };
  const [state, rawDispatch] = useReducer(
    (s: ChatState, a: ChatAction) => reduceChat(s, a, words),
    undefined,
    seedState,
  );
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const replies = useRef(0);

  // Timers from a message that was sent must not fire after the demo closes.
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    },
    [],
  );

  const later = (ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };

  const dispatch = (action: ChatAction) => rawDispatch(action);

  /** A message I sent: its ticks come, then the contact types and answers. */
  const deliver = (chat: string, message: Openable) => {
    dispatch({ type: "send", chat, message, replyTo: message.kind === "text" ? message.replyTo?.id : undefined });
    later(MOCK_TIMING.delivered, () =>
      dispatch({ type: "status", chat, id: message.id, status: "delivered" }),
    );
    later(MOCK_TIMING.read, () =>
      dispatch({ type: "status", chat, id: message.id, status: "read" }),
    );
    later(MOCK_TIMING.typingStarts, () =>
      dispatch({ type: "typing", chat, on: true }),
    );
    later(MOCK_TIMING.typingStarts + MOCK_TIMING.typingLasts, () => {
      const text = MOCK_REPLIES[replies.current % MOCK_REPLIES.length];
      replies.current += 1;
      dispatch({
        type: "receive",
        chat,
        message: { kind: "text", id: newId(), side: "in", text, time: clockNow() },
      });
    });
  };

  const value: DemoChat = {
    state,
    dispatch,
    sendText: (chat, text, replyTo) =>
      deliver(chat, {
        kind: "text",
        id: newId(),
        side: "out",
        text,
        time: clockNow(),
        replyTo,
      }),
    sendPhoto: (chat, src) =>
      deliver(chat, { kind: "photo", id: newId(), side: "out", src, time: clockNow() }),
    sendVoice: (chat, seconds) =>
      deliver(chat, { kind: "voice", id: newId(), side: "out", seconds, time: clockNow() }),
    forward: (from, id, to) => {
      const as = { id: newId(), time: clockNow() };
      dispatch({ type: "forward", from, id, to, as });
      later(MOCK_TIMING.delivered, () =>
        dispatch({ type: "status", chat: to, id: as.id, status: "delivered" }),
      );
      later(MOCK_TIMING.read, () =>
        dispatch({ type: "status", chat: to, id: as.id, status: "read" }),
      );
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoChat(): DemoChat {
  const value = useContext(Ctx);
  if (!value) throw new Error("useDemoChat must be used inside DemoChatProvider");
  return value;
}
