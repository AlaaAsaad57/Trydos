"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { autoSaveMissedMedia, getAutoDownloadMode, setAutoDownloadMode } from "components/Chat/autoDownload";
import { canonicalPhone, phoneRegion } from "components/Chat/contactPhone";
import { findChat } from "components/Chat/findChat";
import { openChatFromList } from "components/Chat/openChatFromList";
import chatService, { CALLS_PAGE_SIZE } from "services/chat";
import home from "services/home";
import { useAppStore } from "store";
import {
  CancelMessageReminder,
  GetArchivedChats,
  GetMyReminders,
  GetTaggedMessages,
  MEDIA_PAGE_SIZE,
  getMedia,
} from "store/chat/actions";
import { openMessageInChat } from "components/Chat/openMessageInChat";
import { canPickContacts, syncPhoneContacts } from "components/Chat/contactsSync";
import { translateFunction } from "utils/functions";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { CHAT_EVENTS, trackPosthog } from "utils/posthogEvents";
import { ChatContext, NOTICE_MS, type ChatApi, type ChatExtras, type ChatPaging } from "./chatContext";
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
import { toChatState, toInviteContact, toMessages, wordsOf, type MapWords } from "./chatMapper";
import { loadMoreChats, loadOlderCalls, loadOlderMessages, type PageResult } from "./chatPaging";
import { startCall } from "./chatCalls";
import type { ChatAction } from "./chatModel";
import { appScreenFromPath } from "../appScreenPaths";
import { SCREEN_TRANSITION } from "../demo1Layout";
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
 *
 * The open chat stays open across the screens of one chat: the conversation
 * going to the contact or the call page is not a "leave". It closes when the
 * shopper leaves those screens (closeChat).
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
  const pathname = usePathname();
  const data = useAppStore((s) => s.data);
  const archived = useAppStore((s) => s.archivedChats);
  const open = useAppStore((s) => s.activeChat);
  const book = useAppStore((s) => s.contacts);
  const calls = useAppStore((s) => s.calls);
  const reminders = useAppStore((s) => s.reminders);
  /** A phone on record (the profile); "0" is the guest's. */
  const profilePhone = useAppStore((s) => (s as { userProfile?: { phone?: string } | null }).userProfile?.phone);
  const jump = useAppStore((s) => s.jumpToMessageId);
  const userChat = useAppStore((s) => s.userChat);
  const accountPhone = useAppStore((s) => (s as { user?: { phone?: string } | null }).user?.phone);
  const country = useAppStore((s) => (s as { country?: string }).country);
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
  /** The chat list reached its end, the call log did, and the chats whose messages did. */
  const [chatsDone, setChatsDone] = useState(false);
  const [callsDone, setCallsDone] = useState(false);
  const [olderDone, setOlderDone] = useState<readonly string[]>([]);
  /** A page on its way, so a second one is not asked for meanwhile. */
  const pageLoading = useRef({ chats: false, calls: false, older: null as string | null });

  const myId = userChat?.id;

  // The notification permission, read again when the shopper comes back to
  // the tab or the browser says it changed. "granted" until it is read, so
  // a shopper who allowed it sees no gate flash by.
  const [permission, setPermission] = useState<string>("granted");
  const readPermission = () =>
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  useEffect(() => {
    if (!enabled) return;
    readPermission();
    window.addEventListener("focus", readPermission);
    let status: PermissionStatus | null = null;
    navigator.permissions
      ?.query({ name: "notifications" as PermissionName })
      .then((s) => {
        status = s;
        s.onchange = readPermission;
      })
      .catch(() => {});
    return () => {
      window.removeEventListener("focus", readPermission);
      if (status) status.onchange = null;
    };
  }, [enabled]);

  /**
   * The old chat's gates (D-36a). A shopper with a phone but no chat account
   * confirms the phone (the login's phone check; the chat account comes with
   * it). The chat opens only with notifications allowed, as the old chat
   * window did (ChatWindowModal.tsx). A guest never gets here: the page
   * sends them to the login (chatGuestGate.ts).
   */
  const gate: ChatApi["gate"] = !enabled
    ? null
    : !myId
      ? profilePhone && profilePhone !== "0"
        ? { kind: "phone", open: () => useAppStore.getState().setShouldAuthinticated("open chat") }
        : null
      : permission !== "granted"
        ? {
            kind: "notifications",
            open: () => {
              void home
                .AllowNotifications()
                .catch(() => {})
                .finally(readPermission);
            },
          }
        : null;
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

  /**
   * Puts a chat's id in the URL of the screen on show, with no new history
   * entry. The router treats `history.replaceState` as a navigation, and a
   * navigation cancels one that is on its way. So this waits for the URL of
   * one chat (a tap on a row draws the conversation before its URL lands; the
   * "Follow" effect writes the id then), and it stays out of a call: the call
   * page's URL already names the chat, and its push may be on its way.
   */
  const writeId = (id: string) => {
    if (!isOneChatScreen(appScreenFromPath(window.location.pathname))) return;
    if (useAppStore.getState().call || chatIdFrom(window.location.search) === id) return;
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
    seek(id);
  };
  /** Looks for a chat outside the loaded pages, and opens it. */
  const seek = (id: string) => {
    if (walking.current === id) return;
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
    writeId(openId);
  }, [oneChat, openId, pathname]);

  /** Closes the open chat, unless a call runs in it. */
  const closeChat = () => {
    const { activeChat, call, openChat } = useAppStore.getState();
    if (activeChat && !call) openChat(null);
  };
  // Off the screens of one chat the open chat closes, once the old screen has
  // slid out (it still draws the chat until then). A new open cancels this.
  useEffect(() => {
    if (oneChat) return;
    const timer = setTimeout(closeChat, SCREEN_TRANSITION.duration * 1000);
    return () => clearTimeout(timer);
  }, [oneChat]);
  // The mount goes away when the shopper goes to an old page.
  useEffect(() => closeChat, []);

  const viewing = pending ?? (oneChat ? openId : null);

  // Media that came while the page was closed, by the "Save To Gallery" choice.
  // Messages load in steps, so this runs as they arrive; the file list in
  // autoDownload.ts stops any repeat.
  useEffect(() => {
    if (oneChat) autoSaveMissedMedia(open?.id, open?.messages, myId);
  }, [oneChat, open?.id, open?.messages, myId]);

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
      ? { chats: data ?? [], archived: archived ?? [], open, book: book ?? [], calls: calls ?? [], me: userChat }
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
    // The conversation says "leave" when it goes, also on its way to the
    // contact or the call page, where the chat must stay open (a call ends
    // when its chat closes). closeChat does the real leaving.
    if (action.type === "leave") return;
    if (action.type === "open") {
      setActive(action.chat);
      // A chat outside the loaded pages (a row of the Calls tab): the screen
      // waits for it, and never shows another chat in its place.
      const loaded = !!findChannel(action.chat);
      setPending(loaded ? null : action.chat);
      // Switch: another chat opened on a screen of one chat takes the URL now.
      if (oneChat) writeId(action.chat);
      if (!loaded) return seek(action.chat);
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

  // A page at a time (step 4). The list asks for its next page near its end,
  // the conversation for older messages near its top.
  const paging: ChatPaging = {
    // The first page holds 10 chats; fewer means there is no other page.
    moreChats: enabled && !chatsDone && (data?.length ?? 0) >= 10,
    loadMoreChats: () => {
      if (pageLoading.current.chats || chatsDone) return;
      pageLoading.current.chats = true;
      void loadMoreChats()
        .then((result: PageResult) => {
          if (result === "done") setChatsDone(true);
        })
        .finally(() => {
          pageLoading.current.chats = false;
        });
    },
    // A short first page is the whole log.
    moreCalls: enabled && !callsDone && (calls?.length ?? 0) >= CALLS_PAGE_SIZE,
    loadMoreCalls: () => {
      if (pageLoading.current.calls || callsDone) return;
      pageLoading.current.calls = true;
      void loadOlderCalls().then((result: PageResult) => {
        // The lock stays on at the end: `callsDone` comes only with the next
        // draw, and the page edge may ask again before it.
        pageLoading.current.calls = result === "done";
        if (result === "done") setCallsDone(true);
      });
    },
    moreOlder: (chat) => enabled && !chat.startsWith("ch-") && !olderDone.includes(chat),
    loadOlder: (chat) => {
      if (pageLoading.current.older || olderDone.includes(chat)) return;
      pageLoading.current.older = chat;
      void loadOlderMessages(chat)
        .then((result: PageResult) => {
          if (result === "done") setOlderDone((done) => [...done, chat]);
        })
        .finally(() => {
          pageLoading.current.older = null;
        });
    },
  };

  /** A reminder's message, when it is not text: its kind, as a row says it. */
  const KIND_WORDS: Record<string, string> = {
    ImageMessage: words.photo,
    VideoMessage: words.video,
    VoiceMessage: words.voice,
    FileMessage: words.file,
    ShareProduct: words.product,
  };
  // The shopper's own number, and the region their phone book's numbers are in.
  const myPhone = userChat?.mobile_phone || accountPhone;
  const region = phoneRegion(myPhone, country);
  const ownPhone = canonicalPhone(myPhone, region);
  const extras: ChatExtras = {
    reminders: (reminders ?? [])
      .map((r) => ({
        id: String(r.id),
        chat: r.message?.channel_id != null ? String(r.message.channel_id) : null,
        message: String(r.message_id),
        text: r.message?.content || KIND_WORDS[r.message?.message_type ?? ""] || "",
        who: r.message?.sender_user?.name ?? "",
        at: new Date(r.remind_at).getTime(),
      }))
      .sort((a, b) => a.at - b.at),
    openMessage: async (chat, message) => {
      // Loads the chat and the messages up to this one, and marks it for the jump.
      const ok = await openMessageInChat(chat, message);
      if (ok && chat) {
        setActive(chat);
        setPending(null);
      }
      return ok;
    },
    cancelReminder: (r) => void CancelMessageReminder(r.chat ?? "", r.message, r.id),
    jump,
    setJump: (message) => useAppStore.getState().setJumpToMessage(message),
    ...(canPickContacts() ? { syncContacts: syncPhoneContacts } : {}),
    tagged: async (chat, label) => {
      const found = await GetTaggedMessages(chat, label);
      if (!found) return null;
      return toMessages(found, ctx).flatMap((m) => {
        const raw = found.find((f) => String(f.id) === m.id);
        return m.kind === "day" || !raw ? [] : [{ id: m.id, text: wordsOf(raw, words), time: m.time }];
      });
    },
    ownPhone,
    invites: enabled ? (book ?? []).flatMap((c) => toInviteContact(c, region, ownPhone) ?? []) : [],
    autoDownload: { read: getAutoDownloadMode, write: setAutoDownloadMode },
    media: async (chat, type, before) => {
      const found = await getMedia(chat, type, before);
      if (!found) return null;
      // The conversation's order is oldest first; the sheet adds older pages at its end.
      const messages = toMessages(found, ctx)
        .filter((m) => m.kind !== "day")
        .reverse();
      return { messages, more: found.length >= MEDIA_PAGE_SIZE };
    },
  };

  const value: ChatApi = {
    state,
    dispatch,
    sendText: sendTextMessage,
    sendPhoto: (chat, file, replyTo) => void sendMediaMessage(chat, file, "ImageMessage", replyTo),
    sendVoice: (chat, audio, _seconds, replyTo) => sendVoiceNote(chat, audio, replyTo),
    sendVideo: (chat, file, _seconds, replyTo) => sendVideoFile(chat, file, replyTo),
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
    paging,
    call: (chat, video) => void startCall(chat, video),
    extras,
    gate,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
