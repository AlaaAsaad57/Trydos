"use client";

import React from "react";
import { C } from "../demo1Layout";

/**
 * A screen of one chat while its chat is not loaded yet (a reload of
 * `/chat/conversation?id=12`). The XD file has no such state, so it is the
 * bare page: the chat draws over it once it is there.
 */
export default function ChatWaiting() {
  return (
    <div
      data-pw="demo-chat-waiting"
      aria-busy="true"
      className="w-full"
      style={{ minHeight: "100dvh", background: C.page }}
    />
  );
}
