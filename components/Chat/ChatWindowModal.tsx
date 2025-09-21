import { useEffect, useState } from "react";
import "styles/chat.css";
import ChatWindow from "./pages/ChatWindow";
const ConversationContainer = dynamic(
  () => import("./pages/ConversationContainer"),
  { ssr: false }
);
import NewChatsSide from "components/Chat/components/NewChatsSide";
import { SSRDetect, translateFunction } from "utils/functions";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
function Chat(props) {
  const {
    main: ViewedScreen,
    first,
    data: chats,
    fetch: loading,
    activeChat,
    language,
    NotificationPremission,
    setNotificationPermission,
    setForwardMessage,
    setMain,
    openChat,
  } = useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const [search, setSearch] = useState("");
  const [contactOpen, setOpenContacts] = useState(false);
  useEffect(() => {
    if (typeof Notification !== "undefined")
      setNotificationPermission(Notification.permission === "granted");
    else setNotificationPermission(false);
  }, []);
  return (
    <>
      <div
        onClick={(e) => {
          if (!props.callInProgress) {
            setForwardMessage(null);

            props.close();
            setMain("main");
            openChat(null);
          }
        }}
        className={`fixed inset-0 w-screen h-screen bg-black/30 z-[9999999999998] ${
          props.open && "open"
        }`}
      ></div>
      <div
        className={`app ${language}-app xs:right-0 xs:left-auto xs:top-0 xs:z-[9999999999999] xs:h-screen`}
      >
        <textarea id="text-copy"></textarea>
        {typeof Notification !== "undefined" &&
        Notification.permission === "granted" &&
        NotificationPremission ? (
          <>
            <ChatWindow
              open={contactOpen}
              setOpenContacts={(e) => setOpenContacts(e)}
              search={search}
              setSearch={(e) => setSearch(e)}
              activeChat={activeChat}
              ViewedScreen={ViewedScreen}
              close={props.close}
            />
            {SSRDetect() && (
              <ConversationContainer
                isPrivate={false}
                closeWidget={props.close}
                first={first}
                loading={loading}
                active={activeChat}
                setSearch={setSearch}
                ViewedScreen={ViewedScreen === "chat" && !contactOpen}
              />
            )}
            <NewChatsSide activeChat={activeChat} chats={chats} />
          </>
        ) : (
          <div className="notification-enable text-[#5d5d5d]">
            {translate("Please Enable Notification to use Chat", language)}
          </div>
        )}
      </div>
    </>
  );
}

export default Chat;
