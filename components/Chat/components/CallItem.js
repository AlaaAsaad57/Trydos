import ProfilePicture from "public/images/profileNo.png";
import { getCallType } from "../chatsFunctions";
import DeleteIcon from "../svg/delt";
import Image from "next/image";
import { GetImageUrl } from "utils/tinyUtils";
function CallItem({ photo, name, date, type, Delete }) {
  return (
    <div className={`call-conversation-item ${type} call-item-row`}>
      <span className="options-icon" onClick={() => Delete()}>
        <DeleteIcon />
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
        <div className="call-type">{getCallType(type)}</div>
      </div>
      <div className="chat-date call-date">
        <div className="date-clock">{date}</div>
      </div>
    </div>
  );
}

export default CallItem;
