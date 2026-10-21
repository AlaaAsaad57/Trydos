"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { motion } from "framer-motion";
import React, { useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { CHAT, MENU_ACTIONS } from "../../DemoApp/demoChat";
import type { Side } from "../../DemoApp/demoChatModel";
import { C, SF_ROUNDED, sfTop } from "../demo1Layout";

/** The icons of the action row, in the file's order, and the name each one shows. */
const MENU_ICONS: { icon: XdIconName; name: (typeof MENU_ACTIONS)[number] }[] =
  [
    { icon: "menuCopy", name: "copy" },
    { icon: "menuCategory", name: "Category" },
    { icon: "menuDelete", name: "Delete" },
    { icon: "menuEdit", name: "Edit" },
    { icon: "menuRemind", name: "re-remind" },
  ];

export type MenuName = (typeof MENU_ACTIONS)[number] | "Forward";

/** The blur behind an open menu, in px, and how long it takes to come and go, in s. */
export const MENU_BLUR = 4;
export const MENU_FADE = 0.22;

/**
 * The menu the file draws under the conversation (`– 44`, y 1960 .. 2199):
 *
 *   - the reply box, 35 x 40, radius 12, `#FAFAFA`, shadow 0 2 5 (black at
 *     16%), with the blue reply mark 10 px in and 13 down;
 *   - 5 px after it the action box, 185 x 40, with Copy, Category, Delete,
 *     Edit and re-remind 30 px apart from 40 px in;
 *   - the tooltip, 50 x 22, radius 8, `#404040`, shadow 0 3 3 (black at 20%),
 *     5 px under the pressed icon, its name in SF Pro Rounded 10 white;
 *   - the Forward bar, 212 x 40, `#1D1D1D`, with its arrow 43 px in, 8 down.
 *
 * The file lists the names (Replay, Forward, Copy, Category, Delete, Edit,
 * re-remind) beside the icons; here the tooltip names the icon under the
 * mouse, and a tap chooses at once. The boxes are centred on the screen (the
 * file's x 106 .. 331); the Forward bar sits 12 px above them, 18.5 px to the
 * right of their centre, as drawn.
 *
 * It opens the way WhatsApp's does on the iPhone (the video of
 * 2026-10-21): the moment the hold lands it grows out of its own top corner
 * on the message's side, small and faint to full size in about 0.2 s, with
 * no delay. Closing runs the same way back. The chat does not scroll for
 * it: a menu that would not fit moves its message instead (see
 * ConversationScreen).
 */
export default function MessageMenu({
  side,
  canEdit,
  canForward = true,
  onPick,
  t,
}: {
  side: Side;
  /** Only a text I sent can be edited; the pencil is dimmed otherwise. */
  canEdit: boolean;
  /** A call card or a note is not forwarded; the bar is dimmed then. */
  canForward?: boolean;
  onPick: (name: MenuName) => void;
  t: (key: DemoKey) => string;
}) {
  const [tip, setTip] = useState<MenuName>("Replay");
  /** The centre of each item's icon, from the action row's left edge (x 106 in the file). */
  const centreOf = (name: MenuName) => {
    if (name === "Replay") return 123.5 - 106;
    if (name === "Forward") return 131 + 43 + 12.5 - 106;
    const i = MENU_ICONS.findIndex((m) => m.name === name);
    return 146 + 40 + 30 * i + 7.5 - 106;
  };
  const pick = (name: MenuName) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (name === "Edit" && !canEdit) return;
    if (name === "Forward" && !canForward) return;
    setTip(name);
    onPick(name);
  };
  const name = (item: MenuName) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setTip(item);
  };
  const boxStyle = {
    height: 40,
    borderRadius: 12,
    background: CHAT.menu,
    boxShadow: "0 2px 5px rgba(0,0,0,0.16)",
  } as const;
  return (
    <motion.div
      data-pw="demo-chat-menu"
      className="absolute z-20"
      // Out of the message's own corner, as on the iPhone.
      initial={{ opacity: 0, scale: 0.3, y: -14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -10, transition: { duration: 0.14, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 620, damping: 40, mass: 0.8 }}
      style={{
        top: "100%",
        // The Forward bar 12 px under the message, the boxes 12 px under it,
        // so no part of the menu covers the message.
        paddingTop: 12 + 40 + 12,
        left: "calc(50% + 3.5px)",
        width: 225,
        x: "-50%",
        transformOrigin: side === "in" ? "20% 0%" : "80% 0%",
      }}
      // A press on the menu is not a press on the message under it.
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <button
          type="button"
          data-pw="demo-chat-menu-forward"
          aria-label={t("Forward")}
          aria-disabled={!canForward}
          onClick={pick("Forward")}
          onPointerEnter={name("Forward")}
          className="absolute flex items-start cursor-pointer active:opacity-80"
          style={{
            opacity: canForward ? 1 : 0.35,
            left: 131 - 106,
            top: -(40 + 12),
            width: 212,
            height: 40,
            borderRadius: 12,
            background: C.ink,
            boxShadow: "0 2px 5px rgba(0,0,0,0.16)",
          }}
        >
          <XdIcon name="forwardMark" style={{ marginLeft: 43, marginTop: 8 }} />
        </button>
        <div className="flex items-start">
          <button
            type="button"
            data-pw="demo-chat-menu-replay"
            aria-label={t("Replay")}
            onClick={pick("Replay")}
            onPointerEnter={name("Replay")}
            className="flex items-start shrink-0 cursor-pointer active:opacity-60"
            style={{ ...boxStyle, width: 35 }}
          >
            <XdIcon
              name="menuReply"
              style={{ marginLeft: 116 - 106 - 0.5, marginTop: 13 - 0.5 }}
            />
          </button>
          <div
            className="flex items-start shrink-0"
            style={{ ...boxStyle, marginLeft: 5, width: 185 }}
          >
            {MENU_ICONS.map((m, i) => (
              <button
                key={m.name}
                type="button"
                data-pw={`demo-chat-menu-${m.name.toLowerCase()}`}
                aria-label={t(m.name)}
                aria-disabled={m.name === "Edit" && !canEdit}
                onClick={pick(m.name)}
                onPointerEnter={name(m.name)}
                className="flex shrink-0 cursor-pointer active:opacity-60"
                style={{
                  marginLeft: i === 0 ? 40 : 15,
                  marginTop: 13,
                  opacity: m.name === "Edit" && !canEdit ? 0.3 : 1,
                }}
              >
                <XdIcon name={m.icon} />
              </button>
            ))}
          </div>
        </div>
        <span
          data-pw="demo-chat-menu-tip"
          className="absolute flex flex-col"
          style={{
            left: centreOf(tip) - 25,
            top: tip === "Forward" ? -(40 + 12) + 45 : 45,
            width: 50,
            height: 22,
            borderRadius: 8,
            background: CHAT.tooltip,
            boxShadow: "0 3px 3px rgba(0,0,0,0.2)",
          }}
        >
          <span
            className="block text-center whitespace-nowrap"
            style={{
              marginTop: sfTop(15, 10, 12),
              fontFamily: SF_ROUNDED,
              fontSize: 10,
              lineHeight: "12px",
              color: C.white,
              letterSpacing: "0.01em",
            }}
          >
            {t(tip)}
          </span>
        </span>
      </div>
    </motion.div>
  );
}
