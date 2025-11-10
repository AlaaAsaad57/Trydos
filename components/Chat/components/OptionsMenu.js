import ReplyIcon from "../svg/rep";
import CopyIcon from "../svg/copy";
import CategoryIcon from "../svg/categ";
import DeleteIcon from "../svg/delt";
import EditIcon from "../svg/edit";
import ForwardIcon from "../svg/forward";
import RemindIcon from "../svg/remind";
import { translateFunction, getUserChat } from "utils/functions";

import { useParams } from "next/navigation";
import { useAppStore } from "store";
function OptionsMenu(props) {
  const { language } = useAppStore();
  let { lang } = useParams();
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
        className="fixed inset-0 z-[999999999] flex items-center justify-center bg-black bg-opacity-50"
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
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow text-gray-900 font-medium"
              onClick={() => props.deleteMessage(false)}
              tabIndex={0}
              aria-label={translateFunction("For Me")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  props.deleteMessage(false);
                }
              }}
            >
              {translateFunction("For Me")}
            </button>
            {isSender ? (
              <button
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow text-gray-900 font-medium"
                data-cy="DELETE-OPTION"
                onClick={() => props.deleteMessage(true)}
                tabIndex={0}
                aria-label={translateFunction("For All")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.deleteMessage(true);
                  }
                }}
              >
                {translateFunction("For All")}
              </button>
            ) : (
              <button
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-shadow text-gray-900 font-medium"
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
  return (
    <div className="abs-menu">
      {
        <>
          <div className="reply-but" onClick={() => props.click()}>
            <ReplyIcon></ReplyIcon>
            <div className="rep-descs" style={{ bottom: "-34px" }}>
              {translate("Reply", language)}
            </div>
          </div>
          <div className="message-ops">
            <div
              className="message-opt "
              data-cy="FORWARD-OPTION"
              onClick={() => props.forward()}
            >
              <ForwardIcon></ForwardIcon>
              <div className="rep-descs">{translate("Forward", language)}</div>
            </div>
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
                <CopyIcon></CopyIcon>
                <div className="rep-descs">{translate("Copy", language)}</div>
              </div>
            )}
            <div className="message-opt">
              <CategoryIcon></CategoryIcon>
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
              <DeleteIcon></DeleteIcon>
              <div className="rep-descs">{translate("Delete", language)}</div>
            </div>
            <div className="message-opt">
              <EditIcon></EditIcon>
              <div className="rep-descs">{translate("Edit", language)}</div>
            </div>
            <div className="message-opt">
              <RemindIcon></RemindIcon>
              <div className="rep-descs">{translate("Reminder", language)}</div>
            </div>
          </div>
        </>
      }
    </div>
  );
}

export default OptionsMenu;
