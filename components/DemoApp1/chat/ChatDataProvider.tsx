"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { findChat } from "components/Chat/findChat";
import { openChatFromList } from "components/Chat/openChatFromList";
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
import { NavCtx } from "../screenNav";

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
 * opens that chat, and the URL follows the open chat.
 *
 * A reload of one chat's URL comes up before its chat is loaded. Until it is
 * open, the URL's chat is the chat on screen, so the screens wait for it
 * (chatOnScreen). A chat outside the loaded pages is found on the chat
 * backend's pages (findChat); a new chat (`ch-<user id>`) is opened again with
 * its contact. A chat that is nowhere sends the shopper back to the list.
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
  const chatsLoading = useAppStore((s) => s.chat_loading);
  const liveCallId = useAppStore((s) => s.MessageActiveCall);
  const calling = useAppStore((s) => s.isCallIncoming || !!s.callInProgress);
  // Read so a language change draws the words again.
  const language = useAppStore((s) => s.language);

  const [active, setActive] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * The URL's chat while it is not open yet: the screens wait for it. A ref
   * for the effects (they run in one pass) and state for the screens. It
   * stays after a chat that is nowhere, so the screen going away never shows
   * another chat in its place; the next open clears it.
   */
  const pendingRef = useRef<string | null>(null);
  const [pending, setPendingState] = useState<string | null>(null);
  const setPending = (id: string | null) => {
    pendingRef.current = id;
    setPendingState(id);
  };
  /** The chat whose pages are being walked, so one walk runs at a time. */
  const walking = useRef<string | null>(null);
  const nav = useContext(NavCtx);

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
    if (pendingRef.current !== id) setPending(id);
    if (findChannel(id)) {
      setActive(id);
      void runChatAction({ type: "open", chat: id }, { say });
      return;
    }
    // Not loaded. Look only once the first page of chats is in.
    if (useAppStore.getState().chat_loading || walking.current === id) return;
    if (id.startsWith("ch-")) {
      // A new chat: open the chat with its contact again (a real one when
      // the first message made it, else a new empty one).
      const contact = freshContact(id.slice(3));
      // The contact may be in the contact book, which loads on its own.
      if (!contact && !(useAppStore.getState().contacts ?? []).length) return;
      if (!contact) return lost(id);
      const opened = openChatWith(contact);
      setActive(opened);
      setPending(opened);
      if (opened !== id) writeId(opened);
      return;
    }
    walking.current = id;
    void findChat(id).then((chat) => {
      walking.current = null;
      if (pendingRef.current !== id) return;
      if (!chat) return lost(id);
      setActive(id);
      openChatFromList(chat);
    });
  };
  useEffect(() => {
    if (!oneChat) return;
    openFromUrl();
    window.addEventListener("popstate", openFromUrl);
    return () => window.removeEventListener("popstate", openFromUrl);
  }, [oneChat, data, archived, book, chatsLoading]);

  /** The URL's chat is nowhere: say so, and go back to the list. */
  const lost = (id: string) => {
    say(t("Could not open the chat"));
    if (pendingRef.current === id) nav?.navigate("chat", -1);
  };

  // Follow: the URL names the open chat. A tap on a row opens the chat and
  // the screen's URL comes with no id; a new chat gets its real id with its
  // first message. Not while the URL's own chat is on its way.
  const openId = open?.id != null ? String(open.id) : null;
  useEffect(() => {
    if (pendingRef.current && pendingRef.current === openId) setPending(null);
    if (!oneChat || !openId || pendingRef.current) return;
    if (chatIdFrom(window.location.search) !== openId) writeId(openId);
  }, [oneChat, openId]);

  const viewing = pending ?? (oneChat ? openId : null);

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
      setPending(null);
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
    setPending(null);
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
