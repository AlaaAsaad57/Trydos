// The search results the chats tab and the contacts tab both draw, so the same
// text shows the same rows in either tab. What matches is decided in
// ../chatSearch.ts.
import ChatItem from "components/Chat/components/ChatItem";
import SearchResult from "components/Chat/components/SearchResult";
import { forwardMessage, isNew } from "components/Chat/chatsFunctions";
import { contactUserId, searchChatList } from "components/Chat/chatSearch";
import { GetLastSeen } from "store/chat/actions";
import { getUserChat } from "utils/functions";
import { useAppStore } from "store";

/** Open a chat from a list: the chats tab, the contacts tab, or a search. */
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

/**
 * The newest message of a chat, by time.
 *
 * The row used to read `messages[messages.length - 1]` — the last element —
 * which trusts the array order. Nothing guarantees that order: `setChats`
 * reverses whatever the server sent, `setPageData` prepends older pages, and
 * live messages are appended. Every other place that means "newest" reads the
 * time instead — `getSortedChats` in pages/ChatLists.jsx, and `sortedMessages`
 * in the conversation. So whenever the array order and the times disagreed, the
 * chat jumped to the top of the list (placed by time) while its row still
 * showed an older message (read by position).
 *
 * Reading by time makes the preview, its date, and the row's position agree,
 * whatever order the array happens to be in. A tie keeps the later element, so
 * two messages in the same second behave as before.
 */
export const getLatestMessage = (messages: any[]) => {
  if (!messages || messages.length === 0) return null;
  return messages.reduce((latest: any, current: any) =>
    new Date(current.created_at).getTime() >=
    new Date(latest.created_at).getTime()
      ? current
      : latest,
  );
};

function ChatSearchResults({
  search,
  onOpened,
}: {
  search: string;
  /** Called after a row opens its chat, e.g. to close the contacts panel. */
  onOpened?: () => void;
}) {
  const { data: allChats, chatSearchResults, activeChat } = useAppStore();
  const me = getUserChat()?.id;
  const { chats, contacts } = searchChatList({
    search,
    chats: allChats ?? [],
    contacts: chatSearchResults ?? [],
    meId: me,
  });

  const open = (chat: any) => {
    openChatFromList(chat);
    onOpened?.();
  };
  const mine = (chat: any) =>
    chat.channel_members.filter((s: any) => s.user_id === me)[0];
  const other = (chat: any) =>
    chat.channel_members.filter((member: any) => member?.user_id !== me)[0];

  return (
    <>
      {chats.map((chat) => (
        <ChatItem
          key={`chat-${chat.id}`}
          isActive={activeChat?.id === chat.id}
          handleClickChat={() => open(chat)}
          status={chat.status}
          unread={chat.unread}
          newMessage={isNew(chat.messages)}
          pinned={parseInt(mine(chat)?.pin) === 1}
          muted={parseInt(mine(chat)?.mute) === 1}
          SenderName={other(chat)?.user?.name}
          photo={other(chat)?.user?.photo_path}
          lastMessage={getLatestMessage(chat.messages)}
          id={chat.id}
          chat_members={chat.channel_members}
        />
      ))}
      {contacts.map((item: any, key) => (
        <SearchResult
          key={`contact-${item.id ?? key}`}
          photo={undefined}
          item={item}
          handleClickChat={(chat: any) => open(chat)}
          SenderName={item.name || item.mobile_phone}
          isUser={contactUserId(item) !== null}
        />
      ))}
    </>
  );
}

export default ChatSearchResults;
