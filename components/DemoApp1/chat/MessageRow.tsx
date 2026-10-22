"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import React, { useEffect, useRef } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { CHAT } from "../../DemoApp/demoChat";
import type { Side } from "../../DemoApp/demoChatModel";
import { C } from "../demo1Layout";
import { useHorizontalSwipe } from "./useHorizontalSwipe";

/** How far the message must be pulled to the right, in px, to answer it. */
export const REPLY_PULL = 56;

/** How long a finger must rest on a message, in ms, to open its menu. */
export const HOLD_MS = 420;

/** The blur on the other messages while a menu is open, in px. */
export const DIM_BLUR = 3;

/** How long the light on a message reached from its quote lasts, in s. */
export const FLASH_S = 1.6;

/**
 * One message's row, with the two gestures WhatsApp gives a message on the
 * iPhone:
 *
 *  - **Swipe to reply.** The row follows a finger pulled to the right, with
 *    resistance, and a round reply mark comes out from behind the message
 *    and grows with the pull. Past REPLY_PULL it fills purple (and the phone
 *    ticks, where it can); letting go there answers the message. The row
 *    springs back either way. An up-down finger scrolls the chat as before.
 *  - **Hold to open the menu.** A finger that rests HOLD_MS without moving
 *    lifts the message and opens its menu (`menu`, drawn under the row).
 *
 * `gap` is the room above the row; `lifted` keeps the row above the blur
 * while its menu is open or fading; `fresh` pops a message that was just
 * sent or received out of its own side. `shift` moves the row up (or down)
 * while its menu is open, so the message and the menu are both on the
 * screen: WhatsApp moves the held message rather than scrolling the chat.
 * `dimmed` blurs the row while another message's menu is open: the body's
 * backdrop-filter does not reach the rows in Chromium, a filter on each
 * row does. `flash` lights the row up across the chat's width and fades it,
 * as WhatsApp marks the message a tapped quote jumps to; each new number
 * runs the light again, 0 runs none.
 */
export default function MessageRow({
  id,
  side,
  gap,
  lifted = false,
  fresh = false,
  wide = false,
  shift = 0,
  dimmed = false,
  faded = false,
  marked = false,
  flash = 0,
  canReply = true,
  onReply,
  onHold,
  menu,
  children,
}: {
  id: string;
  side: Side;
  gap: number;
  lifted?: boolean;
  fresh?: boolean;
  /** The message takes the whole width (a voice message draws its own rows). */
  wide?: boolean;
  /** How far the row is moved, in px, while its menu is open. */
  shift?: number;
  /** Another message's menu is open: this row is blurred under the wash. */
  dimmed?: boolean;
  /** A search is on and this message is not a match: the row goes pale. */
  faded?: boolean;
  /** The search's current match: a blue bar on the row's edge, as the list marks its open row. */
  marked?: boolean;
  /** A new number lights the row up and fades it (a tapped quote jumped here); 0 for none. */
  flash?: number;
  canReply?: boolean;
  onReply?: () => void;
  onHold?: () => void;
  menu?: React.ReactNode;
  children: React.ReactNode;
}) {
  const inn = side === "in";
  const x = useMotionValue(0);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const ticked = useRef(false);

  // The light a tapped quote sends here. Run from here, not as the span's
  // mount animation: the conversation's list is an AnimatePresence with
  // `initial={false}`, and framer hands that to every motion box mounted
  // under it later, so a mount animation would start at its last keyframe.
  const light = useMotionValue(0);
  useEffect(() => {
    if (!flash) return;
    const run = animate(light, [0, 0.16, 0.16, 0], {
      duration: FLASH_S,
      times: [0, 0.1, 0.55, 1],
      ease: "easeOut",
    });
    return () => run.stop();
  }, [flash]);
  /**
   * The message was past REPLY_PULL under the finger. Read on every move,
   * not on release: framer runs `onDragEnd` a frame after the finger lifts,
   * when the spring back has already begun, and `x` there is short of the
   * mark for a pull that was just past it.
   */
  const pulled = useRef(false);

  // The reply mark: it rides out with the message for 44 px, then stays
  // while the message goes on; it fades and grows with the pull.
  const markX = useTransform(x, (v) => Math.min(v, 44) - v);
  const markOpacity = useTransform(x, [0, 30], [0, 1]);
  const markScale = useTransform(x, [0, REPLY_PULL], [0.5, 1]);
  const armed = useTransform(x, (v) => (v >= REPLY_PULL ? 1 : 0));
  const idle = useTransform(armed, (a) => 1 - a);

  // A short tick the moment the pull is far enough (Android; iOS ignores it).
  useMotionValueEvent(x, "change", (v) => {
    const over = v >= REPLY_PULL;
    if (over && !ticked.current) navigator.vibrate?.(8);
    ticked.current = over;
  });

  const cancelHold = () => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
    start.current = null;
  };

  // The swipe reads the touch itself (see useHorizontalSwipe): Safari and
  // framer both read a thumb's arc as up-down, and the chat scrolled instead.
  const swipe = useHorizontalSwipe(canReply);

  const press = {
    onPointerDown: (e: React.PointerEvent) => {
      swipe.handlers.onPointerDown(e);
      if (!onHold || e.button !== 0) return;
      cancelHold();
      start.current = { x: e.clientX, y: e.clientY };
      hold.current = setTimeout(() => {
        hold.current = null;
        start.current = null;
        navigator.vibrate?.(12);
        onHold();
      }, HOLD_MS);
    },
    onPointerMove: (e: React.PointerEvent) => {
      swipe.handlers.onPointerMove(e);
      const s = start.current;
      if (!s) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8) cancelHold();
    },
    onPointerUp: () => {
      swipe.handlers.onPointerUp();
      cancelHold();
    },
    onPointerCancel: () => {
      swipe.handlers.onPointerCancel();
      cancelHold();
    },
    onPointerLeave: cancelHold,
    // The phone's own copy / look-up menu must not come up on the hold.
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };

  return (
    <motion.div
      layout="position"
      data-pw={`demo-chat-message-${id}`}
      className={`relative flex items-start w-full shrink-0 ${inn ? "" : "justify-end"} ${lifted ? "z-20" : ""}`}
      style={{
        marginTop: gap,
        transformOrigin: inn ? "left bottom" : "right bottom",
      }}
      initial={fresh ? { opacity: 0, scale: 0.7, y: 16 } : false}
      animate={{
        opacity: faded ? 0.35 : 1,
        scale: 1,
        y: shift,
        filter: dimmed ? `blur(${DIM_BLUR}px)` : "blur(0px)",
      }}
      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 480, damping: 32, mass: 0.9 }}
    >
      {flash > 0 && (
        <motion.span
          aria-hidden="true"
          data-pw="demo-chat-flash"
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: -3, bottom: -3, background: C.purple, opacity: light }}
        />
      )}
      {marked && (
        <span
          aria-hidden="true"
          data-pw="demo-chat-search-mark"
          className="absolute top-0 h-full"
          style={{ [inn ? "left" : "right"]: 0, width: 4, background: C.blue }}
        />
      )}
      <motion.div
        {...press}
        ref={swipe.ref}
        data-pw="demo-chat-swipe"
        className={`relative flex items-start w-full shrink-0 ${inn ? "" : "justify-end"}`}
        drag={canReply ? "x" : false}
        dragListener={false}
        dragControls={swipe.controls}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.75 }}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 520, bounceDamping: 34 }}
        dragMomentum={false}
        onDragStart={() => {
          cancelHold();
          pulled.current = false;
        }}
        onDrag={() => {
          pulled.current = x.get() >= REPLY_PULL;
        }}
        onDragEnd={() => {
          if (pulled.current) onReply?.();
          pulled.current = false;
        }}
        style={{ x, touchAction: "pan-y" }}
      >
        {/* The message and its dot, with the reply mark behind them. The box
            is as wide as its message, up to the file's widest bubble (the
            row less 86 px) plus the dot's 12 px; the message wraps inside it. */}
        <div
          className={`relative flex items-start min-w-0 ${inn ? "" : "justify-end"}`}
          style={{ width: wide ? "100%" : undefined, maxWidth: wide ? "100%" : "calc(100% - 74px)" }}
        >
          {canReply && (
            <motion.span
              aria-hidden="true"
              data-pw="demo-chat-reply-mark"
              className="absolute flex items-center justify-center pointer-events-none"
              style={{
                left: -36,
                top: "50%",
                marginTop: -15,
                width: 30,
                height: 30,
                borderRadius: 15,
                x: markX,
                opacity: markOpacity,
                scale: markScale,
                background: CHAT.menu,
                boxShadow: "0 2px 5px rgba(0,0,0,0.16)",
              }}
            >
              <motion.span className="absolute inset-0 flex items-center justify-center" style={{ opacity: idle }}>
                <XdIcon name="menuReply" />
              </motion.span>
              <motion.span
                className="absolute inset-0 flex items-center justify-center"
                style={{ opacity: armed, borderRadius: 15, background: C.purple }}
              >
                <XdIcon name="replyMarkWhite" size={14} />
              </motion.span>
            </motion.span>
          )}
          {children}
        </div>
      </motion.div>
      {menu}
    </motion.div>
  );
}
