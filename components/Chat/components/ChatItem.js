import { useEffect } from "react";
import ProfilePicture from "public/images/profileNo.png";
import LastMessageBody from "./LastMessageBody";
import TypingIndicator from "./TypingIndicator";
import { getTwoLetters, showDate } from "../chatsFunctions";
import MessageIcon from "../svg/messageIcon";
import ArrowRightIcon from "../svg/arrowRight";
import MutedChatIcon from "../svg/MutedChat";
import PinnedChatIcon from "../svg/PinnedChat";
import ChatOptions from "./ChatOptions";
import { useState } from "react";
import Image from "next/image";
import { useAppStore } from "store";
import { GetImageUrl } from "utils/tinyUtils";
import { getUserChat } from "utils/functions";
function ChatItem({
  isActive,
  unread,
  handleClickChat,
  SenderName,
  photo,
  lastMessage,
  id,
  status,
  newMessage,
  pinned,
  muted,
  chat_members,
}) {
  const { setMain, openChat } = useAppStore();
  const [Moving, setMoving] = useState(false);
  var timeout;
  function handleTouchStart(evt, a, index) {
    isMove = null;
    a.style.transform = `translateX(-${Math.abs(0)}px)`;
    a.addEventListener("touchmove", (e) => handleTouchMove(e, a, index), {
      once: true,
      passive: true,
    });
    a.addEventListener("mousemove", (e) => handleTouchMove(e, a, index), {
      once: true,
    });
    setMoving(null);
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
  }

  var xDown = null;
  var yDown = null;
  var isMove = null;
  var moving = false;
  function handleTouchEnd(e, a, index) {
    a.removeEventListener("touchmove", (e) => handleTouchMove);
    a.removeEventListener("mousemove", (e) => handleTouchMove);

    xDown = null;
    yDown = null;
  }
  useEffect(() => {
    document.querySelectorAll(".chat-conversation-item").forEach((a, index) => {
      a.addEventListener("touchstart", (e) => handleTouchStart(e, a, index), {
        passive: true,
      });
      a.addEventListener("touchend", (e) => handleTouchEnd(e, a, index), false);
      a.addEventListener(
        "mousedown",
        (e) => handleTouchStart(e, a, index),
        false
      );
      a.addEventListener("mouseup", (e) => handleTouchEnd(e, a, index), false);
    });
  }, []);
  function getTouches(evt) {
    return (
      evt.touches || [evt] // browser API
    ); // jQuery
  }
  const time_differenc = (date) => {
    let value = (new Date(Server_time) - new Date(date)) / 1000 / 60;
    return value;
  };
  function handleTouchMove(evt, a, indexx) {
    evt.preventDefault();
    if (!xDown || !yDown) {
      return;
    }
    document.querySelectorAll(".chat-conversation-item").forEach((v, index) => {
      if (indexx !== index) {
        v.style.transform = "translateX(0px)";
        setMoving(false);
      }
    });
    setMoving(id);
    if (a.previousElementSibling) {
      a.previousElementSibling.style.display = "none";
    }

    isMove = true;
    var yUp, xUp;
    if (evt.touches) {
      xUp = evt.touches[0]?.clientX;
      yUp = evt.touches[0]?.clientY;
    } else {
      xUp = evt.clientX;
      yUp = evt.clientY;
    }

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      /*most significant*/
      if (xDiff > 0) {
        if (Math.abs(xDiff) < 250) {
          setMain("main");
          openChat(null);
          moving = true;
          a.style.transform = `translateX(-${Math.abs(250)}px)`;
          if (timeout) {
            clearTimeout(timeout);
          }
        }
      } else {
        if (Math.abs(xDiff) < 180) {
          moving = true;
          a.style.transform = `translateX(${Math.abs(180)}px)`;
          if (timeout) {
            clearTimeout(timeout);
          }
        }
      }
    } else {
      if (yDiff > 0) {
        /* down swipe */
      } else {
        /* up swipe */
      }
    }
    /* reset values */
  }
  useEffect(() => {
    document.querySelectorAll(".chat-option").forEach((a) => {
      a.addEventListener("click", function () {
        setTimeout(() => {
          document
            .querySelectorAll(".chat-conversation-item")
            .forEach((v, index) => {
              setMoving(false);
              v.previousElementSibling.style.display = "flex";
              v.style.transform = "translateX(0px)";
            });
        }, 700);
      });
    });
  }, []);

  const handleClick = () => {
    timeout = setTimeout(() => {
      if (!isMove && Moving !== id) {
        handleClickChat();
        xDown = null;
        yDown = null;
        moving = false;
        setMoving(false);
        setMain("chat");
      } else {
        if (!isMove && Moving === id) {
        }
      }
    }, 800);
  };
  return (
    <div className="chat-conversation-item-container">
      <div className={"chat-activated-options"}>
        {newMessage === 0 && muted && <MutedChatIcon />}
        {newMessage === 0 && pinned && <PinnedChatIcon />}
      </div>
      <div
        className={`chat-conversation-item ${
          status && status !== "null" && "typing"
        } ${isActive && "active-chat-effect"}`}
        data-cy="ChatItem"
        onMouseUp={() => handleClick()}
      >
        {}
        {photo ? (
          <Image
            priority={false}
            width={60}
            height={60}
            alt="user"
            loading="eager"
            src={photo ? GetImageUrl(photo) : ProfilePicture?.src}
          />
        ) : SenderName ? (
          <div className="text-avatar">{getTwoLetters(SenderName)}</div>
        ) : (
          <Image
            loading="eager"
            alt="Picture of the author"
            priority={false}
            src={ProfilePicture}
            width={60}
            height={60}
          />
        )}
        <div className="chat-info">
          <div className="chat-name">{SenderName || "User-" + id}</div>
          {lastMessage && (!status || status === "null") && (
            <LastMessageBody status={status} message={lastMessage} />
          )}
          {status && status !== "null" && <TypingIndicator status={status} />}
        </div>
        {lastMessage && (
          <div className="chat-date">
            <div className="date-clock">{showDate(lastMessage.created_at)}</div>
            {/* <div className='date-clock'>{props.chat.messages[props.chat.messages.length-1].sent}</div> */}
          </div>
        )}
        <div className="arrow-right">
          <ArrowRightIcon />
        </div>
        {newMessage > 0 && (
          <div className="chat-new">
            <MessageIcon />
            <div className="new-mes">{newMessage}</div>
          </div>
        )}
      </div>
      <ChatOptions
        unread={unread}
        muted={muted}
        pinned={pinned}
        id={id}
        member_id={
          chat_members?.find((s) => s?.user_id === getUserChat()?.id)?.id
        }
      />
    </div>
  );
}

export default ChatItem;
