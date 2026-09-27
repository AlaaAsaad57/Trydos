import { useEffect, useState } from "react";
import ChatItem from "components/Chat/components/ChatItem";
import Spinner from "components/global/Spinner";
import {
  getChatName,
  getChatPhoto,
  unreadCount,
} from "components/Chat/chatsFunctions";
import {
  getLatestMessage,
  openChatFromList,
} from "components/Chat/components/ChatSearchResults";
import { GetArchivedChats } from "store/chat/actions";
import { getUserChat, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { ChatFolderHeader } from "./ChatFolderRow";

/**
 * The chats I archived. Each row has the same swipe options as the main list;
 * its archive option reads "Unarchive" and moves the chat back.
 */
function ArchivedChatsList({ onBack }: { onBack: () => void }) {
  const { archivedChats, activeChat } = useAppStore();
  const [loading, setLoading] = useState(true);

  // Asked again on every opening: another device may have archived or
  // unarchived a chat since the chat list loaded.
  useEffect(() => {
    Promise.resolve(GetArchivedChats()).finally(() => setLoading(false));
  }, []);
  const me = getUserChat()?.id;
  const mine = (chat: any) =>
    chat.channel_members?.find((m: any) => m.user_id === me);

  return (
    <div className="chat-list-items chat-lists-class" data-pw="ARCHIVED-CHATS">
      <ChatFolderHeader title="Archived" onBack={onBack} />
      {archivedChats.length === 0 && loading ? (
        <div className="flex justify-center p-[20px]">
          <Spinner />
        </div>
      ) : archivedChats.length === 0 ? (
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
            SenderName={getChatName(chat)}
            photo={getChatPhoto(chat)}
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
