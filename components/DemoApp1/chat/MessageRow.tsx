"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import React, { useRef } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { CHAT } from "../../DemoApp/demoChat";
import type { Side } from "../../DemoApp/demoChatModel";
import { C } from "../demo1Layout";

/** How far the message must be pulled to the right, in px, to answer it. */
export const REPLY_PULL = 56;

/** How long a finger must rest on a message, in ms, to open its menu. */
export const HOLD_MS = 420;

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
 * sent or received out of its own side.
 */
export default function MessageRow({
  id,
  side,
  gap,
  lifted = false,
  fresh = false,
  wide = false,
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

  const press = {
    onPointerDown: (e: React.PointerEvent) => {
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
      const s = start.current;
      if (!s) return;
      if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8) cancelHold();
    },
    onPointerUp: cancelHold,
    onPointerCancel: cancelHold,
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
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 480, damping: 32, mass: 0.9 }}
    >
      <motion.div
        {...press}
        data-pw="demo-chat-swipe"
        className={`relative flex items-start w-full shrink-0 ${inn ? "" : "justify-end"}`}
        drag={canReply ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.75 }}
        dragSnapToOrigin
        dragTransition={{ bounceStiffness: 520, bounceDamping: 34 }}
        dragMomentum={false}
        onDragStart={cancelHold}
        onDragEnd={() => {
          if (x.get() >= REPLY_PULL) onReply?.();
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
