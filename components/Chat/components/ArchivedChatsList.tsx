import ChatItem from "components/Chat/components/ChatItem";
import { unreadCount } from "components/Chat/chatsFunctions";
import {
  getLatestMessage,
  openChatFromList,
} from "components/Chat/components/ChatSearchResults";
import { getUserChat, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { ChatFolderHeader } from "./ChatFolderRow";

/**
 * The chats I archived. Each row has the same swipe options as the main list;
 * its archive option reads "Unarchive" and moves the chat back.
 */
function ArchivedChatsList({ onBack }: { onBack: () => void }) {
  const { archivedChats, activeChat } = useAppStore();
  const me = getUserChat()?.id;
  const mine = (chat: any) =>
    chat.channel_members?.find((m: any) => m.user_id === me);
  const other = (chat: any) =>
    chat.channel_members?.find((m: any) => m.user_id !== me);

  return (
    <div className="chat-list-items chat-lists-class" data-pw="ARCHIVED-CHATS">
      <ChatFolderHeader title="Archived" onBack={onBack} />
      {archivedChats.length === 0 ? (
        <div className="p-[20px] text-center text-[14px] text-[#8e8d92]">
          {translateFunction("No archived chats")}
        </div>
      ) : (
        archivedChats.map((chat: any) => (
          <ChatItem
            key={chat.id}
            isActive={activeChat?.id === chat.id}
            handleClickChat={() => openChatFromList(chat)}
            status={chat.status}
            unread={unreadCount(chat) > 0}
            newMessage={unreadCount(chat)}
            pinned={parseInt(mine(chat)?.pin) === 1}
            muted={parseInt(mine(chat)?.mute) === 1}
            archived={true}
            SenderName={other(chat)?.user?.name}
            photo={other(chat)?.user?.photo_path}
            lastMessage={getLatestMessage(chat.messages)}
            id={chat.id}
            chat_members={chat.channel_members}
          />
        ))
      )}
    </div>
  );
}

export default ArchivedChatsList;
