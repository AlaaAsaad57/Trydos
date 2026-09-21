import { useAppStore } from "store";
import { getUserChat, translateFunction } from "utils/functions";
import ChatPhoto from "../../ChatPhoto";
import { DeleteMessage, getMessageStatus, getMessageTime } from "store/chat/chatUtils";
import OptionsMenu from "../../OptionsMenu";
import React from "react";
import { toDownloadUrl } from "components/Chat/videoSupport";
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
  // The <video> element is the only honest answer to "can this play here?".
  // No check on the file name can tell an H.264 .mov from an HEVC .mov, and
  // Chrome and Firefox cannot decode HEVC on Windows or Android. So we wait for
  // the decoder to refuse the file and then offer the file itself instead.
  const [cannotPlay, setCannotPlay] = React.useState(false);
  const filePath = message_files?.[0]?.file_path;
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
        // Only the menu closes on hover-out. The delete confirm box must not:
        // it closes on its own Cancel, backdrop, Escape, or a chosen answer.
        setOpen(false);
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
        {cannotPlay ? (
          // `?download=1` is what makes the tap a download. The media server
          // serves a recognised video with `Content-Disposition: inline`, so
          // without the flag this would open a tab that plays nothing — the
          // same dead end in a new window. The `download` attribute below
          // cannot carry it either: the media server is a different origin, and
          // browsers ignore `download` cross-origin.
          <a
            href={toDownloadUrl(filePath)}
            download
            target="_blank"
            rel="noreferrer"
            className="play-vid-icon"
            onClick={(e) => e.stopPropagation()}
            title={translateFunction(
              "This video cannot play here. Tap to download it.",
            )}
          >
            <img
              src="/icons/chat/down.svg"
              data-pw="VIDEO-DOWNLOAD"
              alt={translateFunction("Download")}
            />
          </a>
        ) : (
          <img
            src="/icons/chat/play.svg"
            data-pw="VIDEO-PLAY"
            alt={translateFunction("Play")}
            onClick={(e) => {
              e.stopPropagation();
              setVid(filePath);
            }}
            className="play-vid-icon"
          />
        )}
        {/* `preload="metadata"` makes the browser read the header, which is
            what lets it report an unsupported codec without downloading the
            whole clip. A single `src` and no <source> child: with both, the
            child is ignored and the error lands in a different place. */}
        <video
          className="message-img"
          src={filePath}
          preload="metadata"
          onError={() => setCannotPlay(true)}
        />

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
