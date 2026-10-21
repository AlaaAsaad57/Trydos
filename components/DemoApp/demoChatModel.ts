import {
  CALL_ROWS as DESIGN_CALL_ROWS,
  CHAT_ROWS,
  MESSAGES,
  MESSAGE_TIME,
  type CallKind,
  type DeliveryMark,
} from "./demoChat";

/**
 * The chat demo's state and the pure rules that change it.
 *
 * Nothing here touches React or a backend. The demo shell keeps one
 * `ChatState` (see demoChatState.tsx) and every chat screen reads it and
 * sends actions to `reduceChat`. The starting state is the sample the XD
 * file draws: seven chat rows with one contact, and the conversation of
 * `Home Page – 44` in each of them.
 *
 * When the real chat service is wired in, this file is what it replaces:
 * the screens already read messages, rows and statuses from here only.
 */

export type Side = "in" | "out";

/** A message I sent: one tick, two ticks, two blue ticks. */
export type Status = "sent" | "delivered" | "read";

export type CallTone = "missed" | "incoming" | "outgoing";

type Base = {
  id: string;
  time: string;
  /**
   * The room above this message, in px, when it is not the usual one. The
   * seed carries the file's own gaps; a new message takes the rule in
   * `gapAbove`.
   */
  gap?: number;
};

export type TextMessage = Base & {
  kind: "text";
  side: Side;
  text: string;
  status?: Status;
  /** The message this one answers (its quote is drawn above the bubble). */
  replyTo?: { id: string; text: string };
  /** Another message answered this one (the white reply mark before its time). */
  repliedTo?: boolean;
  edited?: boolean;
  forwarded?: boolean;
};

export type PhotoMessage = Base & {
  kind: "photo";
  side: Side;
  src: string;
  status?: Status;
};

export type VoiceMessage = Base & {
  kind: "voice";
  side: Side;
  /** How long the sound is, in seconds. */
  seconds: number;
  status?: Status;
};

export type CallMessage = Base & {
  kind: "call";
  side: Side;
  tone: CallTone;
  /** The card's width in the file (its words are set in XD's own metrics). */
  width: number;
  sub: "callBack" | "minutes" | "noAnswer";
  minutes?: string;
  /** "12:56 | 3 Ring" after the time. */
  rings?: string;
};

/** The pale red note under a missed call (`– 44`). */
export type NoteMessage = Base & { kind: "note"; text: string };

/** The "YESTERDAY" / "TODAY" pill between two days. */
export type DayMessage = Base & { kind: "day"; label: "YESTERDAY" | "TODAY" };

export type ChatMessage =
  | TextMessage
  | PhotoMessage
  | VoiceMessage
  | CallMessage
  | NoteMessage
  | DayMessage;

/** A message that can be sent, swiped, answered and forwarded. */
export type Openable = TextMessage | PhotoMessage | VoiceMessage;

export const isOpenable = (m: ChatMessage): m is Openable =>
  m.kind === "text" || m.kind === "photo" || m.kind === "voice";

/** A message that can be held for its menu: everything but a day pill. */
export type Holdable = Openable | CallMessage | NoteMessage;

export const isHoldable = (m: ChatMessage): m is Holdable => m.kind !== "day";

/** A message I sent, whose status can move on. */
export const isOwn = (m: ChatMessage): m is Openable =>
  isOpenable(m) && m.side === "out";

export type ChatThread = {
  id: string;
  /** The grey box with the initials instead of the photo (row 2 of `– 41`). */
  initials?: boolean;
  /** Unread messages; the row shows the count and the open-letter mark. */
  unread: number;
  /** The file's "Typing…" row (`– 41`, row 3). */
  typing?: boolean;
  /** The contact is typing right now (a mock reply is on its way). */
  typingNow?: boolean;
  /** Row 4 of `– 41`: the "Send …" list in place of a preview. */
  attachments?: boolean;
  /** The delivery mark before the preview, when the last message is mine. */
  mark?: DeliveryMark;
  pinned?: boolean;
  muted?: boolean;
  /** The preview and time the row shows once the chat moved on from the file's sample. */
  preview?: string;
  time?: string;
  /** Orders the rows: a bigger number is a newer chat. */
  lastAt: number;
  messages: ChatMessage[];
};

export type ChatState = {
  chats: ChatThread[];
  /** The chat opened last: its row carries the purple line and bar. */
  active: string;
  /** The chat whose conversation is on the screen now, if any. */
  viewing: string | null;
  /** The clock `lastAt` is read from. */
  tick: number;
};

export type CallRow = { id: string; kind: CallKind; minutes?: string };
export const CALL_ROWS: CallRow[] = DESIGN_CALL_ROWS;

/** The conversation of `Home Page – 44`, in the file's order, with its gaps. */
export function seedMessages(): ChatMessage[] {
  const t = MESSAGE_TIME;
  return [
    { id: "in1", kind: "text", side: "in", text: MESSAGES.in1, time: t, gap: 16 },
    { id: "in2", kind: "text", side: "in", text: MESSAGES.in2, time: t },
    { id: "in3", kind: "text", side: "in", text: MESSAGES.in3, time: t },
    { id: "out1", kind: "text", side: "out", text: MESSAGES.out1, time: t, status: "read" },
    { id: "out2", kind: "text", side: "out", text: MESSAGES.out2, time: t, status: "read" },
    { id: "out3", kind: "text", side: "out", text: MESSAGES.out3, time: t, status: "read" },
    { id: "day1", kind: "day", label: "YESTERDAY", time: t },
    { id: "photo", kind: "photo", side: "in", src: "/assets/demo/chat/photo-message.jpg", time: t },
    { id: "voice-in", kind: "voice", side: "in", seconds: 80, time: t, gap: 48 },
    { id: "voice-out", kind: "voice", side: "out", seconds: 80, time: t, status: "read", gap: 24 },
    { id: "call1", kind: "call", side: "in", tone: "missed", width: 195, sub: "callBack", time: t, gap: 56.5 },
    { id: "call2", kind: "call", side: "in", tone: "incoming", width: 213, sub: "minutes", minutes: MESSAGES.minutes, time: t },
    { id: "call3", kind: "call", side: "out", tone: "outgoing", width: 217, sub: "noAnswer", time: t },
    { id: "call4", kind: "call", side: "in", tone: "missed", width: 232, sub: "callBack", rings: MESSAGES.rings, time: t, gap: 48 },
    { id: "note", kind: "note", text: MESSAGES.note, time: t },
    {
      id: "reply",
      kind: "text",
      side: "out",
      text: MESSAGES.reply,
      time: t,
      status: "read",
      replyTo: { id: "in2", text: MESSAGES.quoted },
      gap: 50,
    },
    { id: "last", kind: "text", side: "in", text: MESSAGES.last, time: t, repliedTo: true, gap: 34 },
  ];
}

/** The seven rows of `Home Page – 41`, each with the file's conversation. */
export function seedState(): ChatState {
  const n = CHAT_ROWS.length;
  return {
    chats: CHAT_ROWS.map((row, i) => ({
      id: row.id,
      initials: row.initials,
      unread: row.unread ? Number(row.unread) : 0,
      typing: row.typing,
      attachments: row.attachments,
      mark: row.mark,
      lastAt: n - i,
      messages: seedMessages(),
    })),
    active: CHAT_ROWS.find((row) => row.selected)?.id ?? CHAT_ROWS[0].id,
    viewing: null,
    tick: n,
  };
}

export type ChatAction =
  | { type: "open"; chat: string }
  | { type: "leave" }
  | {
      type: "send";
      chat: string;
      message: Openable;
      /** The chat the message answers, for the reply mark. */
      replyTo?: string;
    }
  | { type: "receive"; chat: string; message: Openable }
  | { type: "typing"; chat: string; on: boolean }
  | { type: "status"; chat: string; id: string; status: Status }
  | { type: "deleteMessage"; chat: string; id: string }
  | { type: "editMessage"; chat: string; id: string; text: string }
  | {
      type: "forward";
      from: string;
      id: string;
      to: string;
      /** The copy's own id and time. */
      as: { id: string; time: string };
    }
  | { type: "pin"; chat: string }
  | { type: "unread"; chat: string }
  | { type: "mute"; chat: string }
  | { type: "archive"; chat: string }
  | { type: "deleteChat"; chat: string };

/** The rows in the order the list shows them: pinned first, then the newest. */
export function orderedChats(chats: ChatThread[]): ChatThread[] {
  return [...chats].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return b.lastAt - a.lastAt;
  });
}

/** What a row shows of a message. */
export function previewOf(m: Openable, words: { photo: string; voice: string }) {
  if (m.kind === "text") return m.text;
  if (m.kind === "photo") return words.photo;
  return words.voice;
}

const update = (
  state: ChatState,
  id: string,
  change: (chat: ChatThread) => ChatThread,
): ChatState => ({
  ...state,
  chats: state.chats.map((chat) => (chat.id === id ? change(chat) : chat)),
});

/** A chat that got a message: it is the newest, and the row shows the message. */
function bump(
  state: ChatState,
  id: string,
  message: Openable,
  preview: string,
): ChatState {
  const tick = state.tick + 1;
  return {
    ...update(state, id, (chat) => ({
      ...chat,
      lastAt: tick,
      preview,
      time: message.time,
      mark: message.side === "out" ? message.status ?? "sent" : undefined,
      typingNow: false,
      // A message that comes in while the chat is not on the screen is unread.
      unread:
        message.side === "in" && state.viewing !== id
          ? chat.unread + 1
          : chat.unread,
    })),
    tick,
  };
}

/** The last message of a chat that a row can preview, if any. */
const lastOpenable = (chat: ChatThread) =>
  [...chat.messages].reverse().find(isOpenable);

/**
 * The rules. Each action returns a new state; an action on a chat or a
 * message that is not there returns the state as it was.
 */
export function reduceChat(
  state: ChatState,
  action: ChatAction,
  words: { photo: string; voice: string } = { photo: "Photo", voice: "voice message" },
): ChatState {
  const preview = (m: Openable) => previewOf(m, words);
  switch (action.type) {
    case "open": {
      if (!state.chats.some((c) => c.id === action.chat)) return state;
      return {
        ...update(state, action.chat, (chat) => ({ ...chat, unread: 0 })),
        active: action.chat,
        viewing: action.chat,
      };
    }
    case "leave":
      return { ...state, viewing: null };
    case "send": {
      const chat = state.chats.find((c) => c.id === action.chat);
      if (!chat) return state;
      const message: Openable = { ...action.message, status: action.message.status ?? "sent" };
      const messages = chat.messages.map((m) =>
        action.replyTo && m.id === action.replyTo && m.kind === "text"
          ? { ...m, repliedTo: true }
          : m,
      );
      const withDay = needsToday(messages)
        ? [...messages, { id: `day-${message.id}`, kind: "day" as const, label: "TODAY" as const, time: message.time }]
        : messages;
      const next = update(state, action.chat, (c) => ({
        ...c,
        messages: [...withDay, message],
      }));
      return bump(next, action.chat, message, preview(message));
    }
    case "receive": {
      const chat = state.chats.find((c) => c.id === action.chat);
      if (!chat) return state;
      const message: Openable = { ...action.message, side: "in", status: undefined };
      const withDay = needsToday(chat.messages)
        ? [...chat.messages, { id: `day-${message.id}`, kind: "day" as const, label: "TODAY" as const, time: message.time }]
        : chat.messages;
      const next = update(state, action.chat, (c) => ({
        ...c,
        messages: [...withDay, message],
      }));
      return bump(next, action.chat, message, preview(message));
    }
    case "typing":
      return update(state, action.chat, (chat) => ({ ...chat, typingNow: action.on }));
    case "status": {
      const chat = state.chats.find((c) => c.id === action.chat);
      if (!chat) return state;
      const messages = chat.messages.map((m) =>
        m.id === action.id && isOwn(m) ? { ...m, status: action.status } : m,
      );
      const last = lastOpenable({ ...chat, messages });
      return update(state, action.chat, (c) => ({
        ...c,
        messages,
        // The row's mark follows the last message when that is the one.
        mark: last && last.id === action.id ? action.status : c.mark,
      }));
    }
    case "deleteMessage": {
      const chat = state.chats.find((c) => c.id === action.chat);
      if (!chat || !chat.messages.some((m) => m.id === action.id)) return state;
      const messages = chat.messages.filter((m) => m.id !== action.id);
      const last = lastOpenable({ ...chat, messages });
      return update(state, action.chat, (c) => ({
        ...c,
        messages,
        // The row showed the deleted message: show the one before it.
        ...(c.preview !== undefined && lastOpenable(chat)?.id === action.id
          ? {
              preview: last ? preview(last) : "",
              time: last?.time ?? c.time,
              mark: last && isOwn(last) ? last.status : undefined,
            }
          : {}),
      }));
    }
    case "editMessage": {
      const text = action.text.trim();
      if (!text) return state;
      const chat = state.chats.find((c) => c.id === action.chat);
      const target = chat?.messages.find((m) => m.id === action.id);
      if (!chat || !target || target.kind !== "text" || target.side !== "out")
        return state;
      if (target.text === text) return state;
      const messages = chat.messages.map((m) =>
        m.id === action.id ? { ...m, text, edited: true } : m,
      );
      return update(state, action.chat, (c) => ({
        ...c,
        messages,
        preview: lastOpenable(chat)?.id === action.id && c.preview !== undefined ? text : c.preview,
      }));
    }
    case "forward": {
      if (!state.chats.some((c) => c.id === action.to)) return state;
      const source = state.chats
        .find((c) => c.id === action.from)
        ?.messages.find((m) => m.id === action.id);
      if (!source || !isOpenable(source)) return state;
      const copy: Openable =
        source.kind === "text"
          ? {
              kind: "text",
              id: action.as.id,
              time: action.as.time,
              side: "out",
              text: source.text,
              status: "sent",
              forwarded: true,
            }
          : { ...source, id: action.as.id, time: action.as.time, side: "out", status: "sent", gap: undefined };
      return reduceChat(state, { type: "send", chat: action.to, message: copy }, words);
    }
    case "pin":
      return update(state, action.chat, (chat) => ({ ...chat, pinned: !chat.pinned }));
    case "unread":
      return update(state, action.chat, (chat) => ({
        ...chat,
        unread: chat.unread > 0 ? 0 : 1,
      }));
    case "mute":
      return update(state, action.chat, (chat) => ({ ...chat, muted: !chat.muted }));
    case "archive":
    case "deleteChat": {
      if (!state.chats.some((c) => c.id === action.chat)) return state;
      const chats = state.chats.filter((c) => c.id !== action.chat);
      const active =
        state.active === action.chat
          ? orderedChats(chats)[0]?.id ?? state.active
          : state.active;
      return {
        ...state,
        chats,
        active,
        viewing: state.viewing === action.chat ? null : state.viewing,
      };
    }
  }
}

/** True when the chat's last messages are still the file's "yesterday", so today's first message needs its pill. */
function needsToday(messages: ChatMessage[]) {
  const lastDay = [...messages].reverse().find((m) => m.kind === "day");
  return !lastDay || lastDay.label !== "TODAY";
}

/**
 * The room above a message when the seed gives none: 2 px under a message
 * from the same side, 12 px after anything else.
 */
export function gapAbove(messages: ChatMessage[], i: number): number {
  const m = messages[i];
  if (m.gap !== undefined) return m.gap;
  if (i === 0) return 16;
  const prev = messages[i - 1];
  if (m.kind === "day" || prev.kind === "day") return 12;
  if (m.kind === "note") return 0;
  if ("side" in m && "side" in prev && m.side === prev.side) {
    // A voice or call block is its own group; a text after a text is tight.
    if (m.kind === "text" && prev.kind === "text") return 2;
    return 12;
  }
  return 12;
}

/** Now, as "12:56". */
export const clockNow = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

let counter = 0;
/** An id no other message has. */
export const newId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;
