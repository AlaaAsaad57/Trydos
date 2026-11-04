import { openChatFromList } from "components/Chat/openChatFromList";
import { useAppStore } from "store";
import {
  ArchiveChannel,
  CancelMessageReminder,
  EditMessageApi,
  MarkChannelUnread,
  MuteChat,
  PinnChat,
  SetMessageReminder,
  SetUserBlocked,
  ToggleMessageTag,
  deleteChat as DeleteChatApi,
} from "store/chat/actions";
import { DeleteMessage } from "store/chat/chatUtils";
import { isPinLimitReached } from "store/chat/reducer";
import { showErrorNotification } from "store/notifications/reducer";
import { translateFunction } from "utils/functions";
import type { Channel, Message } from "utils/types/chat";
import { CHAT_LABELS, type ChatAction } from "./chatModel";
import { peerOf, unreadOf } from "./chatMapper";

/**
 * What a screen action does to the real chat. Stage 6, step 3b.
 *
 * Each action calls the same live actions, in the same order, as the old
 * chat UI does (components/Chat/components/ChatOptions.tsx, ChatInfo.tsx and
 * the message menus). An action on a chat or a message that is not loaded
 * does nothing. Actions with no chat backend yet (reactions CH-1, disable
 * calls CH-4) say "Soon available" (A-8).
 */

const sameId = (a: unknown, b: unknown) => a != null && b != null && String(a) === String(b);

/** The chat with this id: the open one first (it holds the most messages), then the lists. */
export function findChannel(id: string): Channel | undefined {
  const { activeChat, data, archivedChats } = useAppStore.getState();
  return [activeChat, ...(data ?? []), ...(archivedChats ?? [])].find((c) => sameId(c?.id, id)) ?? undefined;
}

const findMessage = (chat: Channel | undefined, id: string): Message | undefined =>
  chat?.messages?.find((m) => sameId(m.id, id));

const myId = () => useAppStore.getState().userChat?.id;

/** The label I put on a message, if it is one of the design's 5. */
const myLabelOf = (m: Message | undefined) =>
  m?.tags?.find(
    (tag) => tag.user_ids?.some((u) => sameId(u, myId())) && CHAT_LABELS.some((l) => l.id === tag.tag),
  )?.tag;

export type ActionHelpers = {
  /** Shows a short word to the shopper (the screens' toast). */
  say: (text: string) => void;
};

export async function runChatAction(action: ChatAction, { say }: ActionHelpers): Promise<void> {
  const state = useAppStore.getState();
  switch (action.type) {
    case "open": {
      const chat = findChannel(action.chat);
      if (chat) openChatFromList(chat);
      return;
    }
    case "leave":
      state.openChat(null);
      return;
    case "pin": {
      const chat = findChannel(action.chat);
      const mine = chat?.channel_members?.find((m) => sameId(m.user_id, myId()));
      if (!chat || !mine) return;
      const pinned = Number(mine.pin) === 1;
      // Only 3 chats may be pinned. Unpin always works.
      if (!pinned && isPinLimitReached(state.data)) {
        showErrorNotification(translateFunction("only 3 pinned chats allowed"));
        return;
      }
      PinnChat({ id: chat.id, value: !pinned, member_id: mine.id });
      state.pinChat({ id: chat.id, value: !pinned, member_id: mine.id });
      return;
    }
    case "mute": {
      const chat = findChannel(action.chat);
      const mine = chat?.channel_members?.find((m) => sameId(m.user_id, myId()));
      if (!chat || !mine) return;
      const muted = Number(mine.mute) === 1;
      MuteChat({ id: chat.id, value: !muted, member_id: mine.id });
      state.muteChat({ id: chat.id, value: !muted, member_id: mine.id });
      return;
    }
    case "unread": {
      const chat = findChannel(action.chat);
      if (!chat) return;
      // "Read" is the same call as opening the chat: `/watched` clears the counter.
      if (unreadOf(chat, myId()) > 0) state.watchChannel(chat.id);
      else await MarkChannelUnread(chat.id);
      return;
    }
    case "block": {
      const chat = findChannel(action.chat);
      const peer = chat ? peerOf(chat, myId()) : undefined;
      if (!chat || !peer) return;
      await SetUserBlocked(chat.id, peer.user_id, peer.is_blocked !== 1);
      return;
    }
    case "archive":
    case "unarchive": {
      if (!findChannel(action.chat)) return;
      await ArchiveChannel(action.chat, action.type === "archive");
      return;
    }
    case "deleteChat": {
      const chat = findChannel(action.chat);
      if (!chat) return;
      DeleteChatApi(chat.id);
      state.deleteChat({ id: chat.id });
      return;
    }
    case "deleteMessage": {
      const chat = findChannel(action.chat);
      if (!findMessage(chat, action.id)) return;
      // Delete for me. "Delete for everyone" is added in step 6 (D-36b).
      DeleteMessage(chat.id, action.id, false);
      return;
    }
    case "editMessage": {
      const chat = findChannel(action.chat);
      const message = findMessage(chat, action.id);
      const text = action.text.trim();
      if (!message || !text || !sameId(message.sender_user_id, myId())) return;
      await EditMessageApi(chat.id, message.id, text);
      return;
    }
    case "category": {
      // One label per message (D-37): take the old one off, then put the new one on.
      const chat = findChannel(action.chat);
      const message = findMessage(chat, action.id);
      if (!message) return;
      const current = myLabelOf(message);
      if (current === (action.category ?? undefined)) return;
      if (action.category !== null && !CHAT_LABELS.some((l) => l.id === action.category)) return;
      if (current && !(await ToggleMessageTag(chat.id, message.id, current))) return;
      if (action.category) await ToggleMessageTag(chat.id, message.id, action.category);
      return;
    }
    case "remind": {
      const chat = findChannel(action.chat);
      const message = findMessage(chat, action.id);
      if (!message) return;
      if (action.at !== null) await SetMessageReminder(chat.id, message.id, new Date(action.at));
      else if (message.reminder?.id) await CancelMessageReminder(chat.id, message.id, message.reminder.id);
      return;
    }
    case "react":
    case "calls":
      // No chat backend yet: reactions (CH-1), disable calls (CH-4).
      say(translateFunction("Soon available"));
      return;
    default:
      // send, receive, typing, status, forward, newChat and addContact come
      // from the chat itself or have their own helpers (step 3c).
      return;
  }
}
