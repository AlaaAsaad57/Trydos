"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { TRAVEL } from "components/NavigationDemo/BottomNav";
import XdIcon from "../../DemoApp/XdIcon";
import { XD_ICON_SIZE, type XdIconName } from "../../DemoApp/xdIcons";
import {
  CHAT,
  CHAT_COUNTS,
  CHAT_PHOTOS,
  CHAT_ROW_TIME,
  CONTACT,
  PREVIEW,
  PREVIEW_SHORT,
  type CallKind,
} from "../../DemoApp/demoChat";
import {
  CALL_ROWS,
  contactOf,
  orderedChats,
  type ChatThread,
  type Contact,
} from "../../DemoApp/demoChatModel";
import { useDemoChat } from "../../DemoApp/demoChatState";
import { useDemoNav } from "../Demo1Shell";
import {
  C,
  COLUMN_W,
  EDGE_ANCHOR,
  SAFE_BOTTOM,
  TAB_BAR,
  fill,
  lineBox,
  paraTop,
  textTop,
} from "../demo1Layout";
import { Icon, ScreenPage, Stroke, Txt, useScrollLock } from "../ui";
import { PlusIcon } from "../chat/chatIcons";
import NewChatSheet from "../chat/NewChatSheet";
import Toast, { useToast } from "../chat/Toast";

/**
 * Chat — XD `Home Page – 41` (the Chats tab), `– 42` (a row swiped left and
 * one swiped right) and `– 43` (the Calls tab).
 *
 * Head 50 .. 150, white, sticky:
 *   - the search field, as on the search screen: 406 x 38 at (12, 56), radius
 *     12, `#F8F8F8`, the glass at (21.5, 65.5), the placeholder at x 52 on
 *     baseline 80, 14 Regular `#8D8D8D`. The strip has the file's shadow
 *     (0 0 3, black at 10%); the white strip under it covers that shadow.
 *   - the Chats | Calls strip, 100 .. 150: the envelope (25 x 25 at 129, 113)
 *     and the phone (265, 113) with their counts 4.26 px after them on
 *     baseline 125, 12 Medium. The block is 172.5 wide and centred. Only the
 *     open tab shows its word, right-aligned 7 px (Chats) or 6 px (Calls)
 *     before its icon, on baseline 135.
 *
 * Chats: rows 430 x 100 from y 152, 2 px apart, white with a 0.3 `#D3D3D3`
 * line; the open chat's row has a 0.5 `#4A31E7` line and a 4 px purple bar
 * at its left edge. The photo is 66 x 76 at (12, 12 in the row), radius 15 (a
 * purple 1 px line on that row); the name 14 Medium at x 90 on baseline 26;
 * the time 11 Medium `#8D8D8D` ending 13 px before the right edge on baseline
 * 23; the preview 12 Regular, 17 px lines, 295 wide from x 90, first baseline
 * 46, two lines at most. Each row then draws one more thing — see ChatRowFace.
 *
 * A row swiped left shows Mute, Delete and Archive (71 x 100 each, 2 px
 * apart, flush right: the row moves 219); swiped right it shows Unread and
 * Pin at x 2 and 75 (the row moves 148). The cell's icon is 25 x 25 at 20
 * from the top; its word 12 Regular on baseline 77, centred. One row is open
 * at a time: swiping another closes it, and while one is open the list holds
 * still and a tap anywhere closes it. The cells act on the chat state
 * (demoChatModel.ts): a pinned chat moves to the top with the pin mark, an
 * archived or deleted one leaves the list, Unread toggles the count, Mute
 * marks the row.
 *
 * Calls: rows 430 x 90 `#FCFCFC` from y 152, the photo 66 x 66, the name 16
 * Medium on baseline 36 (30 on the row that has a second line), and the
 * call's state under it — see CallRowFace.
 */
export default function ChatListScreen() {
  const { t, navigate } = useDemoNav();
  const { state, dispatch, newChat, addContact } = useDemoChat();
  const [tab, setTab] = useState<"chats" | "calls">("chats");
  const [query, setQuery] = useState("");
  /** The "New chat" sheet is up. */
  const [starting, setStarting] = useState(false);
  /** The row whose action cells show, if any. */
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  /** A row is being dragged, and when the last drag ended: the click a mouse fires after a drag is not a tap. */
  const drag = useRef({ on: false, endedAt: 0 });

  // An open row holds the list still; a tap anywhere closes it.
  useScrollLock(openRow !== null);
  useEffect(() => {
    if (!openRow) return;
    const close = () => {
      if (drag.current.on || Date.now() - drag.current.endedAt < 300) return;
      setOpenRow(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openRow]);

  const needle = query.trim().toLowerCase();
  const rows = orderedChats(state.chats).filter(
    (chat) =>
      !needle ||
      contactOf(state, chat).name.toLowerCase().includes(needle) ||
      (chat.preview ?? PREVIEW).toLowerCase().includes(needle),
  );

  /** Opens the chat with a contact — the one there is, or a new one — and goes to it. */
  const startChat = (contact: string) => {
    setStarting(false);
    newChat(contact);
    navigate("chat/conversation");
  };

  const act = (chat: ChatThread, label: DemoKey) => {
    switch (label) {
      case "Pin":
        dispatch({ type: "pin", chat: chat.id });
        return;
      case "Unread":
        dispatch({ type: "unread", chat: chat.id });
        return;
      case "Mute":
        dispatch({ type: "mute", chat: chat.id });
        showToast(t(chat.muted ? "Unmuted" : "Muted"));
        return;
      case "Archive":
        dispatch({ type: "archive", chat: chat.id });
        showToast(t("Archived"));
        return;
      case "Delete":
        dispatch({ type: "deleteChat", chat: chat.id });
        showToast(t("Deleted"));
        return;
    }
  };

  const openChat = (chat: ChatThread) => {
    dispatch({ type: "open", chat: chat.id });
    navigate("chat/conversation");
  };

  const header = (
    <header
      className="relative w-full flex flex-col"
      style={{ height: 100, background: C.white }}
    >
      <div
        className="relative flex shrink-0"
        style={{ height: 50, boxShadow: "0 0 3px rgba(0,0,0,0.1)" }}
      >
        <div
          className="flex items-start shrink-0"
          style={{
            marginLeft: 12,
            marginTop: 6,
            width: fill(12),
            height: 38,
            borderRadius: 12,
            background: C.field,
          }}
        >
          <Icon name="searchGlass" ml={9.5} mt={9.5} />
          <input
            data-pw="demo-chat-search"
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search, Chat, Contact, Start New Chat")}
            aria-label={t("Search, Chat, Contact, Start New Chat")}
            className="block bg-transparent outline-none font-normal placeholder:text-[#8D8D8D]"
            // Text left 52 on the artboard; baseline 80 → box top 66 at 14 px.
            style={{
              marginLeft: 40 - (9.5 + XD_ICON_SIZE.searchGlass.w),
              marginTop: 7,
              marginRight: 12,
              flex: "1 1 0",
              minWidth: 0,
              height: 24,
              fontSize: 14,
              color: C.ink,
              padding: 0,
              border: 0,
            }}
          />
        </div>
      </div>

      {/* White, and after the search strip in the DOM: it covers the strip's shadow. */}
      <div
        className="relative flex shrink-0 justify-center"
        style={{ height: 50, background: C.white }}
      >
        <div className="relative shrink-0" style={{ width: 172.5, height: 50 }}>
          <TabButton
            testId="demo-chat-tab-chats"
            icon="chatTabChats"
            count={CHAT_COUNTS.chats}
            label="Chats"
            labelGap={7}
            left={0}
            on={tab === "chats"}
            onClick={() => setTab("chats")}
            t={t}
          />
          <TabButton
            testId="demo-chat-tab-calls"
            icon="chatTabCalls"
            count={CHAT_COUNTS.calls}
            label="Calls"
            labelGap={6}
            left={265 - 129}
            on={tab === "calls"}
            onClick={() => setTab("calls")}
            t={t}
          />
        </div>
      </div>
    </header>
  );

  return (
    <ScreenPage testId="demo-chat" header={header} tabBar>
      {tab === "chats" ? (
        <AnimatePresence initial={false}>
          {rows.map((chat) => (
            <motion.div
              key={chat.id}
              layout
              className="w-full shrink-0 overflow-hidden"
              exit={{ height: 0, opacity: 0, transition: { duration: 0.22 } }}
              transition={TRAVEL}
            >
              <SwipeRow
                id={chat.id}
                active={openRow === chat.id}
                onActivate={() => {
                  drag.current.on = true;
                  setOpenRow(chat.id);
                }}
                onRelease={() => {
                  drag.current = { on: false, endedAt: Date.now() };
                }}
                onRest={() => setOpenRow((now) => (now === chat.id ? null : now))}
                onOpen={() => openChat(chat)}
                onAct={(label) => act(chat, label)}
                t={t}
              >
                <ChatRowFace
                  row={chat}
                  contact={contactOf(state, chat)}
                  selected={state.active === chat.id}
                  t={t}
                />
              </SwipeRow>
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        CALL_ROWS.map((row) => (
          <CallRowFace
            key={row.id}
            id={row.id}
            kind={row.kind}
            minutes={row.minutes}
            onOpen={() => navigate("chat/call")}
            t={t}
          />
        ))
      )}
      <Toast text={toast} bottom={TAB_BAR.height + 24} fixed />

      {/* The round purple button that starts a chat: 52 px, 20 px from the
          right edge, 16 px over the tab bar. It hangs on a 0 x 0 anchor at
          the bottom of the window, as the toast and the tab bar do (see
          EDGE_ANCHOR). Only on the Chats tab. */}
      <AnimatePresence>
        {tab === "chats" && (
          <div
            key="new-chat"
            style={{
              ...EDGE_ANCHOR,
              top: undefined,
              bottom: `calc(${15 + TAB_BAR.height + 16}px + ${SAFE_BOTTOM})`,
              zIndex: 30,
            }}
          >
            <motion.button
              type="button"
              data-pw="demo-chat-new"
              aria-label={t("New chat")}
              onClick={(e) => {
                e.stopPropagation();
                setStarting(true);
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              whileTap={{ scale: 0.9 }}
              className="absolute flex items-center justify-center cursor-pointer"
              style={{
                bottom: 0,
                right: `calc(20px - ${COLUMN_W} / 2)`,
                width: 52,
                height: 52,
                borderRadius: 26,
                background: C.purple,
                boxShadow: "0 4px 12px rgba(74,49,231,0.35)",
              }}
            >
              <PlusIcon color={C.white} size={26} />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <NewChatSheet
        open={starting}
        contacts={state.contacts}
        onPick={startChat}
        onAdd={(name, phone) => startChat(addContact(name, phone))}
        onClose={() => setStarting(false)}
        t={t}
      />
    </ScreenPage>
  );
}

/**
 * One tab of the strip: the icon at `left` in the 172.5 block, its count
 * 4.26 after it, and — when open — its word hanging to the left of the icon.
 * The icons never move; only the word comes and goes.
 */
function TabButton({
  testId,
  icon,
  count,
  label,
  labelGap,
  left,
  on,
  onClick,
  t,
}: {
  testId: string;
  icon: XdIconName;
  count: string;
  label: DemoKey;
  labelGap: number;
  left: number;
  on: boolean;
  onClick: () => void;
  t: (key: DemoKey) => string;
}) {
  return (
    <button
      type="button"
      data-pw={testId}
      aria-pressed={on}
      onClick={onClick}
      className="absolute flex items-start cursor-pointer"
      // The strip starts at design y 100; the icons sit at 113.
      style={{ left, top: 13, height: 25 }}
    >
      {on && (
        <Txt
          size={12}
          weight="medium"
          className="absolute"
          // Baseline 135 → box top 123, 10 under the icon's top.
          style={{
            right: `calc(100% + ${labelGap}px)`,
            top: textTop(135, 12) - 113,
            letterSpacing: "0.02em",
          }}
        >
          {t(label)}
        </Txt>
      )}
      <XdIcon name={icon} />
      {/* Baseline 125 at 12 px → box top 113, level with the icon's top. */}
      <Txt
        size={12}
        weight="medium"
        ml={158.26 - 154}
        style={{ letterSpacing: "0.02em" }}
      >
        {count}
      </Txt>
    </button>
  );
}

/** The actions a row swiped left shows (right side) and swiped right shows (left side). */
const RIGHT_ACTIONS: { icon: XdIconName; label: DemoKey }[] = [
  { icon: "swipeMute", label: "Mute" },
  { icon: "swipeDelete", label: "Delete" },
  { icon: "swipeArchive", label: "Archive" },
];
const LEFT_ACTIONS: { icon: XdIconName; label: DemoKey }[] = [
  { icon: "swipeUnread", label: "Unread" },
  { icon: "swipePin", label: "Pin" },
];

const CELL_W = 71;
const CELL_GAP = 2;
/** How far the row moves to show all of its right actions (3 cells) or left actions (2 cells). */
export const OPEN_LEFT = -(RIGHT_ACTIONS.length * (CELL_W + CELL_GAP));
export const OPEN_RIGHT = LEFT_ACTIONS.length * (CELL_W + CELL_GAP) + CELL_GAP;

/**
 * A chat row that slides sideways over its action cells (`Home Page – 42`).
 * Drag it, and it snaps open past half way; a tap on an open row closes it,
 * a tap on a closed row opens the conversation.
 *
 * The list owns which row is open: a row says when it starts to move
 * (`onActivate`), when the finger lets go (`onRelease`) and when it rests
 * closed again (`onRest`), and a row that is no longer the `active` one
 * slides shut on its own.
 */
function SwipeRow({
  id,
  active,
  onActivate,
  onRelease,
  onRest,
  onOpen,
  onAct,
  t,
  children,
}: {
  id: string;
  active: boolean;
  /** The row started to move under a finger. */
  onActivate: () => void;
  /** The finger let go of the row. */
  onRelease: () => void;
  /** The row rests closed again. */
  onRest: () => void;
  onOpen: () => void;
  onAct: (label: DemoKey) => void;
  t: (key: DemoKey) => string;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const [open, setOpen] = useState<"left" | "right" | null>(null);
  /** True from the start of a drag until the next press: a swipe is never a tap. */
  const dragged = useRef(false);

  const snapTo = (target: number) => {
    animate(x, target, TRAVEL);
    const side = target === 0 ? null : target < 0 ? "left" : "right";
    setOpen(side);
    if (side === null) onRest();
  };

  // Another row took the stage, or a tap closed every row: this one shuts.
  useEffect(() => {
    if (!active && (open || x.get() !== 0)) {
      animate(x, 0, TRAVEL);
      setOpen(null);
    }
    // `open` and `x` are read, not followed.
  }, [active]);

  const act = (label: DemoKey) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onAct(label);
    snapTo(0);
  };

  return (
    <div
      data-pw={`demo-chat-row-${id}`}
      data-open={open ?? undefined}
      data-active={active ? "true" : undefined}
      className="relative w-full shrink-0 overflow-hidden"
      style={{ height: 100, marginTop: 2 }}
      onClick={(e) => {
        // A click on an open row is the row's own business (it closes itself).
        if (open) e.stopPropagation();
      }}
    >
      <div
        className="absolute top-0 right-0 flex"
        style={{ height: 100, gap: CELL_GAP }}
        aria-hidden={open !== "left"}
      >
        {RIGHT_ACTIONS.map((a) => (
          <ActionCell key={a.label} {...a} onClick={act(a.label)} t={t} />
        ))}
      </div>
      <div
        className="absolute top-0 left-0 flex"
        style={{ height: 100, marginLeft: CELL_GAP, gap: CELL_GAP }}
        aria-hidden={open !== "right"}
      >
        {LEFT_ACTIONS.map((a) => (
          <ActionCell key={a.label} {...a} onClick={act(a.label)} t={t} />
        ))}
      </div>
      <motion.div
        data-pw={`demo-chat-row-face-${id}`}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: OPEN_LEFT, right: OPEN_RIGHT }}
        dragElastic={0.08}
        dragMomentum={false}
        style={{ x, touchAction: "pan-y" }}
        onPointerDown={() => {
          dragged.current = false;
        }}
        onDragStart={() => {
          dragged.current = true;
          onActivate();
        }}
        onDragEnd={() => {
          onRelease();
          const at = x.get();
          if (at < OPEN_LEFT / 2) snapTo(OPEN_LEFT);
          else if (at > OPEN_RIGHT / 2) snapTo(OPEN_RIGHT);
          else snapTo(0);
        }}
        // A tap, not the end of a drag: framer can fire onTap after a drag
        // too, so a press that moved the row is ignored here.
        onTap={() => {
          if (dragged.current) return;
          if (open) snapTo(0);
          else onOpen();
        }}
        className="relative w-full h-full cursor-pointer"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** One action cell: 71 x 100, white, a 0.3 line, the icon 20 down and the word on baseline 77. */
function ActionCell({
  icon,
  label,
  onClick,
  t,
}: {
  icon: XdIconName;
  label: DemoKey;
  onClick: (e: React.MouseEvent) => void;
  t: (key: DemoKey) => string;
}) {
  return (
    <button
      type="button"
      data-pw={`demo-chat-action-${label.toLowerCase()}`}
      onClick={onClick}
      className="relative flex flex-col items-center shrink-0 cursor-pointer active:opacity-60"
      style={{ width: CELL_W, height: 100, background: C.white }}
    >
      <XdIcon name={icon} style={{ marginTop: 20 }} />
      <Txt
        size={12}
        mt={textTop(77, 12) - 45}
        style={{ letterSpacing: "0.01em" }}
      >
        {t(label)}
      </Txt>
      <Stroke color={C.line} width={0.3} />
    </button>
  );
}

/** The photo of the contact, `w` x `h`, radius 15, with the line the file draws round it. */
function Photo({
  w,
  h,
  line,
  src = CHAT_PHOTOS.contact,
  initials,
}: {
  w: number;
  h: number;
  line?: string;
  src?: string;
  /** The grey box with these letters instead of the picture. */
  initials?: string;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden flex flex-col"
      style={{
        width: w,
        height: h,
        borderRadius: 15,
        background: initials ? C.field : undefined,
      }}
    >
      {initials ? (
        // "MW" 14 Medium on baseline 43 of the 76 box, centred.
        <Txt center size={14} weight="medium" mt={textTop(43, 14)}>
          {initials}
        </Txt>
      ) : (
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {line && <Stroke color={line} width={1} radius={15} />}
    </div>
  );
}

/** The 11 Medium time at the right of a row, on baseline 23: `mt` from the row it sits in. */
function RowTime({
  right,
  mt = 0,
  time = CHAT_ROW_TIME,
  muted = false,
  t,
}: {
  right: number;
  mt?: number;
  time?: string;
  /** A muted chat shows the small mute mark before its time. */
  muted?: boolean;
  t: (key: DemoKey) => string;
}) {
  return (
    <span className="flex items-start ml-auto shrink-0" style={{ marginTop: mt, marginRight: right }}>
      {muted && (
        <XdIcon
          name="swipeMute"
          size={12}
          aria-label={t("Mute")}
          style={{ marginTop: 1, marginRight: 4, opacity: 0.55 }}
        />
      )}
      <Txt size={11} weight="medium" color={C.grey}>
        {time}
      </Txt>
    </span>
  );
}

/** One "Send …" line of the fourth row: a 15 px icon and the 12 px word 4 px after it. */
function SendLine({
  icon,
  label,
  mt,
  t,
}: {
  icon: XdIconName;
  label: DemoKey;
  mt: number;
  t: (key: DemoKey) => string;
}) {
  return (
    <span className="flex items-start shrink-0" style={{ marginTop: mt }}>
      <XdIcon name={icon} />
      <Txt size={12} color={C.inkSoft} ml={4}>
        {t(label)}
      </Txt>
    </span>
  );
}

/**
 * The face of a chat row: what the file draws on it (`Home Page – 41`).
 *
 *   - the first row: the unread count "1" (`#7756E9`, 11 Medium, baseline 84)
 *     and the open-letter mark 11 x 14 at (407, 73);
 *   - the third: the ink mark 14 x 14 at (90, 74) and "Typing…" 11 `#388CFF`
 *     at x 108, baseline 85 — "Typing" Regular, the dots Bold;
 *   - the fourth: "Send Photo" with its 15 px mark at (90, 36) and, from
 *     x 227, Send Voice / Video / File / Location 19 px apart from y 12 —
 *     until the chat has a message of its own to preview;
 *   - the last three: the preview starts with a Bold `|` (sent, the preview
 *     grey), `||` (delivered) or a blue `||` (read);
 *   - a pinned row (`– 42`, after Pin) shows the pin 10 x 14 at (406, 74).
 *
 * The row reads all of it from its chat: the preview and time of the last
 * message once there is one, the ticks of the last message I sent, the
 * unread count, and whether the contact is typing.
 */
function ChatRowFace({
  row,
  contact,
  selected,
  t,
}: {
  row: ChatThread;
  contact: Contact;
  /** The chat opened last: the purple line and bar. */
  selected: boolean;
  t: (key: DemoKey) => string;
}) {
  const nameTop = textTop(26, 14);
  const nameBottom = nameTop + lineBox(14);
  // The preview's first baseline is 46; its 17 px lines share the extra
  // 2 px above and below, so the box starts 1 px above a plain 12 px line.
  const previewTop = paraTop(46, 12, 17);
  const previewBottom = previewTop + 2 * 17;
  const typing = row.typing || row.typingNow;
  const time = row.time ?? CHAT_ROW_TIME;
  const preview =
    row.preview ?? (row.initials ? PREVIEW_SHORT : PREVIEW);
  return (
    <div
      className="relative flex items-start w-full h-full"
      style={{ background: C.white }}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-full"
          style={{ width: 4, background: C.purple }}
        />
      )}
      <div className="shrink-0" style={{ marginLeft: 12, marginTop: 12 }}>
        <Photo
          w={66}
          h={76}
          src={contact.photo}
          initials={row.initials || !contact.photo ? contact.initials : undefined}
          line={selected ? C.purple : undefined}
        />
      </div>

      {row.attachments && row.preview === undefined ? (
        <div
          className="flex items-start min-w-0 grow"
          style={{ marginLeft: 12, marginTop: 12 }}
        >
          {/* The left column is 137 wide: from x 90 to the icons at 227. */}
          <div className="flex flex-col shrink-0" style={{ width: 227 - 90 }}>
            <Txt size={14} weight="medium">
              {contact.name}
            </Txt>
            <SendLine
              icon="chatSendPhoto"
              label="Send Photo"
              mt={36 - (12 + lineBox(14))}
              t={t}
            />
          </div>
          <div className="flex flex-col shrink-0">
            <SendLine icon="chatSendVoice" label="Send Voice" mt={0} t={t} />
            <SendLine icon="chatSendVideo" label="Send Video" mt={4} t={t} />
            <SendLine icon="chatSendFile" label="Send File" mt={4} t={t} />
            <SendLine
              icon="chatSendLocation"
              label="Send Location"
              mt={4}
              t={t}
            />
          </div>
          <RowTime right={13} time={time} muted={row.muted} t={t} />
        </div>
      ) : (
        <div
          className="flex flex-col min-w-0 grow"
          style={{ marginLeft: 12, marginTop: nameTop }}
        >
          <div className="flex items-start w-full">
            <Txt size={14} weight="medium" className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "ellipsis" }}>
              {contact.name}
            </Txt>
            <RowTime right={13} time={time} muted={row.muted} t={t} />
          </div>
          <p
            data-pw="demo-chat-row-preview"
            className="font-normal"
            style={{
              marginTop: previewTop - nameBottom,
              marginRight: 45,
              fontSize: 12,
              lineHeight: "17px",
              color: row.mark === "sent" ? C.grey : C.ink,
              // Two lines, cut plainly: the file shows no "…".
              height: 2 * 17,
              overflow: "hidden",
            }}
          >
            {row.mark && (
              <span
                className="font-bold"
                style={{ color: row.mark === "read" ? CHAT.read : C.ink }}
              >
                {row.mark === "sent" ? "|" : "||"}
              </span>
            )}
            {row.mark ? ` ${preview}` : preview}
          </p>
          {row.unread > 0 && (
            <span
              data-pw="demo-chat-row-unread-count"
              className="flex items-start ml-auto shrink-0"
              style={{ marginTop: 73 - previewBottom, marginRight: 12 }}
            >
              {/* "1" on baseline 84 → box top 73, level with the mark. */}
              <Txt size={11} weight="medium" color={CHAT.unreadCount}>
                {String(row.unread)}
              </Txt>
              <XdIcon name="chatUnreadMark" style={{ marginLeft: 2 }} />
            </span>
          )}
          {typing && (
            <span
              data-pw="demo-chat-row-typing-mark"
              className="flex items-start shrink-0"
              style={{ marginTop: 74 - previewBottom }}
            >
              <XdIcon name="chatTyping" />
              <Txt size={11} color={CHAT.typing} ml={108 - 104}>
                {t("Typing…").replace(/…$/, "")}
                <span className="font-bold">…</span>
              </Txt>
            </span>
          )}
        </div>
      )}

      {row.pinned && (
        <XdIcon
          name="chatPinned"
          className="absolute"
          style={{ right: 430 - 416, top: 74 }}
        />
      )}
      <Stroke
        color={selected ? C.purple : C.line}
        width={selected ? 0.5 : 0.3}
      />
    </div>
  );
}

/** What each call row draws under the name (`Home Page – 43`). */
const CALL_STATE: Record<
  CallKind,
  { icon: XdIconName; label: DemoKey; size: number; color: string; iconTop: number; baseline: number; x: number }
> = {
  // The red phone 18 x 18 at (90, 52 in the row); the words 14 Regular, baseline 66, x 114.
  missed: { icon: "callMissed", label: "Missed Voice Call !", size: 14, color: CHAT.red, iconTop: 52, baseline: 66, x: 114 },
  // The purple phone 15 x 15 at (90, 40); the words 12 Regular, baseline 52, x 111.
  incoming: { icon: "callIncoming", label: "Incoming Voice Call !", size: 12, color: C.ink, iconTop: 40, baseline: 52, x: 111 },
  // The violet phone 18 x 18 at (90, 52); the words 14 Regular, baseline 66, x 114.
  noAnswer: { icon: "callOutgoing", label: "No Answer", size: 14, color: C.ink, iconTop: 52, baseline: 66, x: 114 },
};

/**
 * One row of the Calls tab: 90 tall, `#FCFCFC`, the photo 66 x 66, the name
 * 16 Medium on baseline 36, the time on baseline 23, and the call's state —
 * its icon and words, with "16 Min" 11 Regular on baseline 72 under an
 * incoming call.
 */
function CallRowFace({
  id,
  kind,
  minutes,
  onOpen,
  t,
}: {
  id: string;
  kind: CallKind;
  minutes?: string;
  onOpen: () => void;
  t: (key: DemoKey) => string;
}) {
  const state = CALL_STATE[kind];
  // The file lifts the name of the row with a second line to baseline 30.
  const nameTop = textTop(minutes ? 30 : 36, 16);
  const nameBottom = nameTop + lineBox(16);
  const stateTop = textTop(state.baseline, state.size);
  return (
    <button
      type="button"
      data-pw={`demo-call-row-${id}`}
      onClick={onOpen}
      className="relative flex items-start w-full shrink-0 cursor-pointer text-left"
      style={{ height: 90, marginTop: 2, background: C.page }}
    >
      <div className="shrink-0" style={{ marginLeft: 12, marginTop: 12 }}>
        <Photo w={66} h={66} />
      </div>
      <div
        className="flex flex-col min-w-0 grow"
        style={{ marginLeft: 12, marginTop: nameTop }}
      >
        <div className="flex items-start w-full">
          <Txt size={16} weight="medium">
            {CONTACT.name}
          </Txt>
          <RowTime right={12} mt={textTop(23, 11) - nameTop} t={t} />
        </div>
        <div
          className="flex items-start"
          style={{ marginTop: Math.min(state.iconTop, stateTop) - nameBottom }}
        >
          <XdIcon
            name={state.icon}
            style={{ marginTop: state.iconTop - Math.min(state.iconTop, stateTop) }}
          />
          <div className="flex flex-col">
            <Txt
              size={state.size}
              color={state.color}
              ml={state.x - 90 - XD_ICON_SIZE[state.icon].w}
              mt={stateTop - Math.min(state.iconTop, stateTop)}
              style={{ letterSpacing: "0.012em" }}
            >
              {t(state.label)}
            </Txt>
            {minutes && (
              <Txt
                size={11}
                ml={state.x - 90 - XD_ICON_SIZE[state.icon].w}
                mt={textTop(72, 11) - (stateTop + lineBox(state.size))}
                style={{ letterSpacing: "0.012em" }}
              >
                {t("{n} Min").replace("{n}", minutes)}
              </Txt>
            )}
          </div>
        </div>
      </div>
      <Stroke color={C.line} width={0.3} />
    </button>
  );
}
