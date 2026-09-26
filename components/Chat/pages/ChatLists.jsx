import ChatItem from "components/Chat/components/ChatItem";
import { unreadCount } from "components/Chat/chatsFunctions";

import ChatSearchResults, {
  getLatestMessage,
  openChatFromList,
} from "components/Chat/components/ChatSearchResults";
import { getUserChat } from "utils/functions";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";
import GetMoreChats from "../components/GetMoreChats";
import { useEffect, useState } from "react";
import { GetArchivedChats, GetMyReminders } from "store/chat/actions";
import ChatFolderRow from "../components/ChatFolderRow";
import ArchivedChatsList from "../components/ArchivedChatsList";
import RemindersList from "../components/RemindersList";

function ChatLists(props) {
  const {
    data: chats,
    chat_loading: loading,
    pinnedChats: pinned,
    activeChat,
    archivedChats,
    reminders,
    userChat,
  } = useAppStore();
  const [hasMore, setHasMore] = useState(true);
  /** "main", or one of the two folders at the top of the list. */
  const [view, setView] = useState("main");
  const handleClick = openChatFromList;

  // The folder rows show only when they hold something, so both lists are
  // asked for once the chat user is known.
  useEffect(() => {
    if (!userChat?.id) return;
    GetArchivedChats();
    GetMyReminders();
  }, [userChat?.id]);
  if (loading) {
    return (
      <div className="chat-list-items gap-[10px]">
        {[1, 1, 1, 1, 1].map((s, i) => (
          <div className="chat-conversation-item  mt-[10px]" key={i}>
            <div className="w-[60px] h-[60px] rounded-[12px]">
              <Skeleton className="w-full h-full" borderRadius={100} />
            </div>
            <div className="w-[80px] ml-[20px] h-[60px] items-start pt-[3px] ">
              <Skeleton className="w-full h-[21px]" borderRadius={2} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === "archived") {
    return <ArchivedChatsList onBack={() => setView("main")} />;
  }
  if (view === "reminders") {
    return <RemindersList onBack={() => setView("main")} />;
  }

  // An archived chat stays out of the main list, even when a push put it
  // back into the store: archiving is only undone by "Unarchive".
  const archivedIds = new Set(archivedChats.map((c) => String(c.id)));

  const getSortedChats = () => {
    return [...chats]
      .filter((s) => !s.isPrivate || s.channel_name !== "Delivery Worker")
      .filter((s) => s.is_archived !== 1 && !archivedIds.has(String(s.id)))
      .sort((a, b) => {
        // 1. Find the newest timestamp in Chat A
        const newestA =
          a.messages.length > 0
            ? Math.max(
                ...a.messages.map((m) => new Date(m.created_at).getTime()),
              )
            : 0;

        // 2. Find the newest timestamp in Chat B
        const newestB =
          b.messages.length > 0
            ? Math.max(
                ...b.messages.map((m) => new Date(m.created_at).getTime()),
              )
            : 0;

        // 3. Sort Descending (Newest chat first)
        return newestB - newestA;
      });
  };

  return (
    <div className="chat-list-items chat-lists-class ">
      {!loading && (
        <>
          {props.search.length === 0 ? (
            <>
              {reminders.length > 0 && (
                <ChatFolderRow
                  icon="/icons/chat/remind.svg"
                  label="Reminders"
                  count={reminders.length}
                  onClick={() => setView("reminders")}
                  dataPw="CHAT-REMINDERS-FOLDER"
                />
              )}
              {archivedChats.length > 0 && (
                <ChatFolderRow
                  icon="/icons/chat/ArchiveIcon.svg"
                  label="Archived"
                  count={archivedChats.length}
                  onClick={() => setView("archived")}
                  dataPw="CHAT-ARCHIVED-FOLDER"
                />
              )}
              {getSortedChats()
                ?.filter(
                  (s) =>
                    s.channel_members.filter(
                      (mem) => mem.user_id === getUserChat()?.id,
                    )[0]?.pin === 1,
                )
                .map((chat, key) => {
                  return (
                    <ChatItem
                      key={key}
                      myKey={key}
                      isActive={activeChat?.id === chat.id}
                      handleClickChat={() => handleClick(chat)}
                      status={chat.status}
                      unread={unreadCount(chat) > 0}
                      newMessage={unreadCount(chat)}
                      pinned={true}
                      muted={
                        parseInt(
                          chat.channel_members.filter(
                            (s) => s.user_id === getUserChat()?.id,
                          )[0]?.mute,
                        ) === 1
                      }
                      SenderName={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id,
                        )[0]?.user?.name
                      }
                      photo={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id,
                        )[0]?.user?.photo_path
                      }
                      lastMessage={getLatestMessage(chat.messages)}
                      id={chat.id}
                      chat={chat}
                      chat_members={chat?.channel_members}
                    />
                  );
                })}
              {getSortedChats()
                ?.filter(
                  (s) =>
                    s.channel_members.filter(
                      (mem) => mem.user_id === getUserChat()?.id,
                    )[0]?.pin === 0 &&
                    pinned.filter((p) => p.id === s.id).length === 0,
                )
                .map((chat, key) => {
                  return (
                    <ChatItem
                      key={key}
                      myKey={key}
                      isActive={activeChat?.id === chat.id}
                      handleClickChat={() => handleClick(chat)}
                      status={chat.status}
                      unread={unreadCount(chat) > 0}
                      newMessage={unreadCount(chat)}
                      pinned={
                        parseInt(
                          chat.channel_members.filter(
                            (s) => s.user_id === getUserChat()?.id,
                          )[0]?.pin,
                        ) === 1
                      }
                      muted={
                        parseInt(
                          chat.channel_members.filter(
                            (s) => s.user_id === getUserChat()?.id,
                          )[0]?.mute,
                        ) === 1
                      }
                      SenderName={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id,
                        )[0]?.user?.name
                      }
                      photo={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id,
                        )[0]?.user?.photo_path
                      }
                      lastMessage={getLatestMessage(chat.messages)}
                      id={chat.id}
                      chat={chat}
                      chat_members={chat?.channel_members}
                    />
                  );
                })}
              {chats.length >= 10 && hasMore && (
                <GetMoreChats hasMore={hasMore} setHasMore={setHasMore} />
              )}
            </>
          ) : (
            <ChatSearchResults search={props.search} />
          )}
        </>
      )}
    </div>
  );
}

export default ChatLists;
