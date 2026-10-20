import ChatItem from "components/Chat/components/ChatItem";

import SearchResult from "components/Chat/components/SearchResult";
import ChatSearchResults, {
  openChatFromList,
} from "components/Chat/components/ChatSearchResults";
import { dedupeContacts } from "components/Chat/chatSearch";
import {
  contactRowName,
  getChatPhoto,
} from "components/Chat/chatsFunctions";
import { translateFunction } from "utils/functions";
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
  // A row's React key is the contact, not its place in the list. The sort moves
  // rows, and an index key would remount them and play the flash again.
  const rowKey = (contact, key) => contact?.id ?? contact?.mobile_phone ?? key;
  const flash = (contact, key, row) =>
    wasAlreadySaved(contact) ? (
      <div
        key={`${alreadySaved.run}-${rowKey(contact, key)}`}
        className="contact-already-saved"
      >
        {row}
      </div>
    ) : (
      row
    );

  // The row that already has the number typed in the add form. It is drawn
  // first, with a red frame that pulses (chatcomponent.css), until the form
  // reports another row or null.
  const [duplicate, setDuplicate] = useState(null);
  const frame = (contact, key, row) =>
    contact === duplicate ? (
      <div
        key={`duplicate-${rowKey(contact, key)}`}
        className="contact-duplicate"
      >
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
        onDuplicate={setDuplicate}
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
            .sort(
              (a, b) =>
                (b === duplicate) - (a === duplicate) ||
                wasAlreadySaved(b) - wasAlreadySaved(a)
            )
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
                return frame(contact, key, flash(contact, key,
                  <ChatItem
                    disabledOptions={true}
                    myKey={key}
                    key={rowKey(contact, key)}
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
                    SenderName={contactRowName(contact, chats)}
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
                ));
              } else {
                return frame(contact, key, flash(contact, key,
                  <SearchResult
                    myKey={key}
                    key={rowKey(contact, key)}
                    item={contact}
                    handleClickChat={(e) => {
                      props.close();
                      handleClick(e);
                    }}
                    photo={contact.contact_user?.photo_path}
                    SenderName={contactRowName(contact, chats)}
                    isUser={Boolean(contact.contact_user_id)}
                  />
                ));
              }
            })}
        </>
      )}
    </div>
  );
}

export default ContactLists;
