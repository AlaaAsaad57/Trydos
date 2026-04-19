import { translateFunction, getUserChat } from "utils/functions";
import { useParams } from "next/navigation";
import { useAppStore } from "store";

import { useState } from "react";
import Spinner from "components/global/Spinner";
function OptionsMenu(props) {
  const { language } = useAppStore();
  const [edit, setEdit] = useState<any>(false);
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
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setDelete(false);
    }
  };
  if (DeleteModal)
    return (
      <div
        className="fixed inset-0 z-999999999 flex items-center justify-center bg-[#0000006a]"
        onClick={handleBackdropClick}
      >
        <div
          className="bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-[400px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-4 text-gray-900 text-center">
            {translateFunction("Do you want to delete this message?")}
          </h2>
          <div className="flex flex-row justify-between">
            <button
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-xs hover:shadow-md transition-shadow text-gray-900 font-medium"
              onClick={() => props.deleteMessage(false)}
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
                data-cy="DELETE-OPTION"
                onClick={() => props.deleteMessage(true)}
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
                data-cy="DELETE-OPTION"
                onClick={() => setDelete(false)}
                tabIndex={0}
                aria-label={translateFunction("cancel")}
              >
                {translateFunction("Cancel")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  if (isSender && edit) {
    return (
      <>
        <div
          className="fixed inset-0 bg-[#0000006a] z-9999999999"
          onClick={() => {
            setEdit(false);
          }}
        />
        <div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-99999999999 w-full max-w-md mx-4"
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            {/* Header */}
            <div className="text-center">
              {/* <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {translateFunction("Rate Your Experience")}
              </h3>
              <p className="text-sm text-gray-600">
                {translateFunction("Share your thoughts about this product")}
              </p> */}
            </div>

            {/* Comment Input */}
            <div className="space-y-2">
              <label
                htmlFor="comment-input"
                className="block text-sm font-medium text-gray-700"
              >
                {translateFunction("Your Message")}
              </label>
              <textarea
                id="comment-input"
                value={typeof edit === "string" ? edit : ""}
                onChange={(e) => setEdit(e.target.value)}
                className={`${
                  isRtl ? "text-right" : "text-left"
                } w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base text-gray-800 bg-gray-50 transition-colors`}
                placeholder={translateFunction("Edit")}
                aria-label="Message input"
                disabled={false}
                rows={3}
              />
            </div>
            {/* Action Buttons */}
            <div className="flex space-x-3 mt-[10px]">
              <button
                type="button"
                onClick={() => {
                  setEdit(false);
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-gray-300"
                disabled={false}
              >
                {translateFunction("Cancel")}
              </button>
              <button
                type="button"
                onClick={() => {}}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors focus:outline-hidden focus:ring-2 ${
                  props.message.message_content?.content === edit ||
                  edit?.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-300"
                }`}
                disabled={
                  props.message.message_content?.content === edit ||
                  edit?.length === 0
                }
              >
                {false ? (
                  <div className="flex items-center justify-center">
                    <Spinner />
                  </div>
                ) : (
                  translateFunction("Edt")
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (props.isCall) {
    return (
      <div className="abs-menu">
        <div
          className="message-ops w-auto cursor-pointer"
          onClick={() => {
            setDelete(true);
          }}
        >
          <div
            className="message-opt"
            data-cy="DELETE-OPTION"
            onClick={() => {
              setDelete(true);
            }}
          >
            <img src="/icons/chat/delete.svg" className="w-[15px] h-[15px]" />
            <div className="rep-descs">{translate("Delete", language)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="abs-menu">
      {
        <>
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
                data-cy="FORWARD-OPTION"
                onClick={() => props.forward()}
              >
                <img src="/icons/chat/forward.svg" />
                <div className="rep-descs">
                  {translate("Forward", language)}
                </div>
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
            <div className="message-opt">
              <img src="/icons/chat/categ.svg" />
              <div className="rep-descs">
                {translate("CategoryMessage", language)}
              </div>
            </div>
            <div
              className="message-opt"
              data-cy="DELETE-OPTION"
              onClick={() => {
                setDelete(true);
              }}
            >
              <img src="/icons/chat/delete.svg" className="w-[15px] h-[15px]" />
              <div className="rep-descs">{translate("Delete", language)}</div>
            </div>
            {props.isSender &&
              props.message?.message_type?.name === "TextMessage" && (
                <div
                  className="message-opt"
                  onClick={() => {
                    setEdit(props.message.message_content?.content);
                  }}
                >
                  <img src="/icons/chat/edit.svg" />
                  <div className="rep-descs">{translate("Edit", language)}</div>
                </div>
              )}
            <div className="message-opt">
              <img src="/icons/chat/remind.svg" />
              <div className="rep-descs">{translate("Reminder", language)}</div>
            </div>
          </div>
        </>
      }
    </div>
  );
}

export default OptionsMenu;
