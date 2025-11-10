import ChatTabIcon from "./ChatTabIcon";
import ChatIcon from "../svg/Tabs/ChatIcon";
import ActiveChatIcon from "../svg/Tabs/ActiveChatIcon";
import HasNewChatIon from "../svg/Tabs/HasNewChatIon";
import CallIcon from "../svg/Tabs/CallIcon";
import ActiveCallIcon from "../svg/Tabs/ActiveCallIcon";
import HasNewCallIcon from "../svg/Tabs/HasNewCallIcon";
import StoryIcon from "../svg/Tabs/StoryIcon";
import ActiveStoryIcon from "../svg/Tabs/ActiveStoryIcon";
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
          setSelectedTab={setSelectedTab}
          Icon={ChatIcon}
          ActiveIcon={ActiveChatIcon}
          HasNewItemIcon={HasNewChatIon}
          NumberOfItems={getNew(chats, { id: "false" }).length}
        />
      </div>
      <div className="chat-tab" onClick={() => setSelectedTab("Calls")}>
        <ChatTabIcon
          index={2}
          SelectedTab={SelectedTab === "Calls"}
          setSelectedTab={setSelectedTab}
          Icon={CallIcon}
          ActiveIcon={ActiveCallIcon}
          HasNewItemIcon={HasNewCallIcon}
          NumberOfItems={getNewCalls(calls)}
        />
      </div>
      <div className="chat-tab" onClick={() => setSelectedTab("Stories")}>
        <ChatTabIcon
          index={3}
          SelectedTab={SelectedTab === "Stories"}
          setSelectedTab={setSelectedTab}
          Icon={StoryIcon}
          ActiveIcon={ActiveStoryIcon}
          HasNewItemIcon={StoryIcon}
          NumverOfItems={9}
        />
      </div>
    </div>
  );
}

export default ChatWindowTabs;
