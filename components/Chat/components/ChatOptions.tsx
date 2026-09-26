import { useState } from "react";
import { createPortal } from "react-dom";
import { ConfirmModal } from "components/global/ConfirmModal";
import { translateFunction } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

import {
  ArchiveChannel,
  MarkChannelUnread,
  MuteChat,
  PinnChat,
  deleteChat as DeleteChatAction,
} from "store/chat/actions";
function ChatOptions({
  id,
  unread,
  pinned,
  muted,
  archived = false,
  member_id,
  closeRow,
}) {
  const { language, watchChannel, pinChat, muteChat, deleteChat } =
    useAppStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
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
        data-pw="CHAT-UNREAD-OPTION"
        onClick={() => {
          // "Read" is the same call as opening the chat: `/watched` clears
          // the counter and the "marked unread" mark.
          if (unread) watchChannel(id);
          else MarkChannelUnread(id);
          closeRow?.();
        }}
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
          closeRow?.();
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
          closeRow?.();
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
      <div className="chat-option chat-4" onClick={() => setConfirmDelete(true)}>
        <img src="/icons/chat/DeleteIcon.svg" />

        <div>{translate("Delete", language)}</div>
      </div>
      <div
        className="chat-option chat-5"
        data-pw="CHAT-ARCHIVE-OPTION"
        onClick={() => {
          ArchiveChannel(id, !archived);
          closeRow?.();
        }}
      >
        <img src="/icons/chat/ArchiveIcon.svg" />
        <div>
          {archived
            ? translate("Unarchive", language)
            : translate("Archive", language)}
        </div>
      </div>
      {confirmDelete &&
        createPortal(
          // The chat window sits at z-index 9999999999999 (public/styles/chat.css)
          // and ConfirmModal at 999999999999999. Both are past the 32-bit limit a
          // browser allows for z-index, so both clamp to 2147483647 and tie. This
          // wrapper takes that top value in its own stacking context at the end of
          // <body>, so the confirm window is above the chat on purpose.
          <div style={{ position: "relative", zIndex: 2147483647 }}>
            <ConfirmModal
              showModal={confirmDelete}
              loading={false}
              type="Delete"
              confirmTilte="Delete Chat"
              confirmMessage="Are you sure you want to delete this chat?"
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => {
                DeleteChatAction(id);
                deleteChat({ id: id });
                setConfirmDelete(false);
                closeRow?.();
              }}
              dataCy="confirm-delete-chat"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

export default ChatOptions;
