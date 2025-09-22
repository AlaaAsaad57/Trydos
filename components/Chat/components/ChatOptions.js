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
import Image from "next/image";
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
        <Image src={UnreadIcon} alt="unread-icon" />
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
        <Image src={PinIcon} alt="unread-icon" />

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
        {!muted ? (
          <Image src={MuteIcon} alt="unread-icon" />
        ) : (
          <Image src={UnmuteIcon} alt="unread-icon" />
        )}
        <div>
          {muted ? translate("Unmute", language) : translate("Mute", language)}
        </div>
      </div>
      <div
        className="chat-option chat-4"
        onClick={() => deleteChat({ id: id })}
      >
        <Image src={DeleteIcon} alt="unread-icon" />

        <div>{translate("Delete", language)}</div>
      </div>
      <div className="chat-option chat-5">
        <Image src={ArchiveIcon} alt="unread-icon" />
        <div>{translate("Archive", language)}</div>
      </div>
    </div>
  );
}

export default ChatOptions;
