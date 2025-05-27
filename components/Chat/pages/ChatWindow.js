import "styles/ChatWindow.css";
import { useEffect, useState } from "react";
import ChatWindowHeader from "components/Chat/components/ChatWindowHeader";
import ChatWindowTabs from "components/Chat/components/ChatWindowTabs";
import ChatLists from "./ChatLists";
import CallList from "./CallList";
import ArrowIcon from "../svg/arrow.svg";
import ContactIcon from "../svg/contact.svg";
import StoriesList from "./StoriesList";

import ContactLists from "./ContactLists";
import { getUserChat, translateFunction } from "utils/functions";
import { setLastSeen } from "store/chat/actions";
import { useAppStore } from "store";
function ChatWindow(props) {
  const { language, forwarded_message, setMain, setForwardMessage } =
    useAppStore();
  const Tabs = ["Chats", "Calls", "Stories"];
  const [SelectedTab, setSelectedTab] = useState("Chats");

  useEffect(() => {
    setLastSeen(getUserChat()?.id?.toString());
    let interval = setInterval(() => {
      setLastSeen(getUserChat()?.id?.toString());
    }, 300000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="chat-window">
      <ContactIcon
        data-cy="ContactsIcon"
        className="contact-icon-header"
        onClick={() => {
          props.setOpenContacts(true);
        }}
      />
      <ChatWindowHeader
        openContact={props.open}
        search={props.search}
        setSearch={(e) => props.setSearch(e)}
        Tabs={Tabs}
        SelectedTab={SelectedTab}
        setSelectedTab={setSelectedTab}
      />
      {forwarded_message ? (
        <div className="forwarded-label">
          <div
            className="forward-cancel-icon"
            onClick={() => {
              setForwardMessage(null);
              setMain("chat");
            }}
          >
            <ArrowIcon />
          </div>
          <div className="forward-text">Forward Message</div>
        </div>
      ) : (
        <>
          {props.open ? (
            <>
              <div className="forwarded-label">
                <div
                  className="forward-cancel-icon"
                  onClick={() => {
                    props.setOpenContacts(false);
                  }}
                >
                  <ArrowIcon />
                </div>
                <div className="forward-text">
                  {translateFunction("Contacts List", language)}
                </div>
              </div>
            </>
          ) : (
            <ChatWindowTabs
              SelectedTab={SelectedTab}
              setSelectedTab={setSelectedTab}
            />
          )}
        </>
      )}
      {SelectedTab === "Chats" && !props.open && (
        <ChatLists search={props.search} />
      )}
      {SelectedTab === "Calls" && <CallList />}
      {SelectedTab === "Stories" && <StoriesList />}
      {props.open && (
        <ContactLists
          search={props.search}
          close={() => props.setOpenContacts(false)}
        />
      )}
    </div>
  );
}

export default ChatWindow;
