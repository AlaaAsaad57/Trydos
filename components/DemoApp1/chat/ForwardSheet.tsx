"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { motion } from "framer-motion";
import React from "react";
import { CHAT_PHOTOS, CONTACT, PREVIEW } from "../../DemoApp/demoChat";
import { orderedChats, type ChatThread } from "../../DemoApp/demoChatModel";
import { C, ROW, fill, textTop } from "../demo1Layout";
import { Sheet, Stroke, Txt, Under } from "../ui";

/**
 * "Forward to": the sheet that picks the chat a message goes to. The demo's
 * bottom sheet (`Sheet`) with the chat rows in the list's manner — the
 * photo (radius 15), the name 14 Medium, the preview 12 Regular grey — 60 px
 * tall each, 12 px from both edges, on the `#FCFCFC` card the contact's
 * rows use.
 */
export default function ForwardSheet({
  open,
  chats,
  except,
  onPick,
  onClose,
  t,
}: {
  open: boolean;
  chats: ChatThread[];
  /** The chat the message is in: it is not offered. */
  except: string;
  onPick: (chat: string) => void;
  onClose: () => void;
  t: (key: DemoKey) => string;
}) {
  const rows = orderedChats(chats).filter((c) => c.id !== except);
  return (
    <Sheet open={open} onClose={onClose} y={360} testId="demo-forward-sheet">
      <Txt center size={16} weight="medium" mt={textTop(30, 16) - 8}>
        {t("Forward to")}
      </Txt>
      <Under testId="demo-forward-list">
        {rows.map((chat, i) => (
          <motion.button
            key={chat.id}
            type="button"
            data-pw={`demo-forward-row-${chat.id}`}
            whileTap={{ scale: 0.985 }}
            onClick={() => onPick(chat.id)}
            className="flex items-center shrink-0 cursor-pointer text-left"
            style={{
              marginTop: i === 0 ? 16 : 2,
              marginLeft: ROW.x,
              width: fill(ROW.x),
              height: 60,
              borderRadius: ROW.radius,
              background: C.card,
            }}
          >
            <span
              className="relative block shrink-0 overflow-hidden flex-col"
              style={{
                marginLeft: 8,
                width: 44,
                height: 44,
                borderRadius: 15,
                background: chat.initials ? C.field : undefined,
              }}
            >
              {chat.initials ? (
                <Txt center size={12} weight="medium" mt={textTop(27, 12)}>
                  {CONTACT.initials}
                </Txt>
              ) : (
                <img
                  src={CHAT_PHOTOS.contact}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <Stroke color={C.line} width={0.3} radius={15} />
            </span>
            <span className="flex flex-col min-w-0 grow" style={{ marginLeft: 12, marginRight: 12 }}>
              <Txt size={14} weight="medium">
                {CONTACT.name}
              </Txt>
              <Txt
                size={12}
                color={C.grey}
                className="overflow-hidden"
                style={{ textOverflow: "ellipsis" }}
              >
                {chat.preview ?? PREVIEW}
              </Txt>
            </span>
          </motion.button>
        ))}
      </Under>
    </Sheet>
  );
}
