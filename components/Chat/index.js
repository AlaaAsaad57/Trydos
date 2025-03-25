import { useEffect, useState } from "react";
import "styles/chat.css";
import ChatWindow from "./pages/ChatWindow";
import { useDispatch, useSelector } from "react-redux";
const ConversationContainer = dynamic(
  () => import("./pages/ConversationContainer"),
  { ssr: false }
);
import NewChatsSide from "components/Chat/components/NewChatsSide";
import { SSRDetect, translateFunction } from "utils/functions";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
function Chat(props) {
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const dispatch = useDispatch();
  const ViewedScreen = useSelector((state) => state.chat.main);
  const first = useSelector((state) => state.chat.first);
  const chats = useSelector((state) => state.chat.data);
  const loading = useSelector((state) => state.chat.fetch);
  const activeChat = useSelector((state) => state.chat.activeChat);
  const language = useSelector((state) => state.homepage.language);
  const NotificationPremission = useSelector(
    (state) => state.chat.NotificationPremission
  );
  const [search, setSearch] = useState("");
  const [contactOpen, setOpenContacts] = useState(false);
  useEffect(() => {
    dispatch({
      type: "Notification",
      payload: Notification.permission === "granted",
    });
  }, []);
  return (
    <>
      <div
        onClick={(e) => {
          if (!props.callInProgress) {
            dispatch({ type: "FORWARD-MESSAGEs", payload: null });
            props.close();
            dispatch({ type: "MAIN", payload: "main" });
            dispatch({ type: "OPEN-CHAT", payload: null });
          }
        }}
        className={`lang-modalDisable ${props.open && "open"}`}
      ></div>
      <div className={`app ${language}-app`}>
        <textarea id="text-copy"></textarea>
        {Notification.permission === "granted" && NotificationPremission ? (
          <>
            <ChatWindow
              open={contactOpen}
              setOpenContacts={(e) => setOpenContacts(e)}
              search={search}
              setSearch={(e) => setSearch(e)}
              activeChat={activeChat}
              ViewedScreen={ViewedScreen}
            />
            {SSRDetect() && (
              <ConversationContainer
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
