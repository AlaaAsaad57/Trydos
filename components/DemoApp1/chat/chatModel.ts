/**
 * The chat screens' data model: the shapes they draw and the pure helpers
 * they use.
 *
 * Nothing here touches React, the store or a backend. The screens read a
 * `ChatState` and send `ChatAction`s. On `/demo` a mock state answers them
 * (components/DemoApp/demoChatState.tsx); in the app the real chat data
 * answers them. The mock seed and the mock rules stay in
 * components/DemoApp/demoChatModel.ts, so shipping code never imports them
 * (A-16).
 */

export type Side = "in" | "out";

/** A message I sent: one tick, two ticks, two blue ticks. */
export type Status = "sent" | "delivered" | "read";

export type CallTone = "missed" | "incoming" | "outgoing";

/**
 * The delivery mark before a preview: `|` sent, `||` delivered, a blue `||`
 * read (`– 41`, the last three rows). A `sent` preview is grey.
 */
export type DeliveryMark = "sent" | "delivered" | "read";

/** A row of the Calls tab (`Home Page – 43`). */
export type CallKind = "missed" | "incoming" | "noAnswer";

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
  /** When the shopper asked to be reminded of it, in ms since the epoch (the menu's Remind me). */
  reminderAt?: number;
  /** The emoji the shopper put on the message, from the bar over the held message. */
  reaction?: string;
};

/** A tag a message can carry: the menu's Category. */
export type Category = { id: string; name: string; color: string };

/** The 5 labels of the design, one per message (D-37). */
export const CHAT_LABELS: readonly Category[] = [
  { id: "orders", name: "Orders", color: "#4A31E7" },
  { id: "payment", name: "Payment", color: "#00DD80" },
  { id: "shipping", name: "Shipping", color: "#388CFF" },
  { id: "question", name: "Question", color: "#F4780E" },
  { id: "important", name: "Important", color: "#FF0508" },
];

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
  /** The contact is typing right now. */
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
  /** The contact may not call me (`– 45`: Enable Call / Disable Call). */
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

/**
 * The contact a chat is with. A chat whose contact is not in the list gets
 * an empty contact with the chat's contact id, never another person.
 */
export function contactOf(state: ChatState, chat: ChatThread): Contact {
  return (
    state.contacts.find((c) => c.id === chat.contact) ?? {
      id: chat.contact,
      name: "",
      phone: "",
      initials: "",
    }
  );
}

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
