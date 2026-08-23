import "styles/ChatWindow.css";
import { useEffect, useState } from "react";
import ChatWindowHeader from "components/Chat/components/ChatWindowHeader";
import ChatWindowTabs from "components/Chat/components/ChatWindowTabs";
import ChatLists from "./ChatLists";
import CallList from "./CallList";
import StoriesList from "./StoriesList";
import ContactLists from "./ContactLists";
import { getUserChat, translateFunction } from "utils/functions";
import { setLastSeen } from "store/chat/actions";
import { useAppStore } from "store";
function ChatWindow({ close, setOpenContacts, open, setSearch, search }) {
  const {
    language,
    forwarded_message,
    setMain,
    setForwardMessage,
    activeChat,
  } = useAppStore();
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
    <div className="chat-window  xs:h-screen">
      <img
        src="/icons/chat/contact.svg"
        data-pw="ContactsIcon"
        className="contact-icon-header"
        onClick={() => {
          setOpenContacts(true);
        }}
      />
      <div
        className="absolute cursor-pointer right-[20px] top-[19px] max-w-[20px] max-h-[20px]"
        aria-label="close icon"
        onClick={() => {
          setForwardMessage(null);
          close();
          setMain("main");
        }}
      >
        <img src="/icons/chat/cancel.svg" />
      </div>
      <ChatWindowHeader
        openContact={open}
        search={search}
        setSearch={(e) => setSearch(e)}
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
            <img src="/icons/chat/arrow.svg" />
          </div>
          <div className="forward-text">{translateFunction("Forward Message")}</div>
        </div>
      ) : (
        <>
          {open ? (
            <>
              <div className="forwarded-label">
                <div
                  className="forward-cancel-icon"
                  onClick={() => {
                    setOpenContacts(false);
                  }}
                >
                  <img src="/icons/chat/arrow.svg" />
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
      {SelectedTab === "Chats" && !open && <ChatLists search={search} />}
      {SelectedTab === "Calls" && <CallList />}
      {SelectedTab === "Stories" && <StoriesList />}
      {open && (
        <ContactLists search={search} close={() => setOpenContacts(false)} />
      )}
    </div>
  );
}

export default ChatWindow;
