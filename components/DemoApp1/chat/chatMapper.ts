import { getCallDirection, getChatName, showDate } from "components/Chat/chatsFunctions";
import { sortMessages } from "store/chat/messageOrder";
import { GetImageUrl } from "utils/tinyUtils";
import type { Channel, Member, Message } from "utils/types/chat";
import {
  CHAT_LABELS,
  clockNow,
  dayPill,
  initialsOf,
  previewOf,
  type ChatMessage,
  type ChatThread,
  type Contact,
  type DeliveryMark,
  type PreviewWords,
  type Side,
  type Status,
} from "./chatModel";

/**
 * Turns the live chat data (`store/chat`, `utils/types/chat`) into the shapes
 * the new chat screens draw (chatModel.ts). Stage 6, step 2.
 *
 * Pure: it reads only what it is given. It follows the old chat's rules, so a
 * chat shows the same on both: the ticks of `getMessageStatus`
 * (store/chat/chatUtils.tsx), the order of `sortMessages`, the call direction
 * of `getCallDirection`, the name of `getChatName` and the row time of
 * `showDate` (components/Chat/chatsFunctions.tsx).
 */

/** The words a row or a quote uses, in the page's language. */
export type MapWords = PreviewWords & {
  /** "Product" */
  product: string;
  /** "this message was deleted" */
  deleted: string;
  /** "Voice Call" */
  voiceCall: string;
  /** "Video Call" */
  videoCall: string;
};

export type MapContext = {
  /** The signed-in user's chat id (`userChat.id`). */
  myId: string | number;
  words: MapWords;
  /** The page's locale ("sy-en"), for the day pills. */
  locale?: string;
  now?: Date;
  /** The row's time. The old chat's rule by default (`showDate`). */
  rowTime?: (createdAt: string) => string;
  /** The chat's name. The old chat's rule by default (`getChatName`). */
  chatName?: (chat: Channel) => string;
  /** The call message that rings or runs now, if any: it is not missed. */
  liveCallId?: string | number | null;
};

/** The call card widths of the design (`– 44`), by tone. */
const CALL_CARD_WIDTH = { missed: 195, incoming: 213, outgoing: 217 } as const;

const sameId = (a: unknown, b: unknown) => String(a) === String(b);

const timeOf = (createdAt: unknown) => new Date(createdAt as string).getTime();

/** The other person in a chat: the member who is not me. */
export const peerOf = (chat: Channel, myId: string | number): Member | undefined =>
  chat.channel_members?.find((m) => !sameId(m.user_id, myId));

/** The words of a text or shared-product message (`message_content.content`). */
const contentOf = (m: Message): string =>
  !Array.isArray(m.message_content) && m.message_content
    ? (m.message_content.content ?? "")
    : "";

/** The first file of a media message. */
const fileOf = (m: Message): { file_path?: string; file_name?: string } | undefined =>
  m.message_files?.[0] ??
  (Array.isArray(m.message_content) ? m.message_content[0] : undefined);

/** The shared product: its content is a JSON list with one product. */
const productOf = (
  m: Message,
): { product_name?: string; product_image_url?: string; product_slug?: string } | null => {
  try {
    const list = JSON.parse(contentOf(m));
    return Array.isArray(list) && list[0] ? list[0] : null;
  } catch {
    return null;
  }
};

const isDeleted = (m: Message) => m.auth_message_status?.is_deleted === 1;

const isCall = (m: Message) =>
  m.message_type?.name === "VoiceCall" || m.message_type?.name === "VideoCall";

/**
 * The unread count of a row, by the old row's rule (`unreadCount` / `isNew`
 * in components/Chat/chatsFunctions.tsx): messages from the other person that
 * I have not watched, not calls, not deleted for all. A chat I marked unread
 * by hand counts at least 1. The backend's `total_unread_message_count` is not
 * used, as in the old row.
 */
export function unreadOf(chat: Channel, myId: string | number): number {
  const unwatched = (chat.messages ?? []).filter(
    (m) =>
      !isCall(m) &&
      !sameId(m.sender_user_id, myId) &&
      m.message_status?.find((s) => sameId(s.user_id, myId))?.is_watched === false &&
      m.auth_message_status?.delete_for_all === false,
  );
  return Math.max(unwatched.length, chat.marked_unread ? 1 : 0);
}

/** The ticks of a message I sent, from the other member's status. */
export function statusOf(m: Message, myId: string | number): Status {
  const theirs = m.message_status?.find((s) => !sameId(s.user_id, myId));
  if (theirs?.is_watched === true && theirs.watched_at) return "read";
  if (theirs?.is_received === 1 && theirs.received_at) return "delivered";
  return "sent";
}

/** What a row or a quote says of a message. */
export function wordsOf(m: Message, words: MapWords): string {
  if (isDeleted(m)) return words.deleted;
  switch (m.message_type?.name) {
    case "TextMessage":
      return contentOf(m);
    case "ImageMessage":
      return words.photo;
    case "VideoMessage":
      return words.video;
    case "VoiceMessage":
      return words.voice;
    case "FileMessage":
      return previewOf({ kind: "file", id: "", time: "", side: "in", src: "", name: fileOf(m)?.file_name ?? "" }, words);
    case "ShareProduct":
      return productOf(m)?.product_name || words.product;
    case "VoiceCall":
      return words.voiceCall;
    case "VideoCall":
      return words.videoCall;
    default:
      return "";
  }
}

/**
 * One live message as the screen's message, or null for a type the screens
 * do not know.
 */
export function toMessage(
  m: Message,
  ctx: MapContext,
  answered: ReadonlySet<string> = new Set(),
): ChatMessage | null {
  const id = String(m.id || m.mid);
  const side: Side = sameId(m.sender_user_id, ctx.myId) ? "out" : "in";
  const time = clockNow(new Date(m.created_at));
  if (isDeleted(m)) return { kind: "deleted", id, time, side };

  const own = side === "out";
  const pending = !!m.mid;
  const myLabel = m.tags?.find(
    (tag) =>
      tag.user_ids?.some((u) => sameId(u, ctx.myId)) &&
      CHAT_LABELS.some((label) => label.id === tag.tag),
  )?.tag;
  const remindAt = m.reminder?.remind_at ? timeOf(m.reminder.remind_at) : NaN;
  const base = {
    id,
    time,
    ...(myLabel ? { category: myLabel } : {}),
    ...(Number.isNaN(remindAt) ? {} : { reminderAt: remindAt }),
    ...(pending ? { pending: true } : {}),
    ...(m.is_forward === 1 ? { forwarded: true } : {}),
  };
  const status = own ? statusOf(m, ctx.myId) : undefined;
  const file = fileOf(m);

  if (isCall(m)) {
    const tone = getCallDirection(
      m.sender_user_id,
      ctx.myId,
      m.duration_in_seconds,
      ctx.liveCallId != null && sameId(ctx.liveCallId, m.id),
    );
    const seconds = Number(m.duration_in_seconds) || 0;
    return {
      ...base,
      kind: "call",
      side,
      tone,
      width: CALL_CARD_WIDTH[tone],
      sub: tone === "missed" ? "callBack" : seconds > 0 ? "minutes" : "noAnswer",
      ...(seconds > 0 ? { minutes: String(Math.max(1, Math.round(seconds / 60))) } : {}),
      ...(m.message_type.name === "VideoCall" ? { video: true } : {}),
    };
  }

  switch (m.message_type?.name) {
    case "TextMessage": {
      const parent = m.parent_message;
      return {
        ...base,
        kind: "text",
        side,
        text: contentOf(m),
        status,
        ...(parent ? { replyTo: { id: String(parent.id), text: wordsOf(parent, ctx.words) } } : {}),
        ...(answered.has(id) ? { repliedTo: true } : {}),
        ...(m.is_edited === 1 ? { edited: true } : {}),
      };
    }
    case "ImageMessage":
      return { ...base, kind: "photo", side, src: file?.file_path ?? "", status };
    case "VideoMessage":
      return {
        ...base,
        kind: "video",
        side,
        src: file?.file_path ?? "",
        seconds: Number(m.duration_in_seconds) || 0,
        status,
      };
    case "VoiceMessage":
      return {
        ...base,
        kind: "voice",
        side,
        src: file?.file_path ?? "",
        seconds: Number(m.duration_in_seconds) || 0,
        status,
      };
    case "FileMessage":
      return {
        ...base,
        kind: "file",
        side,
        src: file?.file_path ?? "",
        name: file?.file_name ?? "",
        status,
      };
    case "ShareProduct": {
      const product = productOf(m);
      return {
        ...base,
        kind: "product",
        side,
        name: product?.product_name ?? "",
        image: product?.product_image_url ? GetImageUrl(product.product_image_url) : "",
        slug: product?.product_slug ?? "",
        status,
      };
    }
    default:
      return null;
  }
}

/**
 * A chat's messages as the screen draws them: oldest first, with a day pill
 * before the first message of each day.
 */
export function toMessages(messages: Message[] | null | undefined, ctx: MapContext): ChatMessage[] {
  const sorted = sortMessages(messages);
  const answered = new Set(
    sorted.map((m) => m.parent_message_id).filter(Boolean).map(String),
  );
  const out: ChatMessage[] = [];
  let lastDay = "";
  for (const m of sorted) {
    const mapped = toMessage(m, ctx, answered);
    if (!mapped) continue;
    const at = timeOf(m.created_at);
    const day = new Date(at).toDateString();
    if (day !== lastDay) {
      lastDay = day;
      out.push({ kind: "day", id: `day-${mapped.id}`, time: mapped.time, ...dayPill(at, ctx.locale, ctx.now) });
    }
    out.push(mapped);
  }
  return out;
}

/** The person a chat is with, as the screens' contact. */
export function toContact(chat: Channel, ctx: MapContext): Contact {
  const peer = peerOf(chat, ctx.myId);
  const name = (ctx.chatName ?? getChatName)(chat) ?? "";
  // The other member's photo only, as the old row (`getChatPhoto`).
  const photo = peer?.user?.photo_path;
  return {
    id: String(peer?.user_id ?? `chat-${chat.id}`),
    name,
    phone: peer?.user?.mobile_phone ?? chat.mobile_phone ?? "",
    ...(photo ? { photo: GetImageUrl(photo) } : {}),
    initials: initialsOf(name),
  };
}

/** One live chat as the screens' chat row and conversation. */
export function toThread(chat: Channel, ctx: MapContext): ChatThread {
  const sorted = sortMessages(chat.messages);
  const last = sorted[sorted.length - 1];
  const peer = peerOf(chat, ctx.myId);
  // Pin and mute live on my own member row, not on the chat (store/chat/reducer.ts).
  const mine = chat.channel_members?.find((m) => sameId(m.user_id, ctx.myId));
  // The typing words the old chat writes to Firebase; "null" is none.
  const typing = (chat as Channel & { status?: unknown }).status;
  const mark: DeliveryMark | undefined =
    last && !isDeleted(last) && !isCall(last) && sameId(last.sender_user_id, ctx.myId)
      ? statusOf(last, ctx.myId)
      : undefined;
  return {
    id: String(chat.id),
    contact: toContact(chat, ctx).id,
    unread: unreadOf(chat, ctx.myId),
    ...(typeof typing === "string" && typing && typing !== "null" ? { typingNow: true } : {}),
    ...(mark ? { mark } : {}),
    ...(Number(mine?.pin) === 1 ? { pinned: true } : {}),
    ...(Number(mine?.mute) === 1 ? { muted: true } : {}),
    ...(chat.is_archived === 1 ? { archived: true } : {}),
    ...(peer?.is_blocked === 1 ? { blocked: true } : {}),
    ...(chat.channel_members?.some((m) => m.is_blocked === 1) ? { blockedEitherWay: true } : {}),
    preview: last ? wordsOf(last, ctx.words) : "",
    time: last ? (ctx.rowTime ?? showDate)(last.created_at) : "",
    lastAt: last ? timeOf(last.created_at) : timeOf(chat.updated_at) || 0,
    messages: toMessages(sorted, ctx),
  };
}
