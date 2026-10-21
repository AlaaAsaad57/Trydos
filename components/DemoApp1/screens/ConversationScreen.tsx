"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { CHAT, CHAT_COUNTS, CHAT_PHOTOS, CONTACT } from "../../DemoApp/demoChat";
import {
  gapAbove,
  isOpenable,
  previewOf,
  type ChatMessage,
  type Openable,
} from "../../DemoApp/demoChatModel";
import { useDemoChat } from "../../DemoApp/demoChatState";
import { useDemoNav } from "../Demo1Shell";
import { C, SF_ROUNDED, sfTop, textTop } from "../demo1Layout";
import { ScreenPage, Stroke, Txt } from "../ui";
import Composer, { type ComposerContext } from "../chat/Composer";
import ForwardSheet from "../chat/ForwardSheet";
import MessageMenu, {
  MENU_BLUR,
  MENU_FADE,
  type MenuName,
} from "../chat/MessageMenu";
import MessageRow from "../chat/MessageRow";
import {
  Bubble,
  CallCard,
  DayPill,
  Dot,
  Note,
  PhotoMessage,
  Quote,
  SmallPhoto,
  TypingBubble,
  VoiceMessage,
} from "../chat/messages";
import Toast, { useToast } from "../chat/Toast";

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
 * The gestures are WhatsApp's on the iPhone (../chat/MessageRow.tsx): pull a
 * message right to answer it; hold it to lift it, blur everything else and
 * pop its menu (../chat/MessageMenu.tsx). The menu's actions work on the
 * state: reply, forward (a sheet picks the chat), copy, delete, edit.
 * Category and re-remind say "Soon available". The body scrolls on its own
 * under the head, opens at its end, the newest message, and holds still
 * while a menu is open.
 */
export default function ConversationScreen() {
  const { t, navigate, back } = useDemoNav();
  const { state, dispatch, sendText, sendPhoto, sendVoice, forward } = useDemoChat();
  const chatId = state.viewing ?? state.active;
  const chat = state.chats.find((c) => c.id === chatId) ?? state.chats[0];
  const [menu, setMenu] = useState<string | null>(null);
  // The message above the blur: it stays up until the blur has faded out.
  const [lifted, setLifted] = useState<string | null>(null);
  const [context, setContext] = useState<ComposerContext | null>(null);
  const [forwarding, setForwarding] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const body = useRef<HTMLDivElement>(null);
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

  // The chat holds still while a menu is open, as on the iPhone. With
  // `important`: the site's Tailwind utilities are `!important`, and the
  // body's `overflow-y-auto` would win over a plain inline style.
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    if (menu) el.style.setProperty("overflow-y", "hidden", "important");
    else el.style.removeProperty("overflow-y");
  }, [menu]);

  const close = () => setMenu(null);

  /** What a message says when it is quoted or previewed. */
  const wordsOf = (m: Openable) =>
    previewOf(m, { photo: t("Photo"), voice: t("voice message") });

  const act = (name: MenuName, m: Openable) => {
    close();
    switch (name) {
      case "Replay":
        setContext({
          kind: "reply",
          id: m.id,
          name: m.side === "out" ? t("You") : CONTACT.name,
          text: wordsOf(m),
        });
        return;
      case "Forward":
        setForwarding(m.id);
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

  const header = (
    <header
      className="relative w-full flex items-start"
      style={{
        height: 50,
        background: C.white,
        boxShadow: "0 0 3px rgba(0,0,0,0.1)",
        filter: menu ? `blur(${MENU_BLUR}px)` : "blur(0px)",
        transition: `filter ${MENU_FADE}s ease-out`,
      }}
    >
      {/* The head blurs with the page; a click on it closes the menu. */}
      {menu && <div className="absolute inset-0 z-10" onClick={close} />}
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
          className="relative block shrink-0 overflow-hidden"
          style={{ marginTop: 6, width: 38, height: 38, borderRadius: 12 }}
        >
          <img
            src={CHAT_PHOTOS.contact}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <Stroke color={C.white} width={1} radius={12} />
        </span>
        <Txt size={16} weight="medium" ml={12} mt={textTop(81 - 50, 16)}>
          {CONTACT.name}
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

  /** The menu of a message, when it is this message's. */
  const menuOf = (m: Openable) => (
    <AnimatePresence>
      {menu === m.id && (
        <MessageMenu
          key="menu"
          side={m.side}
          canEdit={m.kind === "text" && m.side === "out"}
          onPick={(name) => act(name, m)}
          t={t}
        />
      )}
    </AnimatePresence>
  );

  const open = (m: Openable) => {
    setMenu(m.id);
    setLifted(m.id);
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
        <motion.div key={m.id} layout="position" className="w-full shrink-0" style={{ marginTop: gap }}>
          <Note text={m.text} />
        </motion.div>
      );
    if (m.kind === "call")
      return (
        <motion.div key={m.id} layout="position" className="w-full shrink-0" style={{ marginTop: gap }}>
          <CallCard message={m} t={t} />
        </motion.div>
      );
    const inn = m.side === "in";
    const isOpen = menu === m.id;
    const row = (
      <MessageRow
        key={m.id}
        id={m.id}
        side={m.side}
        gap={m.kind === "text" && m.replyTo ? 0 : gap}
        lifted={lifted === m.id}
        fresh={!atStart.current?.has(m.id)}
        wide={m.kind === "voice"}
        onReply={() => act("Replay", m)}
        onHold={() => open(m)}
        menu={menuOf(m)}
      >
        {m.kind === "voice" ? (
          <VoiceMessage
            side={m.side}
            seconds={m.seconds}
            time={m.time}
            status={m.status}
            open={isOpen}
            t={t}
          />
        ) : (
          <>
            {inn && <Dot color={C.purple} ml={5} />}
            {m.kind === "text" ? (
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
            ) : (
              <PhotoMessage
                side={m.side}
                src={m.src}
                time={m.time}
                status={m.status}
                open={isOpen}
              />
            )}
            {!inn && <Dot color={CHAT.sentDot} mr={5} />}
          </>
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
          className="w-full shrink-0"
          style={{ marginTop: gap }}
          initial={atStart.current?.has(m.id) ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <Quote text={m.replyTo.text} time={timeOf(m.replyTo.id, m.time)} />
        </motion.div>,
        row,
      ];
    return row;
  };

  const bottom = (
    <div className="relative shrink-0 w-full">
      {/* Above the composer, whatever its height is. */}
      <Toast text={toast} bottom="calc(100% + 12px)" />
      <Composer
        context={context}
        onCancelContext={() => setContext(null)}
        onSend={send}
        onSendPhoto={(src) => sendPhoto(chat.id, src)}
        onSendVoice={(seconds) => sendVoice(chat.id, seconds)}
        onToast={showToast}
        blur={menu ? MENU_BLUR : 0}
        t={t}
      />
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
        {/* Blurs the conversation under the open menu and closes it on a
          click: over the whole body, so it scrolls with it. The lifted
          message and its menu sit above it. */}
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
                background: "rgba(0,0,0,0.08)",
                backdropFilter: `blur(${MENU_BLUR}px)`,
                WebkitBackdropFilter: `blur(${MENU_BLUR}px)`,
              }}
              onClick={close}
            />
          )}
        </AnimatePresence>

        <div
          className="flex items-start w-full shrink-0"
          style={{ marginTop: 4 }}
        >
          <Dot color={C.purple} ml={4} mt={10} />
          <SmallPhoto src={CHAT_PHOTOS.contact} ml={2} line={1} />
          <SmallPhoto src={CHAT_PHOTOS.me} ml="auto" line={0.5} />
          <Dot color={CHAT.sent} ml={2} mr={4} mt={10} />
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {messages.flatMap(draw)}
          {typingNow && (
            <motion.div
              key="typing"
              layout="position"
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
        {/* Room for the last message's menu (64 + 40 + 5 + 22 under the bubble). */}
        <div className="shrink-0" style={{ height: 172 }} />
      </div>

      <ForwardSheet
        open={forwarding !== null}
        chats={state.chats}
        except={chat.id}
        onPick={(to) => {
          if (forwarding) forward(chat.id, forwarding, to);
          setForwarding(null);
          showToast(t("Forwarded"));
        }}
        onClose={() => setForwarding(null)}
        t={t}
      />
    </ScreenPage>
  );
}
