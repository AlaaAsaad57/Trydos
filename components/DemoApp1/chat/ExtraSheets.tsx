"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { motion } from "framer-motion";
import React, { useState } from "react";
import XdIcon from "../../DemoApp/XdIcon";
import { translateFunction } from "utils/functions";
import { C, ROW, fill } from "../demo1Layout";
import { Txt } from "../ui";
import type { ChatReminder, TaggedLine } from "./chatContext";
import { reminderLabel, type Category, type ChatMessage } from "./chatModel";
import PickSheet, { PickBox, PickRow } from "./PickSheet";

/*
  Two sheets for old chat features with no XD board (D-36b), in the manner of
  the Archived sheet (PickSheet). The designer checks both.
*/

/**
 * My reminders, soonest first (the old Reminders folder). A tap opens the
 * chat at the message; the X cancels the reminder.
 */
export function RemindersSheet({
  open,
  reminders,
  locale,
  onOpen,
  onCancel,
  onClose,
}: {
  open: boolean;
  reminders: readonly ChatReminder[];
  locale: string;
  onOpen: (reminder: ChatReminder) => void;
  onCancel: (reminder: ChatReminder) => void;
  onClose: () => void;
}) {
  return (
    <PickSheet open={open} title={translateFunction("Reminders")} testId="demo-reminders-sheet" y={300} onClose={onClose}>
      {reminders.map((r, i) => (
        <PickRow key={r.id} testId={`demo-reminder-row-${r.id}`} first={i === 0} onClick={() => onOpen(r)}>
          <PickBox>
            <XdIcon name="menuRemind" />
          </PickBox>
          <span className="flex flex-col min-w-0 grow" style={{ marginInlineStart: 12, marginInlineEnd: 8 }}>
            <Txt size={14} weight="medium" className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "ellipsis" }}>
              {r.text}
            </Txt>
            <Txt size={12} color={C.grey} className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "ellipsis" }}>
              {[r.who, reminderLabel(r.at, locale)].filter(Boolean).join(" · ")}
            </Txt>
          </span>
          <motion.span
            role="button"
            data-pw={`demo-reminder-cancel-${r.id}`}
            aria-label={translateFunction("Cancel")}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onCancel(r);
            }}
            className="relative flex items-center justify-center shrink-0 cursor-pointer"
            style={{ marginInlineEnd: 8, width: 44, height: 44, borderRadius: 15, background: C.field }}
          >
            <span aria-hidden="true" className="absolute" style={{ width: 14, height: 1.5, background: C.grey, transform: "rotate(45deg)" }} />
            <span aria-hidden="true" className="absolute" style={{ width: 14, height: 1.5, background: C.grey, transform: "rotate(-45deg)" }} />
          </motion.span>
        </PickRow>
      ))}
    </PickSheet>
  );
}

/**
 * "Media & Files" of one chat: the loaded photos and videos in a grid of
 * three, then the files; or, with a label picked, the chat's messages with
 * that label (the old "Tagged messages" block, asked of the chat backend).
 * A tap shows the message in the conversation.
 */
export function MediaSheet({
  open,
  messages,
  categories,
  tagged,
  onPick,
  onClose,
  t,
}: {
  open: boolean;
  messages: readonly ChatMessage[];
  categories: readonly Category[];
  /** The chat's messages with a label; none on `/demo`, which has no labels list. */
  tagged?: (label: string) => Promise<TaggedLine[] | null>;
  onPick: (message: string) => void;
  onClose: () => void;
  t: (key: DemoKey) => string;
}) {
  const [label, setLabel] = useState<string | null>(null);
  const [lines, setLines] = useState<TaggedLine[] | null | "loading">(null);
  const media = messages.filter((m) => m.kind === "photo" || m.kind === "video");
  const files = messages.filter((m) => m.kind === "file");

  const pickLabel = (next: string | null) => {
    setLabel(next);
    if (!next || !tagged) return setLines(null);
    setLines("loading");
    void tagged(next).then((found) => setLines(found));
  };

  const chip = (id: string | null, name: string, color?: string) => (
    <button
      key={id ?? "media"}
      type="button"
      data-pw={`demo-media-chip-${id ?? "media"}`}
      aria-pressed={label === id}
      onClick={() => pickLabel(id)}
      className="flex items-center shrink-0 cursor-pointer active:opacity-60"
      style={{
        height: 30,
        padding: "0 12px",
        borderRadius: 15,
        background: label === id ? C.purpleTint : C.card,
        marginInlineEnd: 6,
      }}
    >
      {color && <span className="block shrink-0" style={{ width: 8, height: 8, borderRadius: 4, background: color, marginInlineEnd: 6 }} />}
      <Txt size={12} weight="medium" color={label === id ? C.purple : C.ink} className="whitespace-nowrap">
        {name}
      </Txt>
    </button>
  );

  const close = () => {
    pickLabel(null);
    onClose();
  };

  return (
    <PickSheet open={open} title={t("Media & Files")} testId="demo-media-sheet" y={200} onClose={close}>
      <div className="flex overflow-x-auto shrink-0" style={{ marginTop: 16, paddingInline: ROW.x, scrollbarWidth: "none" }}>
        {chip(null, t("Media & Files"))}
        {tagged && categories.map((c) => chip(c.id, t(c.name as DemoKey), c.color))}
      </div>

      {label === null ? (
        <>
          <div className="grid shrink-0" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginTop: 12, marginInline: ROW.x, width: fill(ROW.x) }}>
            {media.map((m) => (
              <button
                key={m.id}
                type="button"
                data-pw={`demo-media-item-${m.id}`}
                onClick={() => onPick(m.id)}
                className="relative block cursor-pointer overflow-hidden"
                style={{ aspectRatio: "1", background: C.field, borderRadius: 4 }}
              >
                {m.kind === "photo" && m.src && <img src={m.src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
                {m.kind === "video" && m.src && (
                  <video src={m.src} preload="metadata" muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
          {files.map((m, i) =>
            m.kind === "file" ? (
              <PickRow key={m.id} testId={`demo-media-file-${m.id}`} first={i === 0} onClick={() => onPick(m.id)}>
                <PickBox>
                  <XdIcon name="chatSendFile" />
                </PickBox>
                <Txt size={14} ml={12} className="overflow-hidden whitespace-nowrap grow" style={{ textOverflow: "ellipsis", marginInlineEnd: 12 }}>
                  {m.name}
                </Txt>
              </PickRow>
            ) : null,
          )}
          {media.length === 0 && files.length === 0 && (
            <Txt center size={14} color={C.grey} mt={24}>
              {t("Empty")}
            </Txt>
          )}
        </>
      ) : lines === "loading" ? (
        <Txt center size={14} color={C.grey} mt={24}>
          …
        </Txt>
      ) : lines === null ? (
        <Txt center size={14} color={C.grey} mt={24}>
          {translateFunction("Could not load the messages")}
        </Txt>
      ) : lines.length === 0 ? (
        <Txt center size={14} color={C.grey} mt={24}>
          {translateFunction("No messages with this tag")}
        </Txt>
      ) : (
        lines.map((line, i) => (
          <PickRow key={line.id} testId={`demo-tagged-row-${line.id}`} first={i === 0} onClick={() => onPick(line.id)}>
            <span className="flex flex-col min-w-0 grow" style={{ marginInline: 12 }}>
              <Txt size={14} className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "ellipsis" }}>
                {line.text}
              </Txt>
              <Txt size={11} color={C.grey}>
                {line.time}
              </Txt>
            </span>
          </PickRow>
        ))
      )}
    </PickSheet>
  );
}
