import ChatTabIcon from "./ChatTabIcon";
import { getNew, getNewCalls } from "../chatsFunctions";
import { useAppStore } from "store";

function ChatWindowTabs({ SelectedTab, setSelectedTab }) {
  const { data: chats, calls } = useAppStore();
  return (
    <div className="chat-tabs-container">
      <div className="chat-tab" onClick={() => setSelectedTab("Chats")}>
        <ChatTabIcon
          index={1}
          SelectedTab={SelectedTab === "Chats"}
          Icon={<img src="/icons/chat/ChatIcon.svg" />}
          ActiveIcon={<img src="/icons/chat/ActiveChatIcon.svg" />}
          HasNewItemIcon={<img src="/icons/chat/HasNewChatIon.svg" />}
          NumberOfItems={getNew(chats, { id: "false" }).length}
        />
      </div>
      <div className="chat-tab" onClick={() => setSelectedTab("Calls")}>
        <ChatTabIcon
          index={2}
          SelectedTab={SelectedTab === "Calls"}
          Icon={<img src="/icons/chat/CallIcon.svg" />}
          ActiveIcon={<img src="/icons/chat/ActiveCallIcon.svg" />}
          HasNewItemIcon={<img src="/icons/chat/HasNewCallIcon.svg" />}
          NumberOfItems={getNewCalls(calls)}
        />
      </div>
      <div className="chat-tab" onClick={() => setSelectedTab("Stories")}>
        <ChatTabIcon
          index={3}
          SelectedTab={SelectedTab === "Stories"}
          Icon={<img src="/icons/chat/StoryIcon.svg" />}
          ActiveIcon={<img src="/icons/chat/ActiveStoryIcon.svg" />}
          HasNewItemIcon={<></>}
          NumberOfItems={0}
        />
      </div>
    </div>
  );
}

export default ChatWindowTabs;
