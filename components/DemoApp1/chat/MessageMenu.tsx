"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { XD_ICON_SIZE, type XdIconName } from "../../DemoApp/xdIcons";
import { CHAT, MENU_ACTIONS } from "../../DemoApp/demoChat";
import type { Side } from "../../DemoApp/demoChatModel";
import { TAB_BAR } from "../../DemoApp/demoLayout";
import { C } from "../demo1Layout";
import { Txt } from "../ui";
import AnimatedEmoji, { preloadAnimatedEmojis } from "./AnimatedEmoji";

export type MenuName = (typeof MENU_ACTIONS)[number] | "Forward";

/**
 * What lies over the screen behind an open menu, and how long it takes to come
 * and go, in s (WhatsApp's is quick: about 0.15). It is a dark wash with a
 * light blur: `MENU_DIM` is the wash, `MENU_BLUR` the blur in px, and
 * `MENU_DIM_TINT` the colour the wash gives the white head, for Safari's top
 * area to show.
 */
export const MENU_DIM = "rgba(0,0,0,0.3)";
export const MENU_BLUR = 5;
export const MENU_DIM_TINT = "rgb(179, 179, 179)";
export const MENU_FADE = 0.18;

/**
 * Unified iOS fluid deceleration curve (`cubic-bezier(0.16, 1, 0.3, 1)`):
 * swift, responsive expansion out of the bubble corner that settles cleanly
 * without multi-spring oscillation jitter or sub-pixel blur shimmer.
 */
export const IOS_OPEN_EASE = [0.16, 1, 0.3, 1] as const;

const OPEN_TRANSITION = {
  duration: 0.21,
  ease: IOS_OPEN_EASE,
} as const;

const EMOJI_POP_EASE = [0.22, 1.12, 0.36, 1] as const;

const CLOSE_TRANSITION = {
  duration: 0.14,
  ease: [0.36, 0, 0.66, 0] as const,
};

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
  // The animated emojis too: the player and the files, before the first menu.
  React.useEffect(() => preloadAnimatedEmojis(), []);
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
export const REACTION_GAP = 12;
/** The gap between the message and the menu under it, in px. */
export const MENU_GAP = 12;
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
/**
 * From the row's edge to the bubble's edge: the dot (5 + 4) and the bubble's
 * own 3. A held message grows from this line (see MessageRow), so the bar and
 * the menu stay on the bubble's edge.
 */
export const EDGE = 12;

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

/** How much later each emoji pops in than the one before it, and the first one's delay, in s. */
const STAGGER = 0.018;
const POP_DELAY = 0.015;
/** How long after its pop starts an emoji plays its animation, in s. */
const PLAY_AFTER = 0.065;
/** The animated emoji's size in the bar, in px. */
const EMOJI = 31;

/** The rows of the menu, in order; Forward and Edit go when the message cannot take them. */
const ROWS: { name: MenuName; icon: XdIconName }[] = [
  { name: "Reply", icon: "menuReply" },
  { name: "Forward", icon: "forwardMark" },
  { name: "copy", icon: "menuCopy" },
  { name: "Edit", icon: "menuEdit" },
  { name: "Category", icon: "menuCategory" },
  { name: "Remind me", icon: "menuRemind" },
];

/** When the emoji in place `k` of the bar (counted from the bubble's side) pops in, in s. */
const popDelay = (k: number) => POP_DELAY + k * STAGGER;

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
 *    edge on the message's side is the bubble's edge; it starts as a round
 *    disc on that edge and grows across in 0.21 s (the video of
 *    2026-10-25: see OPEN_TRANSITION), and each emoji pops in with a slight
 *    bounce, 0.018 s after the one before (STAGGER), from the bubble's side
 *    outwards (so a sent message sees the "+" first). Each emoji is an
 *    animated emoji (AnimatedEmoji.tsx) that plays once as it pops in.
 *  - **The menu**: 220 wide, radius 26, frosted (the tab bar's glass), 8 px
 *    of room above and under, 38 px rows with the icon at the row's start and
 *    the name after it, no lines between the rows, and Delete in red after an
 *    inset hairline. It grows out of its own
 *    top corner on the message's side, half size and faint to full in
 *    0.21 s, with no delay.
 *  - **Closing** shrinks and fades both in 0.14 s (CLOSE_TRANSITION).
 *
 * The actions are ours, not WhatsApp's: Reply, Forward, Copy, Edit,
 * Category, Remind me, Delete. Edit shows only on a text I sent; Forward
 * goes on a call card or a note. A tap on an emoji puts it on the message
 * (or takes it off when it is there already): the emoji leaves the bar and
 * flies to its chip on the message (see reactionFly.ts and ReactionChip); the
 * "+" is not wired yet.
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
  /**
   * `from`: where the picked emoji is on the screen (the middle of it, and its
   * size), for the chip on the message to fly in from there.
   */
  onReact: (emoji: string, from: { x: number; y: number; size: number }) => void;
  /** The "+" at the bar's end. */
  onMore: () => void;
  t: (key: DemoKey) => string;
}) {
  const inn = side === "in";
  // The emoji just picked leaves the bar at once: the chip flies in with it.
  const [picked, setPicked] = useState<string | null>(null);
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
          width: REACTION_BAR_W,
          height: REACTION_BAR_H,
          borderRadius: REACTION_BAR_H / 2,
          background: BAR_FILL,
          // The same glass as the tab bar (blur 30, brightness +15%).
          backdropFilter: TAB_BAR.glass,
          WebkitBackdropFilter: TAB_BAR.glass,
          boxShadow: "0 6px 24px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)",
          transformOrigin: inn ? "left bottom" : "right bottom",
          willChange: "transform, opacity",
          justifyContent: inn ? "flex-start" : "flex-end",
        }}
        initial={{ scale: 0.42, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.42, opacity: 0, transition: CLOSE_TRANSITION }}
        transition={{
          scale: OPEN_TRANSITION,
          opacity: { duration: 0.13, ease: "easeOut" },
        }}
        onPointerDown={stop}
      >
        <span
          className="relative flex items-center shrink-0"
          style={{ width: REACTION_BAR_W, paddingLeft: LEAD, height: "100%" }}
        >
          {REACTIONS.map((emoji, i) => {
            const order = inn ? i : REACTIONS.length - 1 - i;
            return (
              <motion.button
                key={emoji}
                type="button"
                data-pw={`demo-chat-react-${i}`}
                aria-label={emoji}
                aria-pressed={reaction === emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  const box = e.currentTarget.getBoundingClientRect();
                  // Taking the same emoji off needs no flight.
                  if (reaction !== emoji) setPicked(emoji);
                  onReact(emoji, {
                    x: box.left + box.width / 2,
                    y: box.top + box.height / 2,
                    size: EMOJI,
                  });
                }}
                className="flex items-center justify-center shrink-0 cursor-pointer select-none"
                style={{
                  width: CELL,
                  height: CELL,
                  borderRadius: CELL / 2,
                  background: reaction === emoji ? "rgba(0,0,0,0.08)" : undefined,
                  opacity: picked === emoji ? 0 : 1,
                  willChange: "transform, opacity",
                }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.19,
                  ease: EMOJI_POP_EASE,
                  // From the bubble's side outwards: the "+" end goes last on
                  // the left, first on the right.
                  delay: popDelay(order),
                }}
                whileTap={{ scale: 1.25 }}
              >
                {/* Each emoji plays its own animation once, as it pops in. */}
                <AnimatedEmoji
                  emoji={emoji}
                  size={EMOJI}
                  play={1}
                  delay={popDelay(order) + PLAY_AFTER}
                />
              </motion.button>
            );
          })}
          <motion.button
            type="button"
            data-pw="demo-chat-react-more"
            aria-label="More reactions"
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
              willChange: "transform, opacity",
            }}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.19,
              ease: EMOJI_POP_EASE,
              delay: popDelay(inn ? REACTIONS.length : 0),
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
          willChange: "transform, opacity",
        }}
        initial={{ scale: 0.48, opacity: 0, y: -4 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.48, opacity: 0, y: -4, transition: CLOSE_TRANSITION }}
        transition={{
          scale: OPEN_TRANSITION,
          y: OPEN_TRANSITION,
          opacity: { duration: 0.13, ease: "easeOut" },
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
