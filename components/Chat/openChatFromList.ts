import { forwardMessage } from "components/Chat/chatsFunctions";
import { GetLastSeen } from "store/chat/actions";
import { getUserChat } from "utils/functions";
import { useAppStore } from "store";

/**
 * Open a chat from a list: the chats tab, the contacts tab, a search, or the
 * new chat screens. Its own small file (moved out of
 * components/ChatSearchResults.tsx, which re-exports it), so the new chat
 * screens can use it without loading the old chat's list components.
 */
export const openChatFromList = (chat: any) => {
  const { openChat, watchChannel, forwarded_message } = useAppStore.getState();
  const friendId = chat.channel_members?.filter(
    (member: any) => parseInt(member.user_id) !== parseInt(getUserChat().id),
  )[0]?.user_id;
  GetLastSeen(chat.id, friendId);
  openChat(chat);
  // A `ch-<user id>` chat is a placeholder with no channel on the backend yet.
  if (chat?.id && !(typeof chat.id === "string" && chat.id.includes("ch")))
    watchChannel(chat.id);
  if (forwarded_message) forwardMessage(forwarded_message, chat);
};
