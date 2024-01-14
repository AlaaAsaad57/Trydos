import React from "react";
import ProfilePicture from "public/images/profileNo.png";
import { getCallType } from "../chatsFunctions";
import Image from "next/image";
function CallItem({ photo, name, date, type }) {
  return (
    <div
      className={`call-conversation-item ${type}`}
      style={{ height: "75px", padding: "10px" }}
    >
      <Image
        loading="eager"
        width={55}
        height={55}
        alt="user-photo"
        src={
          photo?.length > 0
            ? process.env.REACT_APP_BASE_FILE_URL + photo
            : ProfilePicture.src
        }
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
