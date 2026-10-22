import {
  CALLER,
  CALL_ROWS as DESIGN_CALL_ROWS,
  CHAT_PHOTOS,
  CHAT_ROWS,
  CONTACT,
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
  /** The tag the shopper put on the message (a `Category` id), from the menu's Category. */
  category?: string;
  /** When the shopper asked to be reminded of it, in ms since the epoch (the menu's re-remind). */
  reminderAt?: number;
  /** The emoji the shopper put on the message, from the bar over the held message. */
  reaction?: string;
};

/** A tag a message can carry: the menu's Category. */
export type Category = { id: string; name: string; color: string };

/** The tags the demo offers; the real list comes from the chat service. */
export function seedCategories(): Category[] {
  return [
    { id: "orders", name: "Orders", color: "#4A31E7" },
    { id: "payment", name: "Payment", color: "#00DD80" },
    { id: "shipping", name: "Shipping", color: "#388CFF" },
    { id: "question", name: "Question", color: "#F4780E" },
    { id: "important", name: "Important", color: "#FF0508" },
  ];
}

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

export type VideoMessage = Base & {
  kind: "video";
  side: Side;
  src: string;
  /** How long the video is, in seconds; 0 while it is not known. */
  seconds: number;
  status?: Status;
};

export type FileMessage = Base & {
  kind: "file";
  side: Side;
  src: string;
  name: string;
  /** The file's size, in bytes. */
  bytes: number;
  /** The MIME type ("application/pdf"), when the browser knows it. */
  mime?: string;
  status?: Status;
};

export type LocationMessage = Base & {
  kind: "location";
  side: Side;
  lat: number;
  lng: number;
  /** How close the fix is, in metres, when the device says. */
  accuracy?: number;
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
  | VideoMessage
  | FileMessage
  | LocationMessage
  | CallMessage
  | NoteMessage
  | DayMessage;

/** A message that can be sent, swiped, answered and forwarded. */
export type Openable =
  | TextMessage
  | PhotoMessage
  | VoiceMessage
  | VideoMessage
  | FileMessage
  | LocationMessage;

const OPENABLE_KINDS: ReadonlySet<ChatMessage["kind"]> = new Set([
  "text",
  "photo",
  "voice",
  "video",
  "file",
  "location",
]);

export const isOpenable = (m: ChatMessage): m is Openable =>
  OPENABLE_KINDS.has(m.kind);

/** The words a row or a quote uses for a message that is not text. */
export type PreviewWords = {
  photo: string;
  voice: string;
  video: string;
  file: string;
  location: string;
};

/** A message that can be held for its menu: everything but a day pill. */
export type Holdable = Openable | CallMessage | NoteMessage;

export const isHoldable = (m: ChatMessage): m is Holdable => m.kind !== "day";

/** A message I sent, whose status can move on. */
export const isOwn = (m: ChatMessage): m is Openable =>
  isOpenable(m) && m.side === "out";

/** Someone the shopper can chat with. */
export type Contact = {
  id: string;
  name: string;
  phone: string;
  /** The contact's picture; none shows the grey box with the initials. */
  photo?: string;
  initials: string;
};

/** "MW" from "Marie Winter": the first letter of the first two words. */
export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

/** The id of the file's contact, Marie Winter, whose chats the seed draws. */
export const SEED_CONTACT = "marie";

export type ChatThread = {
  id: string;
  /** Who the chat is with (a `Contact` id). */
  contact: string;
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
  /** Put away by the swipe cell Archive: out of the list, in the archived sheet. */
  archived?: boolean;
  /** The contact is blocked (`– 45`: Block / UnBlock). */
  blocked?: boolean;
  /** The contact may not call me (`– 45`: Enable Call / Desible Call). */
  callsDisabled?: boolean;
  /** The preview and time the row shows once the chat moved on from the file's sample. */
  preview?: string;
  time?: string;
  /** Orders the rows: a bigger number is a newer chat. */
  lastAt: number;
  messages: ChatMessage[];
};

export type ChatState = {
  chats: ChatThread[];
  /** Everyone the shopper can start a chat with. */
  contacts: Contact[];
  /** The tags a message can carry. */
  categories: Category[];
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

/** The people the file draws: the chats' contact and the caller of `Call – 3`. */
export function seedContacts(): Contact[] {
  return [
    {
      id: SEED_CONTACT,
      name: CONTACT.name,
      phone: CONTACT.phone,
      photo: CHAT_PHOTOS.contact,
      initials: CONTACT.initials,
    },
    {
      id: "grant",
      name: CALLER.name,
      phone: CALLER.phone,
      photo: CHAT_PHOTOS.caller,
      initials: initialsOf(CALLER.name),
    },
  ];
}

/** The contact a chat is with; the file's contact when the id is unknown. */
export function contactOf(state: ChatState, chat: ChatThread): Contact {
  return (
    state.contacts.find((c) => c.id === chat.contact) ??
    state.contacts.find((c) => c.id === SEED_CONTACT) ??
    seedContacts()[0]
  );
}

/** The seven rows of `Home Page – 41`, each with the file's conversation. */
export function seedState(): ChatState {
  const n = CHAT_ROWS.length;
  return {
    contacts: seedContacts(),
    categories: seedCategories(),
    chats: CHAT_ROWS.map((row, i) => ({
      id: row.id,
      contact: SEED_CONTACT,
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
  | { type: "block"; chat: string }
  | { type: "calls"; chat: string }
  | { type: "archive"; chat: string }
  | { type: "unarchive"; chat: string }
  | { type: "deleteChat"; chat: string }
  /** Tags a message, or takes its tag off with `null`. */
  | { type: "category"; chat: string; id: string; category: string | null }
  /** Sets a reminder on a message (ms since the epoch), or clears it with `null`. */
  | { type: "remind"; chat: string; id: string; at: number | null }
  /** Put an emoji on a message; the emoji it already carries takes it off. */
  | { type: "react"; chat: string; id: string; emoji: string }
  | { type: "addContact"; contact: Contact }
  | {
      /** Opens the chat with a contact: the one there is, or a new empty one. */
      type: "newChat";
      contact: string;
      /** The new chat's own id and time, when one is made. */
      as: { id: string; time: string };
    };

/** Newest first, the pinned ones before the rest. */
const byPlace = (a: ChatThread, b: ChatThread) => {
  if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
  return b.lastAt - a.lastAt;
};

/** The rows in the order the list shows them: pinned first, then the newest. The archived ones are not in it. */
export function orderedChats(chats: ChatThread[]): ChatThread[] {
  return chats.filter((c) => !c.archived).sort(byPlace);
}

/** The archived chats, newest first. */
export function archivedChats(chats: ChatThread[]): ChatThread[] {
  return chats.filter((c) => c.archived).sort(byPlace);
}

/** The words of a message that a search can find. */
export function searchableText(m: ChatMessage): string {
  switch (m.kind) {
    case "text":
    case "note":
      return m.text;
    case "file":
      return m.name;
    default:
      return "";
  }
}

/** The ids of the messages whose words hold `query`, in the chat's order; none for an empty query. */
export function searchMessages(chat: ChatThread, query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return chat.messages
    .filter((m) => searchableText(m).toLowerCase().includes(needle))
    .map((m) => m.id);
}

/** The messages of a chat that carry a reminder, soonest first. */
export function pendingReminders(state: ChatState): { chat: string; id: string; at: number }[] {
  return state.chats
    .flatMap((c) =>
      c.messages
        .filter((m) => m.reminderAt !== undefined)
        .map((m) => ({ chat: c.id, id: m.id, at: m.reminderAt as number })),
    )
    .sort((a, b) => a.at - b.at);
}

/** What a row shows of a message. */
export function previewOf(m: Openable, words: PreviewWords) {
  if (m.kind === "text") return m.text;
  if (m.kind === "file") return `${words.file}: ${m.name}`;
  return words[m.kind];
}

/** The English words used when the screens give none (tests, the seed). */
export const PLAIN_WORDS: PreviewWords = {
  photo: "Photo",
  voice: "voice message",
  video: "Video",
  file: "File",
  location: "Location",
};

/** A size in bytes as "812 KB" / "2.4 MB", the way a file card shows it. */
export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
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
      // A message that comes in brings an archived chat back to the list.
      archived: message.side === "in" ? false : chat.archived,
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
  words: PreviewWords = PLAIN_WORDS,
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
    case "block":
      return update(state, action.chat, (chat) => ({ ...chat, blocked: !chat.blocked }));
    case "calls":
      return update(state, action.chat, (chat) => ({
        ...chat,
        callsDisabled: !chat.callsDisabled,
      }));
    case "addContact": {
      const { contact } = action;
      const phone = contact.phone.replace(/\s+/g, "");
      if (
        !contact.name.trim() ||
        !phone ||
        state.contacts.some(
          (c) => c.id === contact.id || c.phone.replace(/\s+/g, "") === phone,
        )
      )
        return state;
      return { ...state, contacts: [...state.contacts, contact] };
    }
    case "newChat": {
      if (!state.contacts.some((c) => c.id === action.contact)) return state;
      const there =
        orderedChats(state.chats).find((c) => c.contact === action.contact) ??
        archivedChats(state.chats).find((c) => c.contact === action.contact);
      if (there)
        return reduceChat(
          reduceChat(state, { type: "unarchive", chat: there.id }, words),
          { type: "open", chat: there.id },
          words,
        );
      const tick = state.tick + 1;
      const chat: ChatThread = {
        id: action.as.id,
        contact: action.contact,
        unread: 0,
        preview: "",
        time: action.as.time,
        lastAt: tick,
        messages: [],
      };
      return {
        ...state,
        chats: [...state.chats, chat],
        active: chat.id,
        viewing: chat.id,
        tick,
      };
    }
    case "archive":
    case "deleteChat": {
      if (!state.chats.some((c) => c.id === action.chat)) return state;
      // An archived chat stays, out of the list; a deleted one goes.
      const chats =
        action.type === "archive"
          ? state.chats.map((c) => (c.id === action.chat ? { ...c, archived: true } : c))
          : state.chats.filter((c) => c.id !== action.chat);
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
    case "unarchive":
      return update(state, action.chat, (chat) => ({ ...chat, archived: false }));
    case "category": {
      if (action.category !== null && !state.categories.some((c) => c.id === action.category))
        return state;
      return update(state, action.chat, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === action.id && m.kind !== "day"
            ? { ...m, category: action.category ?? undefined }
            : m,
        ),
      }));
    }
    case "remind":
      return update(state, action.chat, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === action.id && m.kind !== "day"
            ? { ...m, reminderAt: action.at ?? undefined }
            : m,
        ),
      }));
    case "react":
      return update(state, action.chat, (chat) => ({
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === action.id && m.kind !== "day"
            ? { ...m, reaction: m.reaction === action.emoji ? undefined : action.emoji }
            : m,
        ),
      }));
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

/** The times the reminder sheet offers, from `now`: in an hour, tomorrow at 9, a week on at 9. */
export function reminderOptions(now = new Date()): { key: "In 1 hour" | "Tomorrow" | "Next week"; at: number }[] {
  const at9 = (daysOn: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysOn);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  };
  return [
    { key: "In 1 hour", at: now.getTime() + 60 * 60 * 1000 },
    { key: "Tomorrow", at: at9(1) },
    { key: "Next week", at: at9(7) },
  ];
}

/** A reminder's time as the flag prints it: "14:30" today, "23 Oct 09:00" on another day. */
export function reminderLabel(at: number, locale = "en", now = new Date()): string {
  const d = new Date(at);
  const time = clockNow(d);
  if (d.toDateString() === now.toDateString()) return time;
  // The day before the month, as the app's English (gb) writes it.
  const lang = locale.split("-").pop() || "en";
  const tag = lang === "en" ? "en-GB" : lang;
  let day: string;
  try {
    day = d.toLocaleDateString(tag, { day: "numeric", month: "short" });
  } catch {
    day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  return `${day} ${time}`;
}

let counter = 0;
/** An id no other message has. */
export const newId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;
