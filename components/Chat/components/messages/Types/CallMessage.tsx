import React from "react";
import { useAppStore } from "store";
import { getUserChat, translateFunction } from "utils/functions";
import ChatPhoto from "../../ChatPhoto";
import { DeleteMessage, getMessageTime } from "store/chat/chatUtils";
import OptionsMenu from "../../OptionsMenu";
const calculate = (duration) => {
  if (duration <= 0) return "";
  // Ensure duration is a positive number
  const totalSeconds = Math.max(0, Math.floor(duration));

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // PadStart ensures we always have two digits (e.g., "02")
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  return `(${paddedMinutes}:${paddedSeconds})`;
};
function CallMessage({
  setOpen,
  setDelete,
  openMenu,
  type,
  isPrivate,
  created_at,
  id,
  DeleteModal,
  channel_id,
  channel_member,
  message_type,
  duration_in_seconds,
  sender_user_id,
}) {
  const user = getUserChat();
  const { activeChat } = useAppStore();
  const showTextAvatar = React.useMemo(() => {
    if (!activeChat) return false;
    const member = activeChat.channel_members.find(
      (a) => parseInt(a.user_id.toString()) === parseInt(user?.id)
    );
    return (
      (!member?.user?.photo_path || member?.user?.photo_path?.includes("eu")) &&
      !!member?.user?.name
    );
  }, [activeChat, user]);
  return (
    <div
      className={`${openMenu && "ac"} flex flex-col gap-[10px] message-hold`}
    >
      <div
        className={` call-body ${duration_in_seconds > 0 && "bg-teal-100!"} `}
        onClick={() => setOpen(id)}
      >
        <>
          {duration_in_seconds <= 0 ? (
            message_type.name === "VoiceCall" ? (
              <img src="/icons/chat/misscall.svg" />
            ) : (
              <img src="/icons/chat/VideoMissed.svg" />
            )
          ) : message_type.name !== "VoiceCall" ? (
            <img src="/icons/chat/videocall.svg" className="scale-90" />
          ) : (
            <img src="/icons/chat/call.svg" className="scale-90" />
          )}
        </>
        <div
          className={"absolute-avatar " + `${showTextAvatar && "text-avatar"}`}
        >
          <ChatPhoto
            user={channel_member}
            width={30}
            className="abs-avva"
            height={30}
          />
        </div>
        <div className="missed-body">
          {duration_in_seconds <= 0
            ? message_type.name === "VideoCall"
              ? translateFunction("Missed Video Call At")
              : translateFunction("Missed Voice Call At")
            : message_type.name === "VideoCall"
            ? translateFunction("Outgoing Video Call")
            : translateFunction("Outgoing Voice Call")}{" "}
          {calculate(duration_in_seconds)} {getMessageTime(created_at, true)}
        </div>
      </div>
      <OptionsMenu
        isPrivate={isPrivate}
        isCall={true}
        message={{
          sender_user_id,
        }}
        DeleteModal={DeleteModal}
        setDelete={(e) => setDelete(e)}
        deleteMessage={(e) => DeleteMessage(channel_id, id, e)}
        copy={() => {}}
        forward={() => {}}
        click={() => {}}
      />
    </div>
  );
}

export default CallMessage;
