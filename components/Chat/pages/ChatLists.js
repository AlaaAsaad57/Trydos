import ChatItem from "components/Chat/components/ChatItem";
import { isNew } from "components/Chat/chatsFunctions";

import { forwardMessage } from "../chatsFunctions";
import SearchResult from "components/Chat/components/SearchResult";
import { getUserChat } from "utils/functions";
import { GetLastSeen } from "store/chat/actions";
import Skeleton from "react-loading-skeleton";
import { useAppStore } from "store";
import GetMoreChats from "../components/GetMoreChats";
import { useState } from "react";
function ChatLists(props) {
  const {
    data: chats,
    chat_loading: loading,
    openChat,
    watchChannel,
    pinnedChats: pinned,
    chatSearchResults: searchResults,
    activeChat,
    setMain,
    main,
    forwarded_message,
  } = useAppStore();
  const [hasMore, setHasMore] = useState(true);
  const handleClick = (e) => {
    if (true) {
      let friendId = e.channel_members.filter(
        (member) => parseInt(member.user_id) !== parseInt(getUserChat().id)
      )[0]?.user_id;
      GetLastSeen(e.id, friendId);
    }
    openChat(e);
    if (e?.id && !(typeof e?.id === "string" && e.id.includes("ch")))
      watchChannel(e?.id);
    if (forwarded_message) {
      forwardMessage(forwarded_message, e);
    }
  };
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

  const getSortedChats = () => {
    return [...chats]
      .filter((s) => !s.isPrivate || s.channel_name !== "Deleivery Worker")
      .sort((a, b) => {
        // 1. Find the newest timestamp in Chat A
        const newestA =
          a.messages.length > 0
            ? Math.max(
                ...a.messages.map((m) => new Date(m.created_at).getTime())
              )
            : 0;

        // 2. Find the newest timestamp in Chat B
        const newestB =
          b.messages.length > 0
            ? Math.max(
                ...b.messages.map((m) => new Date(m.created_at).getTime())
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
              {getSortedChats()
                ?.filter(
                  (s) =>
                    s.channel_members.filter(
                      (mem) => mem.user_id === getUserChat()?.id
                    )[0]?.pin === 1
                )
                .map((chat, key) => {
                  return (
                    <ChatItem
                      key={key}
                      myKey={key}
                      isActive={activeChat?.id === chat.id}
                      handleClickChat={() => handleClick(chat)}
                      status={chat.status}
                      unread={chat.messages}
                      newMessage={isNew(chat.messages)}
                      pinned={true}
                      muted={
                        parseInt(
                          chat.channel_members.filter(
                            (s) => s.user_id === getUserChat()?.id
                          )[0]?.mute
                        ) === 1
                      }
                      SenderName={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id
                        )[0]?.user?.name
                      }
                      photo={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id
                        )[0]?.user?.photo_path
                      }
                      lastMessage={chat.messages[chat.messages.length - 1]}
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
                      (mem) => mem.user_id === getUserChat()?.id
                    )[0]?.pin === 0 &&
                    pinned.filter((p) => p.id === s.id).length === 0
                )
                .map((chat, key) => {
                  return (
                    <ChatItem
                      key={key}
                      myKey={key}
                      isActive={activeChat?.id === chat.id}
                      handleClickChat={() => handleClick(chat)}
                      status={chat.status}
                      unread={chat.messages}
                      newMessage={isNew(chat.messages)}
                      pinned={
                        parseInt(
                          chat.channel_members.filter(
                            (s) => s.user_id === getUserChat()?.id
                          )[0]?.pin
                        ) === 1
                      }
                      muted={
                        parseInt(
                          chat.channel_members.filter(
                            (s) => s.user_id === getUserChat()?.id
                          )[0]?.mute
                        ) === 1
                      }
                      SenderName={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id
                        )[0]?.user?.name
                      }
                      photo={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id
                        )[0]?.user?.photo_path
                      }
                      lastMessage={chat.messages[chat.messages.length - 1]}
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
            <>
              {chats
                .filter(
                  (s) => !s.isPrivate || s.channel_name !== "Deleivery Worker"
                )
                .filter(
                  (chat) =>
                    chat.channel_members.filter(
                      (mem) =>
                        mem.user_id !== getUserChat()?.id &&
                        mem.user?.name
                          ?.toLowerCase()
                          ?.includes(props.search.toLowerCase())
                    ).length > 0
                )
                .map((chat, key) => {
                  return (
                    <ChatItem
                      key={key}
                      myKey={key}
                      isActive={activeChat?.id === chat.id}
                      handleClickChat={() => handleClick(chat)}
                      status={chat.status}
                      unread={chat.unread}
                      newMessage={isNew(chat.messages)}
                      pinned={
                        parseInt(
                          chat.channel_members.filter(
                            (s) => s.user_id === getUserChat()?.id
                          )[0]?.pin
                        ) === 1
                      }
                      muted={
                        parseInt(
                          chat.channel_members.filter(
                            (s) => s.user_id === getUserChat()?.id
                          )[0]?.mute
                        ) === 1
                      }
                      SenderName={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id
                        )[0]?.user?.name
                      }
                      photo={
                        chat?.channel_members.filter(
                          (member) => member?.user_id !== getUserChat()?.id
                        )[0]?.user?.photo_path
                      }
                      lastMessage={chat.messages[chat.messages.length - 1]}
                      id={chat.id}
                      chat={chat}
                      chat_members={chat?.channel_members}
                    />
                  );
                })}

              {searchResults
                .filter((mem) =>
                  mem.name.toLowerCase().includes(props.search.toLowerCase())
                )
                .map((item, key) => {
                  if (
                    chats.filter(
                      (chat) =>
                        chat.channel_members.filter(
                          (mem) => mem.user_id === item.id
                        ).length > 0
                    ).length > 0 ||
                    chats.filter(
                      (chat) =>
                        chat.channel_members.filter(
                          (mem) => mem.user_id === item.id
                        ).length > 0
                    ).length > 0
                  ) {
                    return <></>;
                  } else
                    return (
                      <SearchResult
                        key={key}
                        myKey={key}
                        item={item}
                        handleClickChat={(e) => handleClick(e)}
                        SenderName={item.name}
                        isUser={Boolean(item.contact_user_id)}
                      />
                    );
                })}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ChatLists;
