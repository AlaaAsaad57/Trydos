"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { BUBBLE_RADIUS, CHAT, VOICE_SRC } from "../../DemoApp/demoChat";
import type {
  CallMessage,
  Side,
  Status,
} from "../../DemoApp/demoChatModel";
import { C, fill, lineBox, textTop } from "../demo1Layout";
import { Stroke, Txt } from "../ui";

/**
 * The messages of a conversation, as `Home Page – 44` draws them. Every
 * block here is the one the first build of the screen drew; the only change
 * is that each reads its words, its side and its status from a message in
 * the chat state (demoChatModel.ts) instead of a constant.
 *
 * A message that comes in is a `#4A31E7` bubble from x 12 with corners
 * 2 / 50 / 2 / 30 and a 4 px dot at x 5; one I sent is `#8D00E5` ending at
 * x 418 with corners 50 / 2 / 30 / 2 and a `#883BF2` dot at x 421. The words
 * are 13 Regular white on 18 px lines (the file spaces the letters of the
 * incoming ones by 0.012 em), first baseline 21 under the bubble's top; the
 * time 9 Regular on a baseline 10 above the bubble's bottom, at the right of
 * a bubble that came in and at the left (after the ticks) of one I sent.
 */

export const SPACED = { letterSpacing: "0.012em" } as const;

/**
 * The ticks before the time of a message I sent. The file draws Bold `||` in
 * `#388CFF` on every one (all read); on the way there a message shows one
 * white tick (sent) and then two (delivered), as the chat rows do.
 */
export function Mark({ status = "read" }: { status?: Status }) {
  return (
    <span
      data-pw="demo-chat-mark"
      data-status={status}
      className="font-bold"
      style={{
        color: status === "read" ? CHAT.callBlue : C.white,
        transition: "color 0.3s",
      }}
    >
      {status === "sent" ? "|" : "||"}{" "}
    </span>
  );
}

/** The 4 px dot beside a bubble (the file draws it as a 4 x 4 box with radius 15). */
export function Dot({
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
export function SmallPhoto({
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

/**
 * The held message stays exactly as it is: WhatsApp on the iPhone lifts it
 * above the dimmed chat without growing it (the video of 2026-10-21). The
 * hook is kept so a lift can be tried again in one place.
 */
export const liftOf = (_open: boolean, inn: boolean) => ({
  animate: { scale: 1 },
  transition: { type: "spring" as const, stiffness: 420, damping: 26 },
  style: { transformOrigin: inn ? "left center" : "right center" },
});

/** A text message, in (left) or out (right). */
export function Bubble({
  side,
  text,
  time,
  status,
  replied = false,
  edited = false,
  forwarded = false,
  open = false,
  t,
}: {
  side: Side;
  text: string;
  time: string;
  status?: Status;
  /** The white reply mark before the time (`– 44`, the last message). */
  replied?: boolean;
  edited?: boolean;
  forwarded?: boolean;
  /** Its menu is open: the bubble lifts. */
  open?: boolean;
  t: (key: DemoKey) => string;
}) {
  const inn = side === "in";
  const lift = liftOf(open, inn);
  return (
    <motion.div
      animate={lift.animate}
      transition={lift.transition}
      className="flex flex-col shrink min-w-0 select-none"
      style={{
        ...lift.style,
        marginLeft: inn ? 3 : undefined,
        marginRight: inn ? undefined : 3,
        // The widest bubble is the row less 86 px: the row (MessageRow) holds that limit.
        padding: inn ? "7px 12px 8px 12px" : "7px 12px 8px 13px",
        borderRadius: inn ? BUBBLE_RADIUS.in : BUBBLE_RADIUS.out,
        background: inn ? C.purple : CHAT.sent,
        WebkitTouchCallout: "none",
      }}
    >
      {forwarded && (
        <Txt
          size={9}
          color={C.white}
          className="italic"
          style={{ opacity: 0.8, marginBottom: 2, marginLeft: inn ? 0 : 30 }}
        >
          {t("Forwarded")}
        </Txt>
      )}
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
          {!inn && <Mark status={status} />}
          {edited && (
            <span data-pw="demo-chat-edited" style={{ opacity: 0.8 }}>
              {`${t("edited")} `}
            </span>
          )}
          {time}
        </Txt>
      </span>
    </motion.div>
  );
}

/**
 * The 300 x 300 photo (`– 44`, y 667) with the bubble's corners and a 1 px
 * line in the sender's colour. One I sent is the mirror image, with the
 * time and ticks on it.
 */
export function PhotoMessage({
  side,
  src,
  time,
  status,
  open = false,
}: {
  side: Side;
  src: string;
  time: string;
  status?: Status;
  open?: boolean;
}) {
  const inn = side === "in";
  const lift = liftOf(open, inn);
  return (
    <motion.div
      animate={lift.animate}
      transition={lift.transition}
      className="relative shrink min-w-0 overflow-hidden select-none"
      style={{
        ...lift.style,
        marginLeft: inn ? 3 : undefined,
        marginRight: inn ? undefined : 3,
        width: 300,
        aspectRatio: "1 / 1",
        borderRadius: inn ? BUBBLE_RADIUS.in : BUBBLE_RADIUS.out,
        WebkitTouchCallout: "none",
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <Edge color={inn ? C.purple : CHAT.sent} radius={inn ? BUBBLE_RADIUS.in : BUBBLE_RADIUS.out} />
      {!inn && (
        <span
          className="absolute flex items-start"
          style={{
            right: 14,
            bottom: 8,
            padding: "1px 6px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <Txt size={9} color={C.white}>
            <Mark status={status} />
            {time}
          </Txt>
        </span>
      )}
    </motion.div>
  );
}

/** The five waves' width: where the voice message's sound runs. */
const WAVES_W = 5 * 51.72;

/** Seconds as "01:20". */
export const clock = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/** The voice message playing now, so starting one stops the other. */
let playingNow: HTMLAudioElement | null = null;

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
 * The play mark plays a dummy sound (VOICE_SRC) from its start, for as many
 * seconds as the message is long: the waves take the sender's colour up to
 * the playhead, which moves with the sound, and the pill counts the time
 * played. While it plays, the play mark is a pause mark. A tap or a drag on
 * the waves moves the playhead, so any part can be heard. At rest it is as
 * the file draws it: the first wave coloured, the playhead at 48.5 (in) or
 * 52.2 (out). A second message starting stops the first.
 */
export function VoiceMessage({
  side,
  seconds: total,
  time,
  status,
  open = false,
  t,
}: {
  side: Side;
  seconds: number;
  time: string;
  status?: Status;
  open?: boolean;
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
  /** Where the finger holds the playhead, in px from the waves' left edge. */
  const [drag, setDrag] = useState<number | null>(null);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    // While it plays, the frame loop below keeps the time.
    const onTime = () => {
      if (a.paused) setSeconds(Math.min(total, a.currentTime));
    };
    // The audio says when it stops, also when another message stops it.
    const onStop = () => {
      setPlaying(false);
      setSeconds(Math.min(total, a.currentTime));
      if (playingNow === a) playingNow = null;
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("pause", onStop);
    a.addEventListener("ended", onStop);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("pause", onStop);
      a.removeEventListener("ended", onStop);
      a.pause();
      if (playingNow === a) playingNow = null;
    };
  }, [total]);

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
  // The dummy sound is longer than most messages: the message ends at its
  // own length.
  useEffect(() => {
    const a = audio.current;
    if (!playing || dragging || !a) return;
    let frame = 0;
    const tick = () => {
      if (a.currentTime >= total) {
        a.pause();
        return;
      }
      const x = Math.min(WAVES_W, (a.currentTime / total) * WAVES_W);
      headX.set(x);
      fillX.set(x);
      setSeconds((s) =>
        Math.floor(s) === Math.floor(a.currentTime) ? s : a.currentTime,
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, dragging, headX, fillX, total]);

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
      if (a.ended || a.currentTime >= total - 0.05) a.currentTime = 0;
      setStarted(true);
      void a.play().catch(() => setPlaying(false));
    });
  };

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
      a.currentTime = (x / WAVES_W) * total;
      setSeconds(a.currentTime);
    });
  };
  const scrub = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      // The waves take the finger: the row under them must not start a
      // swipe or a long press.
      e.stopPropagation();
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
        : clock(total);
  const waves = (name: XdIconName) =>
    [0, 1, 2, 3, 4].map((i) => <XdIcon key={i} name={name} />);
  const lift = liftOf(open, inn);

  return (
    <motion.div
      animate={lift.animate}
      transition={lift.transition}
      className="flex flex-col w-full"
      style={lift.style}
    >
      <div
        data-pw={`demo-chat-voice-${side}`}
        className={`flex items-start w-full shrink-0 ${inn ? "" : "justify-end"}`}
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
          onPointerDown={(e) => e.stopPropagation()}
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
              {!inn && <Mark status={status} />}
              {time}
            </Txt>
          </span>
        </div>
      </div>
    </motion.div>
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

/** What a call card says, for a quote or the clipboard. */
export const callWords = (m: CallMessage, t: (key: DemoKey) => string) =>
  t(CARD_TONE[m.tone].title);

/**
 * A call card (`– 44`, y 1277 .. 1549): 50 tall with the bubble's corners,
 * a 40 x 42 box 4 px in (corners 2 / 30 / 2 / 30) with the 18 px phone in
 * its middle, the title 13 Medium 4 px after the box on baseline 21, the
 * second line 11 Regular centred under the title on baseline 39, and the
 * time 9 Regular after the title's end on baseline 40, 9 px from the card's
 * far edge. A card I sent is the mirror image, with "||" before its time.
 */
export function CallCard({
  message: m,
  t,
}: {
  message: CallMessage;
  t: (key: DemoKey) => string;
}) {
  const inn = m.side === "in";
  const look = CARD_TONE[m.tone];
  const sub =
    m.sub === "callBack"
      ? t("Tap To Call Back")
      : m.sub === "minutes"
        ? t("{n} Min").replace("{n}", m.minutes ?? "")
        : t("No Answer");
  const time = m.rings
    ? `${m.time} | ${t("{n} Ring").replace("{n}", m.rings)}`
    : m.time;
  const timeText = (
    <>
      {!inn && <Mark />}
      {time}
    </>
  );
  // "12:56 | 3 Ring" has the file's 0.012 em spacing.
  const timeStyle = m.rings ? SPACED : undefined;
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
      data-pw={`demo-chat-call-${m.tone}`}
      className={`flex items-start w-full shrink-0 ${inn ? "" : "justify-end"}`}
    >
      {inn && <Dot color={C.purple} ml={5} />}
      <div
        className="flex items-start shrink-0 whitespace-nowrap"
        style={{
          marginLeft: inn ? 3 : undefined,
          marginRight: inn ? undefined : 3,
          width: m.width,
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

/** The note under a missed call: 205 x 32 from x 60, the card's pale red, no time. */
export function Note({ text }: { text: string }) {
  return (
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
        <Txt size={13}>{text}</Txt>
      </div>
    </div>
  );
}

/** The "YESTERDAY" pill: 74 x 22 at (168, 633), 10 px left of the screen's centre. */
export function DayPill({ label }: { label: string }) {
  return (
    <div
      data-pw="demo-chat-day"
      className="flex flex-col shrink-0 self-center"
      style={{
        marginLeft: -20,
        minWidth: 74,
        height: 22,
        padding: "0 10px",
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
        {label}
      </Txt>
    </div>
  );
}

/**
 * A quoted message above a reply (`– 44`, y 1631): a 297 x 43 purple bubble
 * from x 121 whose inside, from 3 px in, is `#EFEBFF`; the quoted words 13
 * Regular `#8D8D8D` at 9 px in; the reply mark and the time at the right.
 * The purple dot sits at x 114, before it.
 */
export function Quote({ text, time }: { text: string; time: string }) {
  return (
    <div
      data-pw="demo-chat-quote"
      className="flex items-start w-full shrink-0 justify-end"
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
            style={{ marginRight: 12, textOverflow: "ellipsis", ...SPACED }}
          >
            {text}
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
              {time}
            </Txt>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The contact is typing: an incoming bubble with three white dots that rise
 * one after the other (the real chat's TypingIndicator, in the bubble's own
 * colours).
 */
export function TypingBubble() {
  return (
    <div
      data-pw="demo-chat-typing"
      className="flex items-start w-full shrink-0"
    >
      <Dot color={C.purple} ml={5} />
      <div
        className="flex items-center"
        style={{
          marginLeft: 3,
          height: 34,
          padding: "0 14px",
          gap: 4,
          borderRadius: BUBBLE_RADIUS.in,
          background: C.purple,
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block"
            style={{ width: 6, height: 6, borderRadius: 3, background: C.white }}
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
