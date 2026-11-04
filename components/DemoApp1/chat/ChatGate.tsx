"use client";

import React from "react";
import { translateFunction } from "utils/functions";
import { C, CTA, fill } from "../demo1Layout";
import { Txt } from "../ui";

/** Why the chat cannot open yet (D-36a, the old chat's two gates). */
export type ChatGateKind = "phone" | "notifications";

const WORDS: Record<ChatGateKind, { text: string; action: string }> = {
  // A shopper with a phone on record but no chat account confirms the phone first.
  phone: { text: "Confirm your phone number to use Chat", action: "Verify" },
  // The old chat window opened only with notifications allowed (ChatWindowModal.tsx).
  notifications: { text: "Please Enable Notification to use Chat", action: "Allow Notifications" },
};

/**
 * The chat page while a gate is closed. The XD file has no such state
 * (D-36b): the words in the middle of the page and the purple button that
 * opens the gate (the phone check, or the browser's notification prompt).
 */
export default function ChatGate({ kind, onOpen }: { kind: ChatGateKind; onOpen: () => void }) {
  const words = WORDS[kind];
  return (
    <div
      data-pw={`demo-chat-gate-${kind}`}
      className="flex flex-col items-center justify-center w-full"
      style={{ minHeight: "100dvh", background: C.page, paddingInline: CTA.x }}
    >
      <Txt center size={16} weight="medium">
        {translateFunction(words.text)}
      </Txt>
      <button
        type="button"
        data-pw={`demo-chat-gate-${kind}-open`}
        onClick={onOpen}
        className="cursor-pointer active:opacity-60"
        style={{ marginTop: 24, width: fill(CTA.x), height: CTA.height, borderRadius: CTA.radius, background: C.purple }}
      >
        <Txt center size={16} weight="medium" color={C.white}>
          {translateFunction(words.action)}
        </Txt>
      </button>
    </div>
  );
}
