"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import type { XdIconName } from "../../DemoApp/xdIcons";
import { CHAT } from "../../DemoApp/demoChat";
import { C, SAFE_BOTTOM, lineBox } from "../demo1Layout";
import { Txt } from "../ui";
import {
  CameraIcon,
  ChevronLeftIcon,
  CloseIcon,
  MicIcon,
  PlusIcon,
  RecordDot,
  SendIcon,
} from "./chatIcons";
import { clock } from "./messages";

/**
 * The composer at the end of a conversation. The XD file draws none, so
 * this one is built from the chat boards' own parts:
 *
 *   - a white strip with the header's shadow (0 0 3, black at 10%);
 *   - the field, 38 tall, radius 12, `#F8F8F8`, 14 Regular, the placeholder
 *     `#8D8D8D` — the search field of `– 41`; it grows to five lines;
 *   - the plus, the camera in the field, and the round purple button at the
 *     right: the microphone while the field is empty, the send arrow once
 *     there are words (they swap with the play / pause turn of a voice
 *     message);
 *   - above the field, when a message is answered or edited: the quote's
 *     bar — purple outside, `#EFEBFF` inside — with the name, the words and
 *     a close mark;
 *   - the plus opens the "Send …" list of `– 41`'s fourth row, with its own
 *     icons, in the menu's `#FAFAFA` box.
 *
 * A voice message is recorded WhatsApp's way: hold the microphone, the field
 * turns into a beating red dot and a clock with "‹ Slide to cancel"; let go
 * to send, slide left to cancel. No sound is kept — the message gets the
 * seconds held and plays the demo's dummy sound.
 */

export const COMPOSER_H = 54;

/** The message above the field: the one answered, or the one being edited. */
export type ComposerContext =
  | { kind: "reply"; id: string; name: string; text: string }
  | { kind: "edit"; id: string; text: string };

/** How long the finger must hold the microphone, in ms, for a recording. */
export const MIN_RECORD_MS = 600;
/** How far left the finger slides, in px, to cancel a recording. */
export const CANCEL_SLIDE = 90;

const ATTACH: { icon: XdIconName; label: DemoKey; action: "photo" | "voice" | "soon" }[] = [
  { icon: "chatSendPhoto", label: "Send Photo", action: "photo" },
  { icon: "chatSendVoice", label: "Send Voice", action: "voice" },
  { icon: "chatSendVideo", label: "Send Video", action: "soon" },
  { icon: "chatSendFile", label: "Send File", action: "soon" },
  { icon: "chatSendLocation", label: "Send Location", action: "soon" },
];

const SWAP = { type: "spring", stiffness: 520, damping: 30 } as const;

export default function Composer({
  context,
  onCancelContext,
  onSend,
  onSendPhoto,
  onSendVoice,
  onToast,
  blur,
  t,
}: {
  context: ComposerContext | null;
  onCancelContext: () => void;
  /** The words typed; the edit's new words when a message is edited. */
  onSend: (text: string) => void;
  onSendPhoto: (src: string) => void;
  onSendVoice: (seconds: number) => void;
  onToast: (text: string) => void;
  /** The blur the page has while a message menu is open. */
  blur: number;
  t: (key: DemoKey) => string;
}) {
  const [text, setText] = useState("");
  const [attach, setAttach] = useState(false);
  const [recording, setRecording] = useState<{ since: number; slide: number } | null>(null);
  const [now, setNow] = useState(0);
  const field = useRef<HTMLTextAreaElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const startX = useRef(0);

  // An edit starts with the message's words in the field.
  useEffect(() => {
    if (context?.kind === "edit") {
      setText(context.text);
      field.current?.focus();
    } else if (context?.kind === "reply") field.current?.focus();
  }, [context]);

  // The field grows with its lines, up to five.
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 5 * lineBox(14) + 20)}px`;
  }, [text]);

  // The recording's clock.
  useEffect(() => {
    if (!recording) return;
    const tick = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(tick);
  }, [recording]);

  // A tap anywhere else closes the "Send …" list.
  useEffect(() => {
    if (!attach) return;
    const close = () => setAttach(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [attach]);

  const words = text.trim();
  const canSend = words.length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(words);
    setText("");
    field.current?.focus();
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onSendPhoto(URL.createObjectURL(file));
  };

  const attachAction = (action: (typeof ATTACH)[number]["action"]) => {
    setAttach(false);
    if (action === "photo") gallery.current?.click();
    else if (action === "voice") onToast(t("Hold to record"));
    else onToast(t("Soon available"));
  };

  /** The microphone: held, it records; let go, it sends; slid left, it stops. */
  const mic = {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (canSend) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      startX.current = e.clientX;
      const since = Date.now();
      setRecording({ since, slide: 0 });
      setNow(since);
    },
    onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!recording) return;
      const slide = Math.min(0, e.clientX - startX.current);
      if (slide <= -CANCEL_SLIDE) {
        setRecording(null);
        return;
      }
      setRecording({ since: recording.since, slide });
    },
    onPointerUp: () => {
      if (!recording) return;
      const held = Date.now() - recording.since;
      setRecording(null);
      if (held < MIN_RECORD_MS) onToast(t("Hold to record"));
      else onSendVoice(Math.max(1, Math.round(held / 1000)));
    },
    onPointerCancel: () => setRecording(null),
  };

  return (
    <div
      data-pw="demo-chat-composer"
      className="relative w-full shrink-0 flex flex-col"
      style={{
        background: C.white,
        boxShadow: "0 0 3px rgba(0,0,0,0.1)",
        paddingBottom: SAFE_BOTTOM,
        filter: blur ? `blur(${blur}px)` : "blur(0px)",
        transition: "filter 0.22s ease-out",
      }}
    >
      <input
        ref={gallery}
        type="file"
        accept="image/*"
        hidden
        aria-label={t("Send Photo")}
        onChange={pickFile}
      />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        aria-label={t("Take Photo")}
        onChange={pickFile}
      />

      {/* What the message answers, or the words being edited. */}
      <AnimatePresence initial={false}>
        {context && (
          <motion.div
            key={`${context.kind}-${context.id}`}
            data-pw={`demo-chat-context-${context.kind}`}
            className="overflow-hidden shrink-0"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 46 + 8, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 480, damping: 36 }}
          >
            <div
              className="flex items-stretch"
              style={{
                margin: "8px 12px 0",
                height: 46,
                paddingLeft: 3,
                borderRadius: 12,
                background: C.purple,
              }}
            >
              <div
                className="flex items-center grow min-w-0"
                style={{ borderRadius: 12, background: CHAT.quote, paddingLeft: 10 }}
              >
                {context.kind === "edit" && (
                  <XdIcon name="menuEdit" style={{ marginRight: 8 }} />
                )}
                <span className="flex flex-col min-w-0 grow">
                  <Txt size={12} weight="medium" color={C.purple}>
                    {context.kind === "edit" ? t("Edit") : context.name}
                  </Txt>
                  <Txt
                    size={12}
                    color={C.grey}
                    className="overflow-hidden"
                    style={{ textOverflow: "ellipsis" }}
                  >
                    {context.text}
                  </Txt>
                </span>
                <button
                  type="button"
                  data-pw="demo-chat-context-close"
                  aria-label={t("Close")}
                  onClick={() => {
                    onCancelContext();
                    if (context.kind === "edit") setText("");
                  }}
                  className="flex items-center justify-center shrink-0 cursor-pointer active:opacity-60"
                  style={{ width: 40, height: 46 }}
                >
                  <CloseIcon color={C.grey} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end" style={{ padding: "8px 12px", gap: 8 }}>
        <div className="relative shrink-0">
          <motion.button
            type="button"
            data-pw="demo-chat-attach"
            aria-label={t("Attach")}
            aria-expanded={attach}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setAttach((v) => !v);
            }}
            className="flex items-center justify-center cursor-pointer"
            style={{ width: 38, height: 38 }}
          >
            <motion.span
              className="flex"
              animate={{ rotate: attach ? 45 : 0 }}
              transition={SWAP}
            >
              <PlusIcon color={C.purple} />
            </motion.span>
          </motion.button>
          <AnimatePresence>
            {attach && (
              <motion.div
                key="attach"
                data-pw="demo-chat-attach-menu"
                className="absolute flex flex-col"
                initial={{ opacity: 0, scale: 0.4, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 6, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 520, damping: 32 }}
                style={{
                  left: 0,
                  bottom: "100%",
                  marginBottom: 6,
                  width: 170,
                  padding: "6px 0",
                  borderRadius: 12,
                  background: CHAT.menu,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.16)",
                  transformOrigin: "left bottom",
                  zIndex: 30,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {ATTACH.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    data-pw={`demo-chat-attach-${a.action === "soon" ? a.label.toLowerCase().replace(/\s+/g, "-") : a.action}`}
                    onClick={() => attachAction(a.action)}
                    className="flex items-center shrink-0 cursor-pointer text-left active:opacity-60"
                    style={{ height: 40, padding: "0 14px" }}
                  >
                    <XdIcon name={a.icon} />
                    <Txt size={13} weight="medium" ml={10}>
                      {t(a.label)}
                    </Txt>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="relative flex items-end grow min-w-0"
          style={{ minHeight: 38, borderRadius: 12, background: C.field }}
        >
          {recording ? (
            <motion.div
              data-pw="demo-chat-recording"
              className="flex items-center w-full"
              style={{ height: 38, padding: "0 12px", x: recording.slide }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.span
                className="flex"
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              >
                <RecordDot color={CHAT.red} />
              </motion.span>
              <Txt size={14} ml={8} data-pw="demo-chat-recording-clock">
                {clock(Math.max(0, (now - recording.since) / 1000))}
              </Txt>
              <span className="flex items-center ml-auto" style={{ opacity: 1 + recording.slide / CANCEL_SLIDE }}>
                <ChevronLeftIcon color={C.grey} />
                <Txt size={13} color={C.grey} ml={2}>
                  {t("Slide to cancel")}
                </Txt>
              </span>
            </motion.div>
          ) : (
            <>
              <textarea
                ref={field}
                data-pw="demo-chat-input"
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={t("Type a message")}
                aria-label={t("Type a message")}
                enterKeyHint="send"
                className="block grow min-w-0 bg-transparent outline-none resize-none font-normal placeholder:text-[#8D8D8D]"
                style={{
                  padding: "10px 0 10px 12px",
                  marginRight: canSend ? 12 : 40,
                  fontSize: 14,
                  lineHeight: `${lineBox(14)}px`,
                  color: C.ink,
                  border: 0,
                  overflowY: "auto",
                  scrollbarWidth: "none",
                }}
              />
              <AnimatePresence initial={false}>
                {!canSend && (
                  <motion.button
                    key="camera"
                    type="button"
                    data-pw="demo-chat-camera"
                    aria-label={t("Take Photo")}
                    onClick={() => camera.current?.click()}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute flex items-center justify-center cursor-pointer"
                    style={{ right: 4, bottom: 0, width: 36, height: 38 }}
                  >
                    <CameraIcon color={C.purple} />
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        <motion.button
          type="button"
          data-pw={canSend ? "demo-chat-send" : "demo-chat-mic"}
          data-recording={recording ? "true" : undefined}
          aria-label={canSend ? t("Send") : t("Microphone")}
          onClick={canSend ? send : undefined}
          {...(canSend ? {} : mic)}
          animate={{ scale: recording ? 1.3 : 1 }}
          transition={SWAP}
          whileTap={canSend ? { scale: 0.9 } : undefined}
          className="relative flex items-center justify-center shrink-0 cursor-pointer select-none"
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            background: C.purple,
            touchAction: "none",
            WebkitTouchCallout: "none",
          }}
        >
          <AnimatePresence initial={false}>
            <motion.span
              key={canSend ? "send" : "mic"}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {canSend ? <SendIcon color={C.white} /> : <MicIcon color={C.white} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
