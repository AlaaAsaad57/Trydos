import { useAppStore } from "store";
import { getUserChat } from "utils/functions";
import ChatPhoto from "../../ChatPhoto";
import { DeleteMessage, getMessageStatus, getMessageTime } from "store/chat/chatUtils";
import OptionsMenu from "../../OptionsMenu";
import React from "react";
function VideoMessage({
  setOpen,
  setDelete,
  openMenu,
  type,
  is_forward,
  message_content,
  isPrivate,
  message_status,
  created_at,
  mid,
  id,
  DeleteModal,
  parent_message,
  GetMessage,
  parent_message_id,
  setVid,
  message_files,
  channel_id,
  channel_member,
  is_from_sender,
  sender_user_id,
}) {
  const user = getUserChat();
  const { setForwardMessage, setReplyMessage, activeChat } = useAppStore();
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
      onMouseLeave={() => {
        setOpen(false);
        setDelete(false);
      }}
      className={"message-hold" + " " + `${openMenu && "ac"}`}
    >
      {/* {parent_message && (
        <RepliedMessage
          onClick={() => GetMessage(id, parent_message_id)}
          message_ref={message_ref}
          message={message}
          parent_message={parent_message}
          moving={moving}
        />
      )} */}

      <div
        onClick={() => setOpen(id)}
        className={
          "message-element-body message-body message-img-body " +
          type +
          " " +
          ` ${openMenu && "ac"}`
        }
      >
        {is_forward === 1 && (
          <div className="forwarded-message-icon">
            <img src="/icons/chat/forwarded.svg" />
          </div>
        )}
        {/* <div className="border-element">
          {refmessage.current &&
            showBord(type, refmessage.current.clientHeight).map((ad, i) => (
              <div className="border-child" key={i}></div>
            ))}
        </div>
        {type === "first-chat" && <div className="bordse"></div>} */}

        {(type === "first-chat" || type === "lonely") && (
          <div
            className={
              "absolute-avatar " + `${showTextAvatar && "text-avatar"}`
            }
          >
            <ChatPhoto
              user={channel_member}
              width={30}
              className="abs-avva"
              height={30}
            />
          </div>
        )}
        <img
          src="/icons/chat/play.svg"
          onClick={(e) => {
            e.stopPropagation();
            setVid(message_files[0]?.file_path);
          }}
          className="play-vid-icon"
        />
        <video className="message-img" src={message_files[0]?.file_path}>
          <source src={message_files[0]?.file_path}></source>
        </video>

        {is_from_sender ? (
          <div className="message-date">
            {getMessageStatus({
              mid: mid,
              created_at: created_at,
              message_status: message_status,
            })}
          </div>
        ) : (
          <div className="other-date">{getMessageTime(created_at, true)}</div>
        )}
      </div>
      {/* <div className="message-date hovers">
        {
          <div className="sent-date">
            {
              <>
                <img src="/icons/chat/sent.svg" />
                {getMessageTime(created_at, true)}
              </>
            }
          </div>
        }
        {getStatues({ message_status }).is_received === 1 && (
          <div className="recieve-date">
            <img src="/icons/chat/recieved.svg" />
            {getMessageTime(
              message_status.filter((a) => a.user_id !== user?.id)[0]
                ?.received_at,
              false
            )}
          </div>
        )}
        {getStatues({ message_status }).is_watched === true && (
          <div className="recieve-date">
            <img src="/icons/chat/read.svg" className="w-[10px] h-[10px]" />
            {getMessageTime(
              message_status.filter((a) => a.user_id !== user?.id)[0]
                ?.watched_at,
              false
            )}
          </div>
        )}
      </div> */}

      <OptionsMenu
        isSender={true}
        isPrivate={isPrivate}
        setImg={() => {
          setVid(message_files[0]?.file_path);
        }}
        message={{
          sender_user_id,
          type,
          is_forward,
          message_content,
          isPrivate,
          message_status,
          created_at,
          mid,
          id,
          message_type: {
            name: "VideoMessage",
          },
          message_files,
        }}
        DeleteModal={DeleteModal}
        setDelete={(e) => setDelete(e)}
        deleteMessage={(e) => DeleteMessage(channel_id, id, e)}
        copy={() => { }}
        forward={() =>
          setForwardMessage({
            type,
            is_forward,
            message_content,
            isPrivate,
            message_status,
            created_at,
            mid,
            id,
            message_type: {
              name: "VideoMessage",
            },
            message_files,
          })
        }
        click={() =>
          setReplyMessage({
            type,
            is_forward,
            message_content,
            isPrivate,
            message_status,
            created_at,
            mid,
            id,
            message_type: {
              name: "VideoMessage",
            },
            message_files,
          })
        }
      />
    </div>
  );
}

export default VideoMessage;
