"use client";

import type { DemoKey } from "../../DemoApp/demoKeys";
import { motion } from "framer-motion";
import React from "react";
import { PREVIEW } from "../../DemoApp/demoChat";
import {
  archivedChats,
  seedContacts,
  type ChatThread,
  type Contact,
} from "../../DemoApp/demoChatModel";
import { C } from "../demo1Layout";
import { Stroke, Txt } from "../ui";
import { UnarchiveIcon } from "./chatIcons";
import PickSheet, { PickBox, PickRow } from "./PickSheet";

/**
 * "Archived": the sheet the Archived row of the Chats tab opens. The
 * archived chats, newest first, as the "Forward to" sheet draws a chat —
 * the photo or the initials, the name 14 Medium, the preview 12 Regular
 * grey — with a round pale-purple button at the right that brings the chat
 * back to the list. A tap on the row opens the chat.
 */
export default function ArchivedSheet({
  open,
  chats,
  contacts,
  onOpen,
  onUnarchive,
  onClose,
  t,
}: {
  open: boolean;
  chats: ChatThread[];
  contacts: Contact[];
  onOpen: (chat: string) => void;
  onUnarchive: (chat: string) => void;
  onClose: () => void;
  t: (key: DemoKey) => string;
}) {
  const rows = archivedChats(chats);
  const who = (chat: ChatThread) =>
    contacts.find((c) => c.id === chat.contact) ?? seedContacts()[0];
  return (
    <PickSheet open={open} title={t("Archived")} testId="demo-archived-sheet" y={300} onClose={onClose}>
      {rows.length === 0 && (
        <Txt center size={14} color={C.grey} mt={24}>
          {t("Empty")}
        </Txt>
      )}
      {rows.map((chat, i) => {
        const contact = who(chat);
        const initials = chat.initials || !contact.photo;
        return (
          <PickRow key={chat.id} testId={`demo-archived-row-${chat.id}`} first={i === 0} onClick={() => onOpen(chat.id)}>
            <PickBox background={initials ? C.field : undefined}>
              {initials ? (
                <Txt center size={12} weight="medium">
                  {contact.initials}
                </Txt>
              ) : (
                <img src={contact.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <Stroke color={C.line} width={0.3} radius={15} />
            </PickBox>
            <span className="flex flex-col min-w-0 grow" style={{ marginLeft: 12, marginRight: 8 }}>
              <Txt size={14} weight="medium" className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "ellipsis" }}>
                {contact.name}
              </Txt>
              <Txt size={12} color={C.grey} className="overflow-hidden whitespace-nowrap" style={{ textOverflow: "ellipsis" }}>
                {chat.preview ?? PREVIEW}
              </Txt>
            </span>
            <motion.span
              role="button"
              data-pw={`demo-archived-unarchive-${chat.id}`}
              aria-label={t("Unarchive")}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onUnarchive(chat.id);
              }}
              className="flex items-center justify-center shrink-0 cursor-pointer"
              style={{ marginRight: 8, width: 44, height: 44, borderRadius: 15, background: C.purpleTint }}
            >
              <UnarchiveIcon color={C.purple} />
            </motion.span>
          </PickRow>
        );
      })}
    </PickSheet>
  );
}
