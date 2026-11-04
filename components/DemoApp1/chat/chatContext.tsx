"use client";

import { createContext, useContext } from "react";
import type { ChatAction, ChatState } from "./chatModel";

/**
 * What the chat screens get from the chat: its state and what they can do.
 *
 * Two providers fill it. On `/demo` the mock provider does
 * (components/DemoApp/demoChatState.tsx). In the app the real chat data does.
 * The screens read it with `useChat()` and never know which one runs.
 */
export type ChatApi = {
  state: ChatState;
  dispatch: (action: ChatAction) => void;
  /** Sends a text I typed, answering `replyTo` when given. */
  sendText: (chat: string, text: string, replyTo?: { id: string; text: string }) => void;
  sendPhoto: (chat: string, src: string) => void;
  sendVoice: (chat: string, seconds: number) => void;
  sendVideo: (chat: string, src: string, seconds: number) => void;
  sendFile: (chat: string, file: { src: string; name: string; bytes: number; mime?: string }) => void;
  sendLocation: (chat: string, point: { lat: number; lng: number; accuracy?: number }) => void;
  forward: (from: string, id: string, to: string) => void;
  /** Opens the chat with a contact (a new one when there is none) and says which. */
  newChat: (contact: string) => string;
  /** Adds a contact and says its id. */
  addContact: (name: string, phone: string) => string;
  /** A word for the shopper from the chat itself (a reminder that came due), shown by whatever screen is up. */
  notice: string | null;
  /** The conversation opens with its message search up (the contact screen's Search). */
  search: boolean;
  setSearch: (on: boolean) => void;
};

/** How long a notice stays, in ms. */
export const NOTICE_MS = 3200;

export const ChatContext = createContext<ChatApi | null>(null);

export function useChat(): ChatApi {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside a chat provider");
  return value;
}
