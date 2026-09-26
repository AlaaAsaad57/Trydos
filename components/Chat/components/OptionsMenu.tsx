import { translateFunction, getUserChat } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Spinner from "components/global/Spinner";
import { EditMessageApi } from "store/chat/actions";
import ChatDialog from "./messages/ChatDialog";
import MessageTagPicker from "./messages/MessageTagPicker";
import MessageReminderPicker from "./messages/MessageReminderPicker";
function OptionsMenu(props) {
  const { language, activeChat } = useAppStore();
  const [edit, setEdit] = useState<any>(false);
  const [saving, setSaving] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  let { lang } = useParams();
  const isRtl = language === "ar" || language === "ku";
  // @ts-ignore
  let languageVariable = lang.split("-")[1];
  const translate = (key, lang) => {
    return translateFunction(key, languageVariable);
  };
  const { DeleteModal, setDelete } = props;
  const messageType = props.message?.message_type?.name;
  const isSender =
    parseInt(props.message.sender_user_id) === parseInt(getUserChat()?.id);
  const messageId = props.message?.id;
  // A message that is still sending has no id yet, so nothing can be tagged,
  // reminded or edited on it.
  const isSaved = messageId != null && messageId !== "";
  const channelId = activeChat?.id ?? props.message?.channel_id;
  // Tags and my reminder live on the message in the store. The menu is given
  // a copy of a few fields only, so it reads these two from the open chat.
  const storedMessage = isSaved
    ? activeChat?.messages?.find((m: any) => String(m.id) === String(messageId))
    : null;
  const originalText = props.message.message_content?.content ?? "";
  const editText = typeof edit === "string" ? edit.trim() : "";
  const canSaveEdit =
    !saving && editText.length > 0 && editText !== originalText.trim();

  const submitEdit = async () => {
    if (!canSaveEdit || !isSaved) return;
    setSaving(true);
    const saved = await EditMessageApi(channelId, messageId, editText);
    setSaving(false);
    if (saved) setEdit(false);
  };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setDelete(false);
    }
  };

  // Escape closes the confirm box, the same as the backdrop and Cancel.
  useEffect(() => {
    if (!DeleteModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDelete(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [DeleteModal]);

  /**
   * The confirm box is sent to `document.body`, and the options menu below
   * stays mounted while it is open.
   *
   * It used to replace the menu inside the message, and that is why it
   * flashed and vanished. Opening it removed `.abs-menu` from under the
   * cursor; some browsers answer a removed hovered node with a `mouseout`
   * that carries no `relatedTarget`, so React sent `mouseleave` to every
   * parent — including the `.message-hold` handler that called
   * `setDelete(false)`. Nothing is removed now, and the box no longer sits
   * inside the message, so the message's own hover handling cannot reach it.
   */
  const deleteConfirm =
    DeleteModal && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-9999999999999 flex items-center justify-center bg-[#0000006a]"
            onClick={handleBackdropClick}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-[400px]"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900 text-center">
                {translateFunction("Do you want to delete this message?")}
              </h2>
              <div className="flex flex-row justify-between">
                <button
                  className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xs hover:shadow-md transition-shadow text-gray-900 font-medium"
                  onClick={() => {
                    props.deleteMessage(false);
                    setDelete(false);
                  }}
                  tabIndex={0}
                  aria-label={translateFunction("For Me")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      props.deleteMessage(false);
                      setDelete(false);
                    }
                  }}
                >
                  {translateFunction("For Me")}
                </button>
                {isSender && !props.isCall ? (
                  <button
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xs hover:shadow-md transition-shadow text-gray-900 font-medium"
                    data-pw="DELETE-OPTION"
                    onClick={() => {
                      props.deleteMessage(true);
                      setDelete(false);
                    }}
                    tabIndex={0}
                    aria-label={translateFunction("For All")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        props.deleteMessage(true);
                        setDelete(false);
                      }
                    }}
                  >
                    {translateFunction("For All")}
                  </button>
                ) : (
                  <button
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xs hover:shadow-md transition-shadow text-gray-900 font-medium"
                    data-pw="DELETE-OPTION"
                    onClick={() => setDelete(false)}
                    tabIndex={0}
                    aria-label={translateFunction("cancel")}
                  >
                    {translateFunction("Cancel")}
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const editDialog = (
    <ChatDialog
      open={isSender && isSaved && (!!edit || edit === "")}
      onClose={() => setEdit(false)}
      title={translateFunction("Edit message")}
      dataPw="MESSAGE-EDIT-DIALOG"
    >
      <label
        htmlFor="message-edit-input"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {translateFunction("Your Message")}
      </label>
      <textarea
        id="message-edit-input"
        value={typeof edit === "string" ? edit : ""}
        onChange={(e) => setEdit(e.target.value)}
        onKeyDown={(e) => {
          // Enter saves, the same as Enter sends in the chat input.
          // Shift+Enter still adds a new line.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitEdit();
          }
        }}
        className={`${
          isRtl ? "text-right" : "text-left"
        } w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base text-gray-800 bg-gray-50 transition-colors`}
        placeholder={translateFunction("Edit")}
        aria-label={translateFunction("Your Message")}
        disabled={saving}
        rows={3}
        autoFocus
      />
      <div className="flex gap-[12px] mt-[10px]">
        <button
          type="button"
          onClick={() => setEdit(false)}
          className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-gray-300"
          disabled={saving}
        >
          {translateFunction("Cancel")}
        </button>
        <button
          type="button"
          data-pw="MESSAGE-EDIT-SAVE"
          onClick={submitEdit}
          className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors focus:outline-hidden focus:ring-2 ${
            canSaveEdit
              ? "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!canSaveEdit}
        >
          {saving ? (
            <div className="flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            translateFunction("Save")
          )}
        </button>
      </div>
    </ChatDialog>
  );

  const pickers = isSaved ? (
    <>
      <MessageTagPicker
        open={tagsOpen}
        onClose={() => setTagsOpen(false)}
        channelId={channelId}
        messageId={messageId}
        tags={storedMessage?.tags || []}
        myId={getUserChat()?.id}
      />
      <MessageReminderPicker
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        channelId={channelId}
        messageId={messageId}
        reminder={storedMessage?.reminder}
      />
    </>
  ) : null;

  if (props.isCall) {
    return (
      <>
        {deleteConfirm}
        <div className="abs-menu">
          <div
            className="message-ops w-auto cursor-pointer"
            onClick={() => {
              setDelete(true);
            }}
          >
            <div
              className="message-opt"
              data-pw="DELETE-OPTION"
              onClick={() => {
                setDelete(true);
              }}
            >
              <img src="/icons/chat/delete.svg" className="w-[15px] h-[15px]" />
              <div className="rep-descs">{translate("Delete", language)}</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {deleteConfirm}
      {editDialog}
      {pickers}
      <div className="abs-menu">
        {props.setImg && (
          <div
            className="reply-but mx-[4px]"
            onClick={() => {
              props.setImg();
            }}
          >
            <img src="/icons/EyeIcon.svg" />
          </div>
        )}
        <div
          className="reply-but"
          onClick={() => {
            document.querySelector<HTMLInputElement>("#type")?.focus?.();

            props.click();
          }}
        >
          <img src="/icons/chat/rep.svg" />
          <div className="rep-descs" style={{ bottom: "-34px" }}>
            {translate("Reply", language)}
          </div>
        </div>
        <div className="message-ops">
          {!props.isPrivate && (
            <div
              className="message-opt "
              data-pw="FORWARD-OPTION"
              onClick={() => props.forward()}
            >
              <img src="/icons/chat/forward.svg" />
              <div className="rep-descs">{translate("Forward", language)}</div>
            </div>
          )}
          {messageType === "TextMessage" && (
            <div
              className="message-opt"
              tabIndex={0}
              aria-label="Copy message text"
              onClick={() => props.copy()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") props.copy();
              }}
            >
              <img src="/icons/chat/copy.svg" />
              <div className="rep-descs">{translate("Copy", language)}</div>
            </div>
          )}
          {isSaved && (
            <div
              className="message-opt"
              data-pw="TAG-OPTION"
              tabIndex={0}
              aria-label={translateFunction("Tag message")}
              onClick={() => setTagsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setTagsOpen(true);
              }}
            >
              <img src="/icons/chat/categ.svg" />
              <div className="rep-descs">
                {translateFunction("Tag message")}
              </div>
            </div>
          )}
          <div
            className="message-opt"
            data-pw="DELETE-OPTION"
            onClick={() => {
              setDelete(true);
            }}
          >
            <img src="/icons/chat/delete.svg" className="w-[15px] h-[15px]" />
            <div className="rep-descs">{translate("Delete", language)}</div>
          </div>
          {props.isSender &&
            isSaved &&
            props.message?.message_type?.name === "TextMessage" && (
              <div
                className="message-opt"
                data-pw="EDIT-OPTION"
                onClick={() => {
                  setEdit(props.message.message_content?.content);
                }}
              >
                <img src="/icons/chat/edit.svg" />
                <div className="rep-descs">{translate("Edit", language)}</div>
              </div>
            )}
          {isSaved && (
            <div
              className="message-opt"
              data-pw="REMINDER-OPTION"
              tabIndex={0}
              aria-label={translateFunction("Reminder")}
              onClick={() => setReminderOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setReminderOpen(true);
              }}
            >
              <img src="/icons/chat/remind.svg" />
              <div className="rep-descs">{translateFunction("Reminder")}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default OptionsMenu;
