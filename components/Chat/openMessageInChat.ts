// Open a chat at one of its messages, from a list outside the chat (the
// Reminders folder).
//
// Two things may be missing when the list is tapped:
//   1. The chat. The chat list loads 10 chats a page, so the chat of a
//      reminder is often not in the store yet. The chat backend has no call
//      for one chat by id, so its pages are walked until the chat turns up.
//   2. The message. The chat holds only its newest page. The message may be
//      far up, so the messages from the oldest loaded one up to it are loaded
//      first — the same call a tap on a quote uses.
// The chat shows only when both are in the store. Then the conversation
// scrolls to the message and flashes it (`jumpToMessageId`).
import { openChatFromList } from "components/Chat/components/ChatSearchResults";
import { findChat } from "components/Chat/findChat";
import { getMessagesBetweenTwoMessages } from "store/chat/actions";
import { showErrorNotification } from "store/notifications/reducer";
import { LogError, translateFunction } from "utils/functions";
import { useAppStore } from "store";

const sameId = (a: any, b: any) =>
  a != null && b != null && String(a) === String(b);

/** The oldest message by time. The array order is not to be trusted. */
const oldestMessage = (messages: any[]) =>
  messages.reduce<any>(
    (oldest, m) =>
      !oldest ||
      new Date(m.created_at).getTime() < new Date(oldest.created_at).getTime()
        ? m
        : oldest,
    null,
  );

/**
 * Show the chat `channelId` scrolled to the message `messageId`. Answers false
 * when the chat could not be found; the shopper is told so.
 */
export async function openMessageInChat(
  channelId: string | number | null | undefined,
  messageId: string | number,
): Promise<boolean> {
  const chat: any = channelId == null ? null : await findChat(channelId);
  if (!chat) {
    showErrorNotification(translateFunction("Could not open the chat"));
    return false;
  }

  openChatFromList(chat);
  const messages = useAppStore.getState().activeChat?.messages ?? [];
  let loaded = messages.some((m: any) => sameId(m.id, messageId));
  if (!loaded) {
    try {
      await getMessagesBetweenTwoMessages({
        first: oldestMessage(messages)?.id ?? messageId,
        second: messageId,
        channel_id: chat.id,
      });
      loaded = true;
    } catch (error) {
      // The chat still opens, at its newest message.
      showErrorNotification(translateFunction("Could not load the message"));
      LogError({
        scenario: "openMessageInChat: load the messages up to the message",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const { setMain, setJumpToMessage } = useAppStore.getState();
  setMain("chat");
  if (loaded) setJumpToMessage(messageId);
  return true;
}
