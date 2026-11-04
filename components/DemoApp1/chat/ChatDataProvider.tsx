"use client";

import React, { useEffect, useRef, useState } from "react";
import chatService from "services/chat";
import { useAppStore } from "store";
import { GetArchivedChats, GetMyReminders } from "store/chat/actions";
import { translateFunction } from "utils/functions";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { CHAT_EVENTS, trackPosthog } from "utils/posthogEvents";
import { ChatContext, NOTICE_MS, type ChatApi } from "./chatContext";
import { findChannel, runChatAction } from "./chatActions";
import { CHAT_ID_PARAM, chatIdFrom, isChatScreen, isOneChatScreen } from "./chatPaths";
import {
  forwardTo,
  openChatWith,
  saveContact,
  sendAnyFile,
  sendMediaMessage,
  sendTextMessage,
  sendTyping,
  sendVideoFile,
  sendVoiceNote,
} from "./chatSend";
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
 * The screen mount (AppScreens) keeps it around every new screen and turns it
 * on only while a chat screen shows, so the slides keep working. When it
 * turns on it loads the chats, the contacts, the calls, the archived chats
 * and the reminders, and sends the old chat window's events
 * (components/Chat/ChatModal.tsx).
 *
 * The chat on screen is the store's open chat (`activeChat`, set by the old
 * open), and the URL carries its id (`?id=`, chatPaths.ts): a URL with an id
 * opens that chat, and a screen of one chat with no id in its URL gets one.
 */
export function ChatDataProvider({
  children,
  locale,
  screen,
}: {
  children: React.ReactNode;
  /** The page's locale ("sy-en"), for the day pills. */
  locale: string;
  /** The new screen on show; the chat is on only for a chat screen. */
  screen: string | null;
}) {
  const enabled = isChatScreen(screen);
  const oneChat = isOneChatScreen(screen);
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
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myId = userChat?.id;
  useEffect(() => {
    if (!enabled || !myId) return;
    chatService.getChats(false);
    chatService.getContacts();
    chatService.getCalls();
    GetArchivedChats();
    GetMyReminders();
    // The old chat window's events when it opened (D-10: old names only).
    GAevent({
      action: GA_EVENT_NAMES.SCREEN_VIEW,
      params: { screen_name: GA_GLOBAL_SCREEN.CHAT_SCREEN, screen_path: window.location.pathname },
    });
    trackPosthog(CHAT_EVENTS.CHAT_OPENED);
  }, [enabled, myId]);

  /** Puts a chat's id in the URL of the screen on show, with no new history entry. */
  const writeId = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(CHAT_ID_PARAM, id);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  // Read: a URL with a chat id opens that chat — on arrival, when the chats
  // load (the chat may not be loaded yet), and on the browser's back / forward.
  const openFromUrl = () => {
    const id = chatIdFrom(window.location.search);
    if (!id || String(useAppStore.getState().activeChat?.id ?? "") === id) return;
    if (!findChannel(id)) return;
    setActive(id);
    void runChatAction({ type: "open", chat: id }, { say });
  };
  useEffect(() => {
    if (!oneChat) return;
    openFromUrl();
    window.addEventListener("popstate", openFromUrl);
    return () => window.removeEventListener("popstate", openFromUrl);
  }, [oneChat, data, archived]);

  // Fill: a screen of one chat whose URL has no id gets the open chat's id
  // (a tap on a row opens the chat, then the screen's URL comes with none).
  const openId = open?.id != null ? String(open.id) : null;
  useEffect(() => {
    if (!oneChat || !openId || chatIdFrom(window.location.search)) return;
    writeId(openId);
  }, [oneChat, openId]);

  const viewing = oneChat ? openId : null;

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

  const ctx = { myId: myId ?? "", words, locale, liveCallId: calling ? liveCallId : null };
  // Off a chat screen the chat is not mapped at all.
  const state = toChatState(
    enabled
      ? { chats: data ?? [], archived: archived ?? [], open, book: book ?? [] }
      : { chats: [], archived: [], open: null, book: [] },
    ctx,
    { active, viewing },
  );

  /** The contacts as the store holds them now (a contact saved a moment ago is in). */
  const freshContact = (id: string) => {
    const now = useAppStore.getState();
    return toChatState(
      { chats: now.data ?? [], archived: now.archivedChats ?? [], open: now.activeChat, book: now.contacts ?? [] },
      ctx,
      { active, viewing },
    ).contacts.find((c) => c.id === id);
  };

  const dispatch = (action: ChatAction) => {
    if (action.type === "open") {
      setActive(action.chat);
      // Switch: another chat opened on a screen of one chat takes the URL now.
      if (oneChat) writeId(action.chat);
    } else if (action.type === "archive" && viewing === action.chat) {
      // The archived chat leaves the screen, as on /demo. (A delete closes it in the store.)
      useAppStore.getState().openChat(null);
    }
    void runChatAction(action, { say });
  };

  /** A chat opened by `newChat`: the row to mark, and the URL on a screen of one chat. */
  const show = (id: string) => {
    setActive(id);
    if (oneChat) writeId(id);
  };

  const value: ChatApi = {
    state,
    dispatch,
    sendText: sendTextMessage,
    sendPhoto: (chat, file) => void sendMediaMessage(chat, file, "ImageMessage"),
    sendVoice: (chat, audio) => sendVoiceNote(chat, audio),
    sendVideo: (chat, file) => sendVideoFile(chat, file),
    sendFile: sendAnyFile,
    // No chat backend for a location message yet (CH-2, A-8).
    sendLocation: () => say(t("Soon available")),
    forward: forwardTo,
    newChat: (id) => {
      const contact = freshContact(id);
      if (!contact) return "";
      const chat = openChatWith(contact);
      show(chat);
      return chat;
    },
    addContact: saveContact,
    typing: (chat) => void sendTyping(chat),
    notice,
    search,
    setSearch,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
