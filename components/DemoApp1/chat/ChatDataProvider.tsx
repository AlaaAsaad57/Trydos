"use client";

import React, { useEffect, useRef, useState } from "react";
import chatService from "services/chat";
import { useAppStore } from "store";
import { GetArchivedChats, GetMyReminders } from "store/chat/actions";
import { translateFunction } from "utils/functions";
import { ChatContext, NOTICE_MS, type ChatApi } from "./chatContext";
import { runChatAction } from "./chatActions";
import { toChatState, type MapWords } from "./chatMapper";
import type { ChatAction } from "./chatModel";

/**
 * The real chat for the new chat screens. Stage 6, step 3b.
 *
 * It reads the chat store (filled by services/chat.ts, store/chat/actions.tsx
 * and the push messages in utils/NotificationHandler.ts), turns it into the
 * screens' state with the mapper (chatMapper.ts), and sends the screens'
 * actions to the live chat calls (chatActions.ts). It fills the same context
 * as the `/demo` mock, so the screens do not change.
 *
 * Mounted around the chat screens only: when it mounts it loads the chats,
 * the contacts, the calls, the archived chats and the reminders, as the old
 * chat window did when it opened (components/Chat/ChatModal.tsx).
 */
export function ChatDataProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  /** The page's locale ("sy-en"), for the day pills. */
  locale: string;
}) {
  const data = useAppStore((s) => s.data);
  const archived = useAppStore((s) => s.archivedChats);
  const open = useAppStore((s) => s.activeChat);
  const book = useAppStore((s) => s.contacts);
  const userChat = useAppStore((s) => s.userChat);
  const liveCallId = useAppStore((s) => s.MessageActiveCall);
  const calling = useAppStore((s) => s.isCallIncoming || !!s.callInProgress);
  // Read so a language change draws the words again.
  const language = useAppStore((s) => s.language);

  const [active, setActive] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myId = userChat?.id;
  useEffect(() => {
    if (!myId) return;
    chatService.getChats(false);
    chatService.getContacts();
    chatService.getCalls();
    GetArchivedChats();
    GetMyReminders();
  }, [myId]);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  /** Shows a notice for a moment. */
  const say = (text: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  };

  const t = (key: string) => translateFunction(key, language);
  const words: MapWords = {
    photo: t("Photo"),
    voice: t("voice message"),
    video: t("Video"),
    file: t("File"),
    location: t("Location"),
    product: t("Product"),
    deleted: t("this message was deleted"),
    voiceCall: t("Voice Call"),
    videoCall: t("Video Call"),
  };

  const state = toChatState(
    { chats: data ?? [], archived: archived ?? [], open, book: book ?? [] },
    { myId: myId ?? "", words, locale, liveCallId: calling ? liveCallId : null },
    { active, viewing },
  );

  const dispatch = (action: ChatAction) => {
    if (action.type === "open") {
      setActive(action.chat);
      setViewing(action.chat);
    } else if (action.type === "leave") {
      setViewing(null);
    } else if ((action.type === "archive" || action.type === "deleteChat") && viewing === action.chat) {
      setViewing(null);
    }
    void runChatAction(action, { say });
  };

  /** Sending comes in step 3c. Until then it says so, and nothing is sent. */
  const notYet = () => say(t("Soon available"));

  const value: ChatApi = {
    state,
    dispatch,
    sendText: notYet,
    sendPhoto: notYet,
    sendVoice: notYet,
    sendVideo: notYet,
    sendFile: notYet,
    // No chat backend for a location message yet (CH-2, A-8).
    sendLocation: notYet,
    forward: notYet,
    newChat: () => {
      notYet();
      return "";
    },
    addContact: () => {
      notYet();
      return "";
    },
    notice,
    search,
    setSearch,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
