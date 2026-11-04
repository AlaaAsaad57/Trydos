"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { CHAT } from "../chat/chatTheme";
import { chatOnScreen, contactOf } from "../chat/chatModel";
import ChatWaiting from "../chat/ChatWaiting";
import ChatGate from "../chat/ChatGate";
import { mirrorFor, usePageDir } from "../rtl";
import { useChat } from "../chat/chatContext";
import { useDemoNav } from "../screenNav";
import { useDemoCase } from "../demoCase";
import { MediaSheet } from "../chat/ExtraSheets";
import Toast, { useToast } from "../chat/Toast";
import { translateFunction } from "utils/functions";
import {
  C,
  ROW,
  SF_ROUNDED,
  STATUS_BAR,
  fill,
  lineBox,
  sfTop,
  textBottom,
  textTop,
} from "../demo1Layout";
import { ScreenPage, Stroke, Txt } from "../ui";

/**
 * A contact — XD `Home Page – 45`. A white page with no header strip:
 *
 *   - the blue chevron (3 px line, 8 x 20 at 20, 65) scrolls with the page;
 *   - the photo 131 x 150, radius 30, 1 px purple line, centred at y 102;
 *   - the name 16 Medium on baseline 280 and the number 16 Regular on 304,
 *     both centred;
 *   - Call, Video and Search: 26 px icons at y 358 in three 133 px columns
 *     from x 16.5, their words 13 Medium on baseline 405;
 *   - three 406 x 60 rows (`#FCFCFC`, radius 15) from y 458, 2 px apart: an
 *     18 px icon at x 24, the words 14 Regular at x 54 on baseline 35, and
 *     "ALWAYS" ending 6 px before the row's right edge;
 *   - "Enable Call" and "Disable Call" (the file says "Desible", fixed by D-7), SF Pro Rounded
 *     12 on baselines 670 and 686, ending at x 408;
 *   - Delete Chat (x 79), Block (x 240) and Share, SF Pro Rounded 12 on
 *     baseline 814 with 25 px icons at y 768; UnBlock under Block, its grey
 *     icon at y 829 and its word on baseline 875.
 *
 * The file stacks both states of the call switch and of block / unblock.
 * The screen shows one of each, read from the chat (demoChatModel.ts:
 * `callsDisabled`, `blocked`), in the place of the file's first line: the
 * switch reads "Disable Call" while the contact may call and "Enable Call"
 * once they may not; Block is the red mark until the contact is blocked,
 * then the grey mark and "UnBlock". A tap flips each one.
 */
/** The contact screen, once its chat is there (see ConversationScreen). */
export default function ContactScreen() {
  const { state, gate } = useChat();
  if (gate) return <ChatGate kind={gate.kind} onOpen={gate.open} />;
  if (!chatOnScreen(state)) return <ChatWaiting />;
  return <Contact />;
}

function Contact() {
  const { navigate, back } = useDemoNav();
  const { t } = useDemoCase();
  const dir = usePageDir();
  const { state, dispatch, setSearch, call, extras } = useChat();
  const [media, setMedia] = useState(false);
  const [toast, showToast] = useToast();
  /** No chat backend for it yet (A-8, D-38). */
  const soon = () => showToast(translateFunction("Soon available"));
  // ContactScreen draws this only when there is a chat.
  const chat = chatOnScreen(state)!;
  const contact = contactOf(state, chat);
  const callsOff = !!chat?.callsDisabled;
  const blocked = !!chat?.blocked;
  const actionsTop = 358;
  const labelTop = textTop(405, 13);
  /** A short fade and lift as a word or a mark gives way to its other state. */
  const flip = {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.16, ease: "easeOut" as const },
  };
  return (
    <ScreenPage testId="demo-contact" scrollTop={STATUS_BAR}>
      <button
        type="button"
        data-pw="demo-back"
        aria-label={t("Back")}
        onClick={back}
        className="flex self-start shrink-0 cursor-pointer active:opacity-60"
        style={{ marginInlineStart: 18.5, marginTop: 63.5 - 50 }}
      >
        <XdIcon name="contactBackBlue" style={mirrorFor(dir)} />
      </button>

      <div
        data-pw="demo-contact-photo"
        className="relative flex flex-col shrink-0 self-center overflow-hidden"
        style={{
          marginTop: 102 - (63.5 + 23),
          width: 131,
          height: 150,
          borderRadius: 30,
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
          <Txt center size={28} weight="medium" mt={textTop(85, 28)}>
            {contact.initials}
          </Txt>
        )}
        <Stroke color={C.purple} width={1} radius={30} />
      </div>
      <Txt center size={16} weight="medium" mt={textTop(280, 16) - 252}>
        {contact.name}
      </Txt>
      <Txt center size={16} mt={textTop(304, 16) - textBottom(280, 16)}>
        {/* A phone number reads left to right on every page. */}
        <bdi dir="ltr">{contact.phone}</bdi>
      </Txt>

      <div
        className="flex items-start shrink-0"
        style={{
          marginInlineStart: 16.5,
          width: fill(16.5, 14.5),
          marginTop: actionsTop - textBottom(304, 16),
        }}
      >
        <Action icon="chatHeaderCall" label="Call" onClick={() => (call ? call(chat.id, false) : navigate("chat/call"))} labelTop={labelTop - actionsTop} t={t} />
        <Action icon="chatHeaderVideo" label="Video" onClick={() => (call ? call(chat.id, true) : navigate("chat/call"))} labelTop={labelTop - actionsTop} t={t} />
        <Action
          icon="contactSearch"
          label="Search"
          onClick={() => {
            // The conversation opens with its message search up.
            setSearch(true);
            back();
          }}
          labelTop={labelTop - actionsTop}
          t={t}
        />
      </div>

      <Row icon="rowMedia" label="Media & Files" mt={458 - (labelTop + lineBox(13))} onClick={() => setMedia(true)} t={t} />
      <Row icon="rowGallery" label="Save To Gallery" value="ALWAYS" mt={2} onClick={soon} t={t} />
      <Row icon="rowGallery" label="Notification" value="ALWAYS" mt={2} onClick={soon} t={t} />

      {/* The file's two SF Pro Rounded 12 lines, 17 px apart, ending 22 px
          before the right edge: the switch takes the first line, the second
          stays empty so the blocks under it keep their place. */}
      <div
        className="flex flex-col items-end shrink-0"
        style={{ marginTop: sfTop(670, 12, 17) - 642, marginInlineEnd: 430 - 408, height: 34 }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div key={callsOff ? "enable" : "disable"} {...flip} className="shrink-0">
            <SfLine
              label={callsOff ? "Enable Call" : "Disable Call"}
              testId={callsOff ? "demo-contact-enable-call" : "demo-contact-disable-call"}
              onClick={() => chat && dispatch({ type: "calls", chat: chat.id })}
              t={t}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        className="flex items-start shrink-0"
        style={{ marginTop: 768 - (sfTop(670, 12, 17) + 34) }}
      >
        <BottomAction
          icon="deleteChat"
          label="Delete Chat"
          color={CHAT.greyText}
          ml={61}
          width={125 - 61}
          iconLeft={79 - 61}
          onClick={() => {
            if (!chat) return;
            dispatch({ type: "deleteChat", chat: chat.id });
            navigate("chat", -1);
          }}
          t={t}
        />
        {/* Block in the file's place; UnBlock (the grey mark) takes the same
            place once the contact is blocked — the file draws it lower only
            to show both. */}
        <div className="flex flex-col items-center shrink-0" style={{ marginInlineStart: 238 - 125, width: 268 - 238 }}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div key={blocked ? "unblock" : "block"} {...flip} className="flex shrink-0">
              <BottomAction
                icon={blocked ? "blockGrey" : "blockRed"}
                label={blocked ? "UnBlock" : "Block"}
                color={C.red}
                ml={0}
                width={30}
                iconLeft={2}
                onClick={() => chat && dispatch({ type: "block", chat: chat.id })}
                t={t}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <SfLine
          label="Share"
          testId="demo-contact-share"
          style={{ marginInlineStart: 339 - 268, marginTop: sfTop(814, 12, 17) - 768 }}
          onClick={soon}
          t={t}
        />
      </div>
      <MediaSheet
        open={media}
        messages={chat.messages}
        categories={state.categories}
        tagged={extras && ((label) => extras.tagged(chat.id, label))}
        onPick={(id) => {
          // The conversation scrolls to the message and flashes it.
          setMedia(false);
          extras?.setJump(id);
          back();
        }}
        onClose={() => setMedia(false)}
        t={t}
      />
      <Toast text={toast} bottom={40} fixed />
      <div className="shrink-0" style={{ height: 60 }} />
    </ScreenPage>
  );
}

/** One of the three columns: the icon centred, its word 13 Medium centred under it. */
function Action({
  icon,
  label,
  onClick,
  labelTop,
  t,
}: {
  icon: XdIconName;
  label: DemoKey;
  onClick?: () => void;
  labelTop: number;
  t: (key: DemoKey) => string;
}) {
  return (
    <motion.button
      type="button"
      data-pw={`demo-contact-${label.toLowerCase()}`}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="flex flex-col items-center cursor-pointer"
      style={{ flex: "1 1 0", minWidth: 0 }}
    >
      <XdIcon name={icon} />
      <Txt
        size={13}
        weight="medium"
        mt={labelTop - 26}
        style={{ letterSpacing: "0.01em" }}
      >
        {t(label)}
      </Txt>
    </motion.button>
  );
}

/** A 406 x 60 row: the 18 px icon 12 px in, the words at x 54, a value ending 6 px before the right edge. */
function Row({
  icon,
  label,
  value,
  mt,
  onClick,
  t,
}: {
  icon: XdIconName;
  label: DemoKey;
  value?: DemoKey;
  mt: number;
  onClick?: () => void;
  t: (key: DemoKey) => string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-pw={`demo-contact-row-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
      whileTap={{ scale: 0.985 }}
      className="flex items-start shrink-0 cursor-pointer text-start"
      style={{
        marginTop: mt,
        marginInlineStart: ROW.x,
        width: fill(ROW.x),
        height: 60,
        borderRadius: ROW.radius,
        background: C.card,
      }}
    >
      <XdIcon name={icon} style={{ marginInlineStart: 12, marginTop: 21 }} />
      <Txt size={14} ml={54 - 24 - 18} mt={textTop(35, 14)}>
        {t(label)}
      </Txt>
      {value && (
        <Txt size={14} className="ms-auto" mt={textTop(35, 14)} style={{ marginInlineEnd: 6 }}>
          {t(value)}
        </Txt>
      )}
    </motion.button>
  );
}

/** One SF Pro Rounded 12 line (17 px tall) with the file's 0.01 em spacing. */
function SfLine({
  label,
  color = C.ink,
  testId,
  style,
  onClick,
  t,
}: {
  label: DemoKey;
  color?: string;
  testId: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  t: (key: DemoKey) => string;
}) {
  return (
    <button
      type="button"
      data-pw={testId}
      onClick={onClick}
      className="block shrink-0 whitespace-nowrap cursor-pointer active:opacity-60"
      style={{
        fontFamily: SF_ROUNDED,
        fontSize: 12,
        lineHeight: "17px",
        letterSpacing: "0.01em",
        color,
        ...style,
      }}
    >
      {t(label)}
    </button>
  );
}

/** A 25 px icon with its word under it, 8.5 px lower than the icon's bottom. */
function BottomAction({
  icon,
  label,
  color,
  ml,
  width,
  iconLeft,
  mt = 0,
  onClick,
  t,
}: {
  icon: XdIconName;
  label: DemoKey;
  color: string;
  ml: number;
  width: number;
  iconLeft: number;
  mt?: number;
  onClick?: () => void;
  t: (key: DemoKey) => string;
}) {
  return (
    <button
      type="button"
      data-pw={`demo-contact-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
      onClick={onClick}
      className="flex flex-col shrink-0 cursor-pointer active:opacity-60"
      style={{ marginInlineStart: ml, marginTop: mt, width }}
    >
      <XdIcon name={icon} style={{ marginInlineStart: iconLeft }} />
      <span
        className="block text-center whitespace-nowrap"
        style={{
          marginTop: sfTop(814, 12, 17) - (768 + 25),
          fontFamily: SF_ROUNDED,
          fontSize: 12,
          lineHeight: "17px",
          letterSpacing: "0.01em",
          color,
        }}
      >
        {t(label)}
      </span>
    </button>
  );
}
