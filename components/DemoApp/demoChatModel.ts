import {
  CALLER,
  CALL_ROWS as DESIGN_CALL_ROWS,
  CHAT_PHOTOS,
  CHAT_ROWS,
  CONTACT,
  MESSAGES,
  MESSAGE_TIME,
} from "./demoChat";
import {
  CHAT_LABELS,
  initialsOf,
  isOpenable,
  isOwn,
  orderedChats,
  archivedChats,
  previewOf,
  PLAIN_WORDS,
  type CallKind,
  type Category,
  type ChatAction,
  type ChatMessage,
  type ChatState,
  type ChatThread,
  type Contact,
  type Openable,
  type PreviewWords,
} from "../DemoApp1/chat/chatModel";

/**
 * The chat demo's mock state: the seed and the rules that change it.
 *
 * For `/demo` only: shipping code never imports this file (A-16). The demo
 * shell keeps one `ChatState` (see demoChatState.tsx) and every chat screen
 * reads it and sends actions to `reduceChat`. The starting state is the
 * sample the XD file draws: seven chat rows with one contact, and the
 * conversation of `Home Page – 44` in each of them.
 *
 * The types and the pure helpers the screens use are in
 * components/DemoApp1/chat/chatModel.ts.
 */

/** The tags the demo offers: the design's 5 labels. */
export function seedCategories(): Category[] {
  return CHAT_LABELS.map((c) => ({ ...c }));
}

/** The id of the file's contact, Marie Winter, whose chats the seed draws. */
export const SEED_CONTACT = "marie";

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
