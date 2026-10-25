"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { XD_ICON_SIZE, type XdIconName } from "../../DemoApp/xdIcons";
import { CHAT, MENU_ACTIONS } from "../../DemoApp/demoChat";
import type { Side } from "../../DemoApp/demoChatModel";
import { TAB_BAR } from "../../DemoApp/demoLayout";
import { C } from "../demo1Layout";
import { Txt } from "../ui";

export type MenuName = (typeof MENU_ACTIONS)[number] | "Forward";

/**
 * What lies over the screen behind an open menu, and how long it takes to come
 * and go, in s. WhatsApp does not blur the chat; it only makes the whole
 * screen darker. `MENU_DIM` is the wash; `MENU_DIM_TINT` is the colour that
 * wash gives the white head, for Safari's top area to show.
 */
export const MENU_DIM = "rgba(0,0,0,0.3)";
export const MENU_DIM_TINT = "rgb(179, 179, 179)";
export const MENU_FADE = 0.22;

/**
 * The dark wash over one part of the screen while a menu is open (the head,
 * the composer): one plain layer that only fades in and out, no blur.
 * `onClick` makes the layer take the taps (a tap on the head closes the
 * menu); without it a tap goes through, as before. `top` lets it reach above
 * its box (up over the phone's status bar).
 */
export function MenuVeil({
  on,
  onClick,
  testId,
  top = 0,
}: {
  on: boolean;
  onClick?: () => void;
  testId?: string;
  top?: number | string;
}) {
  return (
    <AnimatePresence>
      {on && (
        <motion.div
          key="veil"
          data-pw={testId}
          className="absolute inset-x-0 bottom-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MENU_FADE, ease: "easeOut" }}
          style={{
            top,
            background: MENU_DIM,
            pointerEvents: onClick ? undefined : "none",
          }}
          onClick={onClick}
        />
      )}
    </AnimatePresence>
  );
}

/** The emojis of the bar over the held message, in the bar's order. */
export const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "😘"] as const;

/**
 * The bar's emojis, drawn once when the chat opens and never seen. The
 * first time a page lays out these emojis the browser has to find and load
 * the emoji font, and that layout fell on the frame the first menu opened:
 * measured at about 60 ms on a desktop, so the first menu stuttered.
 * Drawn here, that work is done before any finger holds a message.
 */
export function ReactionWarmup() {
  return (
    <span
      aria-hidden="true"
      data-pw="demo-chat-reactions-warmup"
      className="absolute left-0 top-0 whitespace-nowrap pointer-events-none select-none"
      style={{ fontSize: 27, lineHeight: 1, opacity: 0 }}
    >
      {REACTIONS.join("")}
    </span>
  );
}

/** The bar's height (and its radius twice over), the gap under it to the message, in px. */
export const REACTION_BAR_H = 48;
export const REACTION_GAP = 10;
/** The gap between the message and the menu under it, in px. */
export const MENU_GAP = 11;
/** The menu's width and one row's height, in px. */
export const MENU_W = 220;
export const MENU_ROW_H = 38;
/** The menu's space above the first row and under the last, in px. */
const MENU_PAD = 8;
/** The space that holds the hairline between the actions and Delete, in px. */
const MENU_SEP = 16;
/** The menu's corner radius, in px (WhatsApp's rounded card). */
const MENU_RADIUS = 26;
/** The bar's and the menu's frosted fill, over the glass of the tab bar. */
const BAR_FILL = "rgba(246,245,243,0.72)";
const MENU_FILL = "rgba(240,238,235,0.78)";
/** From the row's edge to the bubble's edge: the dot (5 + 4) and the bubble's own 3. */
const EDGE = 12;

/**
 * One emoji's cell in the bar, the "+" button's size, the room before the first
 * emoji, the room after the last cell, and the "+" button's distance from the
 * bar's end, in px. The "+" lies over the last emoji's edge, as in WhatsApp.
 */
const CELL = 38;
const PLUS = 30;
const LEAD = 4;
const TAIL = 21;
const PLUS_INSET = 7;
export const REACTION_BAR_W = LEAD + CELL * REACTIONS.length + TAIL;

/** How much later each emoji pops in than the one before it, in s. */
const STAGGER = 0.028;

/** The rows of the menu, in order; Forward and Edit go when the message cannot take them. */
const ROWS: { name: MenuName; icon: XdIconName }[] = [
  { name: "Replay", icon: "menuReply" },
  { name: "Forward", icon: "forwardMark" },
  { name: "copy", icon: "menuCopy" },
  { name: "Edit", icon: "menuEdit" },
  { name: "Category", icon: "menuCategory" },
  { name: "re-remind", icon: "menuRemind" },
];

/** The menu's full height, for the room the chat leaves under its last message. */
export const MENU_H = MENU_PAD * 2 + MENU_ROW_H * (ROWS.length + 1) + MENU_SEP;

/** The menu's height for a message: Forward and Edit go when it cannot take them (as the menu draws it). */
export const menuHeight = (canEdit: boolean, canForward: boolean) =>
  MENU_H - (canEdit ? 0 : MENU_ROW_H) - (canForward ? 0 : MENU_ROW_H);

/**
 * An icon of the XD file in a colour of our own: the file's SVG as a mask
 * over a filled box, so Delete can be red and the white Forward arrow dark.
 */
function InkIcon({ name, color, size }: { name: XdIconName; color: string; size: number }) {
  const box = XD_ICON_SIZE[name];
  const url = `url(/assets/demo/xd/${name}.svg)`;
  return (
    <span
      aria-hidden="true"
      className="block shrink-0"
      style={{
        width: size,
        height: (size * box.h) / box.w,
        background: color,
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

/**
 * What a held message gets, the way WhatsApp on the iPhone gives it (the
 * video of 2026-10-22): the emoji bar over the message and the menu under
 * it, both on the message's own side, with the whole screen darker.
 *
 *  - **The bar**: 48 tall, a full pill, frosted (the tab bar's glass), with
 *    the seven emojis 38 px apart and a light "+" disc (30) over the last
 *    emoji's edge at its right end, on both sides. Its
 *    edge on the message's side is the bubble's edge; it starts as a 44 px
 *    circle on that edge and grows across in about 0.18 s, and each emoji
 *    pops in with a small bounce, about 0.03 s after the one before, from
 *    the bubble's side outwards (so a sent message sees the "+" first).
 *  - **The menu**: 220 wide, radius 26, frosted (the tab bar's glass), 8 px
 *    of room above and under, 38 px rows with the icon at the row's start and
 *    the name after it, no lines between the rows, and Delete in red after an
 *    inset hairline. It grows out of its own
 *    top corner on the message's side, small and faint to full in about
 *    0.15 s, with no delay.
 *  - **Closing** runs both back the same way in about 0.16 s.
 *
 * The actions are ours, not WhatsApp's: Reply, Forward, Copy, Edit,
 * Category, Remind me, Delete. Edit shows only on a text I sent; Forward
 * goes on a call card or a note. A tap on an emoji puts it on the message
 * (or takes it off when it is there already); the "+" is not wired yet.
 *
 * The chat does not scroll for it: a menu (or a bar) that would not fit
 * moves its message instead (see ConversationScreen).
 */
export default function MessageMenu({
  side,
  canEdit,
  canForward = true,
  reaction,
  onPick,
  onReact,
  onMore,
  t,
}: {
  side: Side;
  /** Only a text I sent can be edited; the row goes otherwise. */
  canEdit: boolean;
  /** A call card or a note is not forwarded; the row goes then. */
  canForward?: boolean;
  /** The emoji the message carries now, if any: it is marked in the bar. */
  reaction?: string;
  onPick: (name: MenuName) => void;
  onReact: (emoji: string) => void;
  /** The "+" at the bar's end. */
  onMore: () => void;
  t: (key: DemoKey) => string;
}) {
  const inn = side === "in";
  const rows = ROWS.filter(
    (r) => (r.name !== "Edit" || canEdit) && (r.name !== "Forward" || canForward),
  );
  const stop = (e: React.PointerEvent) => e.stopPropagation();
  const edge = inn ? { left: EDGE } : { right: EDGE };

  const row = (name: MenuName, icon: XdIconName, color: string) => (
    <button
      key={name}
      type="button"
      data-pw={`demo-chat-menu-${name.toLowerCase()}`}
      onClick={(e) => {
        e.stopPropagation();
        onPick(name);
      }}
      className="flex items-center w-full shrink-0 cursor-pointer active:bg-black/5"
      style={{
        height: MENU_ROW_H,
        paddingLeft: 23,
      }}
    >
      <span className="flex items-center justify-center shrink-0" style={{ width: 18 }}>
        <InkIcon name={icon} color={color} size={icon === "forwardMark" ? 17 : 15} />
      </span>
      <Txt size={15} color={color} ml={12}>
        {t(name)}
      </Txt>
    </button>
  );

  return (
    <>
      {/* The emoji bar over the message. */}
      <motion.div
        data-pw="demo-chat-reactions"
        className="absolute z-20 flex items-center overflow-hidden"
        style={{
          bottom: "100%",
          marginBottom: REACTION_GAP,
          ...edge,
          height: REACTION_BAR_H,
          borderRadius: REACTION_BAR_H / 2,
          background: BAR_FILL,
          // The same glass as the tab bar (blur 30, brightness +15%).
          backdropFilter: TAB_BAR.glass,
          WebkitBackdropFilter: TAB_BAR.glass,
          boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)",
          transformOrigin: inn ? "left center" : "right center",
          // The emojis keep their places, in one order on both sides; the
          // pill opens over them like a window, from the bubble's side.
          justifyContent: inn ? "flex-start" : "flex-end",
        }}
        initial={{ width: REACTION_BAR_H, opacity: 0 }}
        animate={{ width: REACTION_BAR_W, opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.16, ease: "easeIn" } }}
        transition={{
          width: { type: "spring", stiffness: 600, damping: 38, mass: 0.9 },
          opacity: { duration: 0.08 },
        }}
        onPointerDown={stop}
      >
        <span
          className="relative flex items-center shrink-0"
          style={{ width: REACTION_BAR_W, paddingLeft: LEAD, height: "100%" }}
        >
          {REACTIONS.map((emoji, i) => (
            <motion.button
              key={emoji}
              type="button"
              data-pw={`demo-chat-react-${i}`}
              aria-label={emoji}
              aria-pressed={reaction === emoji}
              onClick={(e) => {
                e.stopPropagation();
                onReact(emoji);
              }}
              className="flex items-center justify-center shrink-0 cursor-pointer select-none"
              style={{
                width: CELL,
                height: CELL,
                borderRadius: CELL / 2,
                fontSize: 27,
                lineHeight: 1,
                background: reaction === emoji ? "rgba(0,0,0,0.08)" : undefined,
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 520,
                damping: 18,
                mass: 0.7,
                // From the bubble's side outwards: the "+" end goes last on
                // the left, first on the right.
                delay: 0.03 + (inn ? i : REACTIONS.length - i) * STAGGER,
              }}
              whileTap={{ scale: 1.25 }}
            >
              {emoji}
            </motion.button>
          ))}
          <motion.button
          type="button"
          data-pw="demo-chat-react-more"
          aria-label={t("Soon available")}
          onClick={(e) => {
            e.stopPropagation();
            onMore();
          }}
          className="absolute flex items-center justify-center cursor-pointer active:opacity-60"
          style={{
            width: PLUS,
            height: PLUS,
            borderRadius: PLUS / 2,
            // A light, frosted disc that lies over the last emoji's edge.
            background: "rgba(255,255,255,0.72)",
            boxShadow: "0 0 0 0.5px rgba(0,0,0,0.05)",
            right: PLUS_INSET,
            top: (REACTION_BAR_H - PLUS) / 2,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 520,
            damping: 20,
            delay: 0.03 + (inn ? REACTIONS.length : 0) * STAGGER,
          }}
        >
          <span aria-hidden="true" className="absolute" style={{ width: 13, height: 1.5, borderRadius: 1, background: C.ink }} />
          <span aria-hidden="true" className="absolute" style={{ width: 1.5, height: 13, borderRadius: 1, background: C.ink }} />
        </motion.button>
        </span>
      </motion.div>

      {/* The menu under the message. */}
      <motion.div
        data-pw="demo-chat-menu"
        className="absolute z-20 flex flex-col overflow-hidden"
        style={{
          top: "100%",
          marginTop: MENU_GAP,
          ...edge,
          width: MENU_W,
          borderRadius: MENU_RADIUS,
          paddingTop: MENU_PAD,
          paddingBottom: MENU_PAD,
          background: MENU_FILL,
          // The same glass as the tab bar (blur 30, brightness +15%).
          backdropFilter: TAB_BAR.glass,
          WebkitBackdropFilter: TAB_BAR.glass,
          boxShadow: "0 8px 30px rgba(0,0,0,0.16), 0 0 0 0.5px rgba(0,0,0,0.05)",
          transformOrigin: inn ? "left top" : "right top",
        }}
        initial={{ scale: 0.25, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.16, ease: "easeIn" } }}
        transition={{
          scale: { type: "spring", stiffness: 700, damping: 42, mass: 0.8 },
          opacity: { duration: 0.1 },
        }}
        onPointerDown={stop}
      >
        {rows.map((r) => row(r.name, r.icon, C.ink))}
        {/* The inset hairline before Delete, as before WhatsApp's "More...". */}
        <span
          aria-hidden="true"
          className="flex items-center w-full shrink-0"
          style={{ height: MENU_SEP, paddingLeft: 22, paddingRight: 22 }}
        >
          <span className="block w-full" style={{ height: 0.5, background: "rgba(60,60,67,0.29)" }} />
        </span>
        {row("Delete", "menuDelete", CHAT.red)}
      </motion.div>
    </>
  );
}
