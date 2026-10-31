import ProfilePicture from "public/images/profileNo.png";
import { getCallDirection, getCallType } from "../chatsFunctions";
import { getUserChat } from "utils/functions";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
import { useAppStore } from "store";
import { translateFunction } from "utils/functions";
/**
 * One row of the call log. `deleted` is a call this user deleted: the chat
 * backend keeps it in the log (auth_message_status.is_deleted 1), so the row
 * says "Deleted Call" and nothing else. A shopper deletes a call to hide who
 * they talked to and when, so the row shows no name, picture, date, length,
 * direction or bin.
 */
function CallItem({ photo, name, date, type, Delete, duration, deleted = false }) {
  // Arabic and Kurdish read right to left. The row mirrors the same way as a
  // chat row (ChatItem): photo on the right, date and bin on the left.
  const { language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";
  if (deleted) {
    return (
      <div className="call-conversation-item deleted-call call-item-row">
        <div className={`call-info chat-info ${isRtl ? "dir-rtl" : ""}`}>
          <div className="call-type">
            {translateFunction("Deleted Call", language)}
          </div>
        </div>
      </div>
    );
  }
  const calculate = (duration) => {
    // Ensure duration is a positive number
    const totalSeconds = Math.max(0, Math.floor(duration));

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // PadStart ensures we always have two digits (e.g., "02")
    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");

    return `${paddedMinutes}:${paddedSeconds}`;
  };
  // `type` is the record, not a class name. The row is coloured by direction:
  // chatcomponent.css has .missed, .incoming and .outgoing rules for it.
  const direction = getCallDirection(
    type.sender,
    getUserChat()?.id,
    type.duration,
  );
  return (
    <div
      className={`call-conversation-item ${direction} call-item-row ${
        isRtl ? "flex-row-reverse" : ""
      }`}
    >
      <span
        className={`options-icon ${isRtl ? "left-[10px] right-[initial]" : ""}`}
        onClick={() => Delete()}
      >
        <img src="/icons/chat/delete.svg" className="w-[15px] h-[15px]" />
      </span>
      <Image
        loading="eager"
        width={55}
        height={55}
        alt="user-photo"
        src={photo ? GetImageUrl(photo) : ProfilePicture.src}
      />
      <div
        className={`call-info chat-info ${isRtl ? "mr-[20px] dir-rtl" : ""}`}
      >
        <div className="call-name chat-name">{name}</div>
        <div className="call-type">
          {getCallType(type)}

          {duration > 0 && (
            <div className="mx-[4px] text-[11px] text-[#5e5e5e] regular h-full items-end flex">
              {calculate(duration)}
            </div>
          )}
        </div>
      </div>
      <div
        className={`chat-date call-date ${
          isRtl ? "left-[25px] right-[initial]" : ""
        }`}
      >
        <div className="date-clock">{date}</div>
      </div>
    </div>
  );
}

export default CallItem;
