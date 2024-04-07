import "styles/ChatWindow.css";
import { useEffect, useState } from "react";
import ChatWindowHeader from "components/Chat/components/ChatWindowHeader";
import ChatWindowTabs from "components/Chat/components/ChatWindowTabs";
import ChatLists from "./ChatLists";
import CallList from "./CallList";
import ArrowIcon from "../svg/arrow.svg";
import ContactIcon from "../svg/contact.svg";
import StoriesList from "./StoriesList";

import { useDispatch, useSelector } from "react-redux";
import ContactLists from "./ContactLists";
import { getUserChat, translate } from "utils/functions";
import { GetLastSeen, setLastSeen } from "store/chat/actions";
function ChatWindow(props) {
  const Tabs = ["Chats", "Calls", "Stories"];
  const language = useSelector((state) => state.homepage.language);
  let forwarded_message = useSelector((state) => state.chat.forwarded_message);
  let activeChat = useSelector((state) => state.chat.activeChat);
  const [SelectedTab, setSelectedTab] = useState("Chats");
  const dispatch = useDispatch();
  useEffect(() => {
    setLastSeen(getUserChat()?.id?.toString());
    let interval = setInterval(() => {
      console.log("interval");
      setLastSeen(getUserChat()?.id?.toString());
    }, 300000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="chat-window">
      <ContactIcon
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
              dispatch({ type: "FORWARD-MESSAGEs", payload: null });
              dispatch({ type: "MAIN", payload: "chat" });
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
                  {translate("Contacts List", language)}
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
