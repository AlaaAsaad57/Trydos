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
  /** Sends a picked or taken photo. */
  sendPhoto: (chat: string, file: File) => void;
  /** Sends a recorded voice note and how long it is, in seconds. */
  sendVoice: (chat: string, audio: Blob, seconds: number) => void;
  /** Sends a picked video and how long it is, in seconds (0 when not known). */
  sendVideo: (chat: string, file: File, seconds: number) => void;
  /** Sends any picked file. */
  sendFile: (chat: string, file: File) => void;
  sendLocation: (chat: string, point: { lat: number; lng: number; accuracy?: number }) => void;
  forward: (from: string, id: string, to: string) => void;
  /** Opens the chat with a contact (a new one when there is none) and says which. */
  newChat: (contact: string) => string;
  /**
   * Saves a contact (a name and a full phone number with its country code)
   * and says its id, or null when there is no one to chat with: the number
   * is not on Trydos, or the save failed.
   */
  addContact: (name: string, phone: string) => Promise<string | null>;
  /** I am typing in this chat: the other person sees "Typing…". */
  typing: (chat: string) => void;
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
