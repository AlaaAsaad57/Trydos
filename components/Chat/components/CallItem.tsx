import ProfilePicture from "public/images/profileNo.png";
import { getCallType } from "../chatsFunctions";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
function CallItem({ photo, name, date, type, Delete, duration }) {
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
  return (
    <div className={`call-conversation-item ${type} call-item-row`}>
      <span className="options-icon" onClick={() => Delete()}>
        <img src="/icons/chat/delete.svg" className="w-[15px] h-[15px]" />
      </span>
      <Image
        loading="eager"
        width={55}
        height={55}
        alt="user-photo"
        src={photo ? GetImageUrl(photo) : ProfilePicture.src}
      />
      <div className="call-info chat-info">
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
      <div className="chat-date call-date">
        <div className="date-clock">{date}</div>
      </div>
    </div>
  );
}

export default CallItem;
