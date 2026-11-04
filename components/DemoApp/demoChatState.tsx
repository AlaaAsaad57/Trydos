"use client";

import React, {
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type { DemoKey } from "./demoKeys";
import { ChatContext, NOTICE_MS, type ChatApi } from "../DemoApp1/chat/chatContext";
import { reduceChat, seedState } from "./demoChatModel";
import {
  clockNow,
  initialsOf,
  isOpenable,
  newId,
  orderedChats,
  pendingReminders,
  previewOf,
  searchableText,
  type ChatAction,
  type ChatState,
  type Openable,
  type PreviewWords,
} from "../DemoApp1/chat/chatModel";

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


/** The longest a timer may wait, in ms (a longer one fires at once in browsers). */
const MAX_TIMER = 2 ** 31 - 1;

export function DemoChatProvider({
  children,
  t,
}: {
  children: React.ReactNode;
  t: (key: DemoKey) => string;
}) {
  const words: PreviewWords = {
    photo: t("Photo"),
    voice: t("voice message"),
    video: t("Video"),
    file: t("File"),
    location: t("Location"),
  };
  const [state, rawDispatch] = useReducer(
    (s: ChatState, a: ChatAction) => reduceChat(s, a, words),
    undefined,
    seedState,
  );
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const replies = useRef(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Shows a notice for a moment. */
  const say = (text: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  };
  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  // The soonest reminder gets a timer; when it comes due the message loses
  // its reminder and the shopper is told. Rebuilt whenever a reminder is
  // set or cleared. The real chat service would send this as a push.
  const due = pendingReminders(state);
  const dueKey = due.map((r) => `${r.chat}/${r.id}@${r.at}`).join("|");
  useEffect(() => {
    const next = due[0];
    if (!next) return;
    const chat = state.chats.find((c) => c.id === next.chat);
    const message = chat?.messages.find((m) => m.id === next.id);
    const timer = setTimeout(() => {
      rawDispatch({ type: "remind", chat: next.chat, id: next.id, at: null });
      const text = message ? searchableText(message) || (isOpenable(message) ? previewOf(message, words) : "") : "";
      say(text ? `${t("Reminder")}: ${text}` : t("Reminder"));
    }, Math.min(MAX_TIMER, Math.max(0, next.at - Date.now())));
    return () => clearTimeout(timer);
    // Only when the set of reminders changes.
  }, [dueKey]);

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

  const value: ChatApi = {
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
    sendVideo: (chat, src, seconds) =>
      deliver(chat, { kind: "video", id: newId(), side: "out", src, seconds, time: clockNow() }),
    sendFile: (chat, file) =>
      deliver(chat, { kind: "file", id: newId(), side: "out", ...file, time: clockNow() }),
    sendLocation: (chat, point) =>
      deliver(chat, { kind: "location", id: newId(), side: "out", ...point, time: clockNow() }),
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
    newChat: (contact) => {
      const there = orderedChats(state.chats).find((c) => c.contact === contact);
      const as = { id: newId(), time: clockNow() };
      dispatch({ type: "newChat", contact, as });
      return there?.id ?? as.id;
    },
    addContact: (name, phone) => {
      // A number that is already in the list is that contact.
      const digits = phone.replace(/\s+/g, "");
      const there = state.contacts.find((c) => c.phone.replace(/\s+/g, "") === digits);
      if (there) return there.id;
      const id = newId();
      dispatch({
        type: "addContact",
        contact: { id, name: name.trim(), phone: phone.trim(), initials: initialsOf(name) },
      });
      return id;
    },
    notice,
    search,
    setSearch,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
