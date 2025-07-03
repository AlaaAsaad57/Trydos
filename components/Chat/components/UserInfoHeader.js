import { getUserChat } from "utils/functions";

import ChatPhoto from "./ChatPhoto";
import { getUser } from "../chatsFunctions";
function UserInfoHeader() {
  const user = getUser();
  return (
    <div className="chat-window-header-user">
      <ChatPhoto
        className="avatar-holder"
        user={getUserChat()}
        width={40}
        height={40}
      />

      <span>{user?.name || "User"}</span>
    </div>
  );
}

export default UserInfoHeader;
