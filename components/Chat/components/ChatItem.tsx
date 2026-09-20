import { useEffect, useId, useRef, useState } from "react";
import ProfilePicture from "public/images/profileNo.png";
import LastMessageBody from "./LastMessageBody";
import TypingIndicator from "./TypingIndicator";
import { getTwoLetters, showDate } from "../chatsFunctions";
import ChatOptions from "./ChatOptions";
import Image from "next/image";
import { useAppStore } from "store";
import { GetImageUrl } from "utils/tinyUtils";
import { getUserChat } from "utils/functions";

/** How far the row slides to show the options that sit behind it. */
const LEFT_OPEN = 250; // shows mute / delete / archive
const RIGHT_OPEN = 180; // shows unread / pin
/** Move this far before we decide the gesture is a swipe and not a scroll. */
const AXIS_LOCK = 8;
/** How much of the panel you must uncover for the row to stay open. */
const SNAP_RATIO = 0.35;
/** A quick flick opens or closes the row whatever the distance (px per ms). */
const FLICK_SPEED = 0.4;
/** How much the row resists once it is dragged past the open position. */
const OVERDRAG = 0.25;

/**
 * Only one row may stay open, so every row registers a way to close itself.
 * The key is the React instance id, not the chat id: the same chat can be
 * rendered by two lists at once.
 */
const rowClosers = new Map<string, () => void>();
function closeOtherRows(self: string) {
  rowClosers.forEach((close, key) => {
    if (key !== self) close();
  });
}

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
  disabledOptions = false,
}) {
  const { setMain, language } = useAppStore();
  const isRtl = language === "ar" || language === "ku";

  const rowRef = useRef<HTMLDivElement>(null);
  const rowKey = useId();
  /** Where the row rests: 0, -LEFT_OPEN or RIGHT_OPEN. */
  const [offset, setOffset] = useState(0);
  const drag = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    base: 0,
    axis: null as null | "x" | "y",
    /** True once this gesture moved the row, so the tap must not open the chat. */
    moved: false,
    lastX: 0,
    lastTime: 0,
    speed: 0,
  });

  /**
   * Write the position straight to the node while the finger is down. Using
   * state for every move would re-render the whole row on every frame.
   */
  const paint = (x: number, dragging: boolean) => {
    const node = rowRef.current;
    if (!node) return;
    node.style.transition = dragging ? "none" : "";
    node.style.transform = `translateX(${x}px)`;
  };

  const settle = (x: number) => {
    setOffset(x);
    paint(x, false);
  };

  useEffect(() => {
    rowClosers.set(rowKey, () => settle(0));
    return () => {
      rowClosers.delete(rowKey);
    };
  }, [rowKey]);

  /** Keep pulling past the open position, but make it feel heavy. */
  const clampOffset = (x: number) => {
    if (x > RIGHT_OPEN) return RIGHT_OPEN + (x - RIGHT_OPEN) * OVERDRAG;
    if (x < -LEFT_OPEN) return -LEFT_OPEN - (-LEFT_OPEN - x) * OVERDRAG;
    return x;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabledOptions) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const d = drag.current;
    d.pointerId = e.pointerId;
    d.startX = e.clientX;
    d.startY = e.clientY;
    d.base = offset;
    d.axis = null;
    d.moved = false;
    d.lastX = e.clientX;
    d.lastTime = e.timeStamp;
    d.speed = 0;
    // Touching any row puts every other open row back, so at most one is open.
    closeOtherRows(rowKey);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    // Decide once whether this gesture belongs to us or to the list scroll.
    if (d.axis === null) {
      if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.axis !== "x") return;
      rowRef.current?.setPointerCapture(e.pointerId);
    }
    if (d.axis !== "x") return;

    if (e.timeStamp > d.lastTime) {
      d.speed = (e.clientX - d.lastX) / (e.timeStamp - d.lastTime);
    }
    d.lastX = e.clientX;
    d.lastTime = e.timeStamp;
    d.moved = true;
    paint(clampOffset(d.base + dx), true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;
    d.pointerId = -1;
    if (rowRef.current?.hasPointerCapture(e.pointerId)) {
      rowRef.current.releasePointerCapture(e.pointerId);
    }
    if (d.axis !== "x") {
      d.axis = null;
      return;
    }
    d.axis = null;

    const raw = d.base + (e.clientX - d.startX);
    // A finger that rested before lifting is not a flick, however fast it
    // moved before the rest.
    const speed = e.timeStamp - d.lastTime > 80 ? 0 : d.speed;
    let next = 0;
    if (speed <= -FLICK_SPEED) {
      // A fast flick left closes a right-open row, else it opens the left one.
      next = d.base > 0 ? 0 : -LEFT_OPEN;
    } else if (speed >= FLICK_SPEED) {
      next = d.base < 0 ? 0 : RIGHT_OPEN;
    } else if (raw <= -LEFT_OPEN * SNAP_RATIO) {
      next = -LEFT_OPEN;
    } else if (raw >= RIGHT_OPEN * SNAP_RATIO) {
      next = RIGHT_OPEN;
    }
    settle(next);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.pointerId !== e.pointerId) return;
    d.pointerId = -1;
    d.axis = null;
    settle(d.base);
  };

  const handleClick = () => {
    const d = drag.current;
    // The gesture that just ended was a swipe, so it must not open the chat.
    if (d.moved) {
      d.moved = false;
      return;
    }
    // A tap on an open row closes it first, the way a mail list behaves.
    if (offset !== 0) {
      settle(0);
      return;
    }
    handleClickChat();
    setMain("chat");
  };

  return (
    <div className={`chat-conversation-item-container`}>
      <div
        ref={rowRef}
        className={`chat-conversation-item ${
          status && status !== "null" && "typing"
        } ${isActive && "active-chat-effect"}
        ${isRtl ? "p-[10px_20px_10px_10px] flex-row-reverse" : "flex-row"}
        `}
        data-pw="ChatItem"
        style={{ touchAction: "pan-y", transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={handleClick}
      >
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
        <div
          className={`${isRtl ? "mr-[20px] dir-rtl" : "ml-[20px]"} chat-info`}
        >
          <div className="chat-name">{SenderName || "User-" + id}</div>
          {lastMessage && (!status || status === "null") && (
            <LastMessageBody status={status} message={lastMessage} />
          )}
          {status && status !== "null" && <TypingIndicator status={status} />}
        </div>
        {lastMessage && (
          <div
            className={`${isRtl ? "left-[18px]" : "right-[18px]"} chat-date`}
          >
            <div className="date-clock">{showDate(lastMessage.created_at)}</div>
          </div>
        )}
        <div
          className={`${
            isRtl ? "left-[10px] right-[initial] rotate-180 " : "right-[10px]"
          } arrow-right`}
        >
          <img src="/icons/chat/arrowRight.svg" className="w-[3px] h-[13px]" />
        </div>
        {newMessage > 0 && (
          <div
            className="chat-new"
            style={{
              left: isRtl ? "38px" : "initial",
              right: isRtl ? "initial" : "38px",
            }}
          >
            <img
              src="/icons/chat/messageIcon.svg"
              className="w-[15px] h-[15px]"
            />
            <div className="new-mes">{newMessage}</div>
          </div>
        )}
        {/*
          The mute and pin marks sit inside the row, next to the unread mark.
          They used to be a sibling of the row, pinned to the container with a
          plain `right`. In Arabic the row flips but that `right` does not, so
          the pin landed on top of the avatar. They also stayed still while the
          row slid, so a swipe had to hide them by hand.
        */}
        {newMessage === 0 && (muted || pinned) && (
          <div
            className="chat-activated-options gap-[5px]"
            style={{
              left: isRtl ? "30px" : "initial",
              right: isRtl ? "initial" : "30px",
            }}
          >
            {muted && <img className="w-[20px] h-[20px] bg-transparent" src="/icons/chat/MutedChat.svg" alt="muted" />}
            {pinned && <img className="w-[20px] h-[20px] bg-transparent" src="/icons/chat/PinnedChat.svg" alt="pinned" />}
          </div>
        )}
      </div>
      {!disabledOptions && (
        <ChatOptions
          unread={unread}
          muted={muted}
          pinned={pinned}
          id={id}
          closeRow={() => settle(0)}
          member_id={
            chat_members?.find((s) => s?.user_id === getUserChat()?.id)?.id
          }
        />
      )}
    </div>
  );
}

export default ChatItem;
