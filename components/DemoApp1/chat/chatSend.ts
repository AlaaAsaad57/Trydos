import { forwardMessage, upload } from "components/Chat/chatsFunctions";
import { openChatFromList } from "components/Chat/openChatFromList";
import { finishUpload, startUpload } from "components/Chat/uploadCancel";
import { isUnsupportedVideoFile, pickMessageType, type ChatMessageType } from "components/Chat/videoSupport";
import { useAppStore } from "store";
import { SaveContact, SendMessage, getContacts } from "store/chat/actions";
import { showErrorNotification } from "store/notifications/reducer";
import { LogError, translateFunction } from "utils/functions";
import { CHAT_EVENTS, trackPosthog } from "utils/posthogEvents";
import type { Channel, Member, Message } from "utils/types/chat";
import { findChannel } from "./chatActions";
import type { Contact } from "./chatModel";

/**
 * Sending from the new chat screens to the real chat. Stage 6, step 3c.
 *
 * The same steps as the old conversation (components/Chat/pages/
 * ConversationContainer.tsx), moved out of it because Part 2 removes it:
 *
 *   1. a "sending" copy goes into the store at once (it has a local `mid`);
 *   2. a file is uploaded (25 MB cap in `upload`), and the sender can cancel
 *      it from the bubble (`startUpload`);
 *   3. the message goes to the chat backend (`SendMessage`), which swaps the
 *      copy for the stored message, or takes it back and says "Failed to send
 *      message";
 *   4. `chat_message_sent` goes to PostHog with the old properties (D-10).
 */

const sameId = (a: unknown, b: unknown) => a != null && b != null && String(a) === String(b);

const me = () => useAppStore.getState().userChat;

/** A local id for a message that is not stored yet: "m" and random digits, as the old UI. */
export const newLocalId = () => "m" + Math.random().toString().replace(".", "");

/** The other person of a chat. */
const receiverOf = (chat: Channel): Member | undefined =>
  chat.channel_members?.find((m) => !sameId(m.user_id, me()?.id));

/** Both members' status on a message that is not stored yet: nobody has it. */
const pendingStatus = (receiverId: unknown, senderId: unknown) => [
  { is_watched: false, is_received: 0, user_id: senderId },
  { is_received: 0, is_watched: false, user_id: receiverId },
];

/**
 * An order's chat with its delivery worker (D-36c) carries its participant
 * id, and every message to it says so, as the old order chat widget did
 * (`isPrivate` in ConversationContainer.tsx).
 */
const orderChatOf = (chat: Channel) => chat.order_chat_participant_id ?? undefined;

/** A new chat (`ch-<user id>`) has no channel on the chat backend yet. */
const isNewChat = (chat: Channel) => typeof chat.id === "string" && chat.id.includes("ch");

/** Reads a file or a sound as a data URL, for the sending bubble's preview. */
export const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Puts the sending copy into the store, as the old conversation did. */
function putSendingCopy(chat: Channel, message: Record<string, unknown>) {
  useAppStore.getState().sendMessage({
    isNew: isNewChat(chat) ? chat.id : false,
    act: chat,
    message,
    isPrivate: orderChatOf(chat),
  });
}

const track = (chat: Channel, type: string, isReply: boolean) =>
  trackPosthog(CHAT_EVENTS.CHAT_MESSAGE_SENT, {
    conversation_id: chat.id,
    message_type: type,
    is_order_chat: !!orderChatOf(chat),
    is_reply: isReply,
  });

/** The message being answered, in the chat. */
const parentOf = (chat: Channel, replyTo?: { id: string }): Message | undefined =>
  replyTo ? chat.messages?.find((m) => sameId(m.id, replyTo.id)) : undefined;

/** Sends a text I typed, answering `replyTo` when given. */
export function sendTextMessage(chatId: string, text: string, replyTo?: { id: string; text: string }) {
  const chat = findChannel(chatId);
  const words = text.trim();
  if (!chat || !words) return;
  const receiverId = receiverOf(chat)?.user_id;
  const senderId = me()?.id;
  const mid = newLocalId();
  const parent = parentOf(chat, replyTo);
  try {
    putSendingCopy(chat, {
      receiver_user_id: receiverId,
      parent_message_id: parent?.id,
      cid: chat.id,
      sender_user_id: senderId,
      message_type: { name: "TextMessage" },
      message_content: { content: words },
      message_files: [{ file_path: words, file_name: "Text" }],
      created_at: new Date(),
      type: "pending",
      parent_message: parent ?? null,
      mid,
      message_status: pendingStatus(receiverId, senderId),
    });
    SendMessage(
      {
        receiver_user_id: receiverId,
        parent_message_id: parent?.id,
        cid: chat.id,
        content: words,
        message_type: "TextMessage",
        mid,
      },
      false,
      orderChatOf(chat),
    );
    track(chat, "TextMessage", !!parent);
  } catch (error) {
    LogError({ error, scenario: "sendTextMessage in the new chat (chatSend.ts)" });
    useAppStore.getState().deleteErrorMessage({ msg_id: mid, ch_id: chat.id });
    showErrorNotification(translateFunction("Failed to send message"));
  }
}

/**
 * Sends a photo, a video, a file or a voice note: the sending copy first,
 * then the upload, then the message. Voice notes keep the old "new chat"
 * flag, as the old recorder did.
 */
export async function sendMediaMessage(
  chatId: string,
  file: File,
  type: ChatMessageType,
  replyTo?: { id: string },
): Promise<void> {
  const chat = findChannel(chatId);
  if (!chat) return;
  const receiverId = receiverOf(chat)?.user_id;
  const senderId = me()?.id;
  const mid = newLocalId();
  const parent = parentOf(chat, replyTo);
  const { deleteErrorMessage } = useAppStore.getState();
  let signal: AbortSignal | undefined;
  try {
    const preview = await readAsDataUrl(file);
    putSendingCopy(chat, {
      receiver_user_id: receiverId,
      parent_message_id: parent?.id,
      cid: chat.id,
      sender_user_id: senderId,
      parent_message: parent ?? null,
      message_type: { name: type },
      message_content: [{ file_path: preview }],
      message_files: [{ file_path: preview, file_name: type === "VoiceMessage" ? "Audio" : file.name }],
      type: "pending",
      created_at: new Date(),
      message_status: pendingStatus(receiverId, senderId),
      mid,
    });
    signal = startUpload(mid, () => deleteErrorMessage({ msg_id: mid, ch_id: chat.id }));
    const { path, name } = await upload(file, signal);
    finishUpload(mid);
    if (signal.aborted) return;
    SendMessage(
      {
        receiver_user_id: receiverId,
        parent_message_id: parent?.id,
        cid: chat.id,
        content: [{ file_path: path, file_name: name }],
        message_type: type,
        mid,
      },
      type === "VoiceMessage" && isNewChat(chat) ? chat.id : false,
      orderChatOf(chat),
    );
    track(chat, type, !!parent);
  } catch (error) {
    finishUpload(mid);
    // Cancelled by the sender: the bubble is already gone, nothing failed.
    if (signal?.aborted) return;
    LogError({ error, scenario: `sendMediaMessage (${type}) in the new chat (chatSend.ts)` });
    deleteErrorMessage({ msg_id: mid, ch_id: chat.id });
    showErrorNotification(
      type === "VoiceMessage"
        ? translateFunction("Failed to Upload audio")
        : ((error as Error)?.message ?? translateFunction("Failed to Upload file")),
    );
  }
}

/** A picked video: one no browser can play is refused with the old words. */
export function sendVideoFile(chatId: string, file: File, replyTo?: { id: string }) {
  if (isUnsupportedVideoFile(file)) {
    showErrorNotification(translateFunction("This video format is not supported. Send an MP4 video instead."));
    return;
  }
  void sendMediaMessage(chatId, file, "VideoMessage", replyTo);
}

/** Any picked file: it becomes the bubble its kind calls for, as in the old UI. */
export function sendAnyFile(chatId: string, file: File, replyTo?: { id: string }) {
  void sendMediaMessage(chatId, file, pickMessageType(file), replyTo);
}

/** A recorded voice note. */
export function sendVoiceNote(chatId: string, audio: Blob, replyTo?: { id: string }) {
  const file = new File([audio], `voice-${newLocalId()}.wav`, { type: audio.type || "audio/wav" });
  void sendMediaMessage(chatId, file, "VoiceMessage", replyTo);
}

/** Forwards a message to another chat, with the old forward. */
export function forwardTo(fromChatId: string, messageId: string, toChatId: string) {
  const message = findChannel(fromChatId)?.messages?.find((m) => sameId(m.id, messageId));
  const target = findChannel(toChatId);
  if (!message || !target) return;
  void forwardMessage(message, target);
}

/**
 * Opens the chat with a contact: the chat there is, or a new chat
 * (`ch-<user id>`) that the chat backend creates with the first message,
 * as the old contact row did. Says the chat's id.
 */
export function openChatWith(contact: Contact): string {
  const { data, archivedChats } = useAppStore.getState();
  const there = [...(data ?? []), ...(archivedChats ?? [])].find((c) =>
    c.channel_members?.some((m) => sameId(m.user_id, contact.id)),
  );
  if (there) {
    openChatFromList(there);
    return String(there.id);
  }
  const user = me();
  const id = `ch-${contact.id}`;
  openChatFromList({
    channel_name: contact.name,
    mobile_phone: contact.phone,
    photo_path: contact.photo ?? null,
    channel_members: [
      {
        user_id: contact.id,
        user: { id: contact.id, name: contact.name, mobile_phone: contact.phone, photo_path: contact.photo ?? null },
        mute: 0,
        pin: 0,
        archived: 0,
      },
      { mute: 0, pin: 0, archived: 0, user_id: user?.id, user },
    ],
    messages: [],
    id,
    mid: id,
  });
  return id;
}

/**
 * Saves a contact (full phone number), loads the contacts again, and says the
 * contact's Trydos user id, or null when the number is not on Trydos (the
 * contact is saved, but there is no one to chat with) or the save failed.
 */
export async function saveContact(name: string, phone: string): Promise<string | null> {
  if (!(await SaveContact(name.trim(), phone))) return null;
  await getContacts();
  const digits = (value: unknown) => String(value ?? "").replace(/\D/g, "");
  const saved = (useAppStore.getState().contacts ?? []).find(
    (c: { mobile_phone?: string; contact_user?: { mobile_phone?: string } }) =>
      digits(c.mobile_phone) === digits(phone) || digits(c.contact_user?.mobile_phone) === digits(phone),
  );
  return saved?.contact_user?.id ? String(saved.contact_user.id) : null;
}

/**
 * Tells the other person "Typing..." for 2 seconds, the way the old
 * conversation did (Firebase `Transaction/<me>/<them>`).
 */
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
export async function sendTyping(chatId: string) {
  const chat = findChannel(chatId);
  const friend = chat ? receiverOf(chat)?.user_id : undefined;
  const mine = me()?.id;
  if (!friend || !mine) return;
  try {
    const { getDb } = await import("utils/firebaseInitv1");
    const { ref, push, set } = await import("firebase/database");
    const db = await getDb();
    const path = `Transaction/${mine}/${friend}`;
    push(ref(db, path), "Typing...").catch(() => {});
    const before = typingTimers.get(path);
    if (before) clearTimeout(before);
    typingTimers.set(
      path,
      setTimeout(() => {
        typingTimers.delete(path);
        set(ref(db, path), null).catch(() => {});
      }, 2000),
    );
  } catch {
    // Typing is a nicety: a Firebase that does not load must not stop the chat.
  }
}
