"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { CHAT, CHAT_COUNTS, CHAT_PHOTOS, CONTACT } from "../../DemoApp/demoChat";
import {
  contactOf,
  gapAbove,
  isOpenable,
  previewOf,
  reminderLabel,
  searchMessages,
  type ChatMessage,
  type Holdable,
} from "../../DemoApp/demoChatModel";
import { XD_ICON_SIZE } from "../../DemoApp/xdIcons";
import CategorySheet from "../chat/CategorySheet";
import ReminderSheet from "../chat/ReminderSheet";
import ReactionSheet from "../chat/ReactionSheet";
import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from "../chat/chatIcons";
import { useDemoChat } from "../../DemoApp/demoChatState";
import { useDemoNav } from "../Demo1Shell";
import { C, SAFE_BOTTOM, SAFE_TOP, SF_ROUNDED, sfTop, textTop } from "../demo1Layout";
import { Icon, ScreenPage, Stroke, Txt, useTopTint } from "../ui";
import Composer, { type ComposerContext } from "../chat/Composer";
import ForwardSheet from "../chat/ForwardSheet";
import MessageMenu, {
  MENU_BLUR,
  MENU_DIM,
  MENU_DIM_TINT,
  MenuVeil,
  MENU_FADE,
  MENU_GAP,
  MENU_H,
  menuHeight,
  REACTION_BAR_H,
  REACTION_GAP,
  ReactionWarmup,
  type MenuName,
} from "../chat/MessageMenu";
import MessageRow from "../chat/MessageRow";
import {
  Bubble,
  CallCard,
  DayPill,
  Dot,
  FileMessage,
  FlagsLine,
  ReactionChip,
  LocationMessage,
  Note,
  PhotoMessage,
  Quote,
  SmallPhoto,
  TypingBubble,
  VideoMessage,
  VoiceMessage,
  callWords,
} from "../chat/messages";
import Toast, { useToast } from "../chat/Toast";
import { launchReaction } from "../chat/reactionFly";

/**
 * A conversation — XD `Home Page – 44` (430 x 2871; the page is `#FCFCFC`).
 *
 * Header 50 .. 100, white, shadow 0 0 3 (black at 10%): the purple chevron
 * (3 px line, 8 x 20 at 20, 65), the unread count "2" (SF Pro Rounded 18,
 * `#4A31E7`, x 40, baseline 81), the photo 38 x 38 radius 12 at (62, 56), the
 * name 16 Medium at x 112 on baseline 81, the video phone 26 x 26 at (323, 62)
 * and the call phone at (379, 62).
 *
 * Under it, at y 104, each side's 25 x 25 photo (radius 12) with a 6 px dot
 * 4 px from the screen's edge: purple on the contact's side, `#8D00E5` on mine.
 *
 * Then the messages, drawn from the chat state (demoChatModel.ts) by the
 * blocks in ../chat/messages.tsx. The state opens with the file's own
 * conversation, message for message and gap for gap; what the shopper sends
 * follows it, with the composer under the body (../chat/Composer.tsx) — the
 * file draws no composer, so that one is built from the boards' own parts.
 *
 * The gestures are WhatsApp's on the iPhone (../chat/MessageRow.tsx, from
 * the video of 2026-10-21): pull a message right to answer it; hold it to
 * lift it over the dimmed chat and pop its menu (../chat/MessageMenu.tsx).
 * Every message but a day pill has the menu — text, photo, voice, video,
 * file, location, call cards, the note. Its actions work on the state: reply, forward (a sheet
 * picks the chat), copy, delete, edit; Forward is dimmed on a call card or
 * a note, Edit on anything but my own text. Category and re-remind say
 * "Soon available". The body scrolls on its own under the head, opens at
 * its end, the newest message, and holds still while a menu is open; a
 * menu that would not fit moves its message instead of scrolling.
 */
/** While a menu is open, a finger dragged this far (px), or a wheel turned this far (px), closes it. */
const DRAG_CLOSE = 24;
const WHEEL_CLOSE = 60;
/** Only a text I sent can be edited. */
const canEditOf = (m: Holdable) => m.kind === "text" && m.side === "out";
/** A call card or a note is not forwarded. */
const canForwardOf = (m: Holdable) => isOpenable(m);

export default function ConversationScreen() {
  const { t, navigate, back, locale } = useDemoNav();
  const {
    state,
    dispatch,
    sendText,
    sendPhoto,
    sendVoice,
    sendVideo,
    sendFile,
    sendLocation,
    forward,
    notice,
    search,
    setSearch,
  } = useDemoChat();
  const chatId = state.viewing ?? state.active;
  const chat = state.chats.find((c) => c.id === chatId) ?? state.chats[0];
  const contact = contactOf(state, chat);
  const [menu, setMenu] = useState<string | null>(null);

  // Safari's top area goes as dark as the head under the wash while a menu is open.
  useTopTint(MENU_DIM_TINT, !!menu);
  // The message above the blur: it stays up until the blur has faded out.
  const [lifted, setLifted] = useState<string | null>(null);
  // How far the held message is moved so it and its menu are on the screen.
  const [shift, setShift] = useState(0);
  const [context, setContext] = useState<ComposerContext | null>(null);
  const [forwarding, setForwarding] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  /** The message whose Category sheet is up, and the one whose Remind me sheet is up. */
  const [tagging, setTagging] = useState<Holdable | null>(null);
  const [reminding, setReminding] = useState<Holdable | null>(null);
  /** The message whose expanded reactions sheet is up (opened by "+" button). */
  const [reactingMore, setReactingMore] = useState<Holdable | null>(null);
  // The message search: the field in the head, the up / down bar at the
  // bottom. It opens on its own when the contact screen's Search sent us.
  const [searching, setSearching] = useState(search);
  const [query, setQuery] = useState("");
  /** Which match is the current one. */
  const [hit, setHit] = useState(0);
  const searchField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (search) {
      setSearching(true);
      setSearch(false);
    }
  }, [search]);
  const body = useRef<HTMLDivElement>(null);
  /** The message a tapped quote went to, lit up; `n` counts the taps so a second one lights it again. */
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);
  /** The messages on the page when it opened: only later ones pop in. */
  const atStart = useRef<Set<string> | null>(null);
  if (atStart.current === null)
    atStart.current = new Set(chat?.messages.map((m) => m.id));

  // The chat is on the screen: its unread count clears, and a message that
  // comes in now is read at once.
  useEffect(() => {
    dispatch({ type: "open", chat: chat.id });
    return () => dispatch({ type: "leave" });
    // Once, for the chat the screen opened with.
  }, []);

  // Open at the newest message, before the first paint.
  useLayoutEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // A new message scrolls into view: always for one I sent, and for one that
  // came in when the end of the chat was already in view.
  const messages = chat?.messages ?? [];
  const lastId = messages[messages.length - 1]?.id;
  const typingNow = !!chat?.typingNow;
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    const own = last && isOpenable(last) && last.side === "out";
    const nearEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 240;
    if (own || nearEnd)
      requestAnimationFrame(() =>
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }),
      );
    // Only when the end of the chat changes.
  }, [lastId, typingNow]);

  // The chat holds still while a menu is open, as on the iPhone: the finger
  // and the wheel are stopped. Not by switching the body to
  // `overflow: hidden`: on the iPhone that takes the chat's scroll layer
  // down and builds it again, so the whole chat is drawn again on the frame
  // the menu opens and again when it closes, and the menu stuttered.
  // `passive: false`: a passive listener cannot stop the scroll.
  // A small push on the chat changes nothing, but a real scroll (a finger
  // dragged past DRAG_CLOSE px, or a wheel turned past WHEEL_CLOSE px in one
  // go) closes the menu, as on WhatsApp.
  useEffect(() => {
    const el = body.current;
    if (!el || !menu) return;
    const shut = () => {
      setMenu(null);
      setShift(0);
    };
    let startY = 0;
    let wheeled = 0;
    let wheelAt = 0;
    const down = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0;
    };
    const hold = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      if (e.type === "touchmove") {
        const y = (e as TouchEvent).touches[0]?.clientY ?? startY;
        if (Math.abs(y - startY) > DRAG_CLOSE) shut();
      } else {
        // The turns of one scroll add up; a pause of 250 ms starts afresh.
        const now = Date.now();
        wheeled = now - wheelAt > 250 ? 0 : wheeled;
        wheelAt = now;
        wheeled += Math.abs((e as WheelEvent).deltaY);
        if (wheeled > WHEEL_CLOSE) shut();
      }
    };
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchmove", hold, { passive: false });
    el.addEventListener("wheel", hold, { passive: false });
    return () => {
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchmove", hold);
      el.removeEventListener("wheel", hold);
    };
  }, [menu]);

  /**
   * How far a message moves while its menu is open. A menu that would run
   * under the screen's end (or a message held while it is half above the
   * head) moves the message, as WhatsApp does: the chat itself stays where
   * it is. Worked out before the menu opens, from the row's box and the
   * menu's known height, so the menu opens in one render: measuring the
   * menu once it was on the page set the shift in a second render of the
   * whole chat, on the same frame, and the menu stuttered.
   */
  const shiftFor = (m: Holdable) => {
    const el = body.current;
    const row = el?.querySelector<HTMLElement>(`[data-pw="demo-chat-message-${m.id}"]`);
    if (!el || !row) return 0;
    const page = el.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    // The menu hangs MENU_GAP under the row (`top: 100%`).
    const menuBottom =
      box.bottom + MENU_GAP + menuHeight(canEditOf(m), canForwardOf(m));
    let move = 0;
    if (menuBottom > page.bottom - 8) move = page.bottom - 8 - menuBottom;
    // The emoji bar over the message must stay in view too.
    const barTop = box.top - REACTION_GAP - REACTION_BAR_H;
    if (barTop + move < page.top + 8) move = page.top + 8 - barTop;
    return Math.round(move);
  };

  const close = () => {
    setMenu(null);
    setShift(0);
  };

  /**
   * A tap on a quote: the chat scrolls the quoted message to its middle, and
   * once the scroll stops the message lights up and fades, as on WhatsApp.
   * Only the chat's own body scrolls, never the page under it. Nothing
   * happens when the quoted message is gone.
   */
  const jumpTo = (id: string) => {
    const el = body.current;
    const row = el?.querySelector<HTMLElement>(`[data-pw="demo-chat-message-${id}"]`);
    if (!el || !row) return;
    const page = el.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    const middle = box.top - page.top + el.scrollTop - (el.clientHeight - box.height) / 2;
    const top = Math.max(0, Math.min(Math.round(middle), el.scrollHeight - el.clientHeight));
    const light = () => setFlash((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    if (Math.abs(top - el.scrollTop) < 2) {
      light();
      return;
    }
    // The light waits for the scroll to stop: no scroll event for 120 ms.
    let quiet: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      clearTimeout(quiet);
      quiet = setTimeout(() => {
        el.removeEventListener("scroll", settle);
        light();
      }, 120);
    };
    el.addEventListener("scroll", settle, { passive: true });
    settle();
    el.scrollTo({ top, behavior: "smooth" });
  };

  // The matches of the search, and the current one scrolled into the middle.
  const matches = searching ? searchMessages(chat, query) : [];
  const current = matches.length ? matches[Math.min(hit, matches.length - 1)] : null;
  useEffect(() => {
    if (!current) return;
    body.current
      ?.querySelector(`[data-pw="demo-chat-message-${current}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [current]);
  useEffect(() => {
    if (searching) searchField.current?.focus();
  }, [searching]);
  const openSearch = () => {
    setQuery("");
    setHit(0);
    setSearching(true);
  };
  const closeSearch = () => {
    setSearching(false);
    setQuery("");
    setHit(0);
  };
  /** The next match up (-1) or down (+1); a step past the end goes round. */
  const step = (by: 1 | -1) => {
    if (!matches.length) return;
    setHit((h) => (Math.min(h, matches.length - 1) + by + matches.length) % matches.length);
  };

  /** What a message says when it is quoted or previewed. */
  const wordsOf = (m: Holdable) =>
    m.kind === "call"
      ? callWords(m, t)
      : m.kind === "note"
        ? m.text
        : previewOf(m, {
            photo: t("Photo"),
            voice: t("voice message"),
            video: t("Video"),
            file: t("File"),
            location: t("Location"),
          });

  const act = (name: MenuName, m: Holdable) => {
    close();
    switch (name) {
      case "Replay":
        setContext({
          kind: "reply",
          id: m.id,
          name: m.kind !== "note" && m.side === "out" ? t("You") : contact.name,
          text: wordsOf(m),
        });
        return;
      case "Forward":
        if (isOpenable(m)) setForwarding(m.id);
        return;
      case "copy":
        void navigator.clipboard?.writeText(wordsOf(m)).catch(() => {});
        showToast(t("Copied"));
        return;
      case "Delete":
        dispatch({ type: "deleteMessage", chat: chat.id, id: m.id });
        showToast(t("Deleted"));
        return;
      case "Edit":
        if (m.kind === "text" && m.side === "out")
          setContext({ kind: "edit", id: m.id, text: m.text });
        return;
      case "Category":
        setTagging(m);
        return;
      case "re-remind":
        setReminding(m);
        return;
      default:
        showToast(t("Soon available"));
    }
  };

  const send = (text: string) => {
    if (context?.kind === "edit") {
      dispatch({ type: "editMessage", chat: chat.id, id: context.id, text });
    } else {
      const replyTo =
        context?.kind === "reply" ? { id: context.id, text: context.text } : undefined;
      sendText(chat.id, text, replyTo);
    }
    setContext(null);
  };

  // The unread count of the other chats; the file's sample "2" until the state has one.
  const others = state.chats
    .filter((c) => c.id !== chat?.id)
    .reduce((n, c) => n + c.unread, 0);

  /**
   * The head while the search is up: the purple chevron closes it, and the
   * list's search field (38 tall, radius 12, `#F8F8F8`, the glass) takes the
   * rest, with a close mark in it once there are words.
   */
  const searchHeader = (
    <header
      data-pw="demo-chat-search-head"
      className="relative w-full flex items-start"
      style={{ height: 50, background: C.white, boxShadow: "0 0 3px rgba(0,0,0,0.1)" }}
    >
      <button
        type="button"
        data-pw="demo-chat-search-close"
        aria-label={t("Close")}
        onClick={closeSearch}
        className="flex shrink-0 cursor-pointer active:opacity-60"
        style={{ marginLeft: 18.5, marginTop: 13.5 }}
      >
        <XdIcon name="chatBackPurple" />
      </button>
      <div
        className="flex items-start grow min-w-0"
        style={{
          marginLeft: 40 - (18.5 + 8),
          marginRight: 12,
          marginTop: 6,
          height: 38,
          borderRadius: 12,
          background: C.field,
        }}
      >
        <Icon name="searchGlass" ml={9.5} mt={9.5} />
        <input
          ref={searchField}
          data-pw="demo-chat-search-input"
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHit(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              step(e.shiftKey ? -1 : 1);
            }
            if (e.key === "Escape") closeSearch();
          }}
          placeholder={t("Search messages")}
          aria-label={t("Search messages")}
          className="block bg-transparent outline-none font-normal placeholder:text-[#8D8D8D]"
          style={{
            marginLeft: 40 - (9.5 + XD_ICON_SIZE.searchGlass.w),
            marginTop: 7,
            flex: "1 1 0",
            minWidth: 0,
            height: 24,
            fontSize: 14,
            color: C.ink,
            padding: 0,
            border: 0,
          }}
        />
        {query && (
          <button
            type="button"
            data-pw="demo-chat-search-clear"
            aria-label={t("Close")}
            onClick={() => {
              setQuery("");
              setHit(0);
              searchField.current?.focus();
            }}
            className="flex items-center justify-center shrink-0 cursor-pointer active:opacity-60"
            style={{ width: 38, height: 38 }}
          >
            <CloseIcon color={C.grey} />
          </button>
        )}
      </div>
    </header>
  );

  const chatHeader = (
    <header
      className="relative w-full flex items-start"
      style={{
        height: 50,
        background: C.white,
        boxShadow: "0 0 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* The head goes dark with the page, up over the status bar; a click on it closes the menu. */}
      <MenuVeil
        on={!!menu}
        onClick={close}
        testId="demo-chat-head-veil"
        top={`calc(0px - ${SAFE_TOP})`}
      />
      <button
        type="button"
        data-pw="demo-back"
        aria-label={t("Back")}
        onClick={back}
        className="flex shrink-0 cursor-pointer active:opacity-60"
        style={{ marginLeft: 18.5, marginTop: 13.5 }}
      >
        <XdIcon name="chatBackPurple" />
      </button>
      {/* "2" from x 40 to the photo at 62; SF Pro Rounded 18 on baseline 81. */}
      <span
        data-pw="demo-chat-unread-count"
        className="block shrink-0"
        style={{
          marginLeft: 40 - (18.5 + 11),
          marginTop: sfTop(81 - 50, 18, 22),
          width: 62 - 40,
          fontFamily: SF_ROUNDED,
          fontSize: 18,
          lineHeight: "22px",
          color: C.purple,
        }}
      >
        {others > 0 ? String(others) : CHAT_COUNTS.unread}
      </span>
      <button
        type="button"
        data-pw="demo-chat-open-contact"
        onClick={() => navigate("chat/contact")}
        className="flex items-start shrink-0 min-w-0 cursor-pointer active:opacity-60 text-left"
      >
        <span
          className="relative flex flex-col shrink-0 overflow-hidden"
          style={{
            marginTop: 6,
            width: 38,
            height: 38,
            borderRadius: 12,
            background: contact.photo ? undefined : C.field,
          }}
        >
          {contact.photo ? (
            <img
              src={contact.photo}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Txt center size={12} weight="medium" mt={textTop(24, 12)}>
              {contact.initials}
            </Txt>
          )}
          <Stroke color={C.white} width={1} radius={12} />
        </span>
        <Txt
          size={16}
          weight="medium"
          ml={12}
          mt={textTop(81 - 50, 16)}
          className="overflow-hidden whitespace-nowrap"
          style={{ textOverflow: "ellipsis" }}
        >
          {contact.name}
        </Txt>
      </button>
      <button
        type="button"
        data-pw="demo-chat-video-call"
        aria-label={t("Video")}
        onClick={() => navigate("chat/call")}
        className="flex shrink-0 ml-auto cursor-pointer active:opacity-60"
        style={{ marginTop: 12 }}
      >
        <XdIcon name="chatHeaderVideo" />
      </button>
      <button
        type="button"
        data-pw="demo-chat-voice-call"
        aria-label={t("Call")}
        onClick={() => navigate("chat/call")}
        className="flex shrink-0 cursor-pointer active:opacity-60"
        style={{ marginLeft: 379 - 349, marginRight: 430 - 405, marginTop: 12 }}
      >
        <XdIcon name="chatHeaderCall" />
      </button>
    </header>
  );

  const header = searching ? searchHeader : chatHeader;

  /** The menu of a message, when it is this message's. */
  const menuOf = (m: Holdable) => (
    <AnimatePresence>
      {menu === m.id && (
        <MessageMenu
          key="menu"
          side={m.kind === "note" ? "in" : m.side}
          canEdit={canEditOf(m)}
          canForward={canForwardOf(m)}
          reaction={m.reaction}
          onPick={(name) => act(name, m)}
          onReact={(emoji, from) => {
            // A new emoji flies from the bar to its chip on the message.
            if (m.reaction !== emoji) launchReaction({ id: m.id, emoji, ...from });
            close();
            dispatch({ type: "react", chat: chat.id, id: m.id, emoji });
          }}
          onMore={() => {
            close();
            setReactingMore(m);
          }}
          t={t}
        />
      )}
    </AnimatePresence>
  );

  const open = (m: Holdable) => {
    setShift(shiftFor(m));
    setMenu(m.id);
    setLifted(m.id);
  };

  /** The row every message but a day pill sits in: it holds the gestures and the menu. */
  const rowProps = (m: Holdable, gap: number) => ({
    id: m.id,
    side: m.kind === "note" ? ("in" as const) : m.side,
    gap,
    lifted: lifted === m.id,
    shift: menu === m.id ? shift : 0,
    layoutKey: messages,
    faded: searching && query.trim() !== "" && !matches.includes(m.id),
    marked: current === m.id,
    flash: flash?.id === m.id ? flash.n : 0,
    fresh: !atStart.current?.has(m.id),
    onReply: () => act("Replay", m),
    onHold: () => open(m),
    menu: menuOf(m),
  });

  /**
   * The flags over a message (its category, its reminder), when it has any:
   * the block goes into a column with the flags line over it, on its side.
   * A message with none keeps the row as it was.
   */
  const withFlags = (m: Holdable, wide: boolean, node: React.ReactNode) => {
    const category = m.category
      ? state.categories.find((c) => c.id === m.category)
      : undefined;
    const reminder = m.reminderAt !== undefined ? reminderLabel(m.reminderAt, locale) : undefined;
    if (!category && !reminder && !m.reaction) return node;
    const inn = m.kind === "note" || m.side === "in";
    return (
      <div className={`flex flex-col min-w-0 max-w-full ${wide ? "w-full" : ""} ${inn ? "items-start" : "items-end"}`}>
        <FlagsLine
          side={inn ? "in" : "out"}
          category={category && { ...category, name: t(category.name as DemoKey) }}
          reminder={reminder}
        />
        {wide ? node : <div className="flex items-start min-w-0 max-w-full">{node}</div>}
        {m.reaction && <ReactionChip id={m.id} side={inn ? "in" : "out"} emoji={m.reaction} />}
      </div>
    );
  };

  /** The quoted message's time, for the quote above a reply. */
  const timeOf = (id: string, fallback: string) =>
    messages.find((m) => m.id === id)?.time ?? fallback;

  const draw = (m: ChatMessage, i: number) => {
    const gap = gapAbove(messages, i);
    if (m.kind === "day")
      return (
        <motion.div
          key={m.id}
          layout="position"
          layoutDependency={messages}
          className="flex w-full shrink-0 justify-center"
          style={{ marginTop: gap }}
          initial={atStart.current?.has(m.id) ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <DayPill label={t(m.label)} />
        </motion.div>
      );
    if (m.kind === "note")
      return (
        <MessageRow key={m.id} {...rowProps(m, gap)} wide>
          {withFlags(m, true, <Note text={m.text} />)}
        </MessageRow>
      );
    if (m.kind === "call")
      return (
        <MessageRow key={m.id} {...rowProps(m, gap)} wide>
          {withFlags(m, true, <CallCard message={m} t={t} />)}
        </MessageRow>
      );
    const inn = m.side === "in";
    const isOpen = menu === m.id;
    /** The block between the dots: a bubble, a picture, a player or a card. */
    const block = () => {
      switch (m.kind) {
        case "text":
          return (
            <Bubble
              side={m.side}
              text={m.text}
              time={m.time}
              status={m.status}
              replied={m.repliedTo}
              edited={m.edited}
              forwarded={m.forwarded}
              open={isOpen}
              t={t}
            />
          );
        case "photo":
          return (
            <PhotoMessage
              side={m.side}
              src={m.src}
              time={m.time}
              status={m.status}
              open={isOpen}
            />
          );
        case "video":
          return (
            <VideoMessage
              side={m.side}
              src={m.src}
              seconds={m.seconds}
              time={m.time}
              status={m.status}
              open={isOpen}
              t={t}
            />
          );
        case "file":
          return <FileMessage message={m} open={isOpen} t={t} />;
        case "location":
          return <LocationMessage message={m} open={isOpen} t={t} />;
        default:
          return null;
      }
    };
    const row = (
      <MessageRow
        key={m.id}
        {...rowProps(m, m.kind === "text" && m.replyTo ? 0 : gap)}
        wide={m.kind === "voice"}
      >
        {m.kind === "voice"
          ? withFlags(
              m,
              true,
              <VoiceMessage
                side={m.side}
                seconds={m.seconds}
                time={m.time}
                status={m.status}
                open={isOpen}
                t={t}
              />,
            )
          : withFlags(
              m,
              false,
              <>
                {inn && <Dot color={C.purple} ml={5} />}
                {block()}
                {!inn && <Dot color={CHAT.sentDot} mr={5} />}
              </>,
            )}
      </MessageRow>
    );
    // The quote above a reply is its own row, so the list's presence
    // animation sees one motion block per entry.
    if (m.kind === "text" && m.replyTo)
      return [
        <motion.div
          key={`${m.id}-quote`}
          layout="position"
          layoutDependency={messages}
          className="w-full shrink-0"
          style={{ marginTop: gap }}
          initial={atStart.current?.has(m.id) ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <Quote
            text={m.replyTo.text}
            time={timeOf(m.replyTo.id, m.time)}
            onOpen={() => jumpTo(m.replyTo!.id)}
          />
        </motion.div>,
        row,
      ];
    return row;
  };

  /** The search's bar in the composer's place: up, down and "n of m". */
  const searchBar = (
    <div
      data-pw="demo-chat-search-bar"
      className="flex items-center w-full shrink-0"
      style={{
        height: 54,
        padding: "0 12px",
        paddingBottom: SAFE_BOTTOM,
        background: C.white,
        boxShadow: "0 0 3px rgba(0,0,0,0.1)",
      }}
    >
      <button
        type="button"
        data-pw="demo-chat-search-up"
        aria-label={t("Previous")}
        onClick={() => step(-1)}
        disabled={!matches.length}
        className="flex items-center justify-center shrink-0 cursor-pointer active:opacity-60 disabled:opacity-30"
        style={{ width: 38, height: 38 }}
      >
        <ChevronUpIcon color={C.purple} />
      </button>
      <button
        type="button"
        data-pw="demo-chat-search-down"
        aria-label={t("Next")}
        onClick={() => step(1)}
        disabled={!matches.length}
        className="flex items-center justify-center shrink-0 cursor-pointer active:opacity-60 disabled:opacity-30"
        style={{ width: 38, height: 38 }}
      >
        <ChevronDownIcon color={C.purple} />
      </button>
      <Txt
        size={13}
        weight="medium"
        color={matches.length ? C.ink : C.grey}
        className="ml-auto"
        data-pw="demo-chat-search-count"
      >
        {!query.trim()
          ? ""
          : matches.length
            ? t("{n} of {m}")
                .replace("{n}", String(Math.min(hit, matches.length - 1) + 1))
                .replace("{m}", String(matches.length))
            : t("No results")}
      </Txt>
    </div>
  );

  const bottom = (
    <div className="relative shrink-0 w-full">
      {/* Above the composer, whatever its height is. */}
      <Toast text={notice ?? toast} bottom="calc(100% + 12px)" />
      {searching ? searchBar : (
      <Composer
        context={context}
        onCancelContext={() => setContext(null)}
        onSend={send}
        onSendPhoto={(src) => sendPhoto(chat.id, src)}
        onSendVoice={(seconds) => sendVoice(chat.id, seconds)}
        onSendVideo={(src, seconds) => sendVideo(chat.id, src, seconds)}
        onSendFile={(file) => sendFile(chat.id, file)}
        onSendLocation={(point) => sendLocation(chat.id, point)}
        onToast={showToast}
        veiled={!!menu}
        t={t}
      />
      )}
    </div>
  );

  return (
    <ScreenPage
      testId="demo-conversation"
      bg={C.page}
      header={header}
      scrollBody
      bodyRef={body}
      bottom={bottom}
    >
      <div className="relative flex flex-col w-full">
        <ReactionWarmup />
        {/* The dark, lightly blurred wash over the conversation while a menu
          is open (the head and the composer carry the same wash); a click
          on it closes the menu. Over the whole body, so it scrolls with
          it; the lifted message and its menu sit above it. One
          backdrop-filter layer that only fades: a blur that grows on every
          row is drawn again on every frame, and the menu stuttered on the
          iPhone. */}
        <div
          className="flex items-start w-full shrink-0"
          style={{ marginTop: 4 }}
        >
          <Dot color={C.purple} ml={4} mt={10} />
          <SmallPhoto src={contact.photo} initials={contact.initials} ml={2} line={1} />
          <SmallPhoto src={CHAT_PHOTOS.me} ml="auto" line={0.5} />
          <Dot color={CHAT.sent} ml={2} mr={4} mt={10} />
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {messages.flatMap(draw)}
          {typingNow && (
            <motion.div
              key="typing"
              layout="position"
              layoutDependency={messages}
              className="w-full shrink-0"
              style={{ marginTop: 12, transformOrigin: "left bottom" }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.15 } }}
            >
              <TypingBubble />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The dark, blurred wash over the conversation while a menu is open
          (the head and the composer carry the same wash); a click on it closes
          the menu. Placed after the messages in the DOM so that all other
          messages are blurred and dimmed underneath it. The lifted message has
          z-20, so it and its menu remain sharp and clear on top of this layer. */}
        <AnimatePresence onExitComplete={() => setLifted(null)}>
          {menu && (
            <motion.div
              key="backdrop"
              data-pw="demo-chat-menu-backdrop"
              className="absolute inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MENU_FADE, ease: "easeOut" }}
              style={{
                background: MENU_DIM,
                backdropFilter: `blur(${MENU_BLUR}px)`,
                WebkitBackdropFilter: `blur(${MENU_BLUR}px)`,
                willChange: "opacity",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                contain: "layout paint",
              }}
              onClick={close}
            />
          )}
        </AnimatePresence>
        {/* Room for the last message's menu under its bubble. */}
        <div className="shrink-0" style={{ height: MENU_GAP + MENU_H + 8 }} />
      </div>

      <ForwardSheet
        open={forwarding !== null}
        chats={state.chats}
        contacts={state.contacts}
        except={chat.id}
        onPick={(to) => {
          if (forwarding) forward(chat.id, forwarding, to);
          setForwarding(null);
          showToast(t("Forwarded"));
        }}
        onClose={() => setForwarding(null)}
        t={t}
      />
      <CategorySheet
        open={tagging !== null}
        categories={state.categories}
        chosen={tagging?.category}
        onPick={(category) => {
          if (tagging) dispatch({ type: "category", chat: chat.id, id: tagging.id, category });
          setTagging(null);
        }}
        onClose={() => setTagging(null)}
        t={t}
      />
      <ReminderSheet
        open={reminding !== null}
        current={reminding?.reminderAt}
        locale={locale}
        onPick={(at) => {
          if (reminding) dispatch({ type: "remind", chat: chat.id, id: reminding.id, at });
          setReminding(null);
          if (at !== null) showToast(t("Reminder"));
        }}
        onClose={() => setReminding(null)}
        t={t}
      />
      <ReactionSheet
        open={reactingMore !== null}
        currentReaction={reactingMore?.reaction}
        onPick={(emoji, from) => {
          if (reactingMore) {
            if (reactingMore.reaction !== emoji) {
              launchReaction({ id: reactingMore.id, emoji, ...from });
            }
            dispatch({ type: "react", chat: chat.id, id: reactingMore.id, emoji });
          }
          setReactingMore(null);
        }}
        onClose={() => setReactingMore(null)}
        t={t}
      />
    </ScreenPage>
  );
}
