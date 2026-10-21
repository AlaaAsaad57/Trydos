"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import {
  BUBBLE_RADIUS,
  CHAT,
  CHAT_COUNTS,
  CHAT_PHOTOS,
  CONTACT,
  MENU_ACTIONS,
  MESSAGES,
  MESSAGE_TIME,
  VOICE_LENGTH,
  VOICE_SRC,
} from "../../DemoApp/demoChat";
import { useDemoNav } from "../Demo1Shell";
import { C, SF_ROUNDED, fill, lineBox, sfTop, textTop } from "../demo1Layout";
import { ScreenPage, Stroke, Txt } from "../ui";

/**
 * A conversation — XD `Home Page – 44` (430 x 2871; the page is `#FCFCFC`).
 *
 * Header 50 .. 100, white, shadow 0 0 3 (black at 10%): the purple chevron
 * (3 px line, 8 x 20 at 20, 65), the unread count "2" (SF Pro Rounded 18,
 * `#4A31E7`, x 40, baseline 81), the photo 38 x 38 radius 12 at (62, 56), the
 * name 16 Medium at x 112 on baseline 81, the video phone 26 x 26 at (323, 62)
 * and the call phone at (379, 62).
 *
 * Under it, at y 104, each side's 25 x 25 photo (radius 12) with a 6 px dot
 * 4 px from the screen's edge: purple on the contact's side, `#8D00E5` on mine.
 *
 * Then the messages, each at the y the file gives it (the margins below are
 * the file's gaps). A message that comes in is a `#4A31E7` bubble from x 12
 * with corners 2 / 50 / 2 / 30 and a 4 px dot at x 5; one I sent is `#8D00E5`
 * ending at x 418 with corners 50 / 2 / 30 / 2 and a `#883BF2` dot at x 421.
 * The words are 13 Regular white (18 px lines; the file spaces the letters of
 * the incoming ones by 0.012 em), first baseline 21 under the bubble's top;
 * the time 9 Regular on a baseline 10 above the bubble's bottom, at the right
 * of a bubble that came in and at the left (after a Bold "||") of one I sent.
 * The widest bubble is 344 (x 12 .. 356, or 74 .. 418).
 *
 * The file also draws, in order: the "YESTERDAY" pill (74 x 22, radius 15,
 * `#F4F4F4`, 11 Regular); a 300 x 300 photo with the bubble's corners and a
 * 1 px purple line; a voice message each way (see VoiceMessage); four call
 * cards (see CallCard) with a note under the second missed one; a reply that
 * quotes a message (see Quote); and a last message that was replied to.
 *
 * A click on a message opens the file's menu (see MessageMenu): the message
 * lifts, and everything but the message and its menu blurs. A click anywhere
 * else closes it. The file draws no composer, so the demo draws none
 * either. The body scrolls on its own under the head, and opens at its end,
 * the newest message, as a chat does.
 */
export default function ConversationScreen() {
  const { t, navigate, back } = useDemoNav();
  const [menu, setMenu] = useState<string | null>(null);
  // The message above the blur: it stays up until the blur has faded out.
  const [lifted, setLifted] = useState<string | null>(null);
  const body = useRef<HTMLDivElement>(null);

  // Open at the newest message, before the first paint.
  useLayoutEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const header = (
    <header
      className="relative w-full flex items-start"
      style={{
        height: 50,
        background: C.white,
        boxShadow: "0 0 3px rgba(0,0,0,0.1)",
        filter: menu ? `blur(${MENU_BLUR}px)` : "blur(0px)",
        transition: `filter ${MENU_FADE}s ease-out`,
      }}
    >
      {/* The head blurs with the page; a click on it closes the menu. */}
      {menu && (
        <div
          className="absolute inset-0 z-10"
          onClick={() => setMenu(null)}
        />
      )}
      <button
        type="button"
        data-pw="demo-back"
        aria-label={t("Back")}
        onClick={back}
        className="flex shrink-0 cursor-pointer active:opacity-60"
        style={{ marginLeft: 18.5, marginTop: 13.5 }}
      >
        <XdIcon name="chatBackPurple" />
      </button>
      {/* "2" from x 40 to the photo at 62; SF Pro Rounded 18 on baseline 81. */}
      <span
        data-pw="demo-chat-unread-count"
        className="block shrink-0"
        style={{
          marginLeft: 40 - (18.5 + 11),
          marginTop: sfTop(81 - 50, 18, 22),
          width: 62 - 40,
          fontFamily: SF_ROUNDED,
          fontSize: 18,
          lineHeight: "22px",
          color: C.purple,
        }}
      >
        {CHAT_COUNTS.unread}
      </span>
      <button
        type="button"
        data-pw="demo-chat-open-contact"
        onClick={() => navigate("chat/contact")}
        className="flex items-start shrink-0 min-w-0 cursor-pointer active:opacity-60 text-left"
      >
        <span
          className="relative block shrink-0 overflow-hidden"
          style={{ marginTop: 6, width: 38, height: 38, borderRadius: 12 }}
        >
          <img
            src={CHAT_PHOTOS.contact}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <Stroke color={C.white} width={1} radius={12} />
        </span>
        <Txt size={16} weight="medium" ml={12} mt={textTop(81 - 50, 16)}>
          {CONTACT.name}
        </Txt>
      </button>
      <button
        type="button"
        data-pw="demo-chat-video-call"
        aria-label={t("Video")}
        onClick={() => navigate("chat/call")}
        className="flex shrink-0 ml-auto cursor-pointer active:opacity-60"
        style={{ marginTop: 12 }}
      >
        <XdIcon name="chatHeaderVideo" />
      </button>
      <button
        type="button"
        data-pw="demo-chat-voice-call"
        aria-label={t("Call")}
        onClick={() => navigate("chat/call")}
        className="flex shrink-0 cursor-pointer active:opacity-60"
        style={{ marginLeft: 379 - 349, marginRight: 430 - 405, marginTop: 12 }}
      >
        <XdIcon name="chatHeaderCall" />
      </button>
    </header>
  );

  const close = () => setMenu(null);
  /** What a message needs to open the menu, and the menu itself when it is this message's. */
  const menuOf = (id: string): Openable => ({
    onOpen: () => {
      setMenu(id);
      setLifted(id);
    },
    open: menu === id,
    lifted: lifted === id,
    menu: (
      <AnimatePresence>
        {menu === id && <MessageMenu key="menu" onClose={close} t={t} />}
      </AnimatePresence>
    ),
  });

  return (
    <ScreenPage
      testId="demo-conversation"
      bg={C.page}
      header={header}
      scrollBody
      bodyRef={body}
    >
      <div className="relative flex flex-col w-full">
        {/* Blurs the conversation under the open menu and closes it on a
          click: over the whole body, so it scrolls with it. The lifted
          message and its menu sit above it. */}
        <AnimatePresence onExitComplete={() => setLifted(null)}>
          {menu && (
            <motion.div
              key="backdrop"
              data-pw="demo-chat-menu-backdrop"
              className="absolute inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MENU_FADE, ease: "easeOut" }}
              style={{
                background: "rgba(0,0,0,0.08)",
                backdropFilter: `blur(${MENU_BLUR}px)`,
                WebkitBackdropFilter: `blur(${MENU_BLUR}px)`,
              }}
              onClick={close}
            />
          )}
        </AnimatePresence>

        <div
          className="flex items-start w-full shrink-0"
          style={{ marginTop: 4 }}
        >
          <Dot color={C.purple} ml={4} mt={10} />
          <SmallPhoto src={CHAT_PHOTOS.contact} ml={2} line={1} />
          <SmallPhoto src={CHAT_PHOTOS.me} ml="auto" line={0.5} />
          <Dot color={CHAT.sent} ml={2} mr={4} mt={10} />
        </div>

        <Bubble
          id="in1"
          side="in"
          text={MESSAGES.in1}
          mt={145 - 129}
          {...menuOf("in1")}
        />
        <Bubble
          id="in2"
          side="in"
          text={MESSAGES.in2}
          mt={2}
          {...menuOf("in2")}
        />
        <Bubble
          id="in3"
          side="in"
          text={MESSAGES.in3}
          mt={2}
          {...menuOf("in3")}
        />
        <Bubble
          id="out1"
          side="out"
          text={MESSAGES.out1}
          mt={398 - 386}
          {...menuOf("out1")}
        />
        <Bubble
          id="out2"
          side="out"
          text={MESSAGES.out2}
          mt={2}
          {...menuOf("out2")}
        />
        <Bubble
          id="out3"
          side="out"
          text={MESSAGES.out3}
          mt={2}
          {...menuOf("out3")}
        />

        {/* 74 x 22 at (168, 633): 10 px left of the screen's centre. */}
        <div
          data-pw="demo-chat-day"
          className="flex flex-col shrink-0 self-center"
          style={{
            marginTop: 633 - 621,
            marginLeft: -20,
            width: 74,
            height: 22,
            borderRadius: 15,
            background: CHAT.callCard,
          }}
        >
          <Txt
            center
            size={11}
            mt={textTop(15, 11)}
            style={{ letterSpacing: "0.01em" }}
          >
            {t("YESTERDAY")}
          </Txt>
        </div>

        <PhotoMessage mt={667 - 655} {...menuOf("photo")} />

        <VoiceMessage side="in" mt={1015 - 967} t={t} />
        <VoiceMessage side="out" mt={1130 - 1106} t={t} />

        <CallCard
          side="in"
          tone="missed"
          width={195}
          sub={t("Tap To Call Back")}
          time={MESSAGE_TIME}
          mt={1277 - 1220.5}
          t={t}
        />
        <CallCard
          side="in"
          tone="incoming"
          width={213}
          sub={t("{n} Min").replace("{n}", MESSAGES.minutes)}
          time={MESSAGE_TIME}
          mt={12}
          t={t}
        />
        <CallCard
          side="out"
          tone="outgoing"
          width={217}
          sub={t("No Answer")}
          time={MESSAGE_TIME}
          mt={12}
          t={t}
        />
        <CallCard
          side="in"
          tone="missed"
          width={232}
          sub={t("Tap To Call Back")}
          time={`${MESSAGE_TIME} | ${t("{n} Ring").replace("{n}", MESSAGES.rings)}`}
          spacedTime
          mt={1499 - 1451}
          t={t}
        />
        {/* The note under the card: 205 x 32 from x 60, the card's pale red, no time. */}
        <div className="flex items-start w-full shrink-0">
          <div
            data-pw="demo-chat-note"
            className="shrink-0"
            style={{
              marginLeft: 60,
              padding: "8px 12px 8px 12px",
              borderRadius: BUBBLE_RADIUS.in,
              background: CHAT.missedCard,
            }}
          >
            <Txt size={13}>{MESSAGES.note}</Txt>
          </div>
        </div>

        <Quote mt={1631 - 1581} />
        <Bubble
          id="reply"
          side="out"
          text={MESSAGES.reply}
          mt={0}
          {...menuOf("reply")}
        />
        <Bubble
          id="last"
          side="in"
          text={MESSAGES.last}
          replied
          mt={1751 - 1717}
          {...menuOf("last")}
        />
        {/* Room for the last message's menu (64 + 40 + 5 + 22 under the bubble). */}
        <div className="shrink-0" style={{ height: 172 }} />
      </div>
    </ScreenPage>
  );
}

const SPACED = { letterSpacing: "0.012em" } as const;

/** The "||" before the time of a message I sent: Bold, `#388CFF`, whatever the words' colour (`– 44`). */
const Mark = () => (
  <span className="font-bold" style={{ color: CHAT.callBlue }}>
    ||{" "}
  </span>
);

/** The 4 px dot beside a bubble (the file draws it as a 4 x 4 box with radius 15). */
function Dot({
  color,
  ml,
  mr,
  mt = 0,
  size = 4,
}: {
  color: string;
  ml?: number;
  mr?: number;
  mt?: number;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="block shrink-0"
      style={{
        marginLeft: ml,
        marginRight: mr,
        marginTop: mt,
        width: size,
        height: size,
        borderRadius: 15,
        background: color,
      }}
    />
  );
}

/** A 25 x 25 photo, radius 12, with the white line the file draws round it. */
function SmallPhoto({
  src,
  ml,
  line,
}: {
  src: string;
  ml: number | "auto";
  line: number;
}) {
  return (
    <span
      className="relative block shrink-0 overflow-hidden"
      style={{ marginLeft: ml, width: 25, height: 25, borderRadius: 12 }}
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <Stroke color={C.white} width={line} radius={12} />
    </span>
  );
}

/**
 * A 1 px line on the inside of a box whose corners are not all the same —
 * `Stroke` draws one radius. A plain CSS border, which Safari draws evenly
 * (the uneven line was the 0.5 px inset shadow, not a border).
 */
function Edge({ color, radius }: { color: string; radius: string }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ border: `1px solid ${color}`, borderRadius: radius }}
    />
  );
}

/** The blur behind an open menu, in px, and how long it takes to come and go, in s. */
const MENU_BLUR = 6;
const MENU_FADE = 0.22;

/** What every message takes to open its menu. */
type Openable = {
  onOpen: () => void;
  /** Its menu is open. */
  open: boolean;
  /** It sits above the blur (its menu is open, or the blur is still fading out). */
  lifted: boolean;
  menu: React.ReactNode;
};

/** The open message grows a little out of its own side, on a soft spring. */
const liftOf = (open: boolean, inn: boolean) => ({
  animate: { scale: open ? 1.03 : 1 },
  transition: { type: "spring" as const, stiffness: 420, damping: 28 },
  style: { transformOrigin: inn ? "left center" : "right center" },
});

/** A text message, in (left) or out (right). */
function Bubble({
  id,
  side,
  text,
  replied = false,
  mt,
  onOpen,
  open,
  lifted,
  menu,
}: {
  id: string;
  side: "in" | "out";
  text: string;
  /** The white reply mark before the time (`– 44`, the last message). */
  replied?: boolean;
  mt: number;
} & Openable) {
  const inn = side === "in";
  const lift = liftOf(open, inn);
  return (
    <div
      data-pw={`demo-chat-message-${id}`}
      className={`relative flex items-start w-full shrink-0 ${inn ? "" : "justify-end"} ${lifted ? "z-20" : ""}`}
      style={{ marginTop: mt }}
    >
      {inn && <Dot color={C.purple} ml={5} />}
      <motion.div
        onClick={onOpen}
        animate={lift.animate}
        transition={lift.transition}
        className="flex flex-col shrink min-w-0 select-none cursor-pointer"
        style={{
          ...lift.style,
          marginLeft: inn ? 3 : undefined,
          marginRight: inn ? undefined : 3,
          maxWidth: "calc(100% - 86px)",
          padding: inn ? "7px 12px 8px 12px" : "7px 12px 8px 13px",
          borderRadius: inn ? BUBBLE_RADIUS.in : BUBBLE_RADIUS.out,
          background: inn ? C.purple : CHAT.sent,
          WebkitTouchCallout: "none",
        }}
      >
        {/* 13 px on 18 px lines: the first baseline is 21 under the bubble's
            top. The room after (in) or before (out) the words is where the
            file leaves it: 22 px after the words that came in (37 on the
            replied one, whose bubble is 141 wide), 30 before and 9 after
            the ones I sent. */}
        <p
          className="font-normal"
          style={{
            fontSize: 13,
            lineHeight: "18px",
            color: C.white,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            paddingRight: inn ? (replied ? 37 : 22) : 0,
            paddingLeft: inn ? 0 : 30,
            marginRight: inn ? 0 : -3,
            ...(inn ? SPACED : {}),
          }}
        >
          {text}
        </p>
        <span
          className={`flex items-start ${inn ? "self-end" : "self-start"}`}
          style={{ marginTop: -1 }}
        >
          {inn && replied && (
            <XdIcon name="replyMarkWhite" style={{ marginRight: 4 }} />
          )}
          <Txt size={9} color={C.white}>
            {!inn && <Mark />}
            {MESSAGE_TIME}
          </Txt>
        </span>
      </motion.div>
      {!inn && <Dot color={CHAT.sentDot} mr={5} />}
      {menu}
    </div>
  );
}

/**
 * The 300 x 300 photo (`– 44`, y 667) with the bubble's corners and a 1 px
 * purple line; it opens the menu like a message.
 */
function PhotoMessage({
  mt,
  onOpen,
  open,
  lifted,
  menu,
}: { mt: number } & Openable) {
  const lift = liftOf(open, true);
  return (
    <div
      data-pw="demo-chat-photo-message"
      className={`relative flex items-start w-full shrink-0 ${lifted ? "z-20" : ""}`}
      style={{ marginTop: mt }}
    >
      <Dot color={C.purple} ml={5} />
      <motion.div
        onClick={onOpen}
        animate={lift.animate}
        transition={lift.transition}
        className="relative shrink-0 overflow-hidden select-none cursor-pointer"
        style={{
          ...lift.style,
          marginLeft: 3,
          width: 300,
          height: 300,
          borderRadius: BUBBLE_RADIUS.in,
          WebkitTouchCallout: "none",
        }}
      >
        <img
          src={CHAT_PHOTOS.photoMessage}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <Edge color={C.purple} radius={BUBBLE_RADIUS.in} />
      </motion.div>
      {menu}
    </div>
  );
}

/** The five waves' width: where the voice message's sound runs. */
const WAVES_W = 5 * 51.72;

/** Seconds as "01:20". */
const clock = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/** The voice message playing now, so starting one stops the other. */
let playingNow: HTMLAudioElement | null = null;

/** The sound's length before its file has loaded: the "01:20" the file shows. */
const VOICE_SECONDS = VOICE_LENGTH.split(":")
  .map(Number)
  .reduce((min, sec) => min * 60 + sec);

/** The pause mark: two round bars in the play mark's 30 x 30 box (the file draws only the play mark). */
function PauseMark({ color }: { color: string }) {
  return (
    <svg width={30} height={30} viewBox="0 0 30 30" aria-hidden="true">
      <rect x={6} y={4} width={7} height={22} rx={3.5} fill={color} />
      <rect x={17} y={4} width={7} height={22} rx={3.5} fill={color} />
    </svg>
  );
}

/**
 * A voice message (`– 44`, y 1015 and 1130). The mark 16 x 16 and the words
 * "Voice Message" 13 Regular on one line; 18 px under it the play mark 30 x 30
 * and five 51.72 x 30 waves (the first in the sender's colour, the rest
 * `#C3C3C3`); the playhead, a 0.5 px line 23 tall, 15.5 down, with the
 * length "01:20" in a 38 x 19 pill (0.4 px line, radius 15) under it; and the
 * time 9 Regular at the waves' right end, 36 down.
 *
 * The play mark plays a dummy 80 s sound (VOICE_SRC) from its start: the
 * waves take the sender's colour up to the playhead, which moves with the
 * sound, and the pill counts the time played. While it plays, the play mark
 * is a pause mark. A tap or a drag on the waves moves the playhead, so any
 * part can be heard. At rest it is as the file draws it: the first wave
 * coloured, the playhead at 48.5 (in) or 52.2 (out). A second message
 * starting stops the first.
 */
function VoiceMessage({
  side,
  mt,
  t,
}: {
  side: "in" | "out";
  mt: number;
  t: (key: DemoKey) => string;
}) {
  const inn = side === "in";
  const tint = inn ? C.purple : CHAT.sent;
  const label = inn ? C.purple : "#8C01E5";
  const restHead = inn ? 48.5 : 52.2;
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [length, setLength] = useState(0);
  /** Where the finger holds the playhead, in px from the waves' left edge. */
  const [drag, setDrag] = useState<number | null>(null);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    // While it plays, the frame loop below keeps the time.
    const onTime = () => {
      if (a.paused) setSeconds(a.currentTime);
    };
    const onMeta = () => setLength(a.duration);
    // The audio says when it stops, also when another message stops it.
    const onStop = () => {
      setPlaying(false);
      setSeconds(a.currentTime);
      if (playingNow === a) playingNow = null;
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("pause", onStop);
    a.addEventListener("ended", onStop);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("pause", onStop);
      a.removeEventListener("ended", onStop);
      a.pause();
      if (playingNow === a) playingNow = null;
    };
  }, []);

  // The playhead and the coloured waves move by transform, from these two
  // values: a transform can stand between pixels, so they glide (80 s over
  // 258 px is only ~3 px a second, and `left` / `width` round to whole
  // pixels, so they stepped). Moving them renders nothing in React.
  const headX = useMotionValue(restHead);
  const fillX = useMotionValue(51.72);
  const fillOuter = useTransform(fillX, (f) => f - WAVES_W);
  const fillInner = useTransform(fillX, (f) => WAVES_W - f);
  const pillX = useTransform(headX, (h) => Math.max(0, h - 19.5));
  const dragging = drag !== null;

  // While it plays (and no finger holds the playhead), read the time every
  // frame and move the playhead; React renders only when the second changes.
  useEffect(() => {
    const a = audio.current;
    if (!playing || dragging || !a) return;
    let frame = 0;
    const tick = () => {
      const len = a.duration || VOICE_SECONDS;
      const x = Math.min(WAVES_W, (a.currentTime / len) * WAVES_W);
      headX.set(x);
      fillX.set(x);
      setSeconds((s) =>
        Math.floor(s) === Math.floor(a.currentTime) ? s : a.currentTime,
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, dragging, headX, fillX]);

  /** Runs `fn` once the sound's length is known, loading it first if needed. */
  const whenReady = (fn: () => void) => {
    const a = audio.current;
    if (!a) return;
    if (a.readyState >= 1) return fn();
    a.addEventListener("loadedmetadata", fn, { once: true });
    if (a.networkState !== a.NETWORK_LOADING) a.load();
  };

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    if (playingNow && playingNow !== a) playingNow.pause();
    playingNow = a;
    setPlaying(true);
    whenReady(() => {
      // A finished message starts over; a paused or moved one goes on from
      // its playhead (the start, on the first play).
      if (a.ended) a.currentTime = 0;
      setStarted(true);
      void a.play().catch(() => setPlaying(false));
    });
  };

  const total = length || VOICE_SECONDS;
  /** The finger's place on the waves, in px from their left edge. */
  const xOf = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * WAVES_W;
    return Math.min(WAVES_W, Math.max(0, x));
  };
  const seek = (x: number) => {
    setStarted(true);
    setSeconds((x / WAVES_W) * total);
    whenReady(() => {
      const a = audio.current;
      if (!a) return;
      a.currentTime = (x / WAVES_W) * a.duration;
      setSeconds(a.currentTime);
    });
  };
  const scrub = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDrag(xOf(e));
      // Start loading now, so the sound is ready when the finger lifts.
      whenReady(() => {});
    },
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (drag !== null) setDrag(xOf(e));
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      if (drag === null) return;
      seek(xOf(e));
      setDrag(null);
    },
    // The page took the finger to scroll: leave the sound where it was.
    onPointerCancel: () => setDrag(null),
  };

  // Where the sound stands, in px from the waves' left edge.
  const head =
    drag ??
    (started ? Math.min(WAVES_W, (seconds / total) * WAVES_W) : restHead);
  // At rest the whole first wave is coloured, as the file draws it.
  const coloured = started || drag !== null ? head : 51.72;
  // Out of the frame loop (at rest, paused, a finger on it), the playhead
  // stands where the state says.
  useEffect(() => {
    if (playing && !dragging) return;
    headX.set(head);
    fillX.set(coloured);
  }, [playing, dragging, head, coloured, headX, fillX]);
  const shown =
    drag !== null
      ? clock((drag / WAVES_W) * total)
      : started
        ? clock(seconds)
        : VOICE_LENGTH;
  const waves = (name: XdIconName) =>
    [0, 1, 2, 3, 4].map((i) => <XdIcon key={i} name={name} />);

  return (
    <>
      <div
        data-pw={`demo-chat-voice-${side}`}
        className={`flex items-start w-full shrink-0 ${inn ? "" : "justify-end"}`}
        style={{ marginTop: mt }}
      >
        {inn ? (
          <>
            <Dot color={C.purple} ml={5} />
            <XdIcon name="voiceMarkPurple" style={{ marginLeft: 3 }} />
            <Txt size={13} color={label} ml={4} style={SPACED}>
              {t("voice message")}
            </Txt>
          </>
        ) : (
          <>
            <Txt size={13} color={label} style={SPACED}>
              {t("voice message")}
            </Txt>
            <XdIcon name="voiceMarkMagenta" style={{ marginLeft: 4 }} />
            <Dot color={CHAT.sentDot} ml={3} mr={5} />
          </>
        )}
      </div>
      <div
        className={`flex items-start w-full shrink-0 ${inn ? "" : "justify-end"}`}
        style={{ marginTop: 18, height: 57 }}
      >
        <audio ref={audio} src={VOICE_SRC} preload="none" />
        <button
          type="button"
          data-pw={`demo-chat-voice-play-${side}`}
          data-playing={playing}
          aria-label={playing ? t("Pause") : t("Play")}
          onClick={toggle}
          className="relative flex shrink-0 cursor-pointer active:opacity-60"
          style={{ marginLeft: inn ? 12 : undefined, width: 30, height: 30 }}
        >
          {/* The marks swap with a quick turn and grow. */}
          <AnimatePresence initial={false}>
            <motion.span
              key={playing ? "pause" : "play"}
              className="absolute inset-0 flex"
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {playing ? (
                <PauseMark color={tint} />
              ) : (
                <XdIcon name={inn ? "playPurple" : "playMagenta"} />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
        <div
          {...scrub}
          data-pw={`demo-chat-voice-waves-${side}`}
          data-head={head.toFixed(1)}
          role="slider"
          aria-label={t("voice message")}
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round((head / WAVES_W) * total)}
          aria-valuetext={shown}
          className="relative flex items-start shrink-0 select-none cursor-pointer"
          style={{
            marginLeft: 12,
            marginRight: inn ? undefined : 12,
            width: WAVES_W,
            height: 57,
            // A sideways drag moves the playhead; an up-down one still scrolls the chat.
            touchAction: "pan-y",
          }}
        >
          {waves("waveGrey")}
          {/* The played part: the coloured waves, cut at the playhead. The
              window slides left by what is not played yet, and the waves in
              it slide back right by the same, so they stay in place. The
              window reaches over the play mark, so it takes no clicks. */}
          <motion.span
            aria-hidden="true"
            className="absolute left-0 top-0 overflow-hidden pointer-events-none"
            style={{ x: fillOuter, width: WAVES_W, height: 30 }}
          >
            <motion.span
              className="flex items-start"
              style={{ x: fillInner }}
            >
              {waves(inn ? "wavePurple" : "waveMagenta")}
            </motion.span>
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="absolute left-0"
            style={{
              x: headX,
              top: 15.5,
              width: 0.5,
              height: 23,
              background: tint,
            }}
          />
          {/* The pill follows the playhead, but never runs out over the
              play mark; it grows a little while the finger holds it. */}
          <motion.span
            className="absolute left-0 flex flex-col"
            animate={{ scale: drag !== null ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              x: pillX,
              top: 38,
              width: 38,
              height: 19,
              borderRadius: 15,
              background: drag !== null ? C.white : undefined,
            }}
          >
            <Txt
              center
              size={9}
              weight="medium"
              color={tint}
              mt={textTop(13, 9)}
            >
              {shown}
            </Txt>
            {/* The file says radius 15 on a 19 px pill: round ends, 9.5. An
                SVG rect would make 15 x 9.5 elliptical corners of it. */}
            <Stroke color={tint} width={0.4} radius={9.5} />
          </motion.span>
          <span
            className="absolute right-0 flex items-start pointer-events-none"
            style={{ top: 36 }}
          >
            {inn && (
              <XdIcon name="replyMarkPurple" style={{ marginRight: 4 }} />
            )}
            <Txt size={9}>
              {!inn && <Mark />}
              {MESSAGE_TIME}
            </Txt>
          </span>
        </div>
      </div>
    </>
  );
}

const CARD_TONE = {
  missed: {
    icon: "callMissed" as XdIconName,
    title: "Missed Voice Call !" as DemoKey,
    card: CHAT.missedCard,
    box: CHAT.missedIconBox,
    ink: CHAT.red,
    sub: CHAT.red,
  },
  incoming: {
    icon: "callIncoming" as XdIconName,
    title: "Incoming Voice Call !" as DemoKey,
    card: CHAT.callCard,
    box: CHAT.incomingIconBox,
    ink: C.ink,
    sub: C.inkSoft,
  },
  outgoing: {
    icon: "callOutgoing" as XdIconName,
    title: "Outgoing Voice Call !" as DemoKey,
    card: CHAT.callCard,
    box: CHAT.outgoingIconBox,
    ink: C.ink,
    sub: C.ink,
  },
};

/**
 * A call card (`– 44`, y 1277 .. 1549): 50 tall with the bubble's corners,
 * a 40 x 42 box 4 px in (corners 2 / 30 / 2 / 30) with the 18 px phone in
 * its middle, the title 13 Medium 4 px after the box on baseline 21, the
 * second line 11 Regular centred under the title on baseline 39, and the
 * time 9 Regular after the title's end on baseline 40, 9 px from the card's
 * far edge. A card I sent is the mirror image, with "||" before its time.
 */
function CallCard({
  side,
  tone,
  width,
  sub,
  time,
  spacedTime = false,
  mt,
  t,
}: {
  side: "in" | "out";
  tone: keyof typeof CARD_TONE;
  /** The card's width in the file (its words are set in XD's own metrics). */
  width: number;
  sub: string;
  time: string;
  /** "12:56 | 3 Ring" has the file's 0.012 em spacing. */
  spacedTime?: boolean;
  mt: number;
  t: (key: DemoKey) => string;
}) {
  const inn = side === "in";
  const look = CARD_TONE[tone];
  const timeText = (
    <>
      {!inn && <Mark />}
      {time}
    </>
  );
  const timeStyle = spacedTime ? SPACED : undefined;
  const box = (
    <span
      className="flex items-center justify-center shrink-0"
      style={{
        width: 40,
        height: 42,
        borderRadius: inn ? BUBBLE_RADIUS.iconBoxIn : BUBBLE_RADIUS.iconBoxOut,
        background: look.box,
      }}
    >
      <XdIcon name={look.icon} size={18} />
    </span>
  );
  const column = (
    <div
      className="flex flex-col grow min-w-0"
      style={{
        marginLeft: inn ? 4 : undefined,
        marginRight: inn ? undefined : 4,
        marginTop: textTop(21, 13) - 4,
      }}
    >
      <span className="flex items-start">
        {!inn && (
          <Txt size={9} className="invisible" style={timeStyle}>
            {timeText}
          </Txt>
        )}
        <Txt
          size={13}
          weight="medium"
          color={look.ink}
          ml={inn ? 0 : 4}
          style={SPACED}
        >
          {t(look.title)}
        </Txt>
        {inn && (
          <Txt size={9} className="invisible" style={timeStyle}>
            {timeText}
          </Txt>
        )}
      </span>
      <span
        className="flex items-start"
        style={{ marginTop: textTop(39, 11) - (textTop(21, 13) + lineBox(13)) }}
      >
        {!inn && (
          <Txt
            size={9}
            color={look.ink}
            mt={textTop(40, 9) - textTop(39, 11)}
            style={timeStyle}
          >
            {timeText}
          </Txt>
        )}
        <Txt
          size={11}
          color={look.sub}
          className="grow text-center"
          ml={inn ? 0 : 4}
          style={SPACED}
        >
          {sub}
        </Txt>
        {inn && (
          <Txt
            size={9}
            color={look.ink}
            mt={textTop(40, 9) - textTop(39, 11)}
            style={timeStyle}
          >
            {timeText}
          </Txt>
        )}
      </span>
    </div>
  );
  return (
    <div
      data-pw={`demo-chat-call-${tone}`}
      className={`flex items-start w-full shrink-0 ${inn ? "" : "justify-end"}`}
      style={{ marginTop: mt }}
    >
      {inn && <Dot color={C.purple} ml={5} />}
      <div
        className="flex items-start shrink-0 whitespace-nowrap"
        style={{
          marginLeft: inn ? 3 : undefined,
          marginRight: inn ? undefined : 3,
          width,
          maxWidth: "calc(100% - 20px)",
          height: 50,
          padding: inn ? "4px 9px 0 4px" : "4px 4px 0 9px",
          borderRadius: inn ? BUBBLE_RADIUS.in : BUBBLE_RADIUS.out,
          background: look.card,
        }}
      >
        {inn ? box : column}
        {inn ? column : box}
      </div>
      {!inn && <Dot color={CHAT.sentDot} mr={5} />}
    </div>
  );
}

/**
 * A quoted message above a reply (`– 44`, y 1631): a 297 x 43 purple bubble
 * from x 121 whose inside, from 3 px in, is `#EFEBFF`; the quoted words 13
 * Regular `#8D8D8D` at 9 px in; the reply mark and the time at the right.
 * The purple dot sits at x 114, before it.
 */
function Quote({ mt }: { mt: number }) {
  return (
    <div
      data-pw="demo-chat-quote"
      className="flex items-start w-full shrink-0 justify-end"
      style={{ marginTop: mt }}
    >
      <Dot color={C.purple} />
      <div
        className="shrink-0"
        style={{
          marginLeft: 3,
          marginRight: 12,
          width: fill(121, 12),
          height: 43,
          paddingLeft: 3,
          borderRadius: BUBBLE_RADIUS.in,
          background: C.purple,
        }}
      >
        <div
          className="flex flex-col w-full h-full overflow-hidden"
          style={{ borderRadius: BUBBLE_RADIUS.in, background: CHAT.quote }}
        >
          <Txt
            size={13}
            color={C.grey}
            ml={9}
            mt={textTop(21, 13)}
            className="overflow-hidden"
            style={{ marginRight: 12, ...SPACED }}
          >
            {MESSAGES.quoted}
          </Txt>
          <span
            className="flex items-start self-end"
            style={{ marginRight: 12 }}
          >
            <XdIcon
              name="replyQuoteMark"
              style={{ marginTop: 1, marginRight: 2 }}
            />
            <Txt size={9} color={C.grey}>
              {MESSAGE_TIME}
            </Txt>
          </span>
        </div>
      </div>
    </div>
  );
}

/** The icons of the action row, in the file's order, and the name each one shows. */
const MENU_ICONS: { icon: XdIconName; name: (typeof MENU_ACTIONS)[number] }[] =
  [
    { icon: "menuCopy", name: "copy" },
    { icon: "menuCategory", name: "Category" },
    { icon: "menuDelete", name: "Delete" },
    { icon: "menuEdit", name: "Edit" },
    { icon: "menuRemind", name: "re-remind" },
  ];

type MenuName = (typeof MENU_ACTIONS)[number] | "Forward";

/**
 * The menu the file draws under the conversation (`– 44`, y 1960 .. 2199):
 *
 *   - the reply box, 35 x 40, radius 12, `#FAFAFA`, shadow 0 2 5 (black at
 *     16%), with the blue reply mark 10 px in and 13 down;
 *   - 5 px after it the action box, 185 x 40, with Copy, Category, Delete,
 *     Edit and re-remind 30 px apart from 40 px in;
 *   - the tooltip, 50 x 22, radius 8, `#404040`, shadow 0 3 3 (black at 20%),
 *     5 px under the pressed icon, its name in SF Pro Rounded 10 white;
 *   - the Forward bar, 212 x 40, `#1D1D1D`, with its arrow 43 px in, 8 down.
 *
 * The file lists the names (Replay, Forward, Copy, Category, Delete, Edit,
 * re-remind) beside the icons; here the tooltip names the icon last pressed.
 * The boxes are centred on the screen (the file's x 106 .. 331); the Forward
 * bar sits 12 px above them, 18.5 px to the right of their centre, as drawn.
 */
function MessageMenu({
  onClose,
  t,
}: {
  onClose: () => void;
  t: (key: DemoKey) => string;
}) {
  const [tip, setTip] = useState<MenuName>("Replay");
  const box = useRef<HTMLDivElement>(null);
  // A menu that opens under the screen's end scrolls up into view.
  useEffect(() => {
    box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  /** The centre of each item's icon, from the action row's left edge (x 106 in the file). */
  const centreOf = (name: MenuName) => {
    if (name === "Replay") return 123.5 - 106;
    if (name === "Forward") return 131 + 43 + 12.5 - 106;
    const i = MENU_ICONS.findIndex((m) => m.name === name);
    return 146 + 40 + 30 * i + 7.5 - 106;
  };
  /** A tap names the item first and chooses it on the second tap; the mouse names it on hover, so a click chooses. */
  const pick = (name: MenuName) => () => {
    setTip(name);
    if (tip === name) onClose();
  };
  const name = (item: MenuName) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") setTip(item);
  };
  const boxStyle = {
    height: 40,
    borderRadius: 12,
    background: CHAT.menu,
    boxShadow: "0 2px 5px rgba(0,0,0,0.16)",
  } as const;
  return (
    <motion.div
      ref={box}
      data-pw="demo-chat-menu"
      className="absolute z-20"
      // It pops out from the message: up from a little below, small to full.
      initial={{ opacity: 0, scale: 0.85, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -6 }}
      transition={{ type: "spring", stiffness: 460, damping: 30, mass: 0.8 }}
      style={{
        top: "100%",
        // The Forward bar 12 px under the message, the boxes 12 px under it,
        // so no part of the menu covers the message.
        paddingTop: 12 + 40 + 12,
        left: "calc(50% + 3.5px)",
        width: 225,
        x: "-50%",
        transformOrigin: "50% 0%",
      }}
    >
      <div className="relative">
        <button
          type="button"
          data-pw="demo-chat-menu-forward"
          aria-label={t("Forward")}
          onClick={pick("Forward")}
          onPointerEnter={name("Forward")}
          className="absolute flex items-start cursor-pointer active:opacity-80"
          style={{
            left: 131 - 106,
            top: -(40 + 12),
            width: 212,
            height: 40,
            borderRadius: 12,
            background: C.ink,
            boxShadow: "0 2px 5px rgba(0,0,0,0.16)",
          }}
        >
          <XdIcon name="forwardMark" style={{ marginLeft: 43, marginTop: 8 }} />
        </button>
        <div className="flex items-start">
          <button
            type="button"
            data-pw="demo-chat-menu-replay"
            aria-label={t("Replay")}
            onClick={pick("Replay")}
            onPointerEnter={name("Replay")}
            className="flex items-start shrink-0 cursor-pointer active:opacity-60"
            style={{ ...boxStyle, width: 35 }}
          >
            <XdIcon
              name="menuReply"
              style={{ marginLeft: 116 - 106 - 0.5, marginTop: 13 - 0.5 }}
            />
          </button>
          <div
            className="flex items-start shrink-0"
            style={{ ...boxStyle, marginLeft: 5, width: 185 }}
          >
            {MENU_ICONS.map((m, i) => (
              <button
                key={m.name}
                type="button"
                data-pw={`demo-chat-menu-${m.name.toLowerCase()}`}
                aria-label={t(m.name)}
                onClick={pick(m.name)}
                onPointerEnter={name(m.name)}
                className="flex shrink-0 cursor-pointer active:opacity-60"
                style={{ marginLeft: i === 0 ? 40 : 15, marginTop: 13 }}
              >
                <XdIcon name={m.icon} />
              </button>
            ))}
          </div>
        </div>
        <span
          data-pw="demo-chat-menu-tip"
          className="absolute flex flex-col"
          style={{
            left: centreOf(tip) - 25,
            top: tip === "Forward" ? -(40 + 12) + 45 : 45,
            width: 50,
            height: 22,
            borderRadius: 8,
            background: CHAT.tooltip,
            boxShadow: "0 3px 3px rgba(0,0,0,0.2)",
          }}
        >
          <span
            className="block text-center whitespace-nowrap"
            style={{
              marginTop: sfTop(15, 10, 12),
              fontFamily: SF_ROUNDED,
              fontSize: 10,
              lineHeight: "12px",
              color: C.white,
              letterSpacing: "0.01em",
            }}
          >
            {t(tip)}
          </span>
        </span>
      </div>
    </motion.div>
  );
}
