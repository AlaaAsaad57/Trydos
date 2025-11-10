import { getNew, getTwoLetters, getUser } from "../chatsFunctions";
import PointIcon from "../svg/point";
import Image from "next/image";
import profilePicture from "public/images/profileNo.png";
import { useAppStore } from "store";
import { GetLastSeen } from "store/chat/actions";
import { getUserChat } from "utils/functions";
function NewChatsSide({ activeChat, chats }) {
  const { openChat, watchChannel } = useAppStore();
  return (
    <div className="new-chats">
      {activeChat &&
        activeChat?.id &&
        getNew(chats, activeChat)
          .filter(
            (cv) =>
              cv.id !== activeChat &&
              activeChat?.id &&
              activeChat?.id &&
              cv?.channel_type?.slug !== "team"
          )
          .map((a, index) => {
            return (
              <div
                key={index}
                className="new-chat"
                onClick={() => {
                  if (true) {
                    let friendId = a.channel_members.filter(
                      (member) =>
                        parseInt(member.user_id) !== parseInt(getUserChat().id)
                    )[0]?.user_id;
                    GetLastSeen(a.id, friendId);
                  }
                  openChat(a);
                  watchChannel(a.id);
                }}
              >
                <PointIcon></PointIcon>

                <div className="img-cont">
                  {a.channel_members.filter(
                    (ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id)
                  )[0]?.user?.photo_path &&
                  !a.channel_members
                    .filter(
                      (ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id)
                    )[0]
                    ?.user?.photo_path?.includes(
                      a.channel_members.filter(
                        (ada) =>
                          parseInt(ada.user_id) !== parseInt(getUser()?.id)
                      )[0]?.user?.name
                    ) ? (
                    <Image
                      loading="eager"
                      width={30}
                      height={30}
                      alt="new-user"
                      src={
                        a.channel_members.filter(
                          (ada) =>
                            parseInt(ada.user_id) !== parseInt(getUser()?.id)
                        )[0]?.user?.photo_path
                      }
                    />
                  ) : a.channel_members.filter(
                      (ada) => parseInt(ada.user_id) !== parseInt(getUser()?.id)
                    )[0]?.user?.name ? (
                    <div className="min-text-avatar">
                      {getTwoLetters(
                        a.channel_members.filter(
                          (ada) =>
                            parseInt(ada.user_id) !== parseInt(getUser()?.id)
                        )[0]?.user?.name ||
                          a.channel_members.filter(
                            (ada) =>
                              parseInt(ada.user_id) !== parseInt(getUser()?.id)
                          )[0]?.user?.username
                      )}
                    </div>
                  ) : (
                    <Image
                      loading="eager"
                      width={30}
                      height={30}
                      alt="new-user"
                      src={profilePicture}
                    />
                  )}
                </div>
              </div>
            );
          })}
    </div>
  );
}

export default NewChatsSide;
