import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

import {
  MuteChat,
  PinnChat,
  deleteChat as DeleteChatAction,
} from "store/chat/actions";
function ChatOptions({ id, unread, pinned, muted, member_id }) {
  const { language, setUnreadChat, pinChat, muteChat, deleteChat } =
    useAppStore();
  let { lang } = useParams();
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  return (
    <div className="chat-options-container">
      <div
        className="chat-option chat-1"
        onClick={() => setUnreadChat({ id: id, value: !unread })}
      >
        <img src="/icons/chat/UnreadIcon.svg" />
        <div>
          {unread ? translate("Read", language) : translate("Unread", language)}
        </div>
      </div>
      <div
        className="chat-option chat-2"
        onClick={() => {
          PinnChat({ id: id, value: !pinned, member_id: member_id });
          pinChat({ id: id, value: !pinned, member_id: member_id });
        }}
      >
        <img src="/icons/chat/PinIcon.svg" alt="pin-icon" />

        <div>
          {pinned ? translate("Unpin", language) : translate("Pin", language)}
        </div>
      </div>
      <div
        className="chat-option chat-3"
        onClick={() => {
          MuteChat({ id: id, value: !muted, member_id: member_id });
          muteChat({ id: id, value: !muted, member_id: member_id });
        }}
      >
        {!muted ? (
          <img src="/icons/chat/muteIcon.svg" />
        ) : (
          <img src="/icons/chat/UnmuteIcon.svg" />
        )}
        <div>
          {muted ? translate("Unmute", language) : translate("Mute", language)}
        </div>
      </div>
      <div
        className="chat-option chat-4"
        onClick={() => {
          DeleteChatAction(id);
          deleteChat({ id: id });
        }}
      >
        <img src="/icons/chat/DeleteIcon.svg" />

        <div>{translate("Delete", language)}</div>
      </div>
      <div className="chat-option chat-5">
        <img src="/icons/chat/ArchiveIcon.svg" />
        <div>{translate("Archive", language)}</div>
      </div>
    </div>
  );
}

export default ChatOptions;
