import ProfilePicture from "public/images/profileNo.png";
import { getTwoLetters, getUser } from "../chatsFunctions";
import { getUserChat } from "utils/functions";
import Image from "next/image";
function UserInfoHeader() {
  return (
    <div className="chat-window-header-user">
      <div
        className={`avatar-holder ${
          (getUserChat()?.photo_path?.includes("eu") ||
            !getUserChat().photo_path) &&
          getUserChat().name &&
          "text-avatar"
        }`}
      >
        <div className="inset-shadow" />
        {getUserChat().photo_path?.includes("eu") ? (
          getUserChat().name?.length > 1 ? (
            getTwoLetters(getUserChat().name)
          ) : (
            <Image alt="user" src={40} width={40} height={ProfilePicture.src} />
          )
        ) : getUserChat().photo_path ? (
          <Image
            alt="user-img"
            src={getUserChat().photo_path}
            width={40}
            height={40}
          />
        ) : getUserChat().name?.length > 1 ? (
          getTwoLetters(getUserChat().name)
        ) : (
          <Image
            alt="user-img"
            height={40}
            width={40}
            src={ProfilePicture.src}
          />
        )}
      </div>
      <span>
        {(localStorage.getItem("USER-CHAT") && getUserChat().name) ||
          (localStorage.getItem("USER-CHAT") && getUserChat().name) ||
          "User"}
      </span>
    </div>
  );
}

export default UserInfoHeader;
