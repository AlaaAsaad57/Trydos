import React, { useRef, useState, useCallback } from "react";
import { useAppStore } from "store";
import { getUserChat } from "utils/functions";
import ChatPhoto from "../../ChatPhoto";
import Spinner from "components/global/Spinner";
import { DeleteMessage, getMessageStatus, getMessageTime } from "store/chat/chatUtils";
import OptionsMenu from "../../OptionsMenu";

// 1. Move helper outside to prevent re-declaration on every render
const formatAudioTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds === Infinity) return "00:00";
  let minutes = Math.floor(seconds / 60);
  let remainingSeconds = Math.floor(seconds % 60);
  return `${minutes > 9 ? minutes : "0" + minutes}:${
    remainingSeconds > 9 ? remainingSeconds : "0" + remainingSeconds
  }`;
};

function AudioMessage({
  setOpen,
  setDelete,
  openMenu,
  type,
  sender_user_id,
  is_forward,
  isPrivate,
  message_status,
  created_at,
  mid,
  id,
  DeleteModal,
  parent_message,
  GetMessage,
  parent_message_id,
  message_files,
  channel_id,
  channel_member,
  is_from_sender,
}) {
  const user = getUserChat();
  const { setForwardMessage, setReplyMessage, activeChat } = useAppStore();

  // 2. Track audio state explicitly so React renders the updates
  const [playing, setPlay] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const AudioRef = useRef<HTMLAudioElement>(null);

  // 3. Memoize calculations to prevent heavy logic on every render
  const showTextAvatar = React.useMemo(() => {
    if (!activeChat) return false;
    const member = activeChat.channel_members.find(
      (a) => parseInt(a.user_id.toString()) === parseInt(user?.id)
    );
    return (
      (!member?.user?.photo_path || member?.user?.photo_path?.includes("eu")) &&
      !!member?.user?.name
    );
  }, [activeChat?.id, user?.id]);

  // 4. Memoize handlers to maintain referential integrity
  const handleTogglePlay = useCallback((e) => {
    e.stopPropagation();
    if (!AudioRef.current) return;

    if (AudioRef.current.paused) {
      AudioRef.current.play();
      setPlay(true);
    } else {
      AudioRef.current.pause();
      setPlay(false);
    }
  }, []);

  const onLoadedMetadata = () => {
    if (AudioRef.current) {
      // If duration is Infinity, it usually means the browser hasn't
      // calculated the seekable range yet.
      if (AudioRef.current.duration === Infinity) {
        // Set a temporary "seeking" state to force metadata calculation
        AudioRef.current.currentTime = 1e101;
        AudioRef.current.ontimeupdate = function () {
          this.ontimeupdate = () => onTimeUpdate(); // Reset to normal update
          AudioRef.current.currentTime = 0;
          setDuration(AudioRef.current.duration);
        };
      } else {
        setDuration(AudioRef.current.duration);
      }
    }
  };
  const onTimeUpdate = () => {
    if (AudioRef.current) setCurrentTime(AudioRef.current.currentTime);
  };

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
      {message_files &&
        message_files[0]?.file_path &&
        message_files[0]?.file_path !== "false" && (
          <div
            onClick={() => setOpen(id)}
            className={"message-element-body message-body audio-body " + type}
          >
            {is_forward === 1 && (
              <div className="forwarded-message-icon">
                <img src="/icons/chat/forwarded.svg" />
              </div>
            )}
            <audio
              key={message_files[0]?.file_path}
              onEnded={() => {
                setPlay(false);
                if (AudioRef.current) AudioRef.current.currentTime = 0;
              }}
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              controls={false}
              ref={AudioRef}
              src={message_files[0]?.file_path}
            >
              <source src={message_files[0]?.file_path} />
            </audio>
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
            <div className="audio-message">
              {duration > 0 ? (
                <img
                  src={
                    playing ? "/icons/chat/pause.svg" : "/icons/chat/play.svg"
                  }
                  className="play-icon"
                  onClick={handleTogglePlay}
                />
              ) : (
                <Spinner className="play-icon" />
              )}{" "}
              <div className="player-cont">
                <div className="wave-absolute">
                  {duration > 0 ? (
                    <div className="player-time">
                      {/* Show current time if playing, else show total duration */}
                      {playing
                        ? formatAudioTime(duration - currentTime)
                        : formatAudioTime(duration)}
                    </div>
                  ) : (
                    <div className="player-time border-none h-[22px]"></div>
                  )}
                  <div className="wave w-full">
                    <img src="/icons/chat/wave.svg" />
                    <img src="/icons/chat/wave.svg" />
                    <img src="/icons/chat/wave.svg" />
                    <img src="/icons/chat/wave.svg" />
                    <img src="/icons/chat/wave.svg" />
                  </div>
                </div>
                <div className="player-line"></div>
              </div>
              <img src="/icons/chat/recordme.svg" className="play-icon-me" />
            </div>

            {is_from_sender ? (
              <div className="message-date">
                {getMessageStatus({
                  mid: mid,
                  created_at: created_at,
                  message_status: message_status,
                })}
              </div>
            ) : (
              <div className="other-date">
                {getMessageTime(created_at, true)}
              </div>
            )}
          </div>
        )}
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
        isPrivate={isPrivate}
        message={{
          sender_user_id,
          type,
          is_forward,
          isPrivate,
          message_status,
          created_at,
          mid,
          id,
          message_type: {
            name: "VoiceMessage",
          },
          message_files,
        }}
        DeleteModal={DeleteModal}
        isSender={true}
        setDelete={(e) => setDelete(e)}
        deleteMessage={(e) => DeleteMessage(activeChat.id, id, e)}
        copy={() => {}}
        forward={() =>
          setForwardMessage({
            type,
            is_forward,
            isPrivate,
            message_status,
            created_at,
            mid,
            id,
            message_type: {
              name: "VoiceMessage",
            },
            message_files,
          })
        }
        click={() =>
          setReplyMessage({
            type,
            is_forward,
            isPrivate,
            message_status,
            created_at,
            mid,
            id,
            message_type: {
              name: "VoiceMessage",
            },
            message_files,
          })
        }
      />
    </div>
  );
}

export default React.memo(AudioMessage);
