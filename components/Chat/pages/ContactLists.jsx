import ChatItem from "components/Chat/components/ChatItem";

import SearchResult from "components/Chat/components/SearchResult";
import ChatSearchResults, {
  openChatFromList,
} from "components/Chat/components/ChatSearchResults";
import { dedupeContacts } from "components/Chat/chatSearch";
import { getUserChat, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import ChatContactsUpload from "../components/ChatContactsUpload";

function ContactLists(props) {
  const { data: chats, language, contacts } = useAppStore();

  const handleClick = openChatFromList;
  return (
    <div className="chat-list-items">
      <ChatContactsUpload />
      {/* A search draws the same rows as in the chats tab. */}
      {props.search.length > 0 ? (
        <ChatSearchResults search={props.search} onOpened={props.close} />
      ) : contacts.length === 0 ? (
        <div className="notification-enable">
          <div>{translateFunction("No Contacts", language)}</div>
          <div>
            {translateFunction(
              "Log in Through our App to access contacts",
              language
            )}
          </div>
        </div>
      ) : (
        <>
          {/* One row per person: the same phone or user saved twice shows once. */}
          {dedupeContacts(contacts)
            .map((contact, key) => {
              if (
                chats.filter(
                  (chat) =>
                    chat.channel_members.filter(
                      (mem) =>
                        parseInt(mem.user_id) ===
                        parseInt(contact?.contact_user?.id)
                    ).length > 0
                ).length > 0
              ) {
                return (
                  <ChatItem
                    disabledOptions={true}
                    myKey={key}
                    key={key}
                    isActive={false}
                    handleClickChat={() => {
                      props.close();
                      handleClick(
                        chats.filter(
                          (chat) =>
                            chat.channel_members.filter(
                              (mem) =>
                                parseInt(mem.user_id) ===
                                parseInt(contact?.contact_user?.id)
                            ).length > 0
                        )[0]
                      );
                    }}
                    status={
                      chats.filter(
                        (chat) =>
                          chat.channel_members.filter(
                            (mem) =>
                              parseInt(mem.user_id) ===
                              parseInt(contact?.contact_user?.id)
                          ).length > 0
                      )[0]?.status
                    }
                    unread={
                      chats.filter(
                        (chat) =>
                          chat.channel_members.filter(
                            (mem) =>
                              parseInt(mem.user_id) ===
                              parseInt(contact?.contact_user?.id)
                          ).length > 0
                      )[0]?.unread
                    }
                    newMessage={0}
                    pinned={false}
                    muted={false}
                    SenderName={
                      chats
                        .filter(
                          (chat) =>
                            chat.channel_members.filter(
                              (mem) =>
                                parseInt(mem.user_id) ===
                                parseInt(contact?.contact_user?.id)
                            ).length > 0
                        )[0]
                        ?.channel_members.filter(
                          (member) =>
                            parseInt(member?.user_id) !==
                            parseInt(getUserChat()?.id)
                        )[0]?.user?.name ||
                      chats
                        .filter(
                          (chat) =>
                            chat.channel_members.filter(
                              (mem) =>
                                parseInt(mem.user_id) ===
                                parseInt(contact?.contact_user?.id)
                            ).length > 0
                        )[0]
                        ?.channel_members.filter(
                          (member) =>
                            parseInt(member?.user_id) !==
                            parseInt(getUserChat()?.id)
                        )[0]?.user?.mobile_phone ||
                      "User"
                    }
                    photo={
                      chats
                        .filter(
                          (chat) =>
                            chat.channel_members.filter(
                              (mem) =>
                                parseInt(mem.user_id) ===
                                parseInt(contact?.contact_user?.id)
                            ).length > 0
                        )[0]
                        ?.channel_members.filter(
                          (member) =>
                            parseInt(member?.user_id) !== getUserChat()?.id
                        )[0]?.user?.photo_path
                    }
                    lastMessage={null}
                    id={
                      chats.filter(
                        (chat) =>
                          chat.channel_members.filter(
                            (mem) =>
                              parseInt(mem.user_id) ===
                              parseInt(contact?.contact_user?.id)
                          ).length > 0
                      )[0]?.id
                    }
                    chat={
                      chats.filter(
                        (chat) =>
                          chat.channel_members.filter(
                            (mem) => mem.user_id === contact?.contact_user?.id
                          ).length > 0
                      )[0]
                    }
                    chat_members={
                      chats.filter(
                        (chat) =>
                          chat.channel_members.filter(
                            (mem) =>
                              parseInt(mem.user_id) ===
                              parseInt(contact?.contact_user?.id)
                          ).length > 0
                      )[0]?.channel_members
                    }
                  />
                );
              } else {
                return (
                  <SearchResult
                    myKey={key}
                    key={key}
                    item={contact}
                    handleClickChat={(e) => {
                      props.close();
                      handleClick(e);
                    }}
                    SenderName={contact.name || contact.mobile_phone}
                    isUser={Boolean(contact.contact_user_id)}
                  />
                );
              }
            })}
        </>
      )}
    </div>
  );
}

export default ContactLists;
