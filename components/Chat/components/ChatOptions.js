import React from "react";
import UnreadIcon from "../svg/UnreadIcon.svg";
import PinIcon from "../svg/PinIcon.svg";
import MuteIcon from "../svg/muteIcon.svg";
import UnmuteIcon from "../svg/UnmuteIcon.svg";
import DeleteIcon from "../svg/DeleteIcon.svg";
import ArchiveIcon from "../svg/ArchiveIcon.svg";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";
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
        <UnreadIcon></UnreadIcon>
        <div>
          {unread ? translate("Read", language) : translate("Unread", language)}
        </div>
      </div>
      <div
        className="chat-option chat-2"
        onClick={() =>
          pinChat({ id: id, value: !pinned, member_id: member_id })
        }
      >
        <PinIcon></PinIcon>
        <div>
          {pinned ? translate("Unpin", language) : translate("Pin", language)}
        </div>
      </div>
      <div
        className="chat-option chat-3"
        onClick={() =>
          muteChat({ id: id, value: !muted, member_id: member_id })
        }
      >
        {!muted ? <MuteIcon></MuteIcon> : <UnmuteIcon></UnmuteIcon>}
        <div>
          {muted ? translate("Unmute", language) : translate("Mute", language)}
        </div>
      </div>
      <div
        className="chat-option chat-4"
        onClick={() => deleteChat({ id: id })}
      >
        <DeleteIcon></DeleteIcon>
        <div>{translate("Delete", language)}</div>
      </div>
      <div className="chat-option chat-5">
        <ArchiveIcon></ArchiveIcon>
        <div>{translate("Archive", language)}</div>
      </div>
    </div>
  );
}

export default ChatOptions;
