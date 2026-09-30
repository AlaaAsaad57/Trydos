import ChatItem from "components/Chat/components/ChatItem";

import SearchResult from "components/Chat/components/SearchResult";
import ChatSearchResults, {
  openChatFromList,
} from "components/Chat/components/ChatSearchResults";
import { dedupeContacts } from "components/Chat/chatSearch";
import { getChatName, getChatPhoto } from "components/Chat/chatsFunctions";
import { getUserChat, translateFunction } from "utils/functions";
import { useAppStore } from "store";
import { useRef, useState } from "react";
import ChatContactsUpload from "../components/ChatContactsUpload";

function ContactLists(props) {
  const { data: chats, language, contacts } = useAppStore();

  // The contacts the last import found already saved. They are drawn first and
  // flash once. `run` changes on every import, so the flash plays again.
  const [alreadySaved, setAlreadySaved] = useState({ phones: [], run: 0 });
  const listRef = useRef(null);
  const wasAlreadySaved = (contact) =>
    alreadySaved.phones.includes(
      String(contact?.mobile_phone ?? "").replace(/\s+/g, "")
    );
  const flash = (contact, key, row) =>
    wasAlreadySaved(contact) ? (
      <div key={`${alreadySaved.run}-${key}`} className="contact-already-saved">
        {row}
      </div>
    ) : (
      row
    );

  const handleClick = openChatFromList;
  return (
    <div className="chat-list-items" ref={listRef}>
      <ChatContactsUpload
        onAlreadySaved={(phones) => {
          setAlreadySaved((last) => ({ phones, run: last.run + 1 }));
          listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
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
            .sort((a, b) => wasAlreadySaved(b) - wasAlreadySaved(a))
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
                return flash(contact, key,
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
                      getChatName(
                        chats.filter(
                          (chat) =>
                            chat.channel_members.filter(
                              (mem) =>
                                parseInt(mem.user_id) ===
                                parseInt(contact?.contact_user?.id)
                            ).length > 0
                        )[0]
                      ) ||
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
                    photo={getChatPhoto(
                      chats.filter(
                        (chat) =>
                          chat.channel_members.filter(
                            (mem) =>
                              parseInt(mem.user_id) ===
                              parseInt(contact?.contact_user?.id)
                          ).length > 0
                      )[0]
                    )}
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
                return flash(contact, key,
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
