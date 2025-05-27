import ProfilePicture from "public/images/profileNo.png";
import { getTwoLetters, getUser } from "../chatsFunctions";
import { getUserChat } from "utils/functions";
import Image from "next/image";
import ChatPhoto from "./ChatPhoto";
function UserInfoHeader() {
  return (
    <div className="chat-window-header-user">
      <ChatPhoto
        className="avatar-holder"
        user={getUserChat()}
        width={40}
        height={40}
      />

      <span>
        {(localStorage.getItem("USER-CHAT") && getUserChat().name) ||
          (localStorage.getItem("USER-CHAT") && getUserChat().name) ||
          "User"}
      </span>
    </div>
  );
}

export default UserInfoHeader;
